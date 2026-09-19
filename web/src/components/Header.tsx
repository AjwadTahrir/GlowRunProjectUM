import { useEffect, useState } from 'react';

const LINKS = [
  { href: '#the-run', label: 'The run', index: '02' },
  { href: '#route', label: 'Route', index: '03' },
  { href: '#categories', label: 'Categories', index: '04' },
  { href: '#entitlements', label: 'Entitlements', index: '05' },
  { href: '#the-night', label: 'The night', index: '06' },
  { href: '#lucky-draw', label: 'Lucky draw', index: '07' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--rule)] bg-ink/92 backdrop-blur-[2px]">
      <div className="shell flex h-14 items-center justify-between gap-6">
        <a href="#top" className="font-mono text-xs uppercase tracking-[0.2em] text-paper">
          Witches Glow Run
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-7 lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="tech transition-colors hover:text-paper">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a href="#register" className="tech-gold hidden sm:inline">
            Register →
          </a>
          <button
            type="button"
            className="tech lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Sections" className="border-t border-[color:var(--rule)] bg-ink lg:hidden">
          <ul className="shell py-3">
            {[...LINKS, { href: '#register', label: 'Register', index: '08' }].map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-4 border-b border-[color:var(--rule)] py-4"
                >
                  <span className="tech-gold">{link.index}</span>
                  <span className="font-display text-2xl">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
