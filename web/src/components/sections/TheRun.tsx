import { eventConfig } from '../../config/event';
import { Reveal, Sparkle, Stars, Tape, type StarSpec } from '../Graphics';
import { Leader, SectionShell, Title } from '../ui';

const STARS: StarSpec[] = [
  { x: 92, y: 12, s: 36, c: 'gold', twinkle: 2 },
  { x: 86, y: 7, s: 16, c: 'lavender' },
  { x: 6, y: 58, s: 22, c: 'lavender' },
  { x: 48, y: 4, s: 7, c: 'paper', kind: 'dot' },
  { x: 97, y: 46, s: 8, c: 'lavender', kind: 'dot' },
];

/**
 * 02  THE RUN. Not an intro paragraph: the event as a poster. The facts are set at
 * three different scales and in three different voices, with the race card taped
 * on at an angle.
 */
export function TheRun() {
  return (
    <SectionShell id="the-run" className="overflow-hidden py-24 md:py-36">
      <Stars items={STARS} />
      <div className="shell relative">
        <Tape tone="gold" tilt={-3} className="w-fit">
          <Title id="the-run" index="02" className="display text-[clamp(1.5rem,3vw,2.5rem)] leading-none" folioClass="!text-ink">
            The run
          </Title>
        </Tape>

        <div className="mt-10 grid gap-x-12 gap-y-14 lg:grid-cols-12">
          <p className="lg:col-span-8">
            <span className="display block text-[clamp(3.5rem,12vw,11rem)] leading-[0.82] text-paper">Four</span>
            <span className="wide -mt-1 block text-[clamp(2.2rem,6vw,5.6rem)] leading-none text-lavender md:ml-[4vw]">
              Categories.
            </span>
            <span className="mt-4 flex flex-wrap items-end gap-x-5 md:ml-[1vw]">
              <span className="display text-[clamp(7rem,23vw,20rem)] leading-[0.74] text-gold">
                {eventConfig.maxCapacity}
              </span>
              <span className="display outline-paper pb-[1.5vw] text-[clamp(3rem,9vw,8rem)] leading-[0.8]">Places.</span>
            </span>
            <span className="display mt-6 block text-[clamp(2.75rem,8.2vw,7.5rem)] leading-[0.86] text-paper">
              One night run
            </span>
            <span className="wide block text-[clamp(1.5rem,4vw,3.6rem)] leading-tight text-gold md:ml-[9vw]">
              at Universiti Malaya.
            </span>
          </p>

          <div className="relative lg:col-span-4 lg:pt-24">
            <Reveal from="right" tilt={2.5}>
              <div className="relative bg-paper px-7 pb-8 pt-9 text-ink">
                <span aria-hidden className="notch -left-[15px] top-1/2" />
                <span aria-hidden className="notch -right-[15px] top-1/2" />
                <p className="tech-on mb-2">Race card</p>
                <dl>
                  <Leader label="Date" field={eventConfig.date} />
                  <Leader label="Flag off" field={eventConfig.time} />
                  <Leader label="Distance" field={eventConfig.distance} />
                  <Leader label="Venue" field={eventConfig.venue} w="10ch" />
                  <Leader label="Organiser" field={eventConfig.organiser} w="10ch" />
                  <Leader label="Contact" field={eventConfig.contactNumber} w="10ch" />
                </dl>
              </div>
            </Reveal>
            <Sparkle size={44} color="var(--lavender)" className="twinkle absolute -bottom-6 -left-4 hidden lg:block" />
          </div>
        </div>

        <p className="lede mt-12 md:mt-16">
          Open to Universiti Malaya students, staff and alumni, and to the public. Places are allocated in the order
          registrations are accepted.
        </p>
      </div>
    </SectionShell>
  );
}
