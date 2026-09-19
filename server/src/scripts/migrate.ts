import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, closePool } from '../db.js';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';

/** Applies every .sql file in migrations/ once, tracked in schema_migrations. */
const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(here, '../../migrations');

await pool.query(
  'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
);

const applied = new Set(
  (await pool.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name as string),
);

for (const file of (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort()) {
  if (applied.has(file)) continue;
  const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    await client.query('COMMIT');
    logger.info('migration_applied', { file });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Keep the capacity ceiling in step with configuration.
await pool.query('UPDATE event_state SET max_capacity = $1 WHERE id = 1', [config.MAX_CAPACITY]);
logger.info('migrations_complete', { maxCapacity: config.MAX_CAPACITY });
await closePool();
