'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LogoLoading from './LogoLoading';

export default function RouteLoading() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    // const handleComplete = () => setIsLoading(false);

    // Route değişikliklerini dinle
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleStart);
      
      // Next.js router events (eğer varsa)
      const router = (window as unknown as { __NEXT_ROUTER_BASEPATH?: string }).__NEXT_ROUTER_BASEPATH;
      if (router) {
        // Router event listeners eklenebilir
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleStart);
      }
    };
  }, []);

  // Pathname değiştiğinde kısa bir loading göster
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <LogoLoading size={64} />
        <p className="text-sm text-muted-600 dark:text-muted-400">
          Sayfa yükleniyor...
        </p>
      </div>
    </div>
  );
}
