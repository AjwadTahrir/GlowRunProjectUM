import { eventConfig } from '../config/event';
import { useInView } from '../lib/useInView';
import { Artwork, Blank, Leader, SectionShell, Title, Value } from './ui';

/** Empty checklist / timetable rows: the printed form, waiting to be filled in. */
const BLANK_ROWS = [0, 1, 2, 3];

/* 02  THE RUN: editorial spread. Statement and a giant 500 on the left, the
   programme card on the right. */
export function TheRun() {
  return (
    <SectionShell id="the-run" className="py-24 md:py-40">
      <div className="shell grid gap-x-16 gap-y-16 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Title id="the-run" index="02">
            The run
          </Title>
          <p className="mt-10 max-w-[20ch] text-3xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Four categories, {eventConfig.maxCapacity} places, one night run at Universiti Malaya.
          </p>
          <p className="lede mt-6">
            Open to Universiti Malaya students, staff and alumni, and to the public. Places are allocated in the
            order registrations are accepted.
          </p>
          <div className="mt-14 flex items-end gap-5 md:mt-20">
            <span className="display text-[clamp(7rem,22vw,17rem)] leading-[0.74] text-gold">
              {eventConfig.maxCapacity}
            </span>
            <span className="pb-2 text-lg leading-tight text-paper/75">
              places
              <br />
              in total
            </span>
          </div>
        </div>

        <dl className="self-end lg:col-span-5">
          <Leader label="Date" field={eventConfig.date} />
          <Leader label="Flag off" field={eventConfig.time} />
          <Leader label="Distance" field={eventConfig.distance} />
          <Leader label="Venue" field={eventConfig.venue} w="12ch" />
          <Leader label="Organiser" field={eventConfig.organiser} w="12ch" />
          <Leader label="Contact" field={eventConfig.contactNumber} w="12ch" />
        </dl>
      </div>
    </SectionShell>
  );
}

/* 03  ROUTE: a full-bleed course line, start to finish. Only ever draws what is
   confirmed: the ends, the distance, and any named stops. */
export function Route() {
  const [lineRef, drawn] = useInView<HTMLDivElement>(0.6);
  const { points, description } = eventConfig.route;
  const artwork = eventConfig.posters.route;

  return (
    <SectionShell id="route" tone="purple" className="pb-28 pt-24 md:pb-40 md:pt-36">
      <div className="shell">
        <Title id="route" index="03">
          Route
        </Title>
        {description.confirmed && <p className="lede mt-8">{description.value}</p>}
      </div>

      <div className="shell">
        <div className="mt-16 grid grid-cols-2 items-end gap-x-6 gap-y-3 sm:grid-cols-3 md:mt-24">
          <span className="display display-m order-first col-span-2 text-gold sm:order-none sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:text-center">
            <Value field={eventConfig.distance} w="9ch" />
          </span>
          <span className="display display-m sm:col-start-1 sm:row-start-1">Start</span>
          <span className="display display-m text-right sm:col-start-3 sm:row-start-1">Finish</span>
        </div>

        <div ref={lineRef} className="relative mt-5 h-8">
          {/* Centring and drawing sit on separate elements: both set `transform`. */}
          <div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2">
            <div className={`course-line h-full w-full bg-gold ${drawn ? '' : 'course-line--pending'}`} />
          </div>
          <span className="absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-gold" aria-hidden />
          <span className="finish-flag absolute right-0 top-1/2 h-8 w-8 -translate-y-1/2" aria-hidden />
          {points.map((point, i) => (
            <span
              key={point.label}
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 border-[3px] border-gold bg-purple"
              style={{ left: `${((i + 1) / (points.length + 1)) * 100}%` }}
              aria-hidden
            />
          ))}
        </div>

        {points.length > 0 && (
          <ol className="relative mt-5 h-16">
            {points.map((point, i) => (
              <li
                key={point.label}
                className="absolute top-0 -translate-x-1/2 text-center"
                style={{ left: `${((i + 1) / (points.length + 1)) * 100}%` }}
              >
                <span className="display display-s block">{point.label}</span>
                {point.at && <span className="figure text-sm text-grey">{point.at}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {artwork && (
        <div className="shell mt-16 md:mt-24">
          <Artwork
            src={artwork}
            alt="Official Witches Glow Run route map"
            caption="Open the route full size"
            className="lg:ml-[25%] lg:-mr-12"
          />
        </div>
      )}
    </SectionShell>
  );
}

/* 04  CATEGORIES & FEES: each category is a full-width band, set as big as the
   page will allow. */
export function Categories() {
  return (
    <section id="categories" aria-labelledby="categories-heading">
      <div className="shell pb-14 pt-24 md:pb-20 md:pt-36">
        <Title id="categories" index="04" size="m" className="lg:text-right">
          Categories &amp; fees
        </Title>
        <p className="lede mt-6 lg:ml-auto lg:text-right">
          Choose the category you qualify for. You will need it again on the registration form.
        </p>
      </div>

      <ul>
        {eventConfig.categories.map((category, i) => (
          <li key={category.id} className={i % 2 === 0 ? 'bg-purple' : ''}>
            <div className="shell grid grid-cols-12 items-end gap-x-6 gap-y-4 py-9 md:py-14">
              <span className="figure col-span-12 text-sm text-gold md:col-span-1 md:pb-3">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="col-span-12 md:col-span-8">
                <h3 className="display text-[clamp(3.25rem,10.5vw,9.5rem)]">{category.label}</h3>
                <p className="mt-4 max-w-[46ch] text-base leading-snug text-paper/75">{category.eligibility}</p>
              </div>
              <div className="col-span-12 md:col-span-3 md:text-right">
                <div className="display display-m text-gold">
                  <Value field={category.fee} w="5ch" />
                </div>
                <div className="tech mt-2">Fee</div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="shell grid gap-x-16 gap-y-8 py-20 md:py-28 lg:grid-cols-12">
        <h3 className="display display-s lg:col-span-4">How to pay</h3>
        <div className="lg:col-span-5">
          {eventConfig.payment.instructions.confirmed ? (
            <p className="lede">{eventConfig.payment.instructions.value}</p>
          ) : (
            <div aria-hidden className="space-y-6 pt-3">
              <div className="blank !w-full" />
              <div className="blank !w-4/5" />
              <div className="blank !w-3/5" />
            </div>
          )}
          {!eventConfig.payment.instructions.confirmed && <span className="sr-only">To be announced</span>}
          <p className="hint mt-6">Pay first, then upload the receipt with your registration below.</p>
        </div>
        {eventConfig.payment.qrImage && (
          <img
            src={eventConfig.payment.qrImage}
            alt="Payment QR code supplied by the organiser"
            className="h-44 w-44 bg-paper p-2 lg:col-span-3"
          />
        )}
      </div>
    </section>
  );
}

/* 05  ENTITLEMENTS: the race-pack checklist. */
export function Entitlements() {
  const items = eventConfig.entitlements;
  const artwork = eventConfig.posters.entitlements;

  return (
    <SectionShell id="entitlements" className="py-24 md:py-40">
      <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-5 lg:self-start">
          <Title id="entitlements" index="05" size="m">
            Entitlements
          </Title>
          <p className="lede mt-6">What you receive as a participant.</p>
          {eventConfig.entitlementNotes.confirmed && (
            <p className="mt-6 max-w-[46ch] text-base leading-relaxed text-paper/75">
              {eventConfig.entitlementNotes.value}
            </p>
          )}
        </div>

        <div className="lg:col-span-7">
          {artwork && (
            <Artwork
              src={artwork}
              alt="Official Witches Glow Run entitlements"
              className="mb-14 -mr-5 sm:-mr-8 lg:-mr-12"
            />
          )}

          {items.length > 0 ? (
            <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
              {items.map((entry) => (
                <li key={entry.item} className="flex items-start gap-4">
                  <span aria-hidden className="mt-1 h-7 w-7 shrink-0 border-2 border-gold" />
                  <div>
                    <div className="display display-s">{entry.item}</div>
                    {entry.detail && <p className="mt-1 text-base leading-snug text-paper/70">{entry.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !artwork && (
              <>
                <ul aria-hidden className="space-y-9">
                  {BLANK_ROWS.map((row) => (
                    <li key={row} className="flex items-end gap-5">
                      <span className="h-7 w-7 shrink-0 border-2 border-gold" />
                      <span className="blank !w-full" style={{ opacity: 1 - row * 0.15 }} />
                    </li>
                  ))}
                </ul>
                <p className="sr-only">Entitlements to be announced</p>
              </>
            )
          )}
        </div>
      </div>
    </SectionShell>
  );
}

/* 06  THE NIGHT: a timing sheet. The times are the largest figures on the page. */
export function TheNight() {
  const schedule = eventConfig.schedule;
  const artwork = eventConfig.posters.tentative;

  return (
    <SectionShell id="the-night" tone="purple" className="py-24 md:py-36">
      <div className="shell grid gap-x-16 gap-y-12 lg:grid-cols-12">
        <div className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
          <Title id="the-night" index="06" size="m">
            The night
          </Title>
          {artwork && (
            <Artwork
              src={artwork}
              alt="Official Witches Glow Run schedule"
              caption="Open the schedule full size"
              className="mt-10 max-w-sm"
            />
          )}
        </div>

        {schedule.length > 0 ? (
          <ol className="space-y-8 md:space-y-10 lg:col-span-8">
            {schedule.map((slot) => (
              <li key={`${slot.time}-${slot.activity}`} className="grid grid-cols-[auto_1fr] items-baseline gap-x-6 md:gap-x-12">
                <time className="figure text-[clamp(2.25rem,6.5vw,5.5rem)] font-medium leading-none text-gold">
                  {slot.time}
                </time>
                <div>
                  <div className="display display-m">{slot.activity}</div>
                  {slot.detail && <p className="mt-2 max-w-[48ch] text-paper/75">{slot.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <ol aria-hidden className="space-y-8 md:space-y-10 lg:col-span-8">
              {BLANK_ROWS.map((row) => (
                <li key={row} className="grid grid-cols-[auto_1fr] items-end gap-x-6 md:gap-x-12" style={{ opacity: 1 - row * 0.18 }}>
                  <span className="figure text-[clamp(2.25rem,6.5vw,5.5rem)] font-medium leading-none text-paper/25">
                    --:--
                  </span>
                  <span className="blank mb-2 !w-full" />
                </li>
              ))}
            </ol>
            <p className="sr-only">Schedule to be announced</p>
          </>
        )}
      </div>
    </SectionShell>
  );
}

/* 07  LUCKY DRAW: a raffle ticket. The only large gold surface on the page. */
export function LuckyDraw() {
  const prizes = eventConfig.luckyDraw.prizes;
  const artwork = eventConfig.posters.luckyDraw;

  return (
    <SectionShell id="lucky-draw" className="py-28 md:py-44">
      <div className="shell">
        <div className="on-gold grid bg-gold text-ink md:grid-cols-[1fr_21rem]">
          <div className="px-6 py-10 sm:px-10 md:px-14 md:py-16">
            <h2 id="lucky-draw-heading" className="display text-[clamp(3.75rem,10vw,9rem)]">
              Lucky draw
              <span aria-hidden className="folio !text-ink">
                07
              </span>
            </h2>

            {prizes.length > 0 ? (
              <ol className="mt-10 space-y-3">
                {prizes.map((prize, i) => (
                  <li key={prize} className="flex items-baseline gap-5">
                    <span className="figure text-sm font-medium">{String(i + 1).padStart(2, '0')}</span>
                    <span className="display display-s">{prize}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <>
                <ol aria-hidden className="mt-10 space-y-6">
                  {[0, 1, 2].map((row) => (
                    <li key={row} className="flex items-end gap-5">
                      <span className="figure text-sm font-medium">{String(row + 1).padStart(2, '0')}</span>
                      <span className="blank !w-full" style={{ opacity: 1 - row * 0.2 }} />
                    </li>
                  ))}
                </ol>
                <p className="sr-only">Prizes to be announced</p>
              </>
            )}
          </div>

          <div className="relative border-t-2 border-dashed border-ink/50 px-6 py-10 md:border-l-2 md:border-t-0 md:px-9 md:py-16">
            <span aria-hidden className="notch -left-3.5 -top-3.5" />
            <span aria-hidden className="notch -right-3.5 -top-3.5 md:-bottom-3.5 md:-left-3.5 md:right-auto md:top-auto" />
            <dl className="space-y-9">
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.14em] text-ink/70">Who qualifies</dt>
                <dd className="display display-s mt-2">
                  <Value field={eventConfig.luckyDraw.eligibility} w="12ch" />
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-[0.14em] text-ink/70">Drawn at</dt>
                <dd className="display display-s mt-2">
                  <Value field={eventConfig.luckyDraw.timing} w="12ch" />
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {artwork && (
          <Artwork
            src={artwork}
            alt="Official Witches Glow Run lucky draw poster"
            caption="Open the poster full size"
            className="mt-12 max-w-2xl md:ml-auto"
          />
        )}
      </div>
    </SectionShell>
  );
}

/* 09  BEFORE THE NIGHT: the WhatsApp group, shown once someone is registered. */
export function Community({ registered }: { registered: boolean }) {
  const { inviteUrl, qrImage, visibility } = eventConfig.whatsapp;
  if (visibility === 'after_registration' && !registered) return null;

  return (
    <SectionShell id="whatsapp" className="py-24 md:py-32">
      <div className="shell grid items-center gap-x-16 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Title id="whatsapp" index="09" size="m">
            Before the night
          </Title>
          <p className="lede mt-6">Announcements, reminders and last-minute changes go out on WhatsApp first.</p>
          {inviteUrl ? (
            <a href={inviteUrl} target="_blank" rel="noreferrer noopener" className="btn-gold mt-8">
              Join WhatsApp group
            </a>
          ) : (
            <p className="mt-8 text-paper/75">The group link will be added here.</p>
          )}
        </div>

        {qrImage && (
          <img
            src={qrImage}
            alt="QR code for the Witches Glow Run WhatsApp group"
            className="h-52 w-52 bg-paper p-3 lg:col-span-4 lg:col-start-9 lg:justify-self-end"
          />
        )}
      </div>
    </SectionShell>
  );
}

/* FOOT: the wordmark again, cropped by the bottom of the sheet. */
export function Footer() {
  const socials: Array<[string, string]> = [];
  const { instagram, tiktok, facebook } = eventConfig.social;
  if (instagram) socials.push(['Instagram', instagram]);
  if (tiktok) socials.push(['TikTok', tiktok]);
  if (facebook) socials.push(['Facebook', facebook]);

  const column = 'text-sm leading-relaxed text-paper/75';

  return (
    <footer className="border-t border-paper/15 pt-20 md:pt-28">
      <div className="shell grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="mt-3 max-w-[40ch] text-xs leading-relaxed text-paper/70">{eventConfig.privacyNotice}</p>
          <p className="mt-3 text-sm">
            <a href="#terms" className="text-gold underline underline-offset-4">
              Terms and conditions
            </a>
          </p>
        </div>
      </div>

      <div className="shell mt-16 flex flex-wrap justify-between gap-4 pb-6 font-mono text-xs uppercase tracking-[0.14em] text-grey">
        <span>&copy; {new Date().getFullYear()} Witches Glow Run</span>
        <span>Universiti Malaya</span>
      </div>

      <div aria-hidden className="mb-14 select-none overflow-hidden whitespace-nowrap px-[2vw] pb-0 md:mb-0">
        <span className="display block translate-y-[13%] text-[14.4vw] leading-[0.8] text-paper">
          Witches Glow Run
        </span>
      </div>
    </footer>
  );
}
