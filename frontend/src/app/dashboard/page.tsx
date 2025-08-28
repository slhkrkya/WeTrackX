'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BalanceCards from '@/components/dashboard/BalanceCards';
import MonthlySeriesChart from '@/components/dashboard/MonthlySeriesChart';
import CategoryTotals from '@/components/dashboard/CategoryTotals';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import { ReportsAPI, type BalanceItem, type MonthlyPoint, type CategoryTotal, type TxItem, type Cashflow } from '@/lib/reports';
import { clearAuth } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [series, setSeries] = useState<MonthlyPoint[]>([]);
  const [catIncome, setCatIncome] = useState<CategoryTotal[]>([]);
  const [catExpense, setCatExpense] = useState<CategoryTotal[]>([]);
  const [recent, setRecent] = useState<TxItem[]>([]);
  const [cashflow, setCashflow] = useState<Cashflow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // basit paralel çağrılar
        const [b, s, ci, ce, r, cf] = await Promise.all([
          ReportsAPI.balances(),
          ReportsAPI.monthlySeries(6),
          ReportsAPI.categoryTotals('INCOME'),
          ReportsAPI.categoryTotals('EXPENSE'),
          ReportsAPI.recentTransactions(10),
          ReportsAPI.cashflow(),
        ]);
        setBalances(b);
        setSeries(s);
        setCatIncome(ci);
        setCatExpense(ce);
        setRecent(r);
        setCashflow(cf);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
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
    <main className="min-h-dvh p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={onLogout} className="border rounded px-3 py-1.5 text-sm">Çıkış Yap</button>
      </div>

      {err && (
        <div className="text-sm border rounded p-3">{err}</div>
      )}

      {/* Hesap Bakiyeleri */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Hesap Bakiyeleri</h2>
        <BalanceCards items={balances} />
      </section>

      {/* Aylık Seri */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Aylık Seri (6 Ay)</h2>
        <MonthlySeriesChart data={series} />
      </section>

      {/* Kategoriler */}
      <section className="grid gap-4 lg:grid-cols-2">
        <CategoryTotals title="Gelir Kategorileri" items={catIncome} />
        <CategoryTotals title="Gider Kategorileri" items={catExpense} />
      </section>

      {/* Nakit Akışı (özet) */}
      {cashflow && (
        <section className="rounded-xl border p-4">
          <h2 className="text-lg font-semibold mb-2">Nakit Akışı (Toplam)</h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <div className="opacity-60">Gelir</div>
              <div className="text-base font-semibold">{Number(cashflow.income).toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="opacity-60">Gider</div>
              <div className="text-base font-semibold">{Number(cashflow.expense).toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="opacity-60">Net</div>
              <div className="text-base font-semibold">{Number(cashflow.net).toFixed(2)}</div>
            </div>
          </div>
        </section>
      )}

      {/* Son İşlemler */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Son İşlemler</h2>
        <RecentTransactions items={recent} />
      </section>
    </main>
  );
}