import { eventConfig } from '../../config/event';
import { FinishFlag, Mark, Reveal, Sparkle, Stars, Tape, Trail, type StarSpec, type TrailStop } from '../Graphics';
import { Artwork, SectionShell, Title, Value } from '../ui';

// The trail is the identity graphic for the route. It is a drawing, not a map: it says
// nothing about where the course goes. Stops appear only when the organiser confirms them.
const WIDE = 'M50 440 C210 470 250 210 420 220 C560 230 540 410 690 400 C850 388 800 130 960 140 C1090 148 1080 340 1200 330 C1300 322 1310 130 1400 100';
const TALL = 'M70 50 C330 60 350 210 200 250 S60 390 220 430 S340 560 180 600 S60 700 320 730';

const STARS: StarSpec[] = [
  { x: 8, y: 10, s: 30, c: 'gold', twinkle: 1 },
  { x: 92, y: 36, s: 20, c: 'lavender' },
  { x: 50, y: 90, s: 9, c: 'paper', kind: 'dot' },
  { x: 74, y: 14, s: 7, c: 'gold', kind: 'dot' },
];

function stops(points: typeof eventConfig.route.points, big: number): TrailStop[] {
  const list: TrailStop[] = [
    { at: 0, node: <span className="block rounded-full bg-gold ring-4 ring-ink" style={{ width: big, height: big }} /> },
    { at: 1, node: <FinishFlag size={big + 6} className="ring-4 ring-ink" /> },
  ];
  points.forEach((point, i) => {
    list.push({
      at: (i + 1) / (points.length + 1),
      node: (
        <span className="relative block">
          <span className="block h-6 w-6 rounded-full border-[5px] border-gold bg-ink" />
          <span className="absolute left-1/2 top-9 -translate-x-1/2 whitespace-nowrap bg-purple px-2 py-1 text-center">
            <span className="display display-s block">{point.label}</span>
            {point.at && <span className="figure text-sm text-paper/85">{point.at}</span>}
          </span>
        </span>
      ),
    });
  });
  return list;
}

/**
 * 03  ROUTE. The showpiece: a bright trail across the purple field that draws itself
 * from Start to Finish, with the distance circled by hand.
 */
export function Route() {
  const { points, description } = eventConfig.route;
  const artwork = eventConfig.posters.route;

  return (
    <SectionShell id="route" tone="purple" cut="a" className="overflow-hidden pb-32 pt-[calc(var(--cut)+4rem)] md:pb-44">
      <Stars items={STARS} />
      <div className="shell relative">
        <Reveal from="left" tilt={-2}>
          <Title
            id="route"
            index="03"
            className="wide outline-lavender text-[clamp(4.5rem,17vw,15rem)] [-webkit-text-stroke-width:3px]"
          >
            Route
          </Title>
        </Reveal>
        {description.confirmed && <p className="lede mt-6">{description.value}</p>}

        {/* Wide screens: a long, looping trail. */}
        <div className="relative mt-4 hidden md:mt-0 md:block">
          <Trail d={WIDE} viewBox="0 0 1440 520" width={16} stops={stops(points, 40)} />
          <span className="display display-h absolute left-[1%] top-[91%] text-paper">Start</span>
          <span className="display display-h absolute right-[9%] top-[-3%] text-paper">Finish</span>
          <span className="absolute left-[38%] top-[-2%]">
            <span className="wide relative block text-[clamp(3rem,8vw,7rem)] leading-none text-gold">
              <Value field={eventConfig.distance} w="4ch" />
              <Mark kind="ring" className="absolute -left-[12%] -top-[22%] w-[130%]" color="var(--paper)" width={4} />
            </span>
          </span>
          <Sparkle size={48} className="twinkle absolute right-[3%] top-[26%]" />
        </div>

        {/* Phones: the same trail, running down the screen. */}
        <div className="relative mt-6 md:hidden">
          <Trail d={TALL} viewBox="0 0 400 780" width={11} stops={stops(points, 30)} />
          <span className="display absolute left-0 top-[-2%] text-[3.75rem] leading-none text-paper">Start</span>
          <span className="display absolute bottom-[-1%] right-0 text-[3.75rem] leading-none text-paper">Finish</span>
          <span className="wide absolute left-2 top-[21%] text-[3.25rem] leading-none text-gold">
            <Value field={eventConfig.distance} w="4ch" />
            <Mark kind="ring" className="absolute -left-[10%] -top-[26%] w-[130%]" color="var(--paper)" width={4} />
          </span>
        </div>

        {artwork && (
          <Reveal from="up" tilt={2} className="relative mt-24 max-w-4xl md:ml-auto">
            <Tape tone="gold" tilt={-6} className="absolute -top-4 left-8 z-10 w-28 !p-0">
              <span className="block h-5" />
            </Tape>
            <Artwork src={artwork} alt="Official Witches Glow Run route map" caption="Open the route full size" />
          </Reveal>
        )}
      </div>
    </SectionShell>
  );
}
