import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Unconfirmed } from '../config/event';

export function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="border-t border-white/[0.07] py-16 sm:py-20">
      <div className="shell">
        <h2 id={`${id}-heading`} className="section-heading">
          {title}
        </h2>
        {lede && <p className="lede">{lede}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

/**
 * Renders an organiser-supplied value, or a visible flag when it has not been
 * confirmed yet. Nothing unconfirmed can quietly pass for official information.
 */
export function Detail({ label, field }: { label: string; field: Unconfirmed<string> }) {
  return (
    <div>
      <dt className="text-sm text-violet-mist">{label}</dt>
      <dd className="mt-1 text-lg text-white">
        {field.confirmed ? (
          field.value
        ) : (
          <span className="placeholder-flag">
            <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
            Not confirmed
          </span>
        )}
      </dd>
    </div>
  );
}

export function MissingAsset({ what }: { what: string }) {
  return (
    <p className="panel border-dashed text-violet-mist">
      <span className="placeholder-flag">
        <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
        Missing
      </span>{' '}
      The organiser has not supplied the {what} yet. Add the file to <code className="text-white">web/public/</code> and
      point <code className="text-white">eventConfig.posters</code> at it.
    </p>
  );
}

/** A poster that can be opened full size, by click or by keyboard. */
export function PosterFrame({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full overflow-hidden rounded-2xl border border-white/10"
        aria-label={`${alt} — open full size`}
      >
        <img src={src} alt={alt} loading="lazy" className="h-auto w-full" />
      </button>
      {caption && <figcaption className="mt-2 text-sm text-violet-mist">{caption}</figcaption>}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/95 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full border border-white/25 p-2 text-white"
            aria-label="Close"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
          <img src={src} alt={alt} className="max-h-full max-w-full rounded-xl" />
        </div>
      )}
    </figure>
  );
}
