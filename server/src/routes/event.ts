import { Router } from 'express';
import { config } from '../config.js';
import { getAvailability } from '../services/registrations.js';

export const eventRouter = Router();

/**
 * Availability the browser can trust, because it is counted here. The form reads
 * this on load and again just before submitting.
 */
eventRouter.get('/event', async (_req, res, next) => {
  try {
    const availability = await getAvailability();
    res.json({
      registration: {
        open: availability.registrationOpen,
        isFull: availability.isFull,
        placesRemaining: availability.placesRemaining,
        maxCapacity: availability.maxCapacity,
        closedReason: availability.closedReason,
      },
      terms: { version: config.TERMS_VERSION },
      upload: {
        maxBytes: config.MAX_UPLOAD_BYTES,
        allowedMimeTypes: config.ALLOWED_UPLOAD_MIME,
      },
    });
  } catch (error) {
    next(error);
  }
});
