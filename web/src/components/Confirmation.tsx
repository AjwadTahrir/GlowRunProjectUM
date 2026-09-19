import { CheckCircle2, Clock } from 'lucide-react';
import { eventConfig } from '../config/event';
import { CATEGORY_LABELS, type Category } from '../lib/validation';
import type { RegistrationResult } from '../lib/api';

/** Shown only after the server has accepted the registration. */
export function Confirmation({ registration }: { registration: RegistrationResult }) {
  return (
    <div className="panel border-glow/40" role="status" aria-live="polite">
      <h3 className="flex items-center gap-2 font-display text-2xl text-white">
        <CheckCircle2 aria-hidden className="h-6 w-6 text-glow" />
        You are registered
      </h3>

      <p className="mt-2 text-violet-mist">
        Keep your registration ID. Quote it when you contact the organiser or collect your race pack.
      </p>

      <p className="mt-6 font-display text-4xl tracking-tight text-glow">{registration.id}</p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-violet-mist">Name</dt>
          <dd className="text-white">{registration.fullName}</dd>
        </div>
        <div>
          <dt className="text-sm text-violet-mist">Category</dt>
          <dd className="text-white">
            {CATEGORY_LABELS[registration.category as Category] ?? registration.category}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-violet-mist">T-shirt size</dt>
          <dd className="text-white">{registration.tshirtSize}</dd>
        </div>
        <div>
          <dt className="text-sm text-violet-mist">Payment</dt>
          <dd className="flex items-center gap-2 text-white">
            <Clock aria-hidden className="h-4 w-4 text-glow" />
            {registration.paymentStatus === 'pending' && 'Awaiting verification'}
            {registration.paymentStatus === 'verified' && 'Verified'}
            {registration.paymentStatus === 'rejected' && 'Rejected — the organiser will be in touch'}
          </dd>
        </div>
      </dl>

      <div className="mt-8 border-t border-white/10 pt-6 text-violet-mist">
        <h4 className="text-white">What happens next</h4>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          <li>Your place is held. Registration is capped at {eventConfig.maxCapacity} participants.</li>
          <li>
            The committee checks your receipt by hand. Uploading a file does not mark a payment as verified.
          </li>
          <li>Event updates go out through the WhatsApp group below.</li>
        </ol>
        {eventConfig.contactNumber.confirmed && (
          <p className="mt-4 text-sm">Questions: {eventConfig.contactNumber.value}</p>
        )}
      </div>
    </div>
  );
}
