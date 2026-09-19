import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Unconfirmed } from '../config/event';

/**
 * Section ground. Sections alternate between the two plates, ink and purple.
 * Purple plates are cut on a slant so the page reads like sheets laid over each
 * other, not stacked boxes. `--ground` tells ticket notches what to cut through to.
 */
export function SectionShell({
  id,
  tone = 'ink',
  cut,
  className = '',
  children,
}: {
  id: string;
  tone?: 'ink' | 'purple';
  cut?: 'a' | 'b';
  className?: string;
  children: ReactNode;
}) {
  const shape = cut === 'a' ? 'cut-a' : cut === 'b' ? 'cut-b' : '';
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`relative ${tone === 'purple' ? 'bg-purple' : ''} ${shape} ${className}`}
      style={{ ['--ground' as string]: tone === 'purple' ? 'var(--purple)' : 'var(--ink)' } as CSSProperties}
    >
      {children}
    </section>
  );
}

/**
 * Section heading. The caller sets the voice (compressed, expanded italic, outline)
 * and the size, so no two headings are cut from the same template. The folio is the
 * section's stop number on the route.
 */
export function Title({
  id,
  index,
  className = '',
  style,
  folioClass = '',
  children,
}: {
  id: string;
  index: string;
  className?: string;
  style?: CSSProperties;
  folioClass?: string;
  children: ReactNode;
}) {
  return (
    <h2 id={`${id}-heading`} className={className} style={style}>
      {children}
      <span aria-hidden className={`folio ${folioClass}`}>
        {index}
      </span>
    </h2>
  );
}

/**
 * The empty line on a printed form. Stands in for anything the organiser has not
 * confirmed. Sighted readers see a blank to be filled in; screen readers are told.
 */
export function Blank({ w = '9ch' }: { w?: string }) {
  return (
    <>
      <span className="blank" style={{ ['--w' as string]: w }} aria-hidden />
      <span className="sr-only">To be announced</span>
    </>
  );
}

/** A confirmed value, or a blank line. Never a placeholder passed off as fact. */
export function Value({ field, w }: { field: Unconfirmed<string>; w?: string }) {
  return field.confirmed ? <>{field.value}</> : <Blank w={w} />;
}

/** A programme row: label, dotted leader, value. Takes its colour from where it is printed. */
export function Leader({ label, field, w }: { label: string; field: Unconfirmed<string>; w?: string }) {
  return (
    <div className="leader py-3">
      <dt className="tech-on shrink-0">{label}</dt>
      <dd className="display display-s text-right">
        <Value field={field} w={w} />
      </dd>
    </div>
  );
}

/**
 * Artwork opens full size. The poster is the work; the frame stays out of its way.
 * It is shown taped to the page: tilt and tape come from the section that uses it.
 */
export function Artwork({
  src,
  alt,
  caption,
  className = '',
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <figure className={className}>
      <button type="button" onClick={() => setOpen(true)} className="block w-full" aria-label={`${alt}, open full size`}>
        <img src={src} alt={alt} loading="lazy" className="h-auto w-full border-4 border-paper" />
      </button>
      {caption && <figcaption className="tech mt-3">{caption}</figcaption>}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/95 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            className="btn-outline absolute right-4 top-4"
            aria-label="Close"
          >
            Close
          </button>
          <img src={src} alt={alt} className="max-h-full max-w-full" />
        </div>
      )}
    </figure>
  );
}
