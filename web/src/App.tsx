import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Cover } from './components/Cover';
import { DebugOverlay } from './components/DebugOverlay';
import { MobileRegisterBar } from './components/MobileRegisterBar';
import { Categories, Community, Entitlements, Footer, LuckyDraw, Route, TheNight, TheRun } from './components/Sections';
import { RegistrationSection } from './components/Registration';
import { fetchEventStatus, type EventStatus, type RegistrationResult } from './lib/api';

export function App() {
  const [status, setStatus] = useState<EventStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [registration, setRegistration] = useState<RegistrationResult | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Diagnostics for real-device layout questions. Only when the URL has ?debug.
  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

  const registrationOpen = Boolean(status && status.registration.open && !status.registration.isFull);

  return (
    <>
      <a
        href="#register"
        className="sr-only focus:not-sr-only focus:absolute focus:left-5 focus:top-5 focus:z-[120] focus:bg-gold focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:uppercase focus:text-ink"
      >
        Skip to registration
      </a>

      <Header menuOpen={menuOpen} onMenuChange={setMenuOpen} />

      <main>
        <Cover status={status} />
        <TheRun />
        <Route />
        <Categories />
        <Entitlements />
        <TheNight />
        <LuckyDraw />
        <RegistrationSection
          status={status}
          loadFailed={loadFailed}
          registration={registration}
          onRegistered={setRegistration}
        />
        <Community registered={Boolean(registration)} />
      </main>

      <Footer />
      <MobileRegisterBar hidden={menuOpen || Boolean(registration) || !registrationOpen} />
      {debug && <DebugOverlay />}
    </>
  );
}
