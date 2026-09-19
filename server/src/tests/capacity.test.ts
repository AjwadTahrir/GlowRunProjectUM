import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { closePool, pool } from '../db.js';
import { createRegistration, getAvailability, setRegistrationOpen } from '../services/registrations.js';
import type { RegistrationInput } from '../lib/validation.js';

/**
 * These run against a real Postgres (TEST_DATABASE_URL). Row-level locking is the
 * mechanism under test, so mocking the database would test nothing.
 */

let counter = 0;

function input(overrides: Partial<RegistrationInput> = {}): RegistrationInput {
  counter += 1;
  return {
    email: `runner${counter}@example.test`,
    fullName: 'Test Runner',
    category: 'public',
    matriculationNumber: undefined,
    phoneNumber: '+60123456789',
    tshirtSize: 'M',
    termsAccepted: true,
    ...overrides,
  } as RegistrationInput;
}

async function register(capacityKey: string, overrides: Partial<RegistrationInput> = {}) {
  return createRegistration({
    input: input(overrides),
    idempotencyKey: capacityKey,
    paymentProofKey: 'receipts/2026-01/00000000-0000-0000-0000-000000000000.pdf',
    paymentProofMime: 'application/pdf',
  });
}

async function resetTo(maxCapacity: number, acceptedCount = 0) {
  await pool.query('TRUNCATE registration_events, registrations RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE pending_uploads');
  await pool.query(
    `UPDATE event_state
        SET max_capacity = $1, accepted_count = $2, registration_open = true, closed_reason = NULL
      WHERE id = 1`,
    [maxCapacity, acceptedCount],
  );
}

beforeEach(async () => {
  await resetTo(500);
});

afterAll(async () => {
  await closePool();
});

describe('capacity enforcement', () => {
  it('accepts a registration while places remain', async () => {
    const result = await register('key-basic-1');
    expect(result.created).toBe(true);
    expect(result.registration.registrationStatus).toBe('accepted');
    expect((await getAvailability()).acceptedCount).toBe(1);
  });

  it('allocates the 500th place and rejects the 501st', async () => {
    await resetTo(500, 499);

    const last = await register('key-place-500');
    expect(last.created).toBe(true);

    const availability = await getAvailability();
    expect(availability.acceptedCount).toBe(500);
    expect(availability.isFull).toBe(true);

    await expect(register('key-place-501')).rejects.toMatchObject({ code: 'registration_full' });
    expect((await getAvailability()).acceptedCount).toBe(500);
  });

  it('never exceeds capacity when requests race for the final place', async () => {
    await resetTo(500, 499);

    const attempts = Array.from({ length: 20 }, (_, i) => register(`key-race-${i}`));
    const settled = await Promise.allSettled(attempts);

    const accepted = settled.filter((r) => r.status === 'fulfilled');
    const rejected = settled.filter((r) => r.status === 'rejected');

    expect(accepted).toHaveLength(1);
    expect(rejected).toHaveLength(19);
    expect((await getAvailability()).acceptedCount).toBe(500);
  });

  it('does not consume a place when a registration fails validation at the database', async () => {
    const before = (await getAvailability()).acceptedCount;

    // A UM Student with no matriculation number violates a CHECK constraint.
    await expect(
      register('key-invalid-1', { category: 'um_student', matriculationNumber: undefined }),
    ).rejects.toBeTruthy();

    expect((await getAvailability()).acceptedCount).toBe(before);
  });

  it('blocks new registrations once the organiser closes the window', async () => {
    await setRegistrationOpen(false, 'Closed early by the organiser', 'test');

    await expect(register('key-closed-1')).rejects.toMatchObject({ code: 'registration_closed' });

    await setRegistrationOpen(true, null, 'test');
    await expect(register('key-reopened-1')).resolves.toMatchObject({ created: true });
  });
});

describe('duplicate protection', () => {
  it('returns the original registration when the same idempotency key is replayed', async () => {
    const first = await register('key-replay');
    const second = await createRegistration({
      input: input({ email: first.registration.email }),
      idempotencyKey: 'key-replay',
      paymentProofKey: 'receipts/2026-01/00000000-0000-0000-0000-000000000000.pdf',
      paymentProofMime: 'application/pdf',
    });

    expect(second.created).toBe(false);
    expect(second.registration.id).toBe(first.registration.id);
    expect((await getAvailability()).acceptedCount).toBe(1);
  });

  it('survives two simultaneous submissions of the same key without double-booking', async () => {
    const [a, b] = await Promise.all([register('key-double-click'), register('key-double-click')]);

    expect(a.registration.id).toBe(b.registration.id);
    expect([a.created, b.created].filter(Boolean)).toHaveLength(1);
    expect((await getAvailability()).acceptedCount).toBe(1);
  });

  it('rejects a second registration for the same email address', async () => {
    await register('key-email-1', { email: 'same@example.test' });

    await expect(register('key-email-2', { email: 'same@example.test' })).rejects.toMatchObject({
      code: 'duplicate_email',
    });

    expect((await getAvailability()).acceptedCount).toBe(1);
  });
});
