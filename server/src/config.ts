import 'dotenv/config';
import { z } from 'zod';

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  PUBLIC_WEB_ORIGIN: z.string().url().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1),
  TEST_DATABASE_URL: z.string().optional(),

  MAX_CAPACITY: z.coerce.number().int().positive().default(500),
  CAPACITY_COUNTS_PENDING_PAYMENT: bool.default('true'),

  UPLOAD_SIGNING_SECRET: z.string().min(16, 'UPLOAD_SIGNING_SECRET must be at least 16 chars'),
  ADMIN_API_TOKEN: z.string().min(16, 'ADMIN_API_TOKEN must be at least 16 chars'),

  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  UPLOAD_DIR: z.string().default('./.private-uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  ALLOWED_UPLOAD_MIME: z
    .string()
    .default('image/jpeg,image/png,image/webp,application/pdf')
    .transform((v) => v.split(',').map((s) => s.trim()).filter(Boolean)),

  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  GOOGLE_SHEETS_ENABLED: bool.default('false'),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().optional(),
  GOOGLE_SHEETS_TAB: z.string().default('Registrations'),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  TERMS_VERSION: z.string().default('PLACEHOLDER-v0'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const config = parsed.data;

export const databaseUrl =
  config.NODE_ENV === 'test' && config.TEST_DATABASE_URL
    ? config.TEST_DATABASE_URL
    : config.DATABASE_URL;

if (config.STORAGE_DRIVER === 's3' && !config.S3_BUCKET) {
  throw new Error('STORAGE_DRIVER=s3 requires S3_BUCKET');
}

if (config.GOOGLE_SHEETS_ENABLED && !config.GOOGLE_SHEETS_SPREADSHEET_ID) {
  throw new Error('GOOGLE_SHEETS_ENABLED=true requires GOOGLE_SHEETS_SPREADSHEET_ID');
}
