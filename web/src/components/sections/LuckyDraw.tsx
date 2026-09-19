import { eventConfig } from '../../config/event';
import { Burst, Reveal, Sparkle, Stars, Tape, type StarSpec } from '../Graphics';
import { Artwork, SectionShell, Title, Value } from '../ui';

const STARS: StarSpec[] = [
  { x: 4, y: 20, s: 34, c: 'gold', twinkle: 1 },
  { x: 95, y: 30, s: 22, c: 'lavender', twinkle: 3 },
  { x: 12, y: 84, s: 16, c: 'paper' },
  { x: 90, y: 88, s: 30, c: 'gold', twinkle: 2 },
  { x: 50, y: 6, s: 8, c: 'paper', kind: 'dot' },
];

/**
 * 07  LUCKY DRAW. The raffle ticket, dropped on the purple at an angle: perforated
 * stub, notches, a starburst. The burst carries a question mark only while the
 * prizes are still a mystery.
 */
export function LuckyDraw() {
  const prizes = eventConfig.luckyDraw.prizes;
  const artwork = eventConfig.posters.luckyDraw;

  return (
    <SectionShell
      id="lucky-draw"
      tone="purple"
      cut="a"
      className="overflow-hidden pb-[calc(var(--cut)+6rem)] pt-[calc(var(--cut)+6rem)]"
    >
      <Stars items={STARS} />
      <div className="shell relative">
        <Reveal from="up" tilt={-2}>
          <div className="relative grid bg-gold text-ink md:grid-cols-[1fr_21rem]">
            <div className="px-6 pb-12 pt-10 sm:px-10 md:px-14 md:pb-16 md:pt-14">
              <Title id="lucky-draw" index="07" className="wide leading-[0.84]" folioClass="!text-ink">
                <span className="block text-[clamp(3.4rem,10.5vw,9.75rem)]">Lucky</span>{' '}
                <span className="inline-block text-[clamp(3.4rem,10.5vw,9.75rem)] md:ml-[7vw]">Draw</span>
              </Title>

              {prizes.length > 0 ? (
                <ol className="mt-10 space-y-3">
                  {prizes.map((prize, i) => (
                    <li key={prize} className="flex items-baseline gap-5">
                      <span className="figure text-sm font-medium">{String(i + 1).padStart(2, '0')}</span>
                      <span className="display display-s">{prize}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <>
                  <ol aria-hidden className="mt-10 max-w-xl space-y-6">
                    {[0, 1, 2].map((row) => (
                      <li key={row} className="flex items-end gap-5">
                        <span className="figure text-sm font-medium">{String(row + 1).padStart(2, '0')}</span>
                        <span className="blank !w-full" style={{ opacity: 0.6 - row * 0.12 }} />
                      </li>
                    ))}
                  </ol>
                  <p className="sr-only">Prizes to be announced</p>
                </>
              )}
            </div>

            <div className="relative border-t-2 border-dashed border-ink px-6 py-10 md:border-l-2 md:border-t-0 md:px-9 md:py-16">
              <span aria-hidden className="notch -left-[15px] -top-[15px]" />
              <span
                aria-hidden
                className="notch -right-[15px] -top-[15px] md:-bottom-[15px] md:-left-[15px] md:right-auto md:top-auto"
              />
              <dl className="space-y-9">
                <div>
                  <dt className="tech-on">Who qualifies</dt>
                  <dd className="display display-s mt-2">
                    <Value field={eventConfig.luckyDraw.eligibility} w="12ch" />
                  </dd>
                </div>
                <div>
                  <dt className="tech-on">Drawn at</dt>
                  <dd className="display display-s mt-2">
                    <Value field={eventConfig.luckyDraw.timing} w="12ch" />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Reveal>

        {prizes.length === 0 && (
          <div className="absolute -top-14 right-2 z-10 md:right-6 md:-top-16">
            <Reveal from="pop" delay={500}>
              <Burst size="clamp(6rem, 12vw, 10rem)" tone="paper" tilt={12} glow>
                <span className="wide text-[clamp(2.75rem,6vw,5rem)] leading-none text-ink">?</span>
              </Burst>
            </Reveal>
          </div>
        )}
        <Sparkle size={40} color="var(--paper)" className="twinkle twinkle-2 absolute -left-3 bottom-10 hidden md:block" />

        {artwork && (
          <Reveal from="up" tilt={2} className="relative mt-20 max-w-2xl md:ml-auto">
            <Tape tone="gold" tilt={-6} className="absolute -top-4 left-8 z-10 w-28">
              <span className="block h-5" />
            </Tape>
            <Artwork src={artwork} alt="Official Witches Glow Run lucky draw poster" caption="Open the poster full size" />
          </Reveal>
        )}
      </div>
    </SectionShell>
  );
}
