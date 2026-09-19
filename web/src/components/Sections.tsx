import { eventConfig } from '../config/event';
import { Artwork, DataPoint, MissingAsset, Section, Value } from './ui';

/* 02 — THE RUN ------------------------------------------------------------ */
export function TheRun() {
  return (
    <Section id="the-run" index="02" title="The run">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="font-display text-3xl leading-[1.15] sm:text-4xl">
            A night run through campus, lit by whatever you bring with you.
          </p>
          <p className="mt-6 max-w-[42ch] leading-relaxed text-paper/70">
            Open to Universiti Malaya students, staff and alumni, and to the public. Places are capped at{' '}
            {eventConfig.maxCapacity} and allocated in the order registrations are accepted.
          </p>
        </div>

        <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:col-span-6 lg:col-start-7">
          <DataPoint label="Date" field={eventConfig.date} />
          <DataPoint label="Flag off" field={eventConfig.time} />
          <DataPoint label="Distance" field={eventConfig.distance} />
          <DataPoint label="Venue" field={eventConfig.venue} />
          <DataPoint label="Organiser" field={eventConfig.organiser} />
          <DataPoint label="Contact" field={eventConfig.contactNumber} />
        </dl>
      </div>
    </Section>
  );
}

/* 03 — ROUTE -------------------------------------------------------------- */
export function Route() {
  return (
    <Section id="route" index="03" title="Route">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-9">
          {eventConfig.posters.route ? (
            <Artwork
              src={eventConfig.posters.route}
              alt="Official Witches Glow Run route map"
              caption="Tap to open the route full size"
            />
          ) : (
            <MissingAsset what="route map" />
          )}
        </div>

        {/* Race furniture. Shown as the run's structure, marked unconfirmed until it is. */}
        <ol className="lg:col-span-3">
          {['Start', 'Checkpoint', 'Water station', 'Finish'].map((point, i) => (
            <li key={point} className="flex items-baseline gap-4 border-t border-[color:var(--rule)] py-4">
              <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="font-display text-2xl">{point}</span>
            </li>
          ))}
        </ol>
      </div>

      <p className="mt-10 max-w-[52ch] leading-relaxed text-paper/70">
        <Value field={eventConfig.route.description} />
      </p>
    </Section>
  );
}

/* 04 — CATEGORIES --------------------------------------------------------- */
export function Categories() {
  return (
    <Section id="categories" index="04" title="Categories & fees">
      <ul>
        {eventConfig.categories.map((category, i) => (
          <li
            key={category.id}
            className="grid grid-cols-[3rem_1fr] items-baseline gap-x-5 gap-y-2 border-t border-[color:var(--rule)] py-8 sm:grid-cols-[4rem_1fr_auto] sm:gap-x-8"
          >
            <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="display-lg">{category.label}</h3>
              <p className="tech mt-3 normal-case tracking-normal text-paper/60">{category.eligibility}</p>
            </div>
            <span className="col-start-2 font-mono text-xl text-paper sm:col-start-3 sm:text-right">
              <Value field={category.fee} />
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-14 grid gap-8 border-t border-[color:var(--rule)] pt-8 lg:grid-cols-12">
        <h3 className="tech lg:col-span-3">How to pay</h3>
        <div className="lg:col-span-6">
          <p className="max-w-[46ch] leading-relaxed text-paper/70">
            <Value field={eventConfig.payment.instructions} />
          </p>
          <p className="tech mt-5 normal-case tracking-normal text-grey">
            Pay first, then upload the receipt with your registration below.
          </p>
        </div>
        {eventConfig.payment.qrImage && (
          <img
            src={eventConfig.payment.qrImage}
            alt="Payment QR code supplied by the organiser"
            className="h-44 w-44 bg-paper p-2 lg:col-span-3"
          />
        )}
      </div>
    </Section>
  );
}

/* 05 — ENTITLEMENTS ------------------------------------------------------- */
export function Entitlements() {
  const hasItems = eventConfig.entitlements.length > 0;

  return (
    <Section id="entitlements" index="05" title="Entitlements">
      {eventConfig.posters.entitlements ? (
        <Artwork src={eventConfig.posters.entitlements} alt="Official Witches Glow Run entitlements" />
      ) : (
        <MissingAsset what="entitlements artwork" />
      )}

      {hasItems && (
        <ul className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {eventConfig.entitlements.map((item, i) => (
            <li key={item.item} className="flex items-baseline gap-4 border-t border-[color:var(--rule)] py-5">
              <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <div className="font-display text-2xl">{item.item}</div>
                {item.detail && <p className="mt-1 text-sm text-paper/60">{item.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 max-w-[52ch] leading-relaxed text-paper/70">
        <Value field={eventConfig.entitlementNotes} />
      </p>
    </Section>
  );
}

/* 06 — THE NIGHT ---------------------------------------------------------- */
export function TheNight() {
  const hasSchedule = eventConfig.schedule.length > 0;

  return (
    <Section id="the-night" index="06" title="The night">
      {eventConfig.posters.tentative && (
        <div className="mb-14 lg:max-w-3xl">
          <Artwork src={eventConfig.posters.tentative} alt="Official Witches Glow Run schedule" />
        </div>
      )}

      {hasSchedule ? (
        <ol>
          {eventConfig.schedule.map((slot) => (
            <li
              key={`${slot.time}-${slot.activity}`}
              className="grid grid-cols-[5.5rem_1fr] items-baseline gap-6 border-t border-[color:var(--rule)] py-6 sm:grid-cols-[9rem_1fr]"
            >
              <time className="font-mono text-base text-gold sm:text-xl">{slot.time}</time>
              <div>
                <div className="display-lg">{slot.activity}</div>
                {slot.detail && <p className="mt-2 max-w-[48ch] text-paper/60">{slot.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <MissingAsset what="event schedule" />
      )}
    </Section>
  );
}

/* 07 — LUCKY DRAW --------------------------------------------------------- */
export function LuckyDraw() {
  const hasPrizes = eventConfig.luckyDraw.prizes.length > 0;

  return (
    <Section id="lucky-draw" index="07" title="Lucky draw">
      {eventConfig.posters.luckyDraw ? (
        <Artwork src={eventConfig.posters.luckyDraw} alt="Official Witches Glow Run lucky draw poster" />
      ) : (
        <MissingAsset what="lucky draw poster" />
      )}

      {hasPrizes && (
        <ul className="mt-12">
          {eventConfig.luckyDraw.prizes.map((prize, i) => (
            <li key={prize} className="flex items-baseline gap-5 border-t border-[color:var(--rule)] py-5">
              <span className="font-mono text-xs text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span className="display-lg">{prize}</span>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:max-w-3xl">
        <DataPoint label="Who qualifies" field={eventConfig.luckyDraw.eligibility} />
        <DataPoint label="Drawn at" field={eventConfig.luckyDraw.timing} />
      </dl>
    </Section>
  );
}

/* 09 — COMMUNITY ---------------------------------------------------------- */
export function Community({ registered }: { registered: boolean }) {
  const { inviteUrl, qrImage, visibility } = eventConfig.whatsapp;
  if (visibility === 'after_registration' && !registered) return null;

  return (
    <Section id="whatsapp" index="09" title="Before the night">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h3 className="display-lg">Join the group</h3>
          <p className="mt-5 max-w-[44ch] leading-relaxed text-paper/70">
            Announcements, reminders and last-minute changes go out on WhatsApp first.
          </p>
          {inviteUrl ? (
            <a href={inviteUrl} target="_blank" rel="noreferrer noopener" className="btn-gold mt-8">
              Join WhatsApp group
            </a>
          ) : (
            <div className="mt-8">
              <MissingAsset what="WhatsApp invitation link" />
            </div>
          )}
        </div>

        {qrImage && (
          <img
            src={qrImage}
            alt="QR code for the Witches Glow Run WhatsApp group"
            className="h-52 w-52 bg-paper p-2 lg:col-span-4 lg:col-start-9"
          />
        )}
      </div>
    </Section>
  );
}

/* FOOT -------------------------------------------------------------------- */
export function Footer() {
  const socials = [
    ['Instagram', eventConfig.social.instagram],
    ['TikTok', eventConfig.social.tiktok],
    ['Facebook', eventConfig.social.facebook],
  ] as const;

  return (
    <footer className="border-t border-[color:var(--rule)] pb-16 pt-20">
      <div className="shell">
        <div className="display-xl leading-[0.82]">Witches Glow Run</div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="tech">Organiser</h2>
            <p className="mt-3 text-sm text-paper/70">
              <Value field={eventConfig.organiser} />
            </p>
            <p className="mt-2 text-sm text-paper/70">
              <Value field={eventConfig.contactNumber} />
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="tech">Sections</h2>
            <ul className="mt-3 space-y-2 text-sm text-paper/70">
              <li><a href="#the-run" className="hover:text-gold">The run</a></li>
              <li><a href="#categories" className="hover:text-gold">Categories &amp; fees</a></li>
              <li><a href="#the-night" className="hover:text-gold">The night</a></li>
              <li><a href="#register" className="hover:text-gold">Register</a></li>
            </ul>
          </nav>

          <div>
            <h2 className="tech">Follow</h2>
            <ul className="mt-3 space-y-2 text-sm text-paper/70">
              {socials.map(([label, url]) =>
                url ? (
                  <li key={label}>
                    <a href={url} target="_blank" rel="noreferrer noopener" className="hover:text-gold">
                      {label}
                    </a>
                  </li>
                ) : (
                  <li key={label}>
                    {label} <span className="flag">missing</span>
                  </li>
                ),
              )}
            </ul>
          </div>

          <div>
            <h2 className="tech">Your data</h2>
            <p className="mt-3 max-w-[40ch] text-xs leading-relaxed text-paper/60">{eventConfig.privacyNotice}</p>
            <p className="mt-3 text-xs">
              <a href="#terms" className="text-gold hover:underline">
                Terms and conditions
              </a>
            </p>
          </div>
        </div>

        <div className="tech mt-16 flex flex-wrap justify-between gap-4 border-t border-[color:var(--rule)] pt-6">
          <span>© {new Date().getFullYear()} Witches Glow Run</span>
          <span>Universiti Malaya</span>
        </div>
      </div>
    </footer>
  );
}
