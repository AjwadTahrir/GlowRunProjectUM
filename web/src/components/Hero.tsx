import { AlertTriangle } from 'lucide-react';
import { eventConfig } from '../config/event';
import type { EventStatus } from '../lib/api';

/**
 * The most characteristic thing about this event is running at night under a moon,
 * so the moon is the hero: one gold disc behind the wordmark, with the title sitting
 * across it. No stat blocks, no gradient card.
 */
export function Hero({ status }: { status: EventStatus | null }) {
  const fact = (label: string, field: { value: string; confirmed: boolean }) => (
    <div key={label} className="min-w-[8rem]">
      <div className="text-xs uppercase tracking-wide text-violet-mist">{label}</div>
      <div className="mt-0.5 text-white">
        {field.confirmed ? field.value : <span className="placeholder-flag">Not confirmed</span>}
      </div>
    </div>
  );

  return (
    <div id="top" className="relative overflow-hidden">
      {/* The moon. Decorative, so it stays out of the accessibility tree. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-4 -z-10 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full sm:h-[30rem] sm:w-[30rem]"
        style={{
          background:
            'radial-gradient(circle at 50% 45%, rgba(245,197,66,0.30) 0%, rgba(245,197,66,0.10) 45%, transparent 68%)',
        }}
      />

      <div className="shell flex min-h-[85vh] flex-col justify-center py-20">
        <p className="rise text-sm text-glow">Universiti Malaya · night run</p>

        <h1 className="rise mt-4 font-display text-[clamp(2.9rem,12vw,7rem)] font-black leading-[0.88] tracking-tight">
          Witches
          <br />
          Glow Run
        </h1>

        <p className="rise mt-6 max-w-prose text-lg text-violet-mist sm:text-xl">
          {eventConfig.tagline.value}
          {!eventConfig.tagline.confirmed && (
            <span className="placeholder-flag ml-2 align-middle">
              <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
              Draft copy
            </span>
          )}
        </p>

        <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-5 text-sm">
          {fact('Date', eventConfig.date)}
          {fact('Flag-off', eventConfig.time)}
          {fact('Venue', eventConfig.venue)}
          {fact('Distance', eventConfig.distance)}
        </dl>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href="#register" className="btn-primary">
            Register now
          </a>
          <a href="#details" className="btn-quiet">
            See the details
          </a>
        </div>

        {/* Counted on the server; never a number the browser made up. */}
        {status && (
          <p className="mt-6 text-sm text-violet-mist" aria-live="polite">
            {status.registration.isFull
              ? `All ${status.registration.maxCapacity} places have been taken.`
              : !status.registration.open
                ? 'Registration is closed.'
                : `${status.registration.placesRemaining} of ${status.registration.maxCapacity} places left.`}
          </p>
        )}
      </div>
    </div>
  );
}
