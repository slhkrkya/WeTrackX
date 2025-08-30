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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // /transactions altında her alt sayfayı aktif say
  function isActive(href: string) {
    if (href === '/transactions' && pathname?.startsWith('/transactions')) return true;
    if (href === '/profile' && pathname?.startsWith('/profile')) return true;
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

  // Profil dropdown'ını dışarı tıklayınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.profile-dropdown')) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          {/* Profil Dropdown */}
          <div className="relative profile-dropdown">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={[
                'btn btn-outline h-9 px-3 flex items-center gap-2',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
                isActive('/profile') ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]' : '',
              ].join(' ')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profil
              <svg className={`w-4 h-4 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[rgb(var(--card))] border border-black/10 rounded-lg shadow-lg py-1 z-50">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  Profil Bilgileri
                </Link>
                <Link
                  href="/profile/edit"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  Profil Düzenle
                </Link>
                <Link
                  href="/profile/change-password"
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  Şifre Değiştir
                </Link>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={onLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Çıkış Yap
                </button>
              </div>
            )}
          </div>
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
          <Link
            href="/profile"
            className={[
              'nav-link rounded-md px-3 py-2',
              isActive('/profile') ? 'nav-link-active text-foreground' : 'text-muted-foreground',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
            ].join(' ')}
            aria-current={isActive('/profile') ? 'page' : undefined}
          >
            Profil
          </Link>
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