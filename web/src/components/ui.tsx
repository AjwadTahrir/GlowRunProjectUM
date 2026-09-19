import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Unconfirmed } from '../config/event';

/**
 * Sections are numbered because the page is a sequence — a publication read
 * top to bottom — not because numbering looks technical.
 */
export function Section({
  id,
  index,
  title,
  children,
  className = '',
}: {
  id: string;
  index: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={`py-20 sm:py-28 ${className}`}>
      <div className="shell">
        <div className="marker">
          <span className="tech-gold">{index}</span>
          <h2 id={`${id}-heading`} className="tech">
            {title}
          </h2>
        </div>
        <div className="mt-10 sm:mt-14">{children}</div>
      </div>
    </section>
  );
}

/** Renders a confirmed value, or an unmistakable flag when the organiser hasn't supplied one. */
export function Value({ field }: { field: Unconfirmed<string> }) {
  return field.confirmed ? <>{field.value}</> : <span className="flag">Not confirmed</span>;
}

/** A labelled data point. Label in mono above, value in display below. */
export function DataPoint({ label, field }: { label: string; field: Unconfirmed<string> }) {
  return (
    <div className="border-t border-[color:var(--rule)] pt-3">
      <div className="tech">{label}</div>
      <div className="mt-1.5 font-display text-2xl leading-tight sm:text-3xl">
        <Value field={field} />
      </div>
    </div>
  );
}

export function MissingAsset({ what }: { what: string }) {
  return (
    <div className="flex min-h-[14rem] flex-col items-start justify-center border border-dashed border-[color:var(--rule)] p-8">
      <span className="flag">Awaiting artwork</span>
      <p className="mt-3 max-w-md font-mono text-xs leading-relaxed text-grey">
        The {what} has not been supplied. Add the file to web/public/ and reference it in
        eventConfig.posters.
      </p>
    </div>
  );
}

/** Artwork opens full size. The poster is the work; the frame stays out of its way. */
export function Artwork({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
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
    <figure>
      <button type="button" onClick={() => setOpen(true)} className="block w-full" aria-label={`${alt} — open full size`}>
        <img src={src} alt={alt} loading="lazy" className="h-auto w-full" />
      </button>
      {caption && (
        <figcaption className="tech mt-3 flex items-center gap-3">
          <span className="h-px w-8 bg-[color:var(--rule)]" aria-hidden />
          {caption}
        </figcaption>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/97 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            className="tech-gold absolute right-6 top-6"
            aria-label="Close"
          >
            Close ✕
          </button>
          <img src={src} alt={alt} className="max-h-full max-w-full" />
        </div>
      )}
    </figure>
  );
}
