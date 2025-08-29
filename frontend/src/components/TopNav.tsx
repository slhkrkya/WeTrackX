'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuth } from '@/lib/auth';

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Hesaplar', href: '/accounts' },
  { label: 'Kategoriler', href: '/categories' },
  { label: 'İşlemler', href: '/transactions' },
  { label: 'Yeni İşlem', href: '/transactions/new' },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // /transactions altında her alt sayfayı aktif say
  function isActive(href: string) {
    if (href === '/transactions' && pathname?.startsWith('/transactions')) return true;
    return pathname === href;
  }

  function onLogout() {
    clearAuth();
    router.replace('/auth/login');
  }

  // Scroll gölgesi (okunabilirlik için)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Route değişince mobil menüyü kapat
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className={[
        'sticky top-0 z-40',
        'backdrop-blur supports-[backdrop-filter]:bg-[rgb(var(--card))]/60',
        'bg-[rgb(var(--card))]/80',
        'border-b border-black/10',
        // scroll olduğunda gölgeyi güçlendir
        'data-[scrolled=true]:shadow-sm',
      ].join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3">
        {/* Brand */}
        <Link href="/dashboard" className="font-semibold text-lg tracking-tight">
          WeTrackX
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-1"
          role="navigation"
          aria-label="Ana menü"
        >
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={[
                  'nav-link relative',
                  active ? 'nav-link-active text-foreground' : 'text-muted-foreground',
                  // focus-visible a11y
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-[rgb(var(--card))]',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span className="px-3 py-2 inline-block">{n.label}</span>
                {/* Active indicator */}
                <span
                  aria-hidden="true"
                  className={[
                    'pointer-events-none absolute left-2 right-2 -bottom-[2px] h-[2px] rounded-full',
                    active ? 'bg-[hsl(var(--primary))] opacity-100' : 'opacity-0',
                    'transition-opacity',
                  ].join(' ')}
                />
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onLogout}
            className="btn btn-outline h-9 px-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            Çıkış
          </button>
        </div>

        {/* Mobile toggler */}
        <button
          className="md:hidden btn btn-outline h-9 px-3"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menüyü aç/kapat"
          aria-expanded={open}
          aria-controls="mobile-nav"
        >
          Menü
        </button>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav"
        data-open={open ? 'true' : 'false'}
        className={[
          'md:hidden border-t border-black/10 overflow-hidden',
          // animasyon: height yerine max-h + opacity (transition-friendly)
          'transition-[max-height,opacity] duration-300 ease-out',
          open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
        ].join(' ')}
        aria-hidden={!open}
      >
        <nav className="mx-auto max-w-6xl px-4 py-2 flex flex-col gap-1" aria-label="Mobil menü">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={[
                  'nav-link rounded-md px-3 py-2',
                  active ? 'nav-link-active text-foreground' : 'text-muted-foreground',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                {n.label}
              </Link>
            );
          })}
          <button
            onClick={onLogout}
            className="btn btn-outline h-9 mt-1"
          >
            Çıkış
          </button>
        </nav>
      </div>
    </header>
  );
}