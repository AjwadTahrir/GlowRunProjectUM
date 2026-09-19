-- Witches Glow Run — initial schema.

CREATE TABLE IF NOT EXISTS event_state (
  id                  smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  max_capacity        integer  NOT NULL CHECK (max_capacity > 0),
  accepted_count      integer  NOT NULL DEFAULT 0 CHECK (accepted_count >= 0),
  registration_open   boolean  NOT NULL DEFAULT true,
  closed_reason       text,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capacity_not_exceeded CHECK (accepted_count <= max_capacity)
);

INSERT INTO event_state (id, max_capacity) VALUES (1, 500)
  ON CONFLICT (id) DO NOTHING;

CREATE TYPE participant_category   AS ENUM ('um_student', 'um_staff', 'um_alumni', 'public');
CREATE TYPE payment_status         AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE registration_status    AS ENUM ('accepted', 'cancelled');
CREATE TYPE sheets_sync_status     AS ENUM ('pending', 'synced', 'failed');

CREATE TABLE IF NOT EXISTS registrations (
  id                       text PRIMARY KEY,                -- WGR-000001
  seat_number              integer NOT NULL,
  idempotency_key          text NOT NULL,
  email                    text NOT NULL,
  full_name                text NOT NULL,
  category                 participant_category NOT NULL,
  matriculation_number     text,
  phone_number             text NOT NULL,
  tshirt_size              text NOT NULL,
  payment_proof_key        text NOT NULL,
  payment_proof_mime       text NOT NULL,
  payment_status           payment_status NOT NULL DEFAULT 'pending',
  registration_status      registration_status NOT NULL DEFAULT 'accepted',
  terms_accepted           boolean NOT NULL,
  terms_version            text NOT NULL,
  terms_accepted_at        timestamptz NOT NULL,
  sheets_sync_status       sheets_sync_status NOT NULL DEFAULT 'pending',
  sheets_synced_at         timestamptz,
  sheets_sync_attempts     integer NOT NULL DEFAULT 0,
  sheets_next_attempt_at   timestamptz NOT NULL DEFAULT now(),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT terms_must_be_accepted CHECK (terms_accepted = true),
  CONSTRAINT matric_required_for_students
    CHECK (category <> 'um_student' OR (matriculation_number IS NOT NULL AND matriculation_number <> '')),
  CONSTRAINT matric_only_for_students
    CHECK (category = 'um_student' OR matriculation_number IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS registrations_idempotency_key_uq
  ON registrations (idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS registrations_seat_number_uq
  ON registrations (seat_number);

-- One accepted registration per email; cancelled ones free the address up.
CREATE UNIQUE INDEX IF NOT EXISTS registrations_active_email_uq
  ON registrations (lower(email)) WHERE registration_status = 'accepted';

CREATE INDEX IF NOT EXISTS registrations_sheets_pending_idx
  ON registrations (sheets_next_attempt_at)
  WHERE sheets_sync_status <> 'synced';

CREATE INDEX IF NOT EXISTS registrations_payment_status_idx
  ON registrations (payment_status);

-- Audit trail for every status change an organiser makes.
CREATE TABLE IF NOT EXISTS registration_events (
  id              bigserial PRIMARY KEY,
  registration_id text REFERENCES registrations (id) ON DELETE CASCADE,
  event_type      text NOT NULL,
  from_value      text,
  to_value        text,
  actor           text NOT NULL,
  note            text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registration_events_registration_idx
  ON registration_events (registration_id, created_at DESC);

-- Uploads land here first and are claimed by a registration. Unclaimed rows are
-- swept, so an abandoned form does not leave an orphaned receipt forever.
CREATE TABLE IF NOT EXISTS pending_uploads (
  storage_key  text PRIMARY KEY,
  mime_type    text NOT NULL,
  byte_size    integer NOT NULL,
  claimed      boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_uploads_sweep_idx
  ON pending_uploads (created_at) WHERE claimed = false;

-- Registration IDs are sequential and human-quotable, but they are guessable,
-- so the participant lookup endpoint requires the email as well.
CREATE SEQUENCE IF NOT EXISTS registration_id_seq START 1;
