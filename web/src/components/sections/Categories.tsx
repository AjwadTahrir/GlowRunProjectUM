import { eventConfig } from '../../config/event';
import type { Category } from '../../lib/validation';
import { Reveal, Sparkle } from '../Graphics';
import { SectionShell, Title, Value } from '../ui';

// One colour per category, and the same colour on the bib and in the form.
const COLOUR: Record<Category, string> = {
  um_student: 'cat-um_student',
  um_staff: 'cat-um_staff',
  um_alumni: 'cat-um_alumni',
  public: 'cat-public',
};

// Each ticket sits a little differently, like entries dropped on a desk.
const PLACE = [
  { tilt: -1.4, from: 'left', margin: 'md:mr-[7%]' },
  { tilt: 1.1, from: 'right', margin: 'md:ml-[7%]' },
  { tilt: -0.8, from: 'left', margin: 'md:mr-[3%]' },
  { tilt: 1.5, from: 'right', margin: 'md:ml-[10%]' },
] as const;

/**
 * 04  CATEGORIES & FEES. Four race entries, laid out like tickets: the category on the
 * main part, the fee on the stub, a perforation between. The fee is a blank line
 * until the organiser confirms it.
 */
export function Categories() {
  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="relative overflow-hidden py-24 md:py-36"
      style={{ ['--ground' as string]: 'var(--ink)' } as React.CSSProperties}
    >
      <div className="shell relative">
        <Reveal from="left" tilt={-2}>
          <Title id="categories" index="04" className="leading-none">
            <span className="wide block text-[clamp(2.75rem,9vw,8rem)] text-gold">Categories</span>{' '}
            <span className="display inline-block text-[clamp(2.5rem,7vw,6rem)] text-lavender md:ml-[8vw]">&amp; fees</span>
          </Title>
        </Reveal>
        <p className="lede mt-6">
          Choose the category you qualify for. You will need it again on the registration form.
        </p>
        <Sparkle size={40} color="var(--lavender)" className="twinkle-2 twinkle absolute right-[6%] top-2 hidden md:block" />

        <ul className="mt-14 space-y-6 md:mt-20 md:space-y-9">
          {eventConfig.categories.map((category, i) => {
            const place = PLACE[i % PLACE.length]!;
            return (
              <li key={category.id} className={place.margin}>
                <Reveal from={place.from} tilt={place.tilt}>
                  <div className={`relative grid md:grid-cols-[1fr_18rem] ${COLOUR[category.id as Category]}`}>
                    <div className="px-6 pb-8 pt-7 md:px-10 md:pb-10 md:pt-9">
                      <div className="tech-on">Entry {String(i + 1).padStart(2, '0')}</div>
                      <h3 className="display mt-2 text-[clamp(3.25rem,9vw,8.5rem)] leading-[0.84]">{category.label}</h3>
                      <p className="mt-4 max-w-[46ch] text-base font-medium leading-snug">{category.eligibility}</p>
                    </div>

                    <div className="relative flex flex-col justify-center border-t-2 border-dashed border-current px-6 py-7 md:border-l-2 md:border-t-0 md:px-8">
                      <span aria-hidden className="notch -left-[15px] -top-[15px]" />
                      <span
                        aria-hidden
                        className="notch -right-[15px] -top-[15px] md:-bottom-[15px] md:-left-[15px] md:right-auto md:top-auto"
                      />
                      <div className="tech-on">Fee</div>
                      <div className="wide mt-1 text-[clamp(2.25rem,4.6vw,3.75rem)] leading-none">
                        <Value field={category.fee} w="5ch" />
                      </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ul>

        <Reveal from="up" tilt={-1.2} className="mt-20 md:ml-auto md:mr-[6%] md:mt-28 md:max-w-xl">
          <div className="torn bg-paper px-8 pb-14 pt-9 text-ink">
            <h3 className="display display-s">How to pay</h3>
            {eventConfig.payment.instructions.confirmed ? (
              <p className="mt-4 text-lg font-medium leading-snug">{eventConfig.payment.instructions.value}</p>
            ) : (
              <>
                <div aria-hidden className="mt-6 space-y-5">
                  <div className="blank !w-full" />
                  <div className="blank !w-4/5" />
                  <div className="blank !w-3/5" />
                </div>
                <span className="sr-only">To be announced</span>
              </>
            )}
            <p className="mt-6 text-sm font-medium leading-snug opacity-80">
              Pay first, then upload the receipt with your registration below.
            </p>
            {eventConfig.payment.qrImage && (
              <img
                src={eventConfig.payment.qrImage}
                alt="Payment QR code supplied by the organiser"
                className="mt-6 h-40 w-40 border-4 border-ink"
              />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
