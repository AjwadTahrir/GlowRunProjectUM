import { eventConfig } from '../config/event';
import { CATEGORY_LABELS, type Category } from '../lib/validation';
import type { RegistrationResult } from '../lib/api';

/** Shown only after the server has accepted the registration. Reads like a race bib. */
export function Confirmation({ registration }: { registration: RegistrationResult }) {
  const row = (label: string, value: string) => (
    <div key={label} className="border-t border-[color:var(--rule)] pt-3">
      <div className="tech">{label}</div>
      <div className="mt-1 font-mono text-base text-paper">{value}</div>
    </div>
  );

  return (
    <div role="status" aria-live="polite">
      <div className="tech-gold">Confirmed</div>
      <h3 className="display-lg mt-3">You are registered</h3>

      {/* The number is the artefact. Everything else is supporting detail. */}
      <div className="mt-10 border-y border-gold py-8">
        <div className="tech">Registration number</div>
        <div className="display-xl mt-2 text-gold">{registration.id}</div>
      </div>

      <dl className="mt-10 grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {row('Name', registration.fullName)}
        {row('Category', CATEGORY_LABELS[registration.category as Category] ?? registration.category)}
        {row('Shirt', registration.tshirtSize)}
        {row(
          'Payment',
          registration.paymentStatus === 'pending'
            ? 'Awaiting verification'
            : registration.paymentStatus === 'verified'
              ? 'Verified'
              : 'Rejected — the organiser will be in touch',
        )}
      </dl>

      <div className="mt-14 grid gap-8 border-t border-[color:var(--rule)] pt-8 lg:grid-cols-12">
        <h4 className="tech lg:col-span-3">What happens next</h4>
        <ol className="lg:col-span-7">
          {[
            `Your place is held. Registration is capped at ${eventConfig.maxCapacity} participants.`,
            'The committee checks your receipt by hand. Uploading a file does not mark a payment as verified.',
            'Event updates go out through the WhatsApp group below.',
          ].map((step, i) => (
            <li key={step} className="flex items-baseline gap-5 border-b border-[color:var(--rule)] py-4">
              <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-paper/70">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {eventConfig.contactNumber.confirmed && (
        <p className="tech mt-8 normal-case tracking-normal">Questions: {eventConfig.contactNumber.value}</p>
      )}
    </div>
  );
}
