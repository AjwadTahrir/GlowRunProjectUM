import type { EventStatus, RegistrationResult } from '../lib/api';
import { Confirmation } from './Confirmation';
import { Sparkle, Stars, type StarSpec } from './Graphics';
import { RegistrationForm } from './RegistrationForm';
import { SectionShell, Title } from './ui';

const STARS: StarSpec[] = [
  { x: 96, y: 5, s: 30, c: 'gold', twinkle: 1 },
  { x: 3, y: 14, s: 20, c: 'lavender' },
  { x: 60, y: 3, s: 7, c: 'paper', kind: 'dot' },
];

/**
 * 08  REGISTRATION. The entry document. The form stays plain and legible because this
 * is where usability matters most; the energy is in the heading and the live bib.
 * The capacity counter is a big numeral, and it comes from the server, never from
 * the browser.
 */
export function RegistrationSection({
  status,
  loadFailed,
  registration,
  onRegistered,
}: {
  status: EventStatus | null;
  loadFailed: boolean;
  registration: RegistrationResult | null;
  onRegistered: (result: RegistrationResult) => void;
}) {
  const places = status?.registration;

  return (
    <SectionShell id="register" className="overflow-hidden py-24 md:py-36">
      <Stars items={STARS} />
      <div className="shell relative">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          {registration ? (
            <Title id="register" index="08" className="wide text-[clamp(3.5rem,11vw,10rem)] leading-[0.84] text-gold">
              You&rsquo;re in
            </Title>
          ) : (
            <Title id="register" index="08" className="display text-[clamp(3.5rem,10.5vw,9.5rem)] text-paper">
              Registration
            </Title>
          )}

          {/* Reserved height, so the page does not jump when the count arrives. */}
          <div className="min-h-[5.5rem] text-right" aria-live="polite">
            {places && !registration && (
              <>
                <div className="display text-[clamp(3rem,6vw,5rem)] leading-[0.85] text-gold">
                  {places.maxCapacity - places.placesRemaining}
                  <span className="text-lavender"> / {places.maxCapacity}</span>
                </div>
                <div className="tech mt-2">{places.isFull ? 'Full' : 'Places taken'}</div>
              </>
            )}
          </div>
        </div>

        <div className="mt-14 md:mt-20">
          {registration ? (
            <Confirmation registration={registration} />
          ) : loadFailed ? (
            <p className="border-l-4 border-signal py-2 pl-4 text-base font-semibold text-signal" role="alert">
              Registration availability could not be loaded. Reload the page. Registrations are not being accepted
              until the number of remaining places can be confirmed.
            </p>
          ) : (
            <RegistrationForm status={status} onRegistered={onRegistered} />
          )}
        </div>
        <Sparkle size={36} color="var(--lavender)" className="twinkle twinkle-3 absolute -bottom-6 right-[4%] hidden md:block" />
      </div>
    </SectionShell>
  );
}
