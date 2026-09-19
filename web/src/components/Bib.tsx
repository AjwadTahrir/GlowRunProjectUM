import { CATEGORY_LABELS, type Category } from '../lib/validation';

/**
 * A race bib. The same artefact appears twice: as a live preview beside the form,
 * where it fills in as the participant types, and as the confirmation, where the
 * number is the one the server assigned. Pin holes, a coloured category band and
 * a perforated tear-off strip are how a real bib is built.
 *
 * Category bands are listed in full so the stylesheet can see every class name.
 */
const BAND: Record<Category, string> = {
  um_student: 'bib-band-um_student',
  um_staff: 'bib-band-um_staff',
  um_alumni: 'bib-band-um_alumni',
  public: 'bib-band-public',
};

export function Bib({
  number,
  name,
  category,
  size,
  label,
  className = '',
}: {
  /** Server-assigned registration number, for example WGR-0001. Omit before registration. */
  number?: string;
  name?: string;
  category?: Category;
  size?: string;
  /** Accessible name. The live preview is decorative and passes none. */
  label?: string;
  className?: string;
}) {
  const digits = number?.match(/^WGR-(\d+)$/)?.[1] ?? number;
  const cleanName = name?.trim();

  return (
    <figure
      className={`bib ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="bib-hole bib-hole-tl" />
      <span className="bib-hole bib-hole-tr" />
      <span className="bib-hole bib-hole-bl" />
      <span className="bib-hole bib-hole-br" />

      <div className="bib-head">
        <span className="display bib-brand">Witches Glow Run</span>
        <span className="bib-place">Universiti Malaya</span>
      </div>

      <div className="bib-center">
        {digits ? (
          <span className="display bib-number">{digits}</span>
        ) : (
          <span className="bib-blankwrap">
            <span className="bib-line w-[62%]" />
            <span className="bib-note">Number assigned on registration</span>
          </span>
        )}
      </div>

      <div className="bib-namebox">
        {cleanName ? (
          <div className="display bib-name">{cleanName}</div>
        ) : (
          <div className="bib-line mt-bib" />
        )}
      </div>

      <div className="bib-tear">
        {category ? (
          <span className={`display bib-cat ${BAND[category]}`}>{CATEGORY_LABELS[category]}</span>
        ) : (
          <span className="bib-line w-[30%]" />
        )}
        <span className="bib-place">{size ? `Shirt ${size}` : ''}</span>
      </div>
    </figure>
  );
}
