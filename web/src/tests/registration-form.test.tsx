import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RegistrationForm } from '../components/RegistrationForm';
import type { EventStatus } from '../lib/api';

const openStatus: EventStatus = {
  registration: { open: true, isFull: false, placesRemaining: 120, maxCapacity: 500, closedReason: null },
  terms: { version: 'test-v1' },
  upload: { maxBytes: 5_242_880, allowedMimeTypes: ['image/png', 'application/pdf'] },
};

const fullStatus: EventStatus = {
  ...openStatus,
  registration: { ...openStatus.registration, isFull: true, placesRemaining: 0 },
};

describe('registration form', () => {
  it('asks for a matriculation number from UM students only', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm status={openStatus} onRegistered={vi.fn()} />);

    expect(screen.queryByLabelText(/matriculation number/i)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/participant category/i), 'um_student');
    expect(screen.getByLabelText(/matriculation number/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/participant category/i), 'public');
    expect(screen.queryByLabelText(/matriculation number/i)).not.toBeInTheDocument();
  });

  it('reports every missing required field rather than only the first', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm status={openStatus} onRegistered={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/enter your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a category/i)).toBeInTheDocument();
    expect(screen.getByText(/agree to the terms/i)).toBeInTheDocument();
  });

  it('refuses to submit without proof of payment', async () => {
    const user = userEvent.setup();
    const onRegistered = vi.fn();
    render(<RegistrationForm status={openStatus} onRegistered={onRegistered} />);

    await user.type(screen.getByLabelText(/email address/i), 'runner@example.test');
    await user.type(screen.getByLabelText(/full name/i), 'Test Runner');
    await user.selectOptions(screen.getByLabelText(/participant category/i), 'public');
    await user.type(screen.getByLabelText(/phone number/i), '0123456789');
    await user.selectOptions(screen.getByLabelText(/your size/i), 'M');
    await user.click(screen.getByLabelText(/agree to the witches glow run terms/i));
    await user.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/upload your proof of payment/i)).toBeInTheDocument();
    });
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it('rejects an email that is not an email', async () => {
    const user = userEvent.setup();
    render(<RegistrationForm status={openStatus} onRegistered={vi.fn()} />);

    await user.type(screen.getByLabelText(/email address/i), 'not-an-email');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/does not look right/i)).toBeInTheDocument();
    });
  });

  it('shows the full-capacity state instead of the form when every place is taken', () => {
    render(<RegistrationForm status={fullStatus} onRegistered={vi.fn()} />);

    expect(screen.getByText(/all places have been taken/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /complete registration/i })).not.toBeInTheDocument();
    // No waiting list exists, so the copy must not imply one.
    expect(screen.getByText(/no waiting list/i)).toBeInTheDocument();
  });
});
