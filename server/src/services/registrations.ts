import { config } from '../config.js';
import { pool, withTransaction, type Tx } from '../db.js';
import { ApiError, conflict } from '../lib/errors.js';
import type { RegistrationInput } from '../lib/validation.js';

export interface RegistrationRecord {
  id: string;
  seatNumber: number;
  email: string;
  fullName: string;
  category: string;
  matriculationNumber: string | null;
  phoneNumber: string;
  tshirtSize: string;
  paymentProofKey: string;
  paymentProofMime: string;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  registrationStatus: 'accepted' | 'cancelled';
  termsAccepted: boolean;
  termsVersion: string;
  termsAcceptedAt: Date;
  sheetsSyncStatus: 'pending' | 'synced' | 'failed';
  sheetsSyncedAt: Date | null;
  createdAt: Date;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function toRecord(row: any): RegistrationRecord {
  return {
    id: row.id,
    seatNumber: row.seat_number,
    email: row.email,
    fullName: row.full_name,
    category: row.category,
    matriculationNumber: row.matriculation_number,
    phoneNumber: row.phone_number,
    tshirtSize: row.tshirt_size,
    paymentProofKey: row.payment_proof_key,
    paymentProofMime: row.payment_proof_mime,
    paymentStatus: row.payment_status,
    registrationStatus: row.registration_status,
    termsAccepted: row.terms_accepted,
    termsVersion: row.terms_version,
    termsAcceptedAt: row.terms_accepted_at,
    sheetsSyncStatus: row.sheets_sync_status,
    sheetsSyncedAt: row.sheets_synced_at,
    createdAt: row.created_at,
  };
}

export interface EventAvailability {
  maxCapacity: number;
  acceptedCount: number;
  placesRemaining: number;
  registrationOpen: boolean;
  isFull: boolean;
  closedReason: string | null;
}

/** The only number the browser is ever allowed to display, and it comes from here. */
export async function getAvailability(): Promise<EventAvailability> {
  const { rows } = await pool.query(
    'SELECT max_capacity, accepted_count, registration_open, closed_reason FROM event_state WHERE id = 1',
  );
  const row = rows[0];
  if (!row) throw new Error('event_state row is missing — run the migrations');

  const placesRemaining = Math.max(0, row.max_capacity - row.accepted_count);
  return {
    maxCapacity: row.max_capacity,
    acceptedCount: row.accepted_count,
    placesRemaining,
    registrationOpen: row.registration_open,
    isFull: placesRemaining === 0,
    closedReason: row.closed_reason,
  };
}

/**
 * Claims one place. The conditional UPDATE is the whole mechanism: Postgres takes a
 * row lock on event_state, so simultaneous requests queue behind each other and the
 * count can never pass max_capacity. Zero rows back means full or closed.
 *
 * The returned value is the new occupancy, not the participant's number — a
 * cancellation lowers occupancy, and reusing a freed number would collide with an
 * existing ID. Numbers come from a sequence instead, so they only ever go up.
 */
async function allocatePlace(tx: Tx): Promise<number> {
  const { rows } = await tx.query(
    `UPDATE event_state
        SET accepted_count = accepted_count + 1,
            updated_at = now()
      WHERE id = 1
        AND registration_open = true
        AND accepted_count < max_capacity
      RETURNING accepted_count`,
  );

  if (rows.length === 0) {
    const state = await tx.query('SELECT accepted_count, max_capacity, registration_open FROM event_state WHERE id = 1');
    const open = state.rows[0]?.registration_open;
    throw open
      ? new ApiError(409, 'registration_full', 'All 500 places have been taken.')
      : new ApiError(409, 'registration_closed', 'Registration is closed.');
  }

  // The post-increment count is this participant's place number: 1 through 500.
  return rows[0].accepted_count as number;
}

function formatId(seatNumber: number): string {
  return `WGR-${String(seatNumber).padStart(4, '0')}`;
}

export interface CreateRegistrationArgs {
  input: RegistrationInput;
  idempotencyKey: string;
  paymentProofKey: string;
  paymentProofMime: string;
}

export interface CreateRegistrationResult {
  registration: RegistrationRecord;
  created: boolean; // false when an identical request was replayed
}

export async function createRegistration(
  args: CreateRegistrationArgs,
): Promise<CreateRegistrationResult> {
  // A retry of a request that already succeeded returns the original, without
  // touching the counter.
  const replay = await findByIdempotencyKey(args.idempotencyKey);
  if (replay) return { registration: replay, created: false };

  try {
    const registration = await withTransaction(async (tx) => {
      await allocatePlace(tx);
      const seat = await tx.query("SELECT nextval('registration_id_seq') AS seat");
      const seatNumber = Number(seat.rows[0].seat);
      const id = formatId(seatNumber);
      const now = new Date();

      const { rows } = await tx.query(
        `INSERT INTO registrations (
           id, seat_number, idempotency_key, email, full_name, category,
           matriculation_number, phone_number, tshirt_size,
           payment_proof_key, payment_proof_mime,
           terms_accepted, terms_version, terms_accepted_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true,$12,$13)
         RETURNING *`,
        [
          id,
          seatNumber,
          args.idempotencyKey,
          args.input.email,
          args.input.fullName,
          args.input.category,
          args.input.matriculationNumber ?? null,
          args.input.phoneNumber,
          args.input.tshirtSize,
          args.paymentProofKey,
          args.paymentProofMime,
          config.TERMS_VERSION,
          now,
        ],
      );

      await tx.query('UPDATE pending_uploads SET claimed = true WHERE storage_key = $1', [
        args.paymentProofKey,
      ]);

      await tx.query(
        `INSERT INTO registration_events (registration_id, event_type, to_value, actor)
         VALUES ($1, 'registration_accepted', 'accepted', 'participant')`,
        [id],
      );

      return toRecord(rows[0]);
    });

    return { registration, created: true };
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    const constraint = (error as { constraint?: string }).constraint;

    // Two requests raced with the same key: the loser reads the winner's row.
    if (code === '23505' && constraint === 'registrations_idempotency_key_uq') {
      const existing = await findByIdempotencyKey(args.idempotencyKey);
      if (existing) return { registration: existing, created: false };
    }

    if (code === '23505' && constraint === 'registrations_active_email_uq') {
      throw conflict('duplicate_email', 'That email address is already registered for this run.');
    }

    throw error;
  }
}

export async function findByIdempotencyKey(key: string): Promise<RegistrationRecord | null> {
  const { rows } = await pool.query('SELECT * FROM registrations WHERE idempotency_key = $1', [key]);
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function findById(id: string): Promise<RegistrationRecord | null> {
  const { rows } = await pool.query('SELECT * FROM registrations WHERE id = $1', [id]);
  return rows[0] ? toRecord(rows[0]) : null;
}

/** IDs are sequential and therefore guessable, so the email must match too. */
export async function findByIdAndEmail(id: string, email: string): Promise<RegistrationRecord | null> {
  const { rows } = await pool.query(
    'SELECT * FROM registrations WHERE id = $1 AND lower(email) = lower($2)',
    [id, email],
  );
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function listRegistrations(filter: {
  paymentStatus?: string;
  limit: number;
  offset: number;
}): Promise<RegistrationRecord[]> {
  const { rows } = await pool.query(
    `SELECT * FROM registrations
      WHERE ($1::text IS NULL OR payment_status = $1::payment_status)
      ORDER BY seat_number ASC
      LIMIT $2 OFFSET $3`,
    [filter.paymentStatus ?? null, filter.limit, filter.offset],
  );
  return rows.map(toRecord);
}

export async function updatePaymentStatus(
  id: string,
  status: 'pending' | 'verified' | 'rejected',
  actor: string,
  note?: string,
): Promise<RegistrationRecord> {
  return withTransaction(async (tx) => {
    const current = await tx.query('SELECT payment_status FROM registrations WHERE id = $1 FOR UPDATE', [id]);
    if (current.rows.length === 0) throw new ApiError(404, 'not_found', 'No registration with that ID.');

    const { rows } = await tx.query(
      `UPDATE registrations
          SET payment_status = $2,
              updated_at = now(),
              sheets_sync_status = CASE WHEN sheets_sync_status = 'synced' THEN 'pending'::sheets_sync_status ELSE sheets_sync_status END,
              sheets_next_attempt_at = now()
        WHERE id = $1
        RETURNING *`,
      [id, status],
    );

    await tx.query(
      `INSERT INTO registration_events (registration_id, event_type, from_value, to_value, actor, note)
       VALUES ($1, 'payment_status_changed', $2, $3, $4, $5)`,
      [id, current.rows[0].payment_status, status, actor, note ?? null],
    );

    return toRecord(rows[0]);
  });
}

/**
 * Cancelling frees the place. This is the only path that decrements the counter —
 * nothing expires on a timer, because an unattended release could hand a paid
 * participant's place to someone else.
 */
export async function cancelRegistration(id: string, actor: string, note?: string): Promise<RegistrationRecord> {
  return withTransaction(async (tx) => {
    const { rows } = await tx.query(
      `UPDATE registrations
          SET registration_status = 'cancelled', updated_at = now(),
              sheets_sync_status = 'pending', sheets_next_attempt_at = now()
        WHERE id = $1 AND registration_status = 'accepted'
        RETURNING *`,
      [id],
    );
    if (rows.length === 0) throw new ApiError(404, 'not_found', 'No accepted registration with that ID.');

    await tx.query(
      `UPDATE event_state SET accepted_count = GREATEST(accepted_count - 1, 0), updated_at = now() WHERE id = 1`,
    );

    await tx.query(
      `INSERT INTO registration_events (registration_id, event_type, from_value, to_value, actor, note)
       VALUES ($1, 'registration_cancelled', 'accepted', 'cancelled', $2, $3)`,
      [id, actor, note ?? null],
    );

    return toRecord(rows[0]);
  });
}

export async function setRegistrationOpen(open: boolean, reason: string | null, actor: string): Promise<EventAvailability> {
  await withTransaction(async (tx) => {
    await tx.query(
      'UPDATE event_state SET registration_open = $1, closed_reason = $2, updated_at = now() WHERE id = 1',
      [open, open ? null : reason],
    );
    await tx.query(
      `INSERT INTO registration_events (event_type, to_value, actor, note)
       VALUES ('registration_window_changed', $1, $2, $3)`,
      [open ? 'open' : 'closed', actor, reason],
    );
  });
  return getAvailability();
}

/** What a participant is allowed to see about their own registration. */
export function toParticipantView(reg: RegistrationRecord) {
  return {
    id: reg.id,
    fullName: reg.fullName,
    email: reg.email,
    category: reg.category,
    tshirtSize: reg.tshirtSize,
    paymentStatus: reg.paymentStatus,
    registrationStatus: reg.registrationStatus,
    termsVersion: reg.termsVersion,
    createdAt: reg.createdAt,
    paymentPendingCountsTowardCapacity: config.CAPACITY_COUNTS_PENDING_PAYMENT,
  };
}
