import crypto from 'node:crypto';
import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import {
  cancelRegistration,
  findById,
  getAvailability,
  listRegistrations,
  setRegistrationOpen,
  updatePaymentStatus,
} from '../services/registrations.js';
import { runSyncPass, syncOne } from '../services/sheets-sync.js';
import { storage } from '../services/storage.js';

export const adminRouter = Router();

/** Constant-time bearer check. Every route below is behind it. */
function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(config.ADMIN_API_TOKEN);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    logger.warn('admin_auth_rejected', { path: req.path });
    next(new ApiError(401, 'unauthorised', 'Administrator token required.'));
    return;
  }
  next();
}

adminRouter.use(requireAdmin);

adminRouter.get('/registrations', async (req, res, next) => {
  try {
    const query = z
      .object({
        paymentStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
        limit: z.coerce.number().int().min(1).max(500).default(100),
        offset: z.coerce.number().int().min(0).default(0),
      })
      .parse(req.query);

    res.json({
      availability: await getAvailability(),
      registrations: await listRegistrations(query),
    });
  } catch (error) {
    next(error);
  }
});

/** The only way to read a receipt. Streams bytes; no public URL is ever minted. */
adminRouter.get('/registrations/:id/payment-proof', async (req, res, next) => {
  try {
    const reg = await findById(req.params.id);
    if (!reg) throw new ApiError(404, 'not_found', 'No registration with that ID.');

    const buffer = await storage.get(reg.paymentProofKey);
    res.setHeader('Content-Type', reg.paymentProofMime);
    res.setHeader('Content-Disposition', `attachment; filename="${reg.id}-payment-proof"`);
    res.setHeader('Cache-Control', 'no-store');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

adminRouter.patch('/registrations/:id', async (req, res, next) => {
  try {
    const body = z
      .object({
        paymentStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
        cancel: z.boolean().optional(),
        note: z.string().max(500).optional(),
      })
      .parse(req.body);

    let registration = await findById(req.params.id);
    if (!registration) throw new ApiError(404, 'not_found', 'No registration with that ID.');

    if (body.paymentStatus) {
      registration = await updatePaymentStatus(req.params.id, body.paymentStatus, 'organiser', body.note);
    }
    if (body.cancel) {
      registration = await cancelRegistration(req.params.id, 'organiser', body.note);
    }

    void syncOne(req.params.id).catch(() => {});
    res.json({ registration });
  } catch (error) {
    next(error);
  }
});

adminRouter.post('/registration-status', async (req, res, next) => {
  try {
    const body = z.object({ open: z.boolean(), reason: z.string().max(300).optional() }).parse(req.body);
    res.json(await setRegistrationOpen(body.open, body.reason ?? null, 'organiser'));
  } catch (error) {
    next(error);
  }
});

/** Manual reconciliation trigger, for when the organiser notices a gap. */
adminRouter.post('/sheets/reconcile', async (_req, res, next) => {
  try {
    res.json(await runSyncPass(200));
  } catch (error) {
    next(error);
  }
});
