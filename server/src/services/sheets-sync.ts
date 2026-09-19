import { config } from '../config.js';
import { pool } from '../db.js';
import { logger } from '../lib/logger.js';
import { appendRegistration, updateRegistrationRow } from './sheets.js';
import { findById, type RegistrationRecord } from './registrations.js';

/**
 * A registration is accepted the moment its transaction commits. Writing it to the
 * organiser's spreadsheet is a separate, retried step, so a Google outage can never
 * cost someone their place — and never silently loses a row either: anything not yet
 * written stays 'pending' and is picked up again.
 */

const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 5_000;

function backoffMs(attempt: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** attempt, 30 * 60 * 1000);
}

async function markSynced(id: string): Promise<void> {
  await pool.query(
    `UPDATE registrations
        SET sheets_sync_status = 'synced', sheets_synced_at = now(), updated_at = now()
      WHERE id = $1`,
    [id],
  );
}

async function markFailure(reg: { id: string }, attempts: number): Promise<void> {
  const exhausted = attempts + 1 >= MAX_ATTEMPTS;
  await pool.query(
    `UPDATE registrations
        SET sheets_sync_status = $2,
            sheets_sync_attempts = sheets_sync_attempts + 1,
            sheets_next_attempt_at = now() + ($3 || ' milliseconds')::interval,
            updated_at = now()
      WHERE id = $1`,
    [reg.id, exhausted ? 'failed' : 'pending', backoffMs(attempts)],
  );
}

export async function syncOne(id: string): Promise<boolean> {
  const reg = await findById(id);
  if (!reg) return false;
  return syncRecord(reg, 0);
}

async function syncRecord(reg: RegistrationRecord, attempts: number): Promise<boolean> {
  try {
    // An update rewrites in place; a first sync appends. Both no-op when the row
    // is already correct, so retries cannot duplicate.
    if (reg.sheetsSyncedAt) await updateRegistrationRow(reg);
    else await appendRegistration(reg);

    await markSynced(reg.id);
    return true;
  } catch (error) {
    logger.error('sheets_sync_failed', {
      registrationId: reg.id,
      attempts,
      detail: error instanceof Error ? error.message : 'unknown',
    });
    await markFailure(reg, attempts);
    return false;
  }
}

/** One pass over everything waiting. Called on a timer and by the reconcile script. */
export async function runSyncPass(batchSize = 25): Promise<{ attempted: number; synced: number }> {
  if (!config.GOOGLE_SHEETS_ENABLED) return { attempted: 0, synced: 0 };

  const { rows } = await pool.query(
    `SELECT id, sheets_sync_attempts FROM registrations
      WHERE sheets_sync_status <> 'synced'
        AND sheets_next_attempt_at <= now()
        AND sheets_sync_attempts < $2
      ORDER BY created_at ASC
      LIMIT $1`,
    [batchSize, MAX_ATTEMPTS],
  );

  let synced = 0;
  for (const row of rows) {
    const reg = await findById(row.id);
    if (!reg) continue;
    if (await syncRecord(reg, row.sheets_sync_attempts)) synced += 1;
  }

  if (rows.length > 0) logger.info('sheets_sync_pass', { attempted: rows.length, synced });
  return { attempted: rows.length, synced };
}

export function startSyncWorker(intervalMs = 30_000): NodeJS.Timeout | null {
  if (!config.GOOGLE_SHEETS_ENABLED) {
    logger.warn('sheets_sync_worker_not_started', { reason: 'GOOGLE_SHEETS_ENABLED is false' });
    return null;
  }
  const timer = setInterval(() => {
    runSyncPass().catch((error) =>
      logger.error('sheets_sync_pass_crashed', { detail: String(error) }),
    );
  }, intervalMs);
  timer.unref();
  return timer;
}

/** Deletes receipts whose form was never submitted. */
export async function sweepUnclaimedUploads(olderThanHours = 24): Promise<number> {
  const { storage } = await import('./storage.js');
  const { rows } = await pool.query(
    `DELETE FROM pending_uploads
      WHERE claimed = false AND created_at < now() - ($1 || ' hours')::interval
      RETURNING storage_key`,
    [olderThanHours],
  );
  for (const row of rows) {
    await storage.delete(row.storage_key).catch(() => {});
  }
  if (rows.length) logger.info('swept_unclaimed_uploads', { count: rows.length });
  return rows.length;
}
