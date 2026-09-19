import { google, type sheets_v4 } from 'googleapis';
import { config } from '../config.js';
import { logger } from '../lib/logger.js';
import { CATEGORY_LABELS, type Category } from '../lib/validation.js';
import type { RegistrationRecord } from './registrations.js';

export const SHEET_HEADERS = [
  'Registration ID',
  'Registration timestamp',
  'Email',
  'Full name',
  'Participant category',
  'Matriculation number',
  'Phone number',
  'T-shirt size',
  'Payment proof file reference',
  'Payment verification status',
  'Terms agreement status',
  'Terms agreement timestamp',
  'Registration status',
];

/**
 * Anything a participant typed could start with =, +, - or @ and be read as a
 * formula when the organiser opens the sheet. Prefixing with an apostrophe forces
 * Sheets to treat it as text.
 */
function safeCell(value: string | null | undefined): string {
  const text = (value ?? '').toString();
  return /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
}

let cached: sheets_v4.Sheets | null = null;

function client(): sheets_v4.Sheets {
  if (cached) return cached;

  const scopes = ['https://www.googleapis.com/auth/spreadsheets'];
  const auth = config.GOOGLE_SERVICE_ACCOUNT_EMAIL && config.GOOGLE_PRIVATE_KEY
    ? new google.auth.JWT({
        email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        // Env vars carry the key with literal \n sequences.
        key: config.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes,
      })
    : new google.auth.GoogleAuth({ scopes });

  cached = google.sheets({ version: 'v4', auth: auth as never });
  return cached;
}

export function registrationToRow(reg: RegistrationRecord): string[] {
  return [
    reg.id,
    reg.createdAt.toISOString(),
    safeCell(reg.email),
    safeCell(reg.fullName),
    CATEGORY_LABELS[reg.category as Category] ?? reg.category,
    safeCell(reg.matriculationNumber),
    safeCell(reg.phoneNumber),
    reg.tshirtSize,
    reg.paymentProofKey, // a storage key, never a public link
    reg.paymentStatus,
    reg.termsAccepted ? `Agreed (${reg.termsVersion})` : 'Not agreed',
    reg.termsAcceptedAt.toISOString(),
    reg.registrationStatus,
  ].map(safeCell);
}

/** Registration IDs already present in column A. Used to make retries idempotent. */
async function existingIds(): Promise<Set<string>> {
  const response = await client().spreadsheets.values.get({
    spreadsheetId: config.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: `${config.GOOGLE_SHEETS_TAB}!A2:A`,
  });
  return new Set((response.data.values ?? []).map((row) => String(row[0] ?? '')));
}

export async function ensureHeaderRow(): Promise<void> {
  await client().spreadsheets.values.update({
    spreadsheetId: config.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: `${config.GOOGLE_SHEETS_TAB}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [SHEET_HEADERS] },
  });
}

/**
 * Appends a registration unless its ID is already in the sheet. Returns false when
 * the row was already there, so a retry after a timeout cannot duplicate it.
 */
export async function appendRegistration(reg: RegistrationRecord): Promise<boolean> {
  if (!config.GOOGLE_SHEETS_ENABLED) {
    logger.info('sheets_disabled_skipping_append', { registrationId: reg.id });
    return false;
  }

  if ((await existingIds()).has(reg.id)) {
    logger.info('sheets_row_already_present', { registrationId: reg.id });
    return false;
  }

  await client().spreadsheets.values.append({
    spreadsheetId: config.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: `${config.GOOGLE_SHEETS_TAB}!A:M`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [registrationToRow(reg)] },
  });

  return true;
}

/** Rewrites one existing row in place, e.g. after payment verification. */
export async function updateRegistrationRow(reg: RegistrationRecord): Promise<boolean> {
  if (!config.GOOGLE_SHEETS_ENABLED) return false;

  const response = await client().spreadsheets.values.get({
    spreadsheetId: config.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: `${config.GOOGLE_SHEETS_TAB}!A2:A`,
  });

  const index = (response.data.values ?? []).findIndex((row) => String(row[0] ?? '') === reg.id);
  if (index === -1) return appendRegistration(reg);

  await client().spreadsheets.values.update({
    spreadsheetId: config.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: `${config.GOOGLE_SHEETS_TAB}!A${index + 2}:M${index + 2}`,
    valueInputOption: 'RAW',
    requestBody: { values: [registrationToRow(reg)] },
  });

  return true;
}

export const __testing = { safeCell };
