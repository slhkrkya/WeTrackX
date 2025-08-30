'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import AccountsList from '@/components/accounts/AccountsList';

function LoadingSkeleton() {
  // 4 satırlık basit skeleton
  const rows = Array.from({ length: 4 });
  return (
    <div className="reveal card overflow-hidden">
      <div className="hidden md:grid grid-cols-5 gap-2 px-4 py-2 text-[11px] label-soft">
        <div>Ad</div>
        <div>Tür</div>
        <div>Para Birimi</div>
        <div>Oluşturma</div>
        <div className="text-right">İşlemler</div>
      </div>
      <ul className="divide-y">
        {rows.map((_, i) => (
          <li key={i} className="grid md:grid-cols-5 grid-cols-1 gap-2 px-3 sm:px-4 py-3 sm:py-2">
            <div className="h-6 sm:h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="hidden md:block h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="hidden md:block h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  );
}

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
        // Yetkisiz ise login'e yönlendir
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık + Aksiyon */}
      <div className="reveal flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Hesaplar</h1>
        <Link href="/accounts/new" className="btn btn-primary h-9">
          Yeni Hesap
        </Link>
      </div>

      {/* Hata */}
      {err && (
        <div className="reveal card ring-1 ring-[rgb(var(--error))]/25">
          <p className="text-sm text-[rgb(var(--error))]">
            {err}
          </p>
        </div>
      )}

      {/* İçerik */}
      {loading ? (
        <LoadingSkeleton />
      ) : items.length === 0 ? (
        <div className="reveal card text-sm">
          Henüz hesap yok. Sağ üstten <span className="font-medium">“Yeni Hesap”</span> oluşturabilirsin.
        </div>
      ) : (
        <AccountsList 
          items={items} 
          onDelete={(id) => {
            setItems(items.filter(item => item.id !== id));
          }}
        />
      )}
    </main>
  );
}