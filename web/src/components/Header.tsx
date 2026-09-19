import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

const LINKS = [
  { href: '#top', label: 'Home' },
  { href: '#details', label: 'Event details' },
  { href: '#route', label: 'Run route' },
  { href: '#categories', label: 'Categories & fees' },
  { href: '#tentative', label: 'Tentative' },
  { href: '#entitlements', label: 'Entitlements' },
  { href: '#lucky-draw', label: 'Lucky draw' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  // Escape closes the menu, matching what the button does.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <a href="#top" className="font-display text-lg font-semibold tracking-tight text-white">
          Witches Glow Run
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-6 lg:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-violet-mist transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href="#register" className="btn-primary hidden !px-5 !py-2 text-sm sm:inline-flex">
            Register now
          </a>
          <button
            type="button"
            className="rounded-lg border border-white/20 p-2 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Sections" className="border-t border-white/10 bg-ink lg:hidden">
          <ul className="shell py-2">
            {[...LINKS, { href: '#register', label: 'Register' }].map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/5 py-3.5 text-base text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
