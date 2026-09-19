import { config } from './config.js';
import { createApp } from './app.js';
import { logger } from './lib/logger.js';
import { startSyncWorker, sweepUnclaimedUploads } from './services/sheets-sync.js';

const app = createApp();

app.listen(config.PORT, () => {
  logger.info('server_started', { port: config.PORT, env: config.NODE_ENV });
  startSyncWorker();

  // Housekeeping: receipts uploaded by people who never submitted the form.
  const sweeper = setInterval(() => {
    sweepUnclaimedUploads().catch((error) =>
      logger.error('upload_sweep_failed', { detail: String(error) }),
    );
  }, 60 * 60 * 1000);
  sweeper.unref();
});
