import { eventConfig } from '../../config/event';
import { Moon, Reveal, Stars, Tape, type StarSpec } from '../Graphics';
import { Artwork, SectionShell, Title } from '../ui';

const STARS: StarSpec[] = [
  { x: 5, y: 8, s: 22, c: 'gold', twinkle: 2 },
  { x: 40, y: 5, s: 6, c: 'paper', kind: 'dot' },
  { x: 62, y: 12, s: 8, c: 'lavender', kind: 'dot' },
  { x: 96, y: 60, s: 26, c: 'lavender', twinkle: 1 },
  { x: 55, y: 96, s: 7, c: 'gold', kind: 'dot' },
  { x: 3, y: 70, s: 8, c: 'paper', kind: 'dot' },
];

const BLANK_ROWS = [0, 1, 2, 3];

/**
 * 06  THE NIGHT. The programme, set on the night sky: a crescent moon, and one
 * route line running down the left with a stop for every time. Times are the
 * biggest figures on the page.
 */
export function TheNight() {
  const schedule = eventConfig.schedule;
  const artwork = eventConfig.posters.tentative;

  return (
    <SectionShell id="the-night" className="overflow-hidden py-24 md:py-40">
      <Stars items={STARS} />
      <Moon size="min(15vw, 12rem)" className="right-[8vw] top-[7rem] hidden md:block" />

      <div className="shell relative">
        <Reveal from="left" tilt={-2}>
          <Title id="the-night" index="06" className="leading-[0.86]">
            <span className="wide outline-lavender text-[clamp(2.75rem,9.4vw,9rem)]">The </span>
            <span className="wide text-[clamp(2.75rem,9.4vw,9rem)] text-paper">Night</span>
          </Title>
        </Reveal>

        <div className="mt-14 grid gap-x-16 gap-y-14 md:mt-20 lg:grid-cols-12">
          {schedule.length > 0 ? (
            <ol className="relative lg:col-span-8">
              <span
                aria-hidden
                className="absolute bottom-6 left-[13px] top-6 w-[6px] bg-gold"
                style={{ boxShadow: '6px 6px 0 var(--lavender)' }}
              />
              {schedule.map((slot) => (
                <li key={`${slot.time}-${slot.activity}`} className="relative pb-10 pl-16 md:pb-14 md:pl-24">
                  <span aria-hidden className="absolute left-0 top-3 h-8 w-8 rounded-full bg-gold ring-[6px] ring-ink" />
                  <Reveal from="left">
                    <div className="grid items-baseline gap-x-10 gap-y-2 md:grid-cols-[minmax(0,23rem)_1fr]">
                      <time className="wide text-[clamp(2.5rem,5.2vw,5rem)] leading-none text-gold">{slot.time}</time>
                      <div>
                        <div className="display text-[clamp(2.25rem,5.4vw,5rem)] text-paper">{slot.activity}</div>
                        {slot.detail && <p className="mt-2 max-w-[48ch] text-lg text-paper/85">{slot.detail}</p>}
                      </div>
                    </div>
                  </Reveal>
                </li>
              ))}
            </ol>
          ) : (
            <>
              <ol aria-hidden className="relative lg:col-span-8">
                <span
                  className="absolute bottom-6 left-[13px] top-6 w-[6px] bg-gold opacity-60"
                  style={{ boxShadow: '6px 6px 0 var(--lavender)' }}
                />
                {BLANK_ROWS.map((row) => (
                  <li key={row} className="relative pb-10 pl-16 md:pb-14 md:pl-24" style={{ opacity: 1 - row * 0.17 }}>
                    <span className="absolute left-0 top-3 h-8 w-8 rounded-full bg-ink ring-[6px] ring-gold" />
                    <div className="grid items-end gap-x-10 gap-y-2 md:grid-cols-[minmax(0,23rem)_1fr]">
                      <span className="wide text-[clamp(2.5rem,5.2vw,5rem)] leading-none text-gold/35">--:--</span>
                      <span className="blank mb-2 !w-full text-paper" />
                    </div>
                  </li>
                ))}
              </ol>
              <p className="sr-only">Schedule to be announced</p>
            </>
          )}

          {artwork && (
            <Reveal from="right" tilt={2.5} className="relative lg:col-span-4">
              <Tape tone="lavender" tilt={-7} className="absolute -top-4 left-6 z-10 w-28">
                <span className="block h-5" />
              </Tape>
              <Artwork src={artwork} alt="Official Witches Glow Run schedule" caption="Open the schedule full size" />
            </Reveal>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
