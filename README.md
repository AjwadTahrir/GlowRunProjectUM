# Witches Glow Run — registration site

Event landing page + participant registration, with a hard server-enforced cap of **500 accepted registrations**, private payment-proof storage, and Google Sheets sync for the organiser.

```
witches-glow-run/
  server/   Express + TypeScript + Postgres + Google Sheets + private file storage
  web/      React + TypeScript + Vite + Tailwind + React Hook Form + Zod
```

---

## Status of each integration

| Area | State |
|---|---|
| Frontend, all sections, form, states | Implemented |
| Registration API, validation, idempotency | Implemented |
| Capacity allocation (atomic, Postgres) | Implemented + unit/integration tests written |
| Private upload storage (local disk driver) | Implemented |
| Private upload storage (S3-compatible driver) | Implemented, **never run against a real bucket** |
| Google Sheets sync + retry/reconciliation | Implemented, **never run against a real spreadsheet** |
| Organiser payment verification | Implemented as token-protected API + documented workflow. No admin UI. |

Nothing here has been executed — it was written in an environment without network access, so
dependencies were never installed and the test suite was never run. Treat the first
`npm install && npm test` as part of your setup, not as a formality. Anything that needs
Google credentials or object storage is structurally complete but unverified end to end.

---

## Architecture decisions

**Postgres is the source of truth for capacity; Google Sheets is a read-only mirror for the organiser.**
Sheets has no transactional locking, so it cannot arbitrate the 500th place.

**Seat allocation is a single conditional UPDATE**, executed inside the same transaction as the
registration insert:

```sql
UPDATE event_state
   SET accepted_count = accepted_count + 1
 WHERE id = 1
   AND registration_open = true
   AND accepted_count < max_capacity
RETURNING accepted_count;
```

Zero rows returned means full or closed — the transaction rolls back and no place is consumed.
Row-level locking makes concurrent requests serialise on that one row, so the count can never
exceed `max_capacity`. The returned value becomes the participant's `seat_number` (unique index).

**Upload happens before registration, not during it.** `POST /api/uploads` validates and stores the
file privately, then returns a short-lived HMAC-signed `uploadRef`. `POST /api/registrations`
verifies that signature and stores the key. This keeps the capacity transaction short and avoids
half-created registrations when storage fails. Unclaimed uploads are swept by a janitor job.

**Duplicate protection is two-layered.** A required `Idempotency-Key` header has a unique index —
a retry returns the original registration instead of creating a second one. Separately, one accepted
registration per email address is enforced by a partial unique index.

**Sheets sync is asynchronous and recoverable.** A registration is accepted the moment the
transaction commits, with `sheets_sync_status = 'pending'`. A worker retries with exponential
backoff and reconciles by reading column A first, so retries can't duplicate rows. The UI says
"accepted" — never "saved to the spreadsheet" — until sync actually succeeds.

**Payment-pending registrations consume a place.** This is the default policy
(`CAPACITY_COUNTS_PENDING_PAYMENT=true`). Places are released only by an explicit organiser
cancellation, never by a timer. Changing this is a policy decision for the organiser, not a code
default to flip silently.

---

## Local setup

Requires Node 20+ and Postgres 14+.

```bash
cp .env.example server/.env          # then fill in real values
createdb witches_glow_run
cd server && npm install && npm run migrate && npm run dev     # :4000
cd ../web && npm install && npm run dev                        # :5173
```

`web/vite.config.ts` proxies `/api` to `localhost:4000`, so no CORS config is needed in dev.

### Tests

```bash
cd server && npm test        # vitest + supertest; needs TEST_DATABASE_URL
cd web && npm test           # vitest + testing-library
```

Capacity tests fire concurrent requests at the final place and assert exactly one wins. They need a
real Postgres — that behaviour cannot be meaningfully mocked.

---

## Google Sheets setup

1. Create a Google Cloud project and enable the **Google Sheets API**.
2. Create a **service account**; create a JSON key.
3. Create the spreadsheet `Witches Glow Run — Participants`, with a tab named `Registrations`.
4. Share that spreadsheet with the service-account email (`...@....iam.gserviceaccount.com`) as
   **Editor**. Restrict all other sharing — this sheet holds participant personal data.
5. Put the sheet ID (from its URL) in `GOOGLE_SHEETS_SPREADSHEET_ID`.
6. Put the key in `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` (newlines as `\n`), or set
   `GOOGLE_APPLICATION_CREDENTIALS` to the key file path. Never commit either.
7. `npm run sheets:init` writes the header row.

Columns: Registration ID, Timestamp, Email, Full name, Category, Matriculation number, Phone,
T-shirt size, Payment proof reference, Payment status, Terms accepted, Terms accepted at,
Registration status. Values are prefixed with `'` when they begin with `=`, `+`, `-` or `@` to
prevent formula injection from participant input.

The reference in the sheet is a storage key, not a link. Receipts are never publicly reachable.

## Storage setup

`STORAGE_DRIVER=local` (default) writes to `UPLOAD_DIR`, which must sit outside any static-served
directory. Nothing in Express serves it. `STORAGE_DRIVER=s3` uses any S3-compatible bucket, which
must be created **private, with public access blocked**. Organisers fetch receipts through
`GET /api/admin/registrations/:id/payment-proof`, which requires the admin token.

## Deployment

Frontend is a static build (`npm run build` in `web/`). Backend needs a persistent process, a
Postgres instance, and either a persistent volume for `UPLOAD_DIR` or S3 credentials. Terminate
TLS at the proxy and set `TRUST_PROXY=1` so rate limiting sees real client IPs.

## Organiser workflow (payment verification)

No admin UI is in scope. Verification runs through the protected API:

```bash
# list registrations needing review
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  'https://…/api/admin/registrations?paymentStatus=pending'

# download one receipt
curl -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  'https://…/api/admin/registrations/WGR-000123/payment-proof' -o receipt.pdf

# record the decision
curl -X PATCH -H "Authorization: Bearer $ADMIN_API_TOKEN" -H 'Content-Type: application/json' \
  -d '{"paymentStatus":"verified"}' 'https://…/api/admin/registrations/WGR-000123'

# close or reopen registration
curl -X POST -H "Authorization: Bearer $ADMIN_API_TOKEN" -H 'Content-Type: application/json' \
  -d '{"open":false}' 'https://…/api/admin/registration-status'
```

Every status change is written to `registration_events` with actor and timestamp.

Editing the Google Sheet does **not** change anything in the system. The sheet is a mirror.

---

See `PRE_LAUNCH_CHECKLIST.md` for every placeholder that must be replaced before this goes live.
