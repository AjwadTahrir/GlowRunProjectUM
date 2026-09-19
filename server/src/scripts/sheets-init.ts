import { ensureHeaderRow } from '../services/sheets.js';
import { logger } from '../lib/logger.js';

await ensureHeaderRow();
logger.info('sheets_header_written');
