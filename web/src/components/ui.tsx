import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Unconfirmed } from '../config/event';

/** Section ground. Sections alternate between the two plates, ink and purple. */
export function SectionShell({
  id,
  tone = 'ink',
  className = '',
  children,
}: {
  id: string;
  tone?: 'ink' | 'purple';
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${tone === 'purple' ? 'bg-purple' : ''} ${className}`}
    >
      {children}
    </section>
  );
}

const SIZE = { l: 'display-l', m: 'display-h', r: 'display-r' } as const;

/** Section heading in the display voice. The folio is a small inline index. */
export function Title({
  id,
  index,
  size = 'l',
  className = '',
  children,
}: {
  id: string;
  index: string;
  size?: keyof typeof SIZE;
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2 id={`${id}-heading`} className={`display ${SIZE[size]} ${className}`}>
      {children}
      <span aria-hidden className="folio">
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

/** A programme row: label, dotted leader, value. */
export function Leader({ label, field, w }: { label: string; field: Unconfirmed<string>; w?: string }) {
  return (
    <div className="leader py-3">
      <dt className="tech shrink-0">{label}</dt>
      <dd className="display display-s text-right">
        <Value field={field} w={w} />
      </dd>
    </div>
  );
}

/**
 * Artwork opens full size. The poster is the work; the frame stays out of its way.
 * `crop` sets a fixed aspect ratio so the image can be cropped hard into a layout.
 */
export function Artwork({
  src,
  alt,
  caption,
  crop,
  className = '',
}: {
  src: string;
  alt: string;
  caption?: string;
  crop?: string;
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
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={crop ? `w-full object-cover object-top ${crop}` : 'h-auto w-full'}
        />
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
