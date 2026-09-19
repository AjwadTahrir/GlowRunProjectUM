import crypto from 'node:crypto';
import { config } from '../config.js';

/**
 * An uploadRef is a signed handle to a stored receipt: "<key>.<expiry>.<hmac>".
 * The browser holds it between the upload call and the registration call and
 * cannot forge one, so it can never point the server at a file it did not store.
 */

const TTL_MS = 60 * 60 * 1000; // an hour is plenty to finish a form

function sign(payload: string): string {
  return crypto.createHmac('sha256', config.UPLOAD_SIGNING_SECRET).update(payload).digest('base64url');
}

export function createUploadRef(storageKey: string, now = Date.now()): string {
  const expiry = String(now + TTL_MS);
  const payload = `${storageKey}.${expiry}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyUploadRef(ref: string, now = Date.now()): string | null {
  // The storage key contains dots (".pdf"), so parse from the right:
  // only the trailing expiry and signature have fixed positions.
  const lastDot = ref.lastIndexOf('.');
  const secondLastDot = ref.lastIndexOf('.', lastDot - 1);
  if (lastDot === -1 || secondLastDot === -1) return null;

  const storageKey = ref.slice(0, secondLastDot);
  const expiry = ref.slice(secondLastDot + 1, lastDot);
  const signature = ref.slice(lastDot + 1);
  if (!storageKey || !expiry || !signature) return null;

  const expected = sign(`${storageKey}.${expiry}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const expiresAt = Number(expiry);
  if (!Number.isFinite(expiresAt) || expiresAt < now) return null;

  return storageKey;
}
