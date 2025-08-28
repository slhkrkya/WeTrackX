'use client';

import { usePathname } from 'next/navigation';
import TopNav from '@/components/TopNav';

const HIDE_ON = ['/auth']; // gerekirse '/public', '/onboarding' vs. eklenebilir

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_ON.some(p => pathname?.startsWith(p));

  return (
    <>
      {!hideNav && <TopNav />}
      {children}
    </>
  );
}