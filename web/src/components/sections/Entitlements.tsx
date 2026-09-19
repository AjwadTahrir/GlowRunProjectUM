import { eventConfig } from '../../config/event';
import { useInView } from '../../lib/useInView';
import { Mark, Reveal, Stars, Tape, Tick, type StarSpec } from '../Graphics';
import { Artwork, SectionShell, Title } from '../ui';

const STARS: StarSpec[] = [
  { x: 4, y: 20, s: 26, c: 'gold', twinkle: 3 },
  { x: 96, y: 74, s: 32, c: 'lavender' },
  { x: 40, y: 8, s: 8, c: 'paper', kind: 'dot' },
  { x: 90, y: 12, s: 12, c: 'gold', kind: 'dot' },
];

const BLANK_ROWS = [0, 1, 2, 3];

const Strip = ({ className }: { className: string }) => (
  <Tape tone="gold" tilt={-8} className={`absolute z-10 w-28 ${className}`}>
    <span className="block h-5" />
  </Tape>
);

/**
 * 05  ENTITLEMENTS. The race pack, revealed: a paper checklist taped to the page,
 * each item ticked by hand as it comes into view.
 */
export function Entitlements() {
  const items = eventConfig.entitlements;
  const artwork = eventConfig.posters.entitlements;
  const [sheetRef, seen] = useInView<HTMLDivElement>(0.3);

  return (
    <SectionShell
      id="entitlements"
      tone="purple"
      cut="b"
      className="overflow-hidden pb-[calc(var(--cut)+6rem)] pt-32 md:pt-44"
    >
      <Stars items={STARS} />
      <div className="shell relative grid gap-x-16 gap-y-16 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <Reveal from="left" tilt={-3}>
            <Title
              id="entitlements"
              index="05"
              className="display text-[clamp(2.75rem,6.2vw,6rem)] leading-[0.86] text-paper"
            >
              Entitlements
            </Title>
          </Reveal>
          <Mark kind="scribble" className="mt-3 w-64 max-w-full" />
          <p className="lede mt-6">What you receive as a participant.</p>
          {eventConfig.entitlementNotes.confirmed && (
            <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-paper/85">
              {eventConfig.entitlementNotes.value}
            </p>
          )}
        </div>

        <div className="lg:col-span-7">
          {artwork && (
            <Reveal from="up" tilt={-2} className="relative mb-16 max-w-2xl">
              <Strip className="-top-4 left-10" />
              <Artwork src={artwork} alt="Official Witches Glow Run entitlements" />
            </Reveal>
          )}

          <Reveal from="right" tilt={1.5}>
            <div ref={sheetRef} className="relative bg-paper px-7 pb-11 pt-12 text-ink md:px-12">
              <Strip className="-left-8 -top-3" />
              <Strip className="-right-8 -top-3 !rotate-6" />

              {items.length > 0 ? (
                <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
                  {items.map((entry, i) => (
                    <li key={entry.item} className="flex items-start gap-4">
                      <span className="relative mt-1 block h-9 w-9 shrink-0 border-[3px] border-ink">
                        <Tick drawn={seen} delay={300 + i * 260} className="absolute -left-1 -top-3 h-12 w-12" />
                      </span>
                      <div>
                        <div className="display display-s">{entry.item}</div>
                        {entry.detail && <p className="mt-1 text-base font-medium leading-snug">{entry.detail}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <ul aria-hidden className="space-y-9">
                    {BLANK_ROWS.map((row) => (
                      <li key={row} className="flex items-end gap-5">
                        <span className="block h-9 w-9 shrink-0 border-[3px] border-ink" />
                        <span className="blank !w-full" style={{ opacity: 0.55 - row * 0.1 }} />
                      </li>
                    ))}
                  </ul>
                  <p className="sr-only">Entitlements to be announced</p>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </SectionShell>
  );
}
