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
import Link from 'next/link';

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
      <main className="min-h-dvh p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button onClick={onLogout} className="nav-link">
            Çıkış Yap
          </button>
        </div>
        
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-2 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500">Yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (err && balances.length === 0) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button onClick={onLogout} className="nav-link">
            Çıkış Yap
          </button>
        </div>
        
        <div className="reveal card text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">İlk Hesabınızı Oluşturun</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Finansal takibinize başlamak için önce bir hesap oluşturmanız gerekiyor. 
            Hesap oluşturduktan sonra işlemlerinizi kaydetmeye başlayabilirsiniz.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/accounts/new" className="btn btn-primary">
              Hesap Oluştur
            </Link>
            <Link href="/accounts" className="nav-link">
              Hesapları Görüntüle
            </Link>
          </div>
        </div>
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