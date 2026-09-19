import { eventConfig } from '../config/event';
import type { EventStatus } from '../lib/api';

/**
 * The cover. A race poster that happens to be the top of a web page: oversized
 * type, a technical data strip along the foot, crop marks at the corners.
 *
 * "GLOW" is set hollow — the one piece of graphic licence on the site, and the
 * only place the gold ink is used at display size.
 */
export function Cover({ status }: { status: EventStatus | null }) {
  const cell = (label: string, field: { value: string; confirmed: boolean }) => (
    <div key={label} className="border-t border-[color:var(--rule)] pt-3">
      <div className="tech">{label}</div>
      <div className="mt-1 font-mono text-sm text-paper">
        {field.confirmed ? field.value : <span className="flag">TBC</span>}
      </div>
    </div>
  );

  return (
    <div id="top" className="cropmarks relative flex min-h-[100svh] flex-col justify-between overflow-hidden pb-10 pt-24">
      <div className="shell">
        <div className="lift flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2">
          <span className="tech-gold">Universiti Malaya · Night Run</span>
          <span className="tech">2026</span>
        </div>

        <h1 className="display-xl mt-8 sm:mt-12">
          <span className="lift lift-2 block">Witches</span>
          <span className="lift lift-3 outlined block">Glow</span>
          <span className="lift lift-4 block">Run</span>
        </h1>
      </div>

      <div className="shell">
        <p className="mb-10 max-w-[38ch] font-display text-2xl italic leading-snug text-paper/80 sm:text-3xl">
          {eventConfig.tagline.value}
        </p>

        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          {cell('Date', eventConfig.date)}
          {cell('Flag off', eventConfig.time)}
          {cell('Distance', eventConfig.distance)}
          {cell('Venue', eventConfig.venue)}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href="#register" className="btn-gold">
            Register
          </a>
          {/* Counted on the server. The browser never invents this number. */}
          {status && (
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-grey" aria-live="polite">
              {status.registration.isFull
                ? `Full — ${status.registration.maxCapacity}/${status.registration.maxCapacity} participants`
                : !status.registration.open
                  ? 'Registration closed'
                  : `${status.registration.maxCapacity - status.registration.placesRemaining} / ${status.registration.maxCapacity} participants`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
