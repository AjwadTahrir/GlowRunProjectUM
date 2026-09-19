/**
 * Minimal structured logger. Personal data must never reach it: log registration
 * IDs, not emails, names, phone numbers or file contents.
 */
const REDACT = /(email|fullName|full_name|phone|phoneNumber|matric|matriculation|password|token|key)/i;

function sanitise(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    out[k] = REDACT.test(k) ? '[redacted]' : v;
  }
  return out;
}

function emit(level: string, message: string, meta: Record<string, unknown> = {}): void {
  const line = JSON.stringify({ level, message, ...sanitise(meta), at: new Date().toISOString() });
  if (level === 'error') console.error(line);
  else console.log(line);
}

export const logger = {
  info: (m: string, meta?: Record<string, unknown>) => emit('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => emit('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => emit('error', m, meta),
};
