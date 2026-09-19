import { eventConfig } from '../../config/event';
import { FinishFlag, Sparkle, Stars, Trail, type StarSpec } from '../Graphics';
import { Value } from '../ui';

const STARS: StarSpec[] = [
  { x: 6, y: 20, s: 28, c: 'gold', twinkle: 3 },
  { x: 94, y: 12, s: 22, c: 'lavender' },
  { x: 50, y: 6, s: 7, c: 'paper', kind: 'dot' },
];

const END = 'M30 96 C280 20 470 150 720 84 S1180 20 1390 88';

/** FOOT. The route ends here, at the finish flag, under the wordmark cropped by the page edge. */
export function Footer() {
  const socials: Array<[string, string]> = [];
  const { instagram, tiktok, facebook } = eventConfig.social;
  if (instagram) socials.push(['Instagram', instagram]);
  if (tiktok) socials.push(['TikTok', tiktok]);
  if (facebook) socials.push(['Facebook', facebook]);

  const column = 'text-sm leading-relaxed text-paper/85';

  return (
    <footer className="relative overflow-hidden pt-20 md:pt-28">
      <Stars items={STARS} />

      <div className="shell relative">
        <Trail
          d={END}
          viewBox="0 0 1440 130"
          width={9}
          stops={[
            { at: 0, node: <span className="block h-5 w-5 rounded-full bg-gold" /> },
            { at: 1, node: <FinishFlag size={30} /> },
          ]}
        />

        <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="tech">Organiser</h2>
            <p className={`${column} mt-3`}>
              <Value field={eventConfig.organiser} w="14ch" />
            </p>
            <p className={`${column} mt-2`}>
              <Value field={eventConfig.contactNumber} w="14ch" />
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="tech">Sections</h2>
            <ul className={`${column} mt-3 space-y-2`}>
              <li><a href="#the-run" className="hover:text-gold">The run</a></li>
              <li><a href="#categories" className="hover:text-gold">Categories &amp; fees</a></li>
              <li><a href="#the-night" className="hover:text-gold">The night</a></li>
              <li><a href="#register" className="hover:text-gold">Register</a></li>
            </ul>
          </nav>

          {socials.length > 0 && (
            <div>
              <h2 className="tech">Follow</h2>
              <ul className={`${column} mt-3 space-y-2`}>
                {socials.map(([label, url]) => (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noreferrer noopener" className="hover:text-gold">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="tech">Your data</h2>
            <p className="mt-3 max-w-[40ch] text-xs leading-relaxed text-paper/80">{eventConfig.privacyNotice}</p>
            <p className="mt-3 text-sm">
              <a href="#terms" className="text-gold underline underline-offset-4">
                Terms and conditions
              </a>
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 pb-6 font-mono text-xs uppercase tracking-[0.12em] text-paper/75">
          <span>&copy; {new Date().getFullYear()} Witches Glow Run</span>
          <span className="flex items-center gap-3">
            <Sparkle size={14} color="var(--gold)" />
            Universiti Malaya
          </span>
        </div>
      </div>

      <div aria-hidden className="mb-14 select-none overflow-hidden whitespace-nowrap px-[1.5vw] md:mb-0">
        <span className="block translate-y-[14%] text-[10.6vw] leading-[0.8]">
          <span className="display text-paper">Witches </span>
          <span className="wide text-gold">Glow </span>
          <span className="display text-lavender">Run</span>
        </span>
      </div>
    </footer>
  );
}
