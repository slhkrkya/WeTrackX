'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BalanceCards from '@/components/dashboard/BalanceCards';
import MonthlySeriesChart from '@/components/dashboard/MonthlySeriesChart';
import CategoryTotals from '@/components/dashboard/CategoryTotals';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import {
  ReportsAPI,
  type BalanceItem,
  type CategoryTotal,
  type TxItem,
  type Cashflow,
} from '@/lib/reports';
import { clearAuth } from '@/lib/auth';
import { fmtMoney } from '@/lib/format';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [catIncome, setCatIncome] = useState<CategoryTotal[]>([]);
  const [catExpense, setCatExpense] = useState<CategoryTotal[]>([]);
  const [recent, setRecent] = useState<TxItem[]>([]);
  const [cashflow, setCashflow] = useState<Cashflow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, ci, ce, r, cf] = await Promise.all([
          ReportsAPI.balances(),
          ReportsAPI.categoryTotals('INCOME'),
          ReportsAPI.categoryTotals('EXPENSE'),
          ReportsAPI.recentTransactions(10),
          ReportsAPI.cashflow(),
        ]);
        setBalances(b);
        setCatIncome(ci);
        setCatExpense(ce);
        setRecent(r.items);
        setCashflow(cf);
        
        // Hesap kontrolü - eğer hesap yoksa kullanıcıya bilgi ver
        if (b.length === 0) {
          setErr('Henüz hesabınız bulunmuyor. İşlem yapabilmek için önce hesap oluşturun.');
        }
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

  // Para birimini balances'tan türet (yoksa TRY)
  const baseCurrency = balances[0]?.currency ?? 'TRY';

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık + Aksiyon */}
      <div className="reveal flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={onLogout} className="btn btn-outline h-9">
          Çıkış Yap
        </button>
      </div>

      {/* Hata */}
      {err && (
        <div className="reveal card border border-[rgb(var(--error))]/30">
          <p className="text-sm" style={{ color: 'rgb(var(--error))' }}>
            {err}
          </p>
          {balances.length === 0 && (
            <div className="mt-3">
              <button 
                onClick={() => router.push('/accounts/new')} 
                className="btn btn-primary"
              >
                Hesap Oluştur
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hesap Bakiyeleri */}
      <section className="reveal space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Hesap Bakiyeleri</h2>
        <div className="card">
          <BalanceCards items={balances} />
        </div>
      </section>

      {/* Aylık Seri */}
      <section className="reveal space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Finansal Analiz</h2>
        <div className="card">
          <MonthlySeriesChart incomeCategories={catIncome} expenseCategories={catExpense} />
        </div>
      </section>

      {/* Kategoriler */}
      <section className="reveal grid gap-4 lg:grid-cols-2">
        <div className="card">
          <CategoryTotals title="Gelir Kategorileri" items={catIncome} currency={baseCurrency} />
        </div>
        <div className="card">
          <CategoryTotals title="Gider Kategorileri" items={catExpense} currency={baseCurrency} />
        </div>
      </section>

      {/* Nakit Akışı (özet) */}
      {cashflow && (
        <section className="reveal card">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Nakit Akışı (Toplam)</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="card p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">Gelir</div>
              <div className="text-lg font-bold money-in">
                {fmtMoney(Number(cashflow.income), baseCurrency)}
              </div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">Gider</div>
              <div className="text-lg font-bold money-out">
                {fmtMoney(Number(cashflow.expense), baseCurrency)}
              </div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">Net</div>
              <div className="text-lg font-bold">
                {fmtMoney(Number(cashflow.net), baseCurrency)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Son İşlemler */}
      <section className="reveal space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Son İşlemler</h2>
        <div className="card">
          <RecentTransactions items={recent} />
        </div>
      </section>
    </main>
  );
}