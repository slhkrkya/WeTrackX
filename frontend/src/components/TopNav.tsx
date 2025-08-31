'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearAuth } from '@/lib/auth';

type NavItem = { label: string; href: string };

const NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Kategoriler', href: '/categories' },
  { label: 'İşlemler', href: '/transactions' },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // /transactions altında her alt sayfayı aktif say, ama /transactions/new hariç
  function isActive(href: string) {
    if (href === '/transactions' && pathname?.startsWith('/transactions') && pathname !== '/transactions/new') return true;
    if (href === '/profile' && pathname?.startsWith('/profile')) return true;
    return pathname === href;
  }

  function onLogout() {
    clearAuth();
    router.replace('/'); // Anasayfaya yönlendir
  }

  // Hydration sorununu önlemek için mounted state'i
  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll gölgesi (okunabilirlik için)
  useEffect(() => {
    if (!mounted) return;
    
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mounted]);

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
      data-scrolled={mounted && scrolled ? 'true' : 'false'}
      className={[
        'sticky top-0 z-40',
        'backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/80',
        'bg-white/90 dark:bg-gray-900/90',
        'border-b border-gray-200 dark:border-gray-700',
        // scroll olduğunda gölgeyi güçlendir
        'data-[scrolled=true]:shadow-lg data-[scrolled=true]:shadow-blue-500/10',
      ].join(' ')}
    >
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        {/* Brand */}
        <Link href="/" className="font-bold text-2xl md:text-3xl tracking-tight gradient-text mr-6">
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
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  active 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                  // focus-visible a11y
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                {n.label}
              </Link>
            );
          })}
          
          {/* Yeni İşlem Ekle Butonu */}
          <Link
            href="/transactions/new"
            className="inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-500 hover:text-white text-gray-600 dark:text-gray-300 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-110 active:scale-95"
            title="Yeni işlem ekle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Link>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile Dropdown */}
        <div className="hidden md:block relative profile-dropdown">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span>Profil</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setProfileDropdownOpen(false)}
              >
                Profil Yönetimi
              </Link>
              <hr className="my-1 border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => {
                  setProfileDropdownOpen(false);
                  onLogout();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Çıkış Yap
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          aria-label="Menüyü aç/kapat"
          aria-expanded={open}
        >
          <svg className="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-in slide-in-from-top-2 duration-200">
          <nav className="px-4 py-2 space-y-1">
            {NAV.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={[
                    'block px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    active 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                  ].join(' ')}
                  aria-current={active ? 'page' : undefined}
                >
                  {n.label}
                </Link>
              );
            })}
            
            {/* Yeni İşlem Ekle Butonu - Mobil */}
            <Link
              href="/transactions/new"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-500 hover:text-white text-gray-600 dark:text-gray-300 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Yeni İşlem
            </Link>
            <hr className="my-2 border-gray-200 dark:border-gray-700" />
            <Link
              href="/profile"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all duration-200"
            >
              Profil
            </Link>
            <button
              onClick={onLogout}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
            >
              Çıkış Yap
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}