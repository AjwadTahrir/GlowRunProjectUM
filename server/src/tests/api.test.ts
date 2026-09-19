import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { config } from '../config.js';
import { closePool, pool } from '../db.js';

const app = createApp();

const validForm = {
  email: 'api-runner@example.test',
  fullName: 'Api Runner',
  category: 'public',
  phoneNumber: '+60123456789',
  tshirtSize: 'L',
  termsAccepted: true,
};

const PDF = Buffer.from('%PDF-1.7\nfake receipt for tests');

beforeEach(async () => {
  await pool.query('TRUNCATE registration_events, registrations RESTART IDENTITY CASCADE');
  await pool.query('TRUNCATE pending_uploads');
  await pool.query(
    'UPDATE event_state SET accepted_count = 0, max_capacity = 500, registration_open = true WHERE id = 1',
  );
});

afterAll(async () => {
  await closePool();
});

async function uploadReceipt(): Promise<string> {
  const response = await request(app)
    .post('/api/uploads')
    .attach('file', PDF, { filename: 'receipt.pdf', contentType: 'application/pdf' });
  return response.body.uploadRef;
}

describe('GET /api/event', () => {
  it('reports availability from the server, not the client', async () => {
    const response = await request(app).get('/api/event').expect(200);
    expect(response.body.registration.maxCapacity).toBe(500);
    expect(response.body.registration.placesRemaining).toBe(500);
    expect(response.body.registration.isFull).toBe(false);
  });
});

describe('POST /api/uploads', () => {
  it('stores an allowed file and returns a signed reference', async () => {
    const response = await request(app)
      .post('/api/uploads')
      .attach('file', PDF, { filename: 'receipt.pdf', contentType: 'application/pdf' })
      .expect(201);

    expect(response.body.uploadRef).toMatch(/^receipts\//);
  });

  it('rejects a file whose bytes do not match an allowed format', async () => {
    const response = await request(app)
      .post('/api/uploads')
      .attach('file', Buffer.from('MZ\u0090\u0000executable'), {
        filename: 'receipt.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);

    expect(response.body.error.code).toBe('upload_rejected');
  });

  it('rejects a request with no file at all', async () => {
    await request(app).post('/api/uploads').expect(400);
  });
});

describe('POST /api/registrations', () => {
  it('rejects a submission with no Idempotency-Key', async () => {
    const uploadRef = await uploadReceipt();
    await request(app).post('/api/registrations').send({ registration: validForm, uploadRef }).expect(400);
  });

  it('rejects a submission with no payment proof', async () => {
    const response = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', 'no-proof-0001')
      .send({ registration: validForm })
      .expect(400);

    expect(response.body.error.code).toBe('validation_failed');
  });

  it('rejects a forged upload reference', async () => {
    const response = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', 'forged-ref-0001')
      .send({ registration: validForm, uploadRef: 'receipts/2026-01/aaaa.pdf.999.signature' })
      .expect(400);

    expect(response.body.error.code).toBe('invalid_upload_reference');
  });

  it('reports field-level errors the form can display', async () => {
    const uploadRef = await uploadReceipt();
    const response = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', 'field-errors-001')
      .send({ registration: { ...validForm, email: 'nope', category: 'um_student' }, uploadRef })
      .expect(400);

    expect(response.body.error.fields).toHaveProperty('email');
    expect(response.body.error.fields).toHaveProperty('matriculationNumber');
  });

  it('accepts a complete registration and returns an ID with pending payment', async () => {
    const uploadRef = await uploadReceipt();
    const response = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', 'happy-path-0001')
      .send({ registration: validForm, uploadRef })
      .expect(201);

    expect(response.body.registration.id).toMatch(/^WGR-\d{4}$/);
    expect(response.body.registration.paymentStatus).toBe('pending');
    // The receipt key must never travel to the browser.
    expect(JSON.stringify(response.body)).not.toContain('receipts/');
  });

  it('refuses new registrations once the event is full', async () => {
    await pool.query('UPDATE event_state SET accepted_count = 500 WHERE id = 1');
    const uploadRef = await uploadReceipt();

    const response = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', 'full-house-0001')
      .send({ registration: validForm, uploadRef })
      .expect(409);

    expect(response.body.error.code).toBe('registration_full');
  });
});

describe('participant lookup', () => {
  it('will not reveal a registration without the matching email', async () => {
    const uploadRef = await uploadReceipt();
    const created = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', 'lookup-0001')
      .send({ registration: validForm, uploadRef });

    const id = created.body.registration.id;

    await request(app).get(`/api/registrations/${id}?email=someone-else@example.test`).expect(404);
    await request(app).get(`/api/registrations/${id}?email=${validForm.email}`).expect(200);
  });
});

describe('admin routes', () => {
  it('reject anonymous callers', async () => {
    await request(app).get('/api/admin/registrations').expect(401);
    await request(app).post('/api/admin/registration-status').send({ open: false }).expect(401);
  });

  it('reject a wrong token', async () => {
    await request(app)
      .get('/api/admin/registrations')
      .set('Authorization', 'Bearer not-the-real-token-at-all')
      .expect(401);
  });

  it('let an authorised organiser verify a payment', async () => {
    const uploadRef = await uploadReceipt();
    const created = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', 'admin-verify-0001')
      .send({ registration: validForm, uploadRef });

    const response = await request(app)
      .patch(`/api/admin/registrations/${created.body.registration.id}`)
      .set('Authorization', `Bearer ${config.ADMIN_API_TOKEN}`)
      .send({ paymentStatus: 'verified' })
      .expect(200);

    expect(response.body.registration.paymentStatus).toBe('verified');

    const audit = await pool.query(
      "SELECT * FROM registration_events WHERE event_type = 'payment_status_changed'",
    );
    expect(audit.rowCount).toBe(1);
  });

  it('close registration for everyone when the organiser says so', async () => {
    await request(app)
      .post('/api/admin/registration-status')
      .set('Authorization', `Bearer ${config.ADMIN_API_TOKEN}`)
      .send({ open: false, reason: 'Closed early' })
      .expect(200);

    const uploadRef = await uploadReceipt();
    const response = await request(app)
      .post('/api/registrations')
      .set('Idempotency-Key', 'after-close-0001')
      .send({ registration: validForm, uploadRef })
      .expect(409);

    expect(response.body.error.code).toBe('registration_closed');
  });
});
