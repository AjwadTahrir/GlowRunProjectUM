import { useEffect, useState } from 'react';

const LINKS = [
  { href: '#the-run', label: 'The run', index: '02' },
  { href: '#route', label: 'Route', index: '03' },
  { href: '#categories', label: 'Categories', index: '04' },
  { href: '#entitlements', label: 'Entitlements', index: '05' },
  { href: '#the-night', label: 'The night', index: '06' },
  { href: '#lucky-draw', label: 'Lucky draw', index: '07' },
  { href: '#register', label: 'Register', index: '08' },
];

export function Header({ menuOpen, onMenuChange }: { menuOpen: boolean; onMenuChange: (open: boolean) => void }) {
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onMenuChange(false);
    document.addEventListener('keydown', onKey);
    // The sheet is full screen, so the page behind it should not scroll.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen, onMenuChange]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-paper/15 bg-ink">
      <div className="shell flex h-full items-center justify-between gap-6">
        <a href="#top" className="display text-xl leading-none text-paper">
          Witches Glow Run
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-7 lg:flex">
          {LINKS.slice(0, -1).map((link) => (
            <a key={link.href} href={link.href} className="tech transition-colors hover:text-paper">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#register"
            className="hidden border border-gold px-4 py-2 font-mono text-xs font-medium uppercase tracking-[0.14em] text-gold transition-colors hover:bg-gold hover:text-ink sm:inline-block"
          >
            Register
          </a>
          <button
            type="button"
            className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-paper lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => onMenuChange(!menuOpen)}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Sections"
          className="fixed inset-x-0 bottom-0 top-14 overflow-y-auto bg-ink lg:hidden"
        >
          <ul className="shell py-6">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => onMenuChange(false)}
                  className="flex items-baseline gap-5 py-2 text-paper"
                >
                  <span className="figure w-8 text-sm text-gold">{link.index}</span>
                  <span className="display display-m">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
