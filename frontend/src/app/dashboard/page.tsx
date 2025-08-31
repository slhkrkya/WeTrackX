'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { fmtMoney } from '@/lib/format';
import AccountCards from '@/components/accounts/AccountCards';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [catIncome, setCatIncome] = useState<CategoryTotal[]>([]);
  const [catExpense, setCatExpense] = useState<CategoryTotal[]>([]);
  const [recent, setRecent] = useState<TxItem[]>([]);
  const [cashflow, setCashflow] = useState<Cashflow | null>(null);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [b, a, ci, ce, r, cf] = await Promise.all([
          ReportsAPI.balances(),
          AccountsAPI.list(),
          ReportsAPI.categoryTotals('INCOME'),
          ReportsAPI.categoryTotals('EXPENSE'),
          ReportsAPI.recentTransactions(10),
          ReportsAPI.cashflow(),
        ]);
        
        setBalances(b);
        setAccounts(a);
        setCatIncome(ci);
        setCatExpense(ce);
        setRecent(r.items);
        setCashflow(cf);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Finansal durumunuzun genel görünümü
            </p>
          </div>
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

  // Para birimini balances'tan türet (yoksa TRY)
  const baseCurrency = balances[0]?.currency ?? 'TRY';

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Başlık + Aksiyon */}
      <div className="reveal flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Finansal durumunuzun genel görünümü
          </p>
        </div>
      </div>

      {/* Hata */}
      {err && (
        <div className="reveal card border border-[rgb(var(--error))]/30">
          <p className="text-sm" style={{ color: 'rgb(var(--error))' }}>
            {err}
          </p>
        </div>
      )}

      {/* Modern Hesap Kartları */}
      <section className="reveal space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Hesaplarım
          </h2>
        </div>
        <AccountCards 
          items={accounts} 
          balances={balances}
          onDelete={async (id: string) => {
            setAccounts(accounts.filter(item => item.id !== id));
            // Son işlemleri de yenile
            try {
              const [recentData, balancesData] = await Promise.all([
                ReportsAPI.recentTransactions(10),
                ReportsAPI.balances(),
              ]);
              setRecent(recentData.items);
              setBalances(balancesData);
            } catch (e: unknown) {
              console.error('Son işlemler yenilenirken hata:', e);
            }
          }}
          onRestore={async (id) => {
            // Hesap geri yüklendiğinde listeyi yenile
            try {
              const [accountsData, balancesData, recentData] = await Promise.all([
                AccountsAPI.list(),
                ReportsAPI.balances(),
                ReportsAPI.recentTransactions(10),
              ]);
              setAccounts(accountsData);
              setBalances(balancesData);
              setRecent(recentData.items);
            } catch (e: unknown) {
              console.error('Hesap listesi yenilenirken hata:', e);
            }
          }}
        />
      </section>

      {/* Aylık Seri */}
      <section className="reveal space-y-3">
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Finansal Analiz
        </h2>
        <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <MonthlySeriesChart incomeCategories={catIncome} expenseCategories={catExpense} />
        </div>
      </section>

      {/* Kategoriler */}
      <section className="reveal grid gap-4 lg:grid-cols-2">
        <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CategoryTotals title="Gelir Kategorileri" items={catIncome} currency={baseCurrency} />
        </div>
        <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CategoryTotals title="Gider Kategorileri" items={catExpense} currency={baseCurrency} />
        </div>
      </section>

      {/* Nakit Akışı (özet) */}
      {cashflow && (
        <section className="reveal card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg md:text-xl font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Nakit Akışı (Toplam)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="card p-4 text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div className="text-xs text-muted-foreground mb-1">Gelir</div>
              <div className="text-lg font-bold money-in">
                {fmtMoney(Number(cashflow.income), baseCurrency)}
              </div>
            </div>
            <div className="card p-4 text-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
              <div className="text-xs text-muted-foreground mb-1">Gider</div>
              <div className="text-lg font-bold money-out">
                {fmtMoney(Number(cashflow.expense), baseCurrency)}
              </div>
            </div>
            <div className="card p-4 text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
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
        <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Son İşlemler
        </h2>
        <div className="card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <RecentTransactions items={recent} />
        </div>
      </section>
    </main>
  );
}