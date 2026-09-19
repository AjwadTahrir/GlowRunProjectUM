import { useEffect, useState } from 'react';
import { FinishFlag } from './Graphics';

/**
 * On a phone the Register button on the cover scrolls away long before anyone has
 * finished reading. This keeps the one action reachable, and gets out of the way
 * while the cover or the form itself is on screen.
 */
export function MobileRegisterBar({ hidden }: { hidden: boolean }) {
  const [onScreen, setOnScreen] = useState<Record<string, boolean>>({ top: true, register: false });

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      setOnScreen((current) => {
        const next = { ...current };
        for (const entry of entries) next[entry.target.id] = entry.isIntersecting;
        return next;
      });
    });
    for (const id of ['top', 'register']) {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    }
    return () => observer.disconnect();
  }, []);

  if (hidden || onScreen.top || onScreen.register) return null;

  return (
    <a
      href="#register"
      className="wide fixed inset-x-0 bottom-0 z-40 flex h-[calc(3.5rem+var(--safe-bottom))] items-center justify-center gap-3 bg-gold pb-[var(--safe-bottom)] text-base text-ink md:hidden"
    >
      Register
      <FinishFlag size={18} className="border border-ink" />
    </a>
  );
}
