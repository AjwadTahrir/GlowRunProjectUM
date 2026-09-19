import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config.js';
import { pool } from '../db.js';
import { ApiError, badRequest } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { createUploadRef, verifyUploadRef } from '../lib/upload-ref.js';
import { registrationInputSchema } from '../lib/validation.js';
import {
  createRegistration,
  findByIdAndEmail,
  getAvailability,
  toParticipantView,
} from '../services/registrations.js';
import { syncOne } from '../services/sheets-sync.js';
import { sniffMimeType, storage } from '../services/storage.js';

export const registrationRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_UPLOAD_BYTES, files: 1 },
});

/**
 * Step 1: store the receipt privately and hand back a signed reference.
 * Splitting this from registration keeps the capacity transaction short and stops a
 * storage failure from stranding a half-created registration.
 */
registrationRouter.post('/uploads', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw badRequest('upload_rejected', 'Attach your proof of payment.');

    const { buffer, mimetype, size } = req.file;

    if (size > config.MAX_UPLOAD_BYTES) {
      throw badRequest(
        'upload_rejected',
        `That file is larger than ${Math.round(config.MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
      );
    }

    // The declared type is a hint; the bytes decide.
    const sniffed = sniffMimeType(buffer);
    if (!sniffed || !config.ALLOWED_UPLOAD_MIME.includes(sniffed)) {
      throw badRequest(
        'upload_rejected',
        'Upload a JPG, PNG, WebP or PDF. That file is a different format.',
      );
    }
    if (sniffed !== mimetype) {
      logger.warn('upload_mime_mismatch', { declared: mimetype, actual: sniffed });
    }

    const stored = await storage.put(buffer, sniffed, req.file.originalname);
    await pool.query(
      'INSERT INTO pending_uploads (storage_key, mime_type, byte_size) VALUES ($1, $2, $3)',
      [stored.key, stored.mimeType, stored.byteSize],
    );

    res.status(201).json({
      uploadRef: createUploadRef(stored.key),
      mimeType: stored.mimeType,
      byteSize: stored.byteSize,
    });
  } catch (error) {
    next(error);
  }
});

const bodySchema = z.object({
  registration: z.unknown(),
  uploadRef: z.string().min(1, 'Attach your proof of payment'),
});

/** Step 2: validate, claim a place atomically, persist, then queue the Sheets write. */
registrationRouter.post('/registrations', async (req, res, next) => {
  try {
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 200) {
      throw badRequest('validation_failed', 'Missing or malformed Idempotency-Key header.');
    }

    const body = bodySchema.parse(req.body);
    const input = registrationInputSchema.parse(body.registration);

    const storageKey = verifyUploadRef(body.uploadRef);
    if (!storageKey) {
      throw badRequest(
        'invalid_upload_reference',
        'Your payment proof has expired. Attach the file again.',
      );
    }

    const { rows } = await pool.query(
      'SELECT mime_type, claimed FROM pending_uploads WHERE storage_key = $1',
      [storageKey],
    );
    const pending = rows[0];
    if (!pending) {
      throw badRequest('invalid_upload_reference', 'We could not find that payment proof. Attach it again.');
    }

    const result = await createRegistration({
      input,
      idempotencyKey,
      paymentProofKey: storageKey,
      paymentProofMime: pending.mime_type,
    });

    // Fire and forget: acceptance does not depend on Google being reachable, and
    // the worker retries whatever this misses.
    if (result.created) {
      void syncOne(result.registration.id).catch(() => {});
    }

    res.status(result.created ? 201 : 200).json({
      registration: toParticipantView(result.registration),
      spreadsheetSync: result.registration.sheetsSyncStatus,
      duplicate: !result.created,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Participant lookup. IDs run in sequence and are therefore guessable, so the email
 * has to match — otherwise anyone could walk the range and read other people's details.
 */
registrationRouter.get('/registrations/:id', async (req, res, next) => {
  try {
    const email = z.string().email().safeParse(req.query.email);
    if (!email.success) {
      throw new ApiError(400, 'validation_failed', 'Add ?email= to look up a registration.');
    }

    const reg = await findByIdAndEmail(req.params.id, email.data);
    if (!reg) throw new ApiError(404, 'not_found', 'No registration matches that ID and email address.');

    res.json({ registration: toParticipantView(reg), spreadsheetSync: reg.sheetsSyncStatus });
  } catch (error) {
    next(error);
  }
});

registrationRouter.get('/availability', async (_req, res, next) => {
  try {
    res.json(await getAvailability());
  } catch (error) {
    next(error);
  }
});
