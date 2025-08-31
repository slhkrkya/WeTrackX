'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { ReportsAPI, type BalanceItem } from '@/lib/reports';
import AccountCards from '@/components/accounts/AccountCards';

function LoadingSkeleton() {
  // Kart skeleton'ları
  const cards = Array.from({ length: 4 });
  return (
    <div className="reveal space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        ))}
      </div>
      <div className="h-24 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
    </div>
  );
}

export default function AccountsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AccountDTO[]>([]);
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const [accountsData, balancesData] = await Promise.all([
          AccountsAPI.list(),
          ReportsAPI.balances(),
        ]);
        setItems(accountsData);
        setBalances(balancesData);
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
        <div>
          <h1 className="text-2xl font-bold">Hesaplar</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Finansal hesaplarınızı görüntüleyin ve yönetin
          </p>
        </div>
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
      ) : (
        <AccountCards 
          items={items} 
          balances={balances}
          onDelete={(id) => {
            setItems(items.filter(item => item.id !== id));
          }}
          onRestore={async (id) => {
            // Hesap geri yüklendiğinde listeyi yenile
            try {
              const [accountsData, balancesData] = await Promise.all([
                AccountsAPI.list(),
                ReportsAPI.balances(),
              ]);
              setItems(accountsData);
              setBalances(balancesData);
            } catch (e: unknown) {
              console.error('Hesap listesi yenilenirken hata:', e);
            }
          }}
        />
      )}
    </main>
  );
}