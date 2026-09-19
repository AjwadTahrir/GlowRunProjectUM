import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Categories, Entitlements, EventDetails, Footer, LuckyDraw, RunRoute, Tentative, WhatsAppSection } from './components/Sections';
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
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-glow focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to registration
      </a>

      <Header />

      <main>
        <Hero status={status} />
        <EventDetails />
        <RunRoute />
        <Categories />
        <Tentative />
        <Entitlements />
        <LuckyDraw />

        <Section
          id="register"
          title={registration ? 'Registration complete' : 'Register'}
          lede={
            registration
              ? undefined
              : 'Pay first, then fill this in. You will need your receipt and, for UM students, your matriculation number.'
          }
        >
          {registration ? (
            <Confirmation registration={registration} />
          ) : loadFailed ? (
            <p className="panel border-red-400/40 text-red-200" role="alert">
              We could not load registration availability. Reload the page — registrations are not being accepted
              until we can confirm how many places are left.
            </p>
          ) : (
            <RegistrationForm status={status} onRegistered={setRegistration} />
          )}
        </Section>

        <WhatsAppSection registered={Boolean(registration)} />
      </main>

      <Footer />
    </>
  );
}
