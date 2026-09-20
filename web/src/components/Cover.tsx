import type { CSSProperties } from 'react';
import { eventConfig } from '../config/event';
import type { EventStatus } from '../lib/api';
import { Burst, FinishFlag, Mark, Sparkle, Stars, Tape, Trail, type StarSpec } from './Graphics';
import { Blank } from './ui';

/**
 * The cover is the poster. GLOW is the focal point: expanded italic gold with a
 * lavender print echo, under a crescent moon glowing in halftone. A route line
 * runs the length of the page and ends at the Register ticket stub.
 */

const STARS: StarSpec[] = [
  { x: 60, y: 14, s: 40, c: 'gold', twinkle: 1 },
  { x: 55, y: 9, s: 20, c: 'lavender', twinkle: 2 },
  { x: 67, y: 8, s: 14, c: 'paper' },
  { x: 47, y: 26, s: 7, c: 'lavender', kind: 'dot' },
  { x: 88, y: 34, s: 9, c: 'paper', kind: 'dot' },
  { x: 33, y: 10, s: 6, c: 'paper', kind: 'dot' },
  { x: 8, y: 63, s: 28, c: 'lavender', twinkle: 3 },
  { x: 93, y: 60, s: 22, c: 'gold', twinkle: 2 },
  { x: 20, y: 24, s: 12, c: 'paper' },
  { x: 76, y: 44, s: 6, c: 'gold', kind: 'dot' },
];

const tilt = (deg: number) => ({ '--tilt': `${deg}deg` }) as CSSProperties;

const DESKTOP_TRAIL =
  'M30 300 C180 380 330 310 500 372 C640 420 700 340 660 314 C620 290 590 360 660 392 C760 432 900 428 1040 412 S1290 380 1390 372';
// A single, nearly flat line from the start dot to the flag: a slim banner under the title, so the
// purple cover stays short and Register stays high on a phone.
const MOBILE_TRAIL = 'M20 24 C100 14 180 36 260 32 S350 28 384 34';

export function Cover({ status }: { status: EventStatus | null }) {
  const registration = status?.registration;
  const { distance } = eventConfig;

  const spec = (label: string, field: { value: string; confirmed: boolean }) => (
    <div key={label}>
      <dt className="tech">{label}</dt>
      <dd className="display display-s mt-2 text-paper">{field.confirmed ? field.value : <Blank w="8ch" />}</dd>
    </div>
  );

  return (
    <div id="top" className="relative flex flex-col bg-purple md:min-h-[100dvh]">
     <div className="relative isolate flex flex-1 flex-col overflow-hidden pt-[var(--header-h)]">
      <Stars items={STARS} className="-z-10" />

      {/* The route: draws itself from the start dot to the finish flag beside Register. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] hidden md:block">
        <Trail
          d={DESKTOP_TRAIL}
          viewBox="0 0 1440 460"
          drawNow
          delay={700}
          width={12}
          stops={[
            { at: 0, node: <span className="block h-7 w-7 rounded-full bg-gold" /> },
            { at: 1, node: <FinishFlag size={36} /> },
          ]}
        />
      </div>

      <div className="shell relative flex flex-1 flex-col pb-6 pt-6 md:pt-8">
        <p className="drop font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper">Universiti Malaya</p>

        <div className="relative mt-3 w-fit md:mt-4">
          {/* The wordmark is one heading. Its layered copies are for the eye only. */}
          <h1 aria-label="Witches Glow Run">
            <span aria-hidden className="display hero-witches tilt drop drop-2 block text-paper" style={tilt(-3)}>
              Witches
            </span>

            <span
              aria-hidden
              className="glow-stack wide hero-glow drop drop-3 relative -mt-[0.02em]"
              style={{ paddingLeft: '0.05em' }}
            >
              <span className="glow-ghost">Glow</span>
              <span className="glow-echo">Glow</span>
              <span className="relative z-10 text-gold">Glow</span>
            </span>

            <span aria-hidden className="display hero-run tilt drop drop-4 block text-right text-paper" style={tilt(2)}>
              Run
            </span>
          </h1>

          {/* Stickers: one for the distance, one tape strip for the format. */}
          <span className="absolute -top-[20%] right-[3%] z-20 md:-right-[6%] md:top-[4%]">
            <span className="pop block" style={{ animationDelay: '900ms' }}>
              <Burst size="clamp(5rem, 13vw, 11rem)" tone="paper" tilt={10}>
                <span className="wide text-[clamp(1.5rem,3.4vw,3rem)] leading-none text-ink">
                  {distance.confirmed ? distance.value : <Blank w="3ch" />}
                </span>
              </Burst>
            </span>
          </span>
          <span className="absolute -left-[2%] bottom-[22%] z-10 md:bottom-[20%] md:left-[1%]">
            <span className="pop block" style={{ animationDelay: '1050ms' }}>
              <Tape tone="lavender" tilt={-7}>
                <span className="display text-[clamp(1.1rem,2.2vw,1.9rem)] leading-none">Night run</span>
              </Tape>
            </span>
          </span>
          <Sparkle size={30} color="var(--paper)" className="twinkle twinkle-2 absolute -left-4 top-[2%] hidden md:block" />
        </div>

        {/* Phones: the route runs below the wordmark, in flow, so it can never cross the title. */}
        <div className="pointer-events-none md:hidden">
          <Trail
            d={MOBILE_TRAIL}
            viewBox="0 0 400 64"
            drawNow
            delay={700}
            width={9}
            stops={[
              { at: 0, node: <span className="block h-5 w-5 rounded-full bg-gold" /> },
              { at: 1, node: <FinishFlag size={26} /> },
            ]}
          />
        </div>
      </div>
     </div>

      {/* The stub: a torn ticket edge, and the one thing to do. */}
      <div className="scallop-top relative z-10 bg-ink pb-[calc(2rem+var(--safe-bottom))] pt-12 md:pb-[calc(2.5rem+var(--safe-bottom))] md:pt-14 [@media(max-height:830px)]:pb-[calc(1.5rem+var(--safe-bottom))] [@media(max-height:830px)]:pt-10">
        <div className="shell grid items-end gap-x-10 gap-y-8 md:grid-cols-12">
          <dl className="order-2 grid grid-cols-3 gap-x-6 md:order-1 md:col-span-6">
            {spec('Date', eventConfig.date)}
            {spec('Flag off', eventConfig.time)}
            {spec('Venue', eventConfig.venue)}
          </dl>
          <div className="order-1 md:order-2 md:col-span-5 md:col-start-8">
            <p className="max-w-[34ch] text-lg leading-snug text-paper/90">
              A night run at Universiti Malaya. Open to students, staff, alumni and the public.
            </p>
            <div className="relative mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="#register" className="btn-gold">
                Register
                <FinishFlag size={20} className="border border-ink" />
              </a>
              {/* Counted on the server. The browser never invents this number. */}
              <span className="figure min-h-[1.25rem] text-sm text-paper/85" aria-live="polite">
                {registration &&
                  (registration.isFull
                    ? `Full: ${registration.maxCapacity} of ${registration.maxCapacity} places taken`
                    : !registration.open
                      ? 'Registration closed'
                      : `${registration.maxCapacity - registration.placesRemaining} of ${registration.maxCapacity} places taken`)}
              </span>
              <Mark kind="arrow" width={5} className="pointer-events-none absolute -left-28 top-0 hidden w-24 -scale-y-100 md:block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
