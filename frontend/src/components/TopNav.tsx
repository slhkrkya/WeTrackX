'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
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

  function isActive(href: string) {
    if (href === '/transactions' && pathname?.startsWith('/transactions')) return true;
    return pathname === href;
  }

  function onLogout() {
    clearAuth();
    router.replace('/auth/login');
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-3">
        {/* Brand */}
        <a href="/dashboard" className="font-semibold text-lg">WeTrackX</a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className={`rounded px-3 py-1.5 text-sm border
                ${isActive(n.href) ? 'bg-black/5 dark:bg-white/10' : 'opacity-80 hover:opacity-100'}`}
            >
              {n.label}
            </a>
          ))}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button onClick={onLogout} className="rounded px-3 py-1.5 text-sm border">
            Çıkış
          </button>
        </div>

        {/* Mobile toggler */}
        <button
          className="md:hidden rounded px-3 py-1.5 text-sm border"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menüyü aç/kapat"
        >
          Menü
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t">
          <nav className="mx-auto max-w-6xl px-4 py-2 flex flex-col gap-2">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`rounded px-3 py-2 text-sm border
                  ${isActive(n.href) ? 'bg-black/5 dark:bg-white/10' : 'opacity-80 hover:opacity-100'}`}
              >
                {n.label}
              </a>
            ))}
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="rounded px-3 py-2 text-sm border text-left"
            >
              Çıkış
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}