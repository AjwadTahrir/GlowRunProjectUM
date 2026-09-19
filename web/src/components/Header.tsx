import { useEffect } from 'react';

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
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--header-h)] bg-ink pt-[var(--safe-top)]">
      <div className="shell flex h-full items-center justify-between gap-6">
        <a href="#top" className="flex items-baseline gap-[0.3em] text-[1.35rem] leading-none text-paper">
          <span className="display">Witches</span>
          <span className="wide text-gold">Glow</span>
          <span className="display">Run</span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-7 xl:flex">
          {LINKS.slice(0, -1).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-paper/85 transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="#register"
            className="wide hidden bg-gold px-4 py-2 text-sm text-ink transition-colors hover:bg-paper sm:inline-block"
          >
            Register
          </a>
          <button
            type="button"
            className="font-mono text-xs font-medium uppercase tracking-[0.12em] text-paper xl:hidden"
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
          className="fixed inset-x-0 bottom-0 top-[var(--header-h)] overflow-y-auto bg-purple xl:hidden"
        >
          <ul className="shell relative pb-[calc(2rem+var(--safe-bottom))] pt-8">
            {LINKS.map((link, i) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => onMenuChange(false)}
                  className="flex items-baseline gap-5 py-1.5 text-paper"
                >
                  <span className="figure w-8 text-sm text-gold">{link.index}</span>
                  <span className={`${i % 2 === 0 ? 'display' : 'wide'} text-[clamp(2.5rem,11vw,3.75rem)] leading-none ${
                    link.label === 'Register' ? 'text-gold' : ''
                  }`}
                  >
                    {link.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
