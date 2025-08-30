'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import TopNav from '@/components/TopNav';
import { isAuthenticated, addAuthListener, removeAuthListener } from '@/lib/auth';

const HIDE_ON = ['/auth']; // Auth sayfalarında nav bar gizle

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [authStatus, setAuthStatus] = useState(false);
  
  const hideNav = HIDE_ON.some(p => pathname?.startsWith(p));
  
  // Anasayfa için özel kontrol
  const isHomePage = pathname === '/';
  const shouldShowNavOnHome = isHomePage && authStatus;

  useEffect(() => {
    setMounted(true);
    setAuthStatus(isAuthenticated());
  }, []);

  // Auth durumu değişikliklerini dinle
  useEffect(() => {
    if (!mounted) return;

    const handleAuthChange = (isAuth: boolean) => {
      setAuthStatus(isAuth);
    };

    // Auth listener'ı ekle
    addAuthListener(handleAuthChange);
    
    return () => {
      removeAuthListener(handleAuthChange);
    };
  }, [mounted]);

  // Hydration için mounted kontrolü
  if (!mounted) {
    return (
      <>
        {children}
      </>
    );
  }

  return (
    <>
      {(shouldShowNavOnHome || (!hideNav && !isHomePage)) && <TopNav />}
      {children}
    </>
  );
}