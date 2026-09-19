import { describe, expect, it } from 'vitest';
import { registrationInputSchema } from '../lib/validation.js';
import { createUploadRef, verifyUploadRef } from '../lib/upload-ref.js';
import { __testing } from '../services/sheets.js';
import { sniffMimeType } from '../services/storage.js';

const base = {
  email: 'runner@example.test',
  fullName: 'Nur Aisyah binti Rahman',
  category: 'public' as const,
  phoneNumber: '012-345 6789',
  tshirtSize: 'M' as const,
  termsAccepted: true as const,
};

describe('registration validation', () => {
  it('accepts a complete public registration', () => {
    const result = registrationInputSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('normalises email case and strips phone formatting', () => {
    const result = registrationInputSchema.parse({ ...base, email: '  Runner@Example.TEST ' });
    expect(result.email).toBe('runner@example.test');
    expect(result.phoneNumber).toBe('0123456789');
  });

  it.each([
    ['missing email', { email: '' }],
    ['malformed email', { email: 'runner@' }],
    ['missing name', { fullName: '' }],
    ['missing size', { tshirtSize: undefined }],
    ['unagreed terms', { termsAccepted: false }],
    ['implausible phone', { phoneNumber: '12' }],
  ])('rejects %s', (_label, override) => {
    expect(registrationInputSchema.safeParse({ ...base, ...override }).success).toBe(false);
  });

  it('accepts names with apostrophes, hyphens and non-Latin scripts', () => {
    for (const fullName of ["Siti Nur'ain", 'Wong Mei-Ling', 'Müller Ådahl', '陈伟明']) {
      expect(registrationInputSchema.safeParse({ ...base, fullName }).success).toBe(true);
    }
  });

  it('requires a matriculation number from UM students only', () => {
    expect(
      registrationInputSchema.safeParse({ ...base, category: 'um_student' }).success,
    ).toBe(false);

    const student = registrationInputSchema.parse({
      ...base,
      category: 'um_student',
      matriculationNumber: '23001835',
    });
    expect(student.matriculationNumber).toBe('23001835');

    for (const category of ['um_staff', 'um_alumni', 'public'] as const) {
      expect(registrationInputSchema.safeParse({ ...base, category }).success).toBe(true);
    }
  });

  it('drops a stale matriculation number left over from a category switch', () => {
    const result = registrationInputSchema.parse({
      ...base,
      category: 'public',
      matriculationNumber: '23001835',
    });
    expect(result.matriculationNumber).toBeUndefined();
  });
});

describe('upload references', () => {
  const key = 'receipts/2026-01/11111111-1111-1111-1111-111111111111.pdf';

  it('round-trips a reference it signed', () => {
    expect(verifyUploadRef(createUploadRef(key))).toBe(key);
  });

  it('rejects a tampered key', () => {
    const ref = createUploadRef(key);
    const forged = ref.replace('11111111', '22222222');
    expect(verifyUploadRef(forged)).toBeNull();
  });

  it('rejects an expired reference', () => {
    const ref = createUploadRef(key, Date.now() - 10 * 60 * 60 * 1000);
    expect(verifyUploadRef(ref)).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(verifyUploadRef('nonsense')).toBeNull();
    expect(verifyUploadRef('')).toBeNull();
  });
});

describe('spreadsheet safety', () => {
  it('neutralises values that Sheets would read as formulas', () => {
    expect(__testing.safeCell('=HYPERLINK("http://evil","click")')).toMatch(/^'=/);
    expect(__testing.safeCell('+1')).toMatch(/^'\+/);
    expect(__testing.safeCell('@here')).toMatch(/^'@/);
    expect(__testing.safeCell('Nur Aisyah')).toBe('Nur Aisyah');
  });
});

describe('file type sniffing', () => {
  it('identifies allowed formats from their bytes', () => {
    expect(sniffMimeType(Buffer.from('%PDF-1.7\n1 0 obj'))).toBe('application/pdf');
    expect(sniffMimeType(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(8)]))).toBe('image/jpeg');
  });

  it('refuses a file renamed to look like a receipt', () => {
    // A ZIP (or anything else) with a .pdf name has the wrong magic number.
    expect(sniffMimeType(Buffer.concat([Buffer.from('PK\u0003\u0004'), Buffer.alloc(12)]))).toBeNull();
  });
});
