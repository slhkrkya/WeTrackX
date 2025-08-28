'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';

export default function AccountsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const data = await AccountsAPI.list();
        setItems(data);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-dvh p-6">
        <p>Yükleniyor…</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hesaplar</h1>
        <a href="/accounts/new" className="border rounded px-3 py-1.5 text-sm">
          Yeni Hesap
        </a>
      </div>

      {err && <div className="text-sm border rounded p-3">{err}</div>}

      {/* Liste */}
      <div className="mt-2">
        {/* Dinamik import yerine doğrudan inline render: */}
        <div className="rounded-xl border overflow-hidden">
          <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[11px] opacity-60">
            <div>Ad</div>
            <div>Tür</div>
            <div>Para Birimi</div>
            <div>Oluşturma</div>
          </div>
          {items.length === 0 ? (
            <div className="p-4 text-sm opacity-70">Henüz hesap yok.</div>
          ) : (
            <ul className="divide-y">
              {items.map((a) => (
                <li key={a.id} className="grid grid-cols-4 gap-2 px-4 py-2 text-sm">
                  <div className="truncate">{a.name}</div>
                  <div>{a.type}</div>
                  <div>{a.currency}</div>
                  <div className="opacity-70">
                    {new Date(a.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}