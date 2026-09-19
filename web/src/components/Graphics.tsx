import { useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useInView } from '../lib/useInView';

/**
 * The Witches Glow Run graphic kit. Everything here is built from geometry, in code:
 * a route line, a crescent moon, sparkles, stickers, tape, hand-drawn marks. No
 * imagery, no clip-art. Each piece exists because the event has a route, a night
 * sky, a bib and a ticket.
 */

type Css = CSSProperties & Record<`--${string}`, string | number>;

/* ---- Sparkle: the four-point star. ------------------------------------- */
export function Sparkle({
  size = 24,
  color = 'var(--gold)',
  className = '',
  style,
}: {
  size?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden className={className} style={style}>
      <path
        d="M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0Z"
        fill={color}
      />
    </svg>
  );
}

export interface StarSpec {
  x: number; // percent
  y: number; // percent
  s: number; // px
  c?: 'gold' | 'lavender' | 'paper';
  kind?: 'spark' | 'dot';
  twinkle?: 1 | 2 | 3;
}

const STAR_COLOUR = { gold: 'var(--gold)', lavender: 'var(--lavender)', paper: 'var(--paper)' } as const;
const TWINKLE = { 1: 'twinkle', 2: 'twinkle twinkle-2', 3: 'twinkle twinkle-3' } as const;

/** Stars are placed by hand in clusters near the things that matter, never scattered evenly. */
export function Stars({ items, className = '' }: { items: StarSpec[]; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {items.map((star, i) => {
        const colour = STAR_COLOUR[star.c ?? 'paper'];
        const place: CSSProperties = { left: `${star.x}%`, top: `${star.y}%`, translate: '-50% -50%' };
        return star.kind === 'dot' ? (
          <span
            key={i}
            className={`absolute rounded-full ${star.twinkle ? TWINKLE[star.twinkle] : ''}`}
            style={{ ...place, width: star.s, height: star.s, background: colour }}
          />
        ) : (
          <Sparkle
            key={i}
            size={star.s}
            color={colour}
            className={`absolute ${star.twinkle ? TWINKLE[star.twinkle] : ''}`}
            style={place}
          />
        );
      })}
    </div>
  );
}

/* ---- Moon: a gold crescent glowing in halftone. -------------------------- */
export function Moon({ size, className = '', style }: { size: string; className?: string; style?: CSSProperties }) {
  const id = useId().replace(/:/g, '');
  return (
    <div aria-hidden className={`pointer-events-none absolute ${className}`} style={{ width: size, height: size, ...style }}>
      <div className="halo" style={{ width: '330%', left: '-115%', top: '-115%' }}>
        <i /><i /><i /><i /><i />
      </div>
      <svg viewBox="-100 -100 200 200" className="absolute inset-0 h-full w-full">
        <defs>
          <mask id={id}>
            <rect x="-100" y="-100" width="200" height="200" fill="#fff" />
            <circle cx="44" cy="-28" r="84" fill="#000" />
          </mask>
        </defs>
        <circle r="100" fill="var(--gold)" mask={`url(#${id})`} />
      </svg>
    </div>
  );
}

/* ---- Stickers and tape. --------------------------------------------------- */
const FILL = {
  gold: 'bg-gold text-ink',
  paper: 'bg-paper text-ink',
  lavender: 'bg-lavender text-ink',
  emerald: 'bg-emerald text-paper',
} as const;

export function Burst({
  children,
  size,
  tone = 'paper',
  tilt = 0,
  className = '',
  glow = false,
}: {
  children: ReactNode;
  size: string;
  tone?: keyof typeof FILL;
  tilt?: number;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`${glow ? 'sticker-lav' : 'sticker'} tilt ${className}`} style={{ '--tilt': `${tilt}deg` } as Css}>
      <div className={`burst grid place-items-center text-center ${FILL[tone]}`} style={{ width: size, height: size }}>
        {children}
      </div>
    </div>
  );
}

export function Tape({
  children,
  tone = 'gold',
  tilt = 0,
  className = '',
}: {
  children?: ReactNode;
  tone?: keyof typeof FILL;
  tilt?: number;
  className?: string;
}) {
  return (
    <div className={`sticker tilt ${className}`} style={{ '--tilt': `${tilt}deg` } as Css}>
      <div className={`tape px-6 py-2 ${FILL[tone]}`}>{children}</div>
    </div>
  );
}

export function FinishFlag({ size = 32, className = '' }: { size?: number; className?: string }) {
  return <span aria-hidden className={`finish-flag block ${className}`} style={{ width: size, height: size }} />;
}

/* ---- The Glow Trail: a route line that draws itself. ---------------------- */
export interface TrailStop {
  at: number; // 0 to 1 along the path
  node: ReactNode;
}

export function Trail({
  d,
  viewBox,
  className = '',
  width = 12,
  stops = [],
  drawNow = false,
  delay = 0,
}: {
  d: string;
  viewBox: string;
  className?: string;
  width?: number;
  stops?: TrailStop[];
  /** Draw on load (the cover) instead of when scrolled into view. */
  drawNow?: boolean;
  delay?: number;
}) {
  const [, , w, h] = viewBox.split(' ').map(Number) as [number, number, number, number];
  const [ref, seen] = useInView<HTMLDivElement>(0.4);
  const drawn = drawNow || seen;
  const pathRef = useRef<SVGPathElement>(null);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);

  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path || typeof path.getTotalLength !== 'function') return;
    const total = path.getTotalLength();
    setPoints(
      stops.map((stop) => {
        const point = path.getPointAtLength(total * stop.at);
        return { x: (point.x / w) * 100, y: (point.y / h) * 100 };
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d, viewBox, stops.length]);

  const state = drawn ? 'trail-line--drawn' : 'trail-line--pending';
  const timing: CSSProperties = { transitionDelay: `${delay}ms` };

  return (
    <div ref={ref} aria-hidden className={`relative w-full ${className}`} style={{ aspectRatio: `${w} / ${h}` }}>
      <svg viewBox={viewBox} className="absolute inset-0 h-full w-full overflow-visible">
        {/* Hard offset echo in lavender: the glow, printed a hair off register. */}
        <path
          d={d}
          pathLength={1}
          className={`trail-line ${state}`}
          stroke="var(--lavender)"
          strokeWidth={width}
          transform="translate(7 8)"
          style={timing}
        />
        <path
          ref={pathRef}
          d={d}
          pathLength={1}
          className={`trail-line ${state}`}
          stroke="var(--gold)"
          strokeWidth={width}
          style={timing}
        />
      </svg>
      {stops.map((stop, i) => {
        const point = points[i];
        if (!point) return null;
        return (
          <div
            key={i}
            className="trail-stop absolute"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              translate: '-50% -50%',
              opacity: drawn ? 1 : 0,
              transition: `opacity 300ms ease ${delay + stop.at * 1900}ms`,
            }}
          >
            {stop.node}
          </div>
        );
      })}
    </div>
  );
}

/* ---- Hand-drawn marks. ------------------------------------------------------ */
const MARKS = {
  scribble: { viewBox: '0 0 240 28', paths: ['M6 18 C40 6 70 24 110 12 S176 22 232 8'], ratio: '240 / 28' },
  ring: {
    viewBox: '0 0 300 120',
    paths: ['M42 72 C20 34 110 8 190 14 C268 20 294 62 232 92 C162 122 40 108 24 62 C20 44 42 30 68 22'],
    ratio: '300 / 120',
  },
  arrow: {
    viewBox: '0 0 180 90',
    paths: ['M6 74 C30 14 98 4 150 44', 'M122 30 L152 46 L128 68'],
    ratio: '180 / 90',
  },
} as const;

export function Mark({
  kind,
  color = 'var(--gold)',
  width = 6,
  className = '',
  duration = 900,
}: {
  kind: keyof typeof MARKS;
  color?: string;
  width?: number;
  className?: string;
  duration?: number;
}) {
  const mark = MARKS[kind];
  const [ref, seen] = useInView<SVGSVGElement>(0.5);
  return (
    <svg
      ref={ref}
      aria-hidden
      viewBox={mark.viewBox}
      className={`overflow-visible ${className}`}
      style={{ aspectRatio: mark.ratio }}
    >
      {mark.paths.map((d) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`tick-path ${seen ? 'tick-path--drawn' : 'tick-path--pending'}`}
          style={{ transitionDuration: `${duration}ms` }}
        />
      ))}
    </svg>
  );
}

/** A tick that draws itself in. Used for the race-pack checklist. */
export function Tick({ drawn, delay = 0, className = '' }: { drawn: boolean; delay?: number; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 50 44" className={`overflow-visible ${className}`}>
      <path
        d="M4 24 L18 38 L46 6"
        pathLength={1}
        fill="none"
        stroke="var(--gold)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`tick-path ${drawn ? 'tick-path--drawn' : 'tick-path--pending'}`}
        style={{ transitionDelay: `${delay}ms` }}
      />
    </svg>
  );
}

/* ---- Reveal: arrival, once, with a little overshoot. ---------------------- */
const FROM: Record<string, Css> = {
  up: { '--fy': '2.5rem' },
  left: { '--fx': '-5rem', '--fr': '-4deg' },
  right: { '--fx': '5rem', '--fr': '4deg' },
  pop: { '--fs': 0.55, '--fr': '-10deg' },
};

export function Reveal({
  children,
  from = 'up',
  tilt = 0,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  from?: keyof typeof FROM;
  tilt?: number;
  delay?: number;
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.15);
  return (
    <div
      ref={ref}
      className={`reveal tilt ${seen ? '' : 'reveal--pending'} ${className}`}
      style={{ ...FROM[from], '--tilt': `${tilt}deg`, transitionDelay: `${delay}ms` } as Css}
    >
      {children}
    </div>
  );
}

/* ---- Confetti: one burst of sparkles, for the moment you are in. ---------- */
const CONFETTI: Array<{ bx: string; by: string; s: number; c: keyof typeof STAR_COLOUR; d: number }> = [
  { bx: '-16rem', by: '-9rem', s: 34, c: 'gold', d: 0 },
  { bx: '14rem', by: '-11rem', s: 26, c: 'lavender', d: 60 },
  { bx: '-9rem', by: '-15rem', s: 20, c: 'paper', d: 120 },
  { bx: '20rem', by: '-3rem', s: 38, c: 'gold', d: 30 },
  { bx: '-21rem', by: '2rem', s: 24, c: 'lavender', d: 90 },
  { bx: '9rem', by: '10rem', s: 30, c: 'paper', d: 150 },
  { bx: '-12rem', by: '11rem', s: 36, c: 'gold', d: 200 },
  { bx: '22rem', by: '8rem', s: 22, c: 'lavender', d: 250 },
  { bx: '2rem', by: '-16rem', s: 28, c: 'gold', d: 180 },
  { bx: '-4rem', by: '13rem', s: 18, c: 'paper', d: 300 },
];

export function Confetti({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute left-1/2 top-1/2 ${className}`}>
      {CONFETTI.map((piece, i) => (
        <Sparkle
          key={i}
          size={piece.s}
          color={STAR_COLOUR[piece.c]}
          className="burst-out absolute"
          style={{ '--bx': piece.bx, '--by': piece.by, animationDelay: `${piece.d}ms` } as Css}
        />
      ))}
    </div>
  );
}
