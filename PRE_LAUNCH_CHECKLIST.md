# Pre-launch checklist

Nothing below is invented. Every line is information only the organiser can supply.
Anything still missing appears on the page as a blank printed line, and screen readers
hear "To be announced". Blanks are quiet by design, so they are easy to miss: run
`npm run dev` and the browser console lists every unconfirmed field by name.

## Blocking — registration must not open until these are done

- [ ] **Terms and conditions.** `eventConfig.terms.body` holds placeholder text, not a policy.
      Replace it with approved wording and bump `terms.version` and `TERMS_VERSION` together —
      the version is stored against every participant's agreement.
- [ ] **Registration fees**, per category, in `eventConfig.categories`.
- [ ] **Payment instructions**: bank, account name, account number or QR image.
      `eventConfig.payment`.
- [ ] **Event date, flag-off time, venue, distance**. `eventConfig.date/time/venue/distance`.
- [ ] **Organiser name and contact number**. `eventConfig.organiser`, `eventConfig.contactNumber`.
- [ ] **T-shirt size chart** image plus measurements and units. `posters.sizeChart`,
      `tshirt.chartNote`. Confirm which sizes are actually being produced — the list in
      `tshirt.sizes` is a default, not a stock commitment.
- [ ] Generate real values for `UPLOAD_SIGNING_SECRET` and `ADMIN_API_TOKEN`
      (`openssl rand -hex 32`). The example values must never reach production.

## Assets to drop into `web/public/` and reference in `eventConfig.posters`

- [ ] Route map or route poster (`posters.route`) plus start point, finish point and route notes. Named stops along the course (checkpoints, water) go in `route.points`; none are shown until supplied.
- [ ] Event tentative poster (`posters.tentative`) and/or the schedule rows in `eventConfig.schedule`.
- [ ] Entitlements poster (`posters.entitlements`) and/or the list in `eventConfig.entitlements`,
      with inclusions and exclusions stated.
- [ ] Lucky draw poster (`posters.luckyDraw`), confirmed prizes, eligibility and draw timing.
- [ ] Hero background photograph, if one is being used.

## Links

- [ ] WhatsApp group invite URL and QR code (`eventConfig.whatsapp`). Decide whether the group is
      shown to everyone or only after registration — the default is after registration.
- [ ] Instagram, TikTok and Facebook URLs (`eventConfig.social`).
- [ ] Confirm the tagline. "A little magic. A lot of miles." is a draft, not official copy.

## Policy decisions the organiser has to make

- [ ] Do payment-pending registrations hold a place? Currently yes
      (`CAPACITY_COUNTS_PENDING_PAYMENT=true`). If a place should be released when payment is
      rejected, the organiser cancels the registration — nothing expires automatically.
- [ ] How long are participant records and receipts kept after the event? The privacy notice
      promises deletion after a retention period; set one.
- [ ] Who on the committee holds the admin token and reviews receipts?
- [ ] Is a waiting list wanted? None is implemented, and the full-capacity copy explicitly says so.
      Do not add waiting-list language without building the waiting list.

## Infrastructure

- [ ] Postgres provisioned; `npm run migrate` applied.
- [ ] `MAX_CAPACITY` confirmed as 500.
- [ ] Google Cloud project, Sheets API enabled, service account created, spreadsheet shared with
      the service account and with nobody else who doesn't need it.
- [ ] `npm run sheets:init` run once to write the header row.
- [ ] Storage decided: local volume or a private S3 bucket with public access blocked.
- [ ] HTTPS terminated; `TRUST_PROXY=1` set so rate limiting sees real IPs.
- [ ] `npm test` passing in both packages against real infrastructure.
- [ ] A scheduled `npm run sheets:reconcile` (or the admin reconcile endpoint) in case the
      worker misses rows during an outage.

## Verify by hand before launch

- [ ] Register once end to end and confirm the row appears in the spreadsheet.
- [ ] Download that receipt through the admin endpoint; confirm no public URL works.
- [ ] Temporarily set `MAX_CAPACITY` to a small number on a staging database and confirm the
      full-capacity state renders and the API refuses the next registration.
- [ ] Check the built frontend bundle contains no credentials: `grep -ri "private_key\|ADMIN_API_TOKEN" web/dist`.
