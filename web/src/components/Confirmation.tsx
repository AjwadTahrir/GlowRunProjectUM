import { eventConfig } from '../config/event';
import { CATEGORY_LABELS, type Category } from '../lib/validation';
import type { RegistrationResult } from '../lib/api';
import { Bib } from './Bib';
import { Confetti, FinishFlag, Reveal, Trail } from './Graphics';

/**
 * Shown only after the server has accepted the registration. The bib is the
 * artefact: the number on it is the one the server issued, not one made up here.
 * The route line finishes, the sparkles burst once, and payment state is still
 * reported separately, because uploading a receipt does not verify a payment.
 */
export function Confirmation({ registration }: { registration: RegistrationResult }) {
  const category = registration.category as Category;

  const row = (label: string, value: string) => (
    <div key={label}>
      <dt className="tech">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-paper">{value}</dd>
    </div>
  );

  const paymentText =
    registration.paymentStatus === 'pending'
      ? 'Awaiting verification'
      : registration.paymentStatus === 'verified'
        ? 'Verified'
        : 'Rejected. The organiser will be in touch.';

  return (
    <div role="status" aria-live="polite">
      <div className="grid items-center gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="relative lg:col-span-7">
          <Reveal from="pop" tilt={-3}>
            <Bib
              number={registration.id}
              name={registration.fullName}
              category={category in CATEGORY_LABELS ? category : undefined}
              size={registration.tshirtSize}
              label={`Race bib, registration number ${registration.id}`}
            />
          </Reveal>
          <Confetti />
        </div>

        <div className="lg:col-span-5">
          <p className="text-2xl font-semibold leading-snug sm:text-3xl">
            You are registered. Your number is <span className="figure text-gold">{registration.id}</span>. Keep it.
          </p>

          <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {row('Name', registration.fullName)}
            {row('Category', CATEGORY_LABELS[category] ?? registration.category)}
            {row('Shirt', registration.tshirtSize)}
            {row('Payment', paymentText)}
          </dl>
        </div>
      </div>

      {/* You crossed the line. */}
      <div className="mt-16 md:mt-24">
        <Trail
          d="M20 90 C300 10 520 150 760 80 S1180 20 1410 84"
          viewBox="0 0 1440 140"
          width={10}
          stops={[
            { at: 0, node: <span className="block h-6 w-6 rounded-full bg-gold" /> },
            { at: 1, node: <FinishFlag size={34} /> },
          ]}
        />
      </div>

      <div className="mt-12">
        <h4 className="display display-s">What happens next</h4>
        <ol className="mt-6 grid gap-x-10 gap-y-6 md:grid-cols-3">
          {[
            `Your place is held. Registration is capped at ${eventConfig.maxCapacity} participants.`,
            'The committee checks your receipt by hand. Uploading a file does not mark a payment as verified.',
            'Event updates go out through the WhatsApp group below.',
          ].map((step, i) => (
            <li key={step} className="flex items-baseline gap-4">
              <span className="figure text-sm text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-paper/90">{step}</span>
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
