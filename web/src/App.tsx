import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Cover } from './components/Cover';
import { Categories, Community, Entitlements, Footer, LuckyDraw, Route, TheNight, TheRun } from './components/Sections';
import { RegistrationForm } from './components/RegistrationForm';
import { Confirmation } from './components/Confirmation';
import { Section } from './components/ui';
import { fetchEventStatus, type EventStatus, type RegistrationResult } from './lib/api';

export function App() {
  const [status, setStatus] = useState<EventStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [registration, setRegistration] = useState<RegistrationResult | null>(null);

  // Availability comes from the server on load, and again after every acceptance.
  useEffect(() => {
    let cancelled = false;
    fetchEventStatus()
      .then((next) => !cancelled && setStatus(next))
      .catch(() => !cancelled && setLoadFailed(true));
    return () => {
      cancelled = true;
    };
  }, [registration]);

  return (
    <>
      <a
        href="#register"
        className="sr-only focus:not-sr-only focus:absolute focus:left-5 focus:top-5 focus:z-[120] focus:bg-gold focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:text-ink"
      >
        Skip to registration
      </a>

      <Header />

      <main>
        <Cover status={status} />
        <TheRun />
        <Route />
        <Categories />
        <Entitlements />
        <TheNight />
        <LuckyDraw />

        <Section id="register" index="08" title={registration ? 'Registered' : 'Registration'}>
          {registration ? (
            <Confirmation registration={registration} />
          ) : loadFailed ? (
            <p className="border-l-2 border-red-400 py-2 pl-4 font-mono text-sm text-red-300" role="alert">
              Registration availability could not be loaded. Reload the page — registrations are not being
              accepted until the number of remaining places can be confirmed.
            </p>
          ) : (
            <>
              {status && !status.registration.isFull && status.registration.open && (
                <p className="mb-12 font-mono text-sm uppercase tracking-[0.18em] text-gold">
                  {status.registration.maxCapacity - status.registration.placesRemaining} /{' '}
                  {status.registration.maxCapacity} participants
                </p>
              )}
              <RegistrationForm status={status} onRegistered={setRegistration} />
            </>
          )}
        </Section>

        <Community registered={Boolean(registration)} />
      </main>

      <Footer />
    </>
  );
}
