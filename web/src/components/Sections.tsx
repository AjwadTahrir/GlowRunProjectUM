import { Gift, MessageCircle, Sparkles, Ticket } from 'lucide-react';
import { eventConfig } from '../config/event';
import { Detail, MissingAsset, PosterFrame, Section } from './ui';

export function EventDetails() {
  return (
    <Section id="details" title="Event details" lede="Everything the organiser has confirmed so far.">
      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Detail label="Date" field={eventConfig.date} />
        <Detail label="Time" field={eventConfig.time} />
        <Detail label="Venue" field={eventConfig.venue} />
        <Detail label="Distance" field={eventConfig.distance} />
        <Detail label="Organiser" field={eventConfig.organiser} />
        <Detail label="Contact" field={eventConfig.contactNumber} />
      </dl>
    </Section>
  );
}

export function RunRoute() {
  return (
    <Section id="route" title="Run route" lede="Where you start, where you finish, and what is in between.">
      {eventConfig.posters.route ? (
        <PosterFrame
          src={eventConfig.posters.route}
          alt="Witches Glow Run official route map"
          caption="Tap the map to open it full size."
        />
      ) : (
        <MissingAsset what="official route map" />
      )}

      <p className="lede mt-6">
        {eventConfig.route.description.confirmed ? (
          eventConfig.route.description.value
        ) : (
          <span className="placeholder-flag">Route details not confirmed</span>
        )}
      </p>
    </Section>
  );
}

export function Categories() {
  return (
    <Section
      id="categories"
      title="Categories and fees"
      lede="Pick the category you qualify for. You will need it again on the registration form."
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {eventConfig.categories.map((category) => (
          <li key={category.id} className="panel flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-display text-xl font-semibold text-white">{category.label}</h3>
              <span className="text-lg text-glow">
                {category.fee.confirmed ? category.fee.value : <span className="placeholder-flag">Fee not set</span>}
              </span>
            </div>
            <p className="text-sm text-violet-mist">{category.eligibility}</p>
          </li>
        ))}
      </ul>

      <div className="panel mt-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <Ticket aria-hidden className="h-5 w-5 text-glow" />
          How to pay
        </h3>
        <p className="mt-2 text-violet-mist">
          {eventConfig.payment.instructions.confirmed ? (
            eventConfig.payment.instructions.value
          ) : (
            <span className="placeholder-flag">Payment details not supplied</span>
          )}
        </p>
        {eventConfig.payment.qrImage && (
          <img
            src={eventConfig.payment.qrImage}
            alt="Payment QR code supplied by the organiser"
            className="mt-4 h-48 w-48 rounded-xl bg-white p-2"
          />
        )}
        <p className="mt-4 text-sm text-violet-mist">
          Pay first, then upload your receipt as part of the registration form below.
        </p>
      </div>
    </Section>
  );
}

export function Tentative() {
  const hasSchedule = eventConfig.schedule.length > 0;

  return (
    <Section id="tentative" title="Event tentative" lede="The running order on the night.">
      {eventConfig.posters.tentative && (
        <div className="mb-8">
          <PosterFrame src={eventConfig.posters.tentative} alt="Witches Glow Run official schedule poster" />
        </div>
      )}

      {hasSchedule ? (
        // A timeline is a sequence, which is the one case where a rail and markers
        // carry information rather than decorate.
        <ol className="relative border-l border-white/15 pl-6">
          {eventConfig.schedule.map((slot) => (
            <li key={`${slot.time}-${slot.activity}`} className="relative pb-8 last:pb-0">
              <span
                aria-hidden
                className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full bg-glow"
              />
              <div className="font-display text-lg text-glow">{slot.time}</div>
              <div className="text-white">{slot.activity}</div>
              {slot.detail && <p className="mt-1 text-sm text-violet-mist">{slot.detail}</p>}
            </li>
          ))}
        </ol>
      ) : (
        <MissingAsset what="event schedule" />
      )}
    </Section>
  );
}

export function Entitlements() {
  const hasItems = eventConfig.entitlements.length > 0;

  return (
    <Section id="entitlements" title="What you get" lede="Confirmed inclusions for every registered participant.">
      {eventConfig.posters.entitlements && (
        <div className="mb-8">
          <PosterFrame src={eventConfig.posters.entitlements} alt="Witches Glow Run official entitlements poster" />
        </div>
      )}

      {hasItems ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventConfig.entitlements.map((item) => (
            <li key={item.item} className="panel">
              <h3 className="flex items-center gap-2 text-white">
                <Gift aria-hidden className="h-4 w-4 text-glow" />
                {item.item}
              </h3>
              {item.detail && <p className="mt-1 text-sm text-violet-mist">{item.detail}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <MissingAsset what="entitlement list" />
      )}

      <p className="lede mt-6">
        {eventConfig.entitlementNotes.confirmed ? (
          eventConfig.entitlementNotes.value
        ) : (
          <span className="placeholder-flag">Inclusions and exclusions not confirmed</span>
        )}
      </p>
    </Section>
  );
}

export function LuckyDraw() {
  const hasPrizes = eventConfig.luckyDraw.prizes.length > 0;

  return (
    <Section id="lucky-draw" title="Lucky draw" lede="Prizes drawn on the night.">
      {eventConfig.posters.luckyDraw && (
        <div className="mb-8">
          <PosterFrame src={eventConfig.posters.luckyDraw} alt="Witches Glow Run official lucky draw poster" />
        </div>
      )}

      {hasPrizes ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {eventConfig.luckyDraw.prizes.map((prize) => (
            <li key={prize} className="panel flex items-center gap-2 text-white">
              <Sparkles aria-hidden className="h-4 w-4 text-glow" />
              {prize}
            </li>
          ))}
        </ul>
      ) : (
        <MissingAsset what="lucky draw prize list" />
      )}

      <dl className="mt-6 grid gap-6 sm:grid-cols-2">
        <Detail label="Who qualifies" field={eventConfig.luckyDraw.eligibility} />
        <Detail label="When it happens" field={eventConfig.luckyDraw.timing} />
      </dl>
    </Section>
  );
}

/**
 * The organiser decides whether the group is public or only shown to registered
 * participants. Default is after registration.
 */
export function WhatsAppSection({ registered }: { registered: boolean }) {
  const { inviteUrl, qrImage, visibility } = eventConfig.whatsapp;
  if (visibility === 'after_registration' && !registered) return null;

  return (
    <Section
      id="whatsapp"
      title="Event WhatsApp group"
      lede="Announcements, reminders and last-minute changes go out here first."
    >
      {inviteUrl ? (
        <div className="panel flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {qrImage && (
            <img src={qrImage} alt="QR code for the Witches Glow Run WhatsApp group" className="h-40 w-40 rounded-xl bg-white p-2" />
          )}
          <div>
            <p className="text-violet-mist">
              Join the group for event announcements and updates. On a phone, the button opens WhatsApp directly.
            </p>
            <a href={inviteUrl} target="_blank" rel="noreferrer noopener" className="btn-primary mt-4">
              <MessageCircle aria-hidden className="h-5 w-5" />
              Join WhatsApp group
            </a>
          </div>
        </div>
      ) : (
        <MissingAsset what="WhatsApp group link or QR code" />
      )}
    </Section>
  );
}

export function Footer() {
  const socials = [
    ['Instagram', eventConfig.social.instagram],
    ['TikTok', eventConfig.social.tiktok],
    ['Facebook', eventConfig.social.facebook],
  ] as const;

  return (
    <footer className="border-t border-white/10 bg-ink py-14">
      <div className="shell grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-xl font-semibold text-white">Witches Glow Run</div>
          <p className="mt-2 text-sm text-violet-mist">
            {eventConfig.organiser.confirmed ? (
              eventConfig.organiser.value
            ) : (
              <span className="placeholder-flag">Organiser not confirmed</span>
            )}
          </p>
        </div>

        <nav aria-label="Footer">
          <h2 className="text-sm font-medium text-white">Sections</h2>
          <ul className="mt-3 space-y-2 text-sm text-violet-mist">
            <li><a href="#details" className="hover:text-white">Event details</a></li>
            <li><a href="#categories" className="hover:text-white">Categories and fees</a></li>
            <li><a href="#tentative" className="hover:text-white">Tentative</a></li>
            <li><a href="#register" className="hover:text-white">Register</a></li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-medium text-white">Contact</h2>
          <p className="mt-3 text-sm text-violet-mist">
            {eventConfig.contactNumber.confirmed ? (
              eventConfig.contactNumber.value
            ) : (
              <span className="placeholder-flag">Contact number not confirmed</span>
            )}
          </p>
          <ul className="mt-3 space-y-2 text-sm text-violet-mist">
            {socials.map(([label, url]) =>
              url ? (
                <li key={label}>
                  <a href={url} target="_blank" rel="noreferrer noopener" className="hover:text-white">
                    {label}
                  </a>
                </li>
              ) : (
                <li key={label}>
                  {label} <span className="placeholder-flag">link missing</span>
                </li>
              ),
            )}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-medium text-white">Your data</h2>
          <p className="mt-3 max-w-prose text-sm text-violet-mist">{eventConfig.privacyNotice}</p>
          <p className="mt-3 text-sm">
            <a href="#terms" className="text-glow hover:underline">
              Terms and conditions
            </a>
          </p>
        </div>
      </div>

      <div className="shell mt-10 border-t border-white/10 pt-6 text-sm text-violet-mist">
        © {new Date().getFullYear()} Witches Glow Run.
      </div>
    </footer>
  );
}
