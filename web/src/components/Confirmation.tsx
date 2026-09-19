import { eventConfig } from '../config/event';
import { CATEGORY_LABELS, type Category } from '../lib/validation';
import type { RegistrationResult } from '../lib/api';
import { Bib } from './Bib';

/**
 * Shown only after the server has accepted the registration. The bib is the
 * artefact: the number on it is the one the server issued, not one made up here.
 * Payment state is reported separately, because uploading a receipt does not
 * verify a payment.
 */
export function Confirmation({ registration }: { registration: RegistrationResult }) {
  const category = registration.category as Category;

  const row = (label: string, value: string) => (
    <div key={label}>
      <dt className="tech">{label}</dt>
      <dd className="mt-1 text-lg font-medium text-paper">{value}</dd>
    </div>
  );

  const paymentText =
    registration.paymentStatus === 'pending'
      ? 'Awaiting verification'
      : registration.paymentStatus === 'verified'
        ? 'Verified'
        : 'Rejected. The organiser will be in touch.';

  return (
    <div role="status" aria-live="polite" className="grid gap-x-16 gap-y-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <Bib
          number={registration.id}
          name={registration.fullName}
          category={category in CATEGORY_LABELS ? category : undefined}
          size={registration.tshirtSize}
          label={`Race bib, registration number ${registration.id}`}
        />
      </div>

      <div className="lg:col-span-5">
        <p className="text-2xl font-semibold leading-snug sm:text-3xl">
          You are registered. Your number is{' '}
          <span className="figure text-gold">{registration.id}</span>. Keep it.
        </p>

        <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {row('Name', registration.fullName)}
          {row('Category', CATEGORY_LABELS[category] ?? registration.category)}
          {row('Shirt', registration.tshirtSize)}
          {row('Payment', paymentText)}
        </dl>
      </div>

      <div className="lg:col-span-12">
        <h4 className="display display-s">What happens next</h4>
        <ol className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-3">
          {[
            `Your place is held. Registration is capped at ${eventConfig.maxCapacity} participants.`,
            'The committee checks your receipt by hand. Uploading a file does not mark a payment as verified.',
            'Event updates go out through the WhatsApp group below.',
          ].map((step, i) => (
            <li key={step} className="flex items-baseline gap-4">
              <span className="figure text-sm text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-paper/80">{step}</span>
            </li>
          ))}
        </ol>

        {eventConfig.contactNumber.confirmed && (
          <p className="hint mt-8">Questions: {eventConfig.contactNumber.value}</p>
        )}
      </div>
    </div>
  );
}
