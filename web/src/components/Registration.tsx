import type { EventStatus, RegistrationResult } from '../lib/api';
import { Confirmation } from './Confirmation';
import { RegistrationForm } from './RegistrationForm';
import { SectionShell, Title } from './ui';

/**
 * 08  REGISTRATION: the entry document. The capacity counter is set as a big
 * numeral because it is the most useful number on the page, and it comes from
 * the server, never from the browser.
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
    <SectionShell id="register" tone="purple" className="py-24 md:py-36">
      <div className="shell">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <Title id="register" index="08" size="r">
            {registration ? 'Registered' : 'Registration'}
          </Title>

          {/* Reserved height, so the page does not jump when the count arrives. */}
          <div className="min-h-[5.5rem] text-right" aria-live="polite">
            {places && !registration && (
              <>
                <div className="display text-[clamp(3rem,6vw,5rem)] leading-[0.85] text-gold">
                  {places.maxCapacity - places.placesRemaining}
                  <span className="text-paper/40"> / {places.maxCapacity}</span>
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
            <p className="border-l-4 border-signal py-2 pl-4 text-base font-medium text-signal" role="alert">
              Registration availability could not be loaded. Reload the page. Registrations are not being accepted
              until the number of remaining places can be confirmed.
            </p>
          ) : (
            <RegistrationForm status={status} onRegistered={onRegistered} />
          )}
        </div>
      </div>
    </SectionShell>
  );
}
