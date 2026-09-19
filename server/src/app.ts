import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler } from './lib/errors.js';
import { adminRouter } from './routes/admin.js';
import { eventRouter } from './routes/event.js';
import { registrationRouter } from './routes/registrations.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', config.TRUST_PROXY);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
  app.use(express.json({ limit: '64kb' }));

  // The browser bundle is served from a different origin in development only.
  app.use((req, res, next) => {
    if (config.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', config.PUBLIC_WEB_ORIGIN);
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
      }
    }
    next();
  });

  const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Too many attempts. Wait a few minutes and try again.' } },
  });

  const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: { code: 'rate_limited', message: 'Too many uploads. Wait a few minutes and try again.' } },
  });

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/api', eventRouter);
  app.use('/api/uploads', uploadLimiter);
  app.use('/api/registrations', writeLimiter);
  app.use('/api', registrationRouter);
  app.use('/api/admin', adminRouter);

  app.use((_req, res) =>
    res.status(404).json({ error: { code: 'not_found', message: 'No such endpoint.' } }),
  );
  app.use(errorHandler);

  return app;
}
