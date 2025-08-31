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
      <main className="min-h-dvh p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
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
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık + Aksiyon */}
      <div className="reveal flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
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
          <h2 className="text-lg font-semibold text-foreground">Hesaplarım</h2>
        </div>
        <AccountCards 
          items={accounts} 
          balances={balances}
          onDelete={(id: string) => {
            setAccounts(accounts.filter(item => item.id !== id));
          }}
          onRestore={async (id) => {
            // Hesap geri yüklendiğinde listeyi yenile
            try {
              const [accountsData, balancesData] = await Promise.all([
                AccountsAPI.list(),
                ReportsAPI.balances(),
              ]);
              setAccounts(accountsData);
              setBalances(balancesData);
            } catch (e: unknown) {
              console.error('Hesap listesi yenilenirken hata:', e);
            }
          }}
        />
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