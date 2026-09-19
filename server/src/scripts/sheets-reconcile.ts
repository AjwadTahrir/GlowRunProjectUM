import { runSyncPass } from '../services/sheets-sync.js';
import { closePool } from '../db.js';
import { logger } from '../lib/logger.js';

// Run on a schedule or by hand after an outage. Safe to run repeatedly.
const result = await runSyncPass(500);
logger.info('reconcile_complete', result);
await closePool();
