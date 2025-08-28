'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearAuth, getUser } from '@/lib/auth';

type MeRes = { user?: { userId: string; email: string } };

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeRes | null>(null);
  const localUser = getUser();

  useEffect(() => {
    (async () => {
      try {
        const res = await api<MeRes>('/auth/me');
        setMe(res);
      } catch {
        // Token geçersizse login'e yönlendir
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function onLogout() {
    clearAuth();
    router.replace('/auth/login');
  }

  if (loading) {
    return (
      <main className="min-h-dvh p-6">
        <p>Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={onLogout} className="border rounded px-3 py-1.5">
          Çıkış Yap
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-sm">Backend doğrulaması (auth/me):</p>
        <pre className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded">
          {JSON.stringify(me, null, 2)}
        </pre>
      </div>

      {localUser && (
        <div className="space-y-2">
          <p className="text-sm">Local user (login/register yanıtından):</p>
          <pre className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded">
            {JSON.stringify(localUser, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}