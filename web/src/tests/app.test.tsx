import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import type { EventStatus, RegistrationResult } from '../lib/api';

const status: EventStatus = {
  registration: { open: true, isFull: false, placesRemaining: 188, maxCapacity: 500, closedReason: null },
  terms: { version: 'test' },
  upload: { maxBytes: 5_242_880, allowedMimeTypes: ['image/png', 'application/pdf'] },
};

const registered: RegistrationResult = {
  id: 'WGR-0313',
  fullName: 'Nur Aisyah binti Rahman',
  email: 'siti@example.test',
  category: 'um_student',
  tshirtSize: 'M',
  paymentStatus: 'pending',
  registrationStatus: 'accepted',
  createdAt: '2026-01-01T00:00:00Z',
};

const api = vi.hoisted(() => ({
  fetchEventStatus: vi.fn(),
  uploadPaymentProof: vi.fn(),
  submitRegistration: vi.fn(),
}));

vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  ...api,
}));

beforeEach(() => {
  api.fetchEventStatus.mockReset().mockResolvedValue(status);
  api.uploadPaymentProof.mockReset().mockResolvedValue('upload-ref-1');
  api.submitRegistration.mockReset().mockResolvedValue({ registration: registered, duplicate: false });
});

describe('page content with nothing confirmed yet', () => {
  it('shows blank fields rather than "not confirmed" chips', async () => {
    render(<App />);
    await screen.findByText('312 of 500 places taken');

    // Blank fields are announced to screen readers, not printed as placeholder chips.
    expect(screen.getAllByText('To be announced').length).toBeGreaterThan(5);
    expect(screen.queryByText(/not confirmed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^TBC$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/awaiting artwork/i)).not.toBeInTheDocument();
  });

  it('does not invent course points the organiser has not confirmed', async () => {
    render(<App />);
    await screen.findByText('312 of 500 places taken');
    expect(screen.queryByText(/checkpoint/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/water station/i)).not.toBeInTheDocument();
    // The only certain course facts: it starts and it finishes.
    expect(screen.getAllByText('Start').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Finish').length).toBeGreaterThan(0);
  });

  it('takes the capacity count from the server', async () => {
    render(<App />);
    expect(await screen.findByText('312 of 500 places taken')).toBeInTheDocument();
  });

  it('keeps every section anchor the navigation points at', async () => {
    render(<App />);
    await screen.findByText('312 of 500 places taken');
    for (const id of ['the-run', 'route', 'categories', 'entitlements', 'the-night', 'lucky-draw', 'register']) {
      expect(document.getElementById(id), id).not.toBeNull();
    }
  });
});

describe('registration, end to end', () => {
  it('fills the live bib as the participant types, then issues the server number', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText('312 of 500 places taken');

    const bib = () => document.querySelector('.bib') as HTMLElement;
    expect(bib().textContent).toContain('Number assigned on registration');

    await user.type(screen.getByLabelText(/email address/i), 'siti@example.test');
    await user.type(screen.getByLabelText(/full name/i), 'Nur Aisyah binti Rahman');
    await user.type(screen.getByLabelText(/phone number/i), '012-345 6789');
    await user.selectOptions(screen.getByLabelText(/participant category/i), 'um_student');
    await user.type(screen.getByLabelText(/matriculation number/i), 'S2012345');
    await user.selectOptions(screen.getByLabelText(/your size/i), 'M');

    // The preview is decorative and hidden from assistive technology.
    expect(bib()).toHaveAttribute('aria-hidden', 'true');
    expect(within(bib()).getByText('Nur Aisyah binti Rahman')).toBeInTheDocument();
    expect(within(bib()).getByText('UM Student')).toBeInTheDocument();
    expect(within(bib()).getByText('Shirt M')).toBeInTheDocument();

    await user.upload(
      screen.getByLabelText(/proof of payment/i),
      new File(['x'], 'receipt.png', { type: 'image/png' }),
    );
    await screen.findByText(/receipt\.png uploaded/i);
    await user.click(screen.getByLabelText(/agree to the witches glow run terms/i));
    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => expect(api.submitRegistration).toHaveBeenCalledTimes(1));
    const [values, uploadRef] = api.submitRegistration.mock.calls[0]!;
    expect(uploadRef).toBe('upload-ref-1');
    expect(values).toMatchObject({ category: 'um_student', matriculationNumber: 'S2012345', tshirtSize: 'M' });

    // Confirmation: the bib now carries the number the server issued.
    const confirmed = await screen.findByRole('img', { name: /race bib, registration number WGR-0313/i });
    expect(within(confirmed).getByText('0313')).toBeInTheDocument();
    // Payment is reported separately, and is not treated as verified.
    expect(screen.getByText('Awaiting verification')).toBeInTheDocument();
    // The WhatsApp block only appears once someone is registered.
    expect(document.getElementById('whatsapp')).not.toBeNull();
  });

  it('shows the closed state, with no form, when registration is closed', async () => {
    api.fetchEventStatus.mockResolvedValue({
      ...status,
      registration: { ...status.registration, open: false, closedReason: 'Registration has closed.' },
    });
    render(<App />);
    expect(await screen.findByText('Registration has closed.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete registration/i })).not.toBeInTheDocument();
    expect(document.querySelector('.bib')).toBeNull();
  });

  it('refuses to take registrations when availability cannot be loaded', async () => {
    api.fetchEventStatus.mockRejectedValue(new Error('offline'));
    render(<App />);
    expect(await screen.findByText(/availability could not be loaded/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete registration/i })).not.toBeInTheDocument();
  });
});
