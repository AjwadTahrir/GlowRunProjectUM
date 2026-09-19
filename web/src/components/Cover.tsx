import { eventConfig } from '../config/event';
import type { EventStatus } from '../lib/api';
import { Blank } from './ui';

/**
 * The cover is the poster. Wordmark on the left, a halftone moon cropped off the
 * right edge, and the four facts a runner needs printed along the foot.
 */
export function Cover({ status }: { status: EventStatus | null }) {
  const spec = (label: string, field: { value: string; confirmed: boolean }) => (
    <div key={label}>
      <dt className="tech">{label}</dt>
      <dd className="display display-s mt-2">{field.confirmed ? field.value : <Blank w="8ch" />}</dd>
    </div>
  );

  const registration = status?.registration;

  return (
    <div id="top" className="cropmarks relative isolate flex min-h-[100dvh] flex-col overflow-hidden pt-14">
      <div className="moon" aria-hidden>
        <i /><i /><i /><i /><i />
      </div>

      <div className="shell flex flex-1 flex-col justify-between gap-8 pb-8 pt-8 md:gap-10 md:pb-10 md:pt-14">
        <div>
          <p className="lift font-mono text-xs uppercase tracking-[0.14em] text-paper">Universiti Malaya</p>
          <p className="lift font-mono text-xs uppercase tracking-[0.14em] text-gold">Night run</p>
        </div>

        <h1 className="wordmark display">
          <span className="lift lift-2 block">Witches</span>
          <span className="lift lift-3 glow-word block pl-[0.55em]">Glow</span>
          <span className="lift lift-4 block text-right">Run</span>
        </h1>

        <div className="lift lift-5">
          <div className="grid items-end gap-x-10 gap-y-8 md:grid-cols-12">
            <p className="max-w-[30ch] text-lg leading-snug text-paper/85 md:col-span-3">
              A night run at Universiti Malaya. Open to students, staff, alumni and the public.
            </p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:col-span-9 md:grid-cols-4">
              {spec('Date', eventConfig.date)}
              {spec('Flag off', eventConfig.time)}
              {spec('Distance', eventConfig.distance)}
              {spec('Venue', eventConfig.venue)}
            </dl>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <a href="#register" className="btn-gold">
              Register
            </a>
            {/* Counted on the server. The browser never invents this number. */}
            <span className="figure min-h-[1.25rem] text-sm text-paper/80" aria-live="polite">
              {registration &&
                (registration.isFull
                  ? `Full: ${registration.maxCapacity} of ${registration.maxCapacity} places taken`
                  : !registration.open
                    ? 'Registration closed'
                    : `${registration.maxCapacity - registration.placesRemaining} of ${registration.maxCapacity} places taken`)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
