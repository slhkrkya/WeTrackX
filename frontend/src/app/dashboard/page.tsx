'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MonthlySeriesChart from '@/components/dashboard/MonthlySeriesChart';
import CategoryTotals from '@/components/dashboard/CategoryTotals';
import RecentTransactions from '@/components/dashboard/RecentTransactions';
import AccountSelector from '@/components/dashboard/AccountSelector';
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
  const [allTransactions, setAllTransactions] = useState<TxItem[]>([]); // Tüm işlemler için ayrı state
  const [cashflow, setCashflow] = useState<Cashflow | null>(null);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  
  // Hesap seçimi state'i
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  useEffect(() => {
    (async () => {
      try {
        const [b, a, ci, ce, cf] = await Promise.all([
          ReportsAPI.balances(),
          AccountsAPI.list(),
          ReportsAPI.categoryTotals('INCOME'),
          ReportsAPI.categoryTotals('EXPENSE'),
          ReportsAPI.cashflow(),
        ]);
        
        setBalances(b);
        setAccounts(a);
        setCatIncome(ci);
        setCatExpense(ce);
        setCashflow(cf);
        
        // İşlemleri hesap seçimi durumuna göre yükle
        const accountIdParam = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined;
        const recentData = await ReportsAPI.recentTransactions(5, accountIdParam);
        setAllTransactions(recentData.items);
        setRecent(recentData.items);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [router, selectedAccountId]);

  // Hesap seçimi değiştiğinde işlemleri yenile
  useEffect(() => {
    (async () => {
      try {
        // Hesap seçimi varsa accountId parametresi ekle
        const accountIdParam = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined;
        
        const recentData = await ReportsAPI.recentTransactions(5, accountIdParam);
        setAllTransactions(recentData.items);
        setRecent(recentData.items);
      } catch (e) {
        console.error('İşlemler yenilenirken hata:', e);
      }
    })();
  }, [selectedAccountId]);

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
        <div className="reveal bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">
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
              const accountIdParam = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined;
              const [recentData, balancesData] = await Promise.all([
                ReportsAPI.recentTransactions(5, accountIdParam),
                ReportsAPI.balances(),
              ]);
              setAllTransactions(recentData.items);
              setRecent(recentData.items);
              setBalances(balancesData);
            } catch (e: unknown) {
              console.error('Son işlemler yenilenirken hata:', e);
            }
          }}
          onRestore={async (id) => {
            // Hesap geri yüklendiğinde listeyi yenile
            try {
              const accountIdParam = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined;
              const [accountsData, balancesData, recentData] = await Promise.all([
                AccountsAPI.list(),
                ReportsAPI.balances(),
                ReportsAPI.recentTransactions(5, accountIdParam),
              ]);
              setAccounts(accountsData);
              setBalances(balancesData);
              setAllTransactions(recentData.items);
              setRecent(recentData.items);
            } catch (e: unknown) {
              console.error('Hesap listesi yenilenirken hata:', e);
            }
          }}
        />
      </section>

      {/* Aylık Seri */}
      <section className="reveal">
        <MonthlySeriesChart incomeCategories={catIncome} expenseCategories={catExpense} />
      </section>

      {/* Kategoriler */}
      <section className="reveal grid gap-4 lg:grid-cols-2">
        <CategoryTotals title="Gelir Kategorileri" items={catIncome} currency={baseCurrency} />
        <CategoryTotals title="Gider Kategorileri" items={catExpense} currency={baseCurrency} />
      </section>

      {/* Nakit Akışı (özet) */}
      {cashflow && (
        <section className="reveal">
          <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Nakit Akışı (Toplam)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/20 dark:to-green-800/20 backdrop-blur-sm rounded-2xl border border-green-200/50 dark:border-green-800/30 p-4 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Gelir</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {fmtMoney(Number(cashflow.income), baseCurrency)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/20 dark:to-red-800/20 backdrop-blur-sm rounded-2xl border border-red-200/50 dark:border-red-800/30 p-4 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Gider</div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">
                {fmtMoney(Number(cashflow.expense), baseCurrency)}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/20 dark:to-blue-800/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-4 text-center">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Net</div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {fmtMoney(Number(cashflow.net), baseCurrency)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hesap Seçimi */}
      <section className="reveal">
        <AccountSelector 
          accounts={accounts}
          balances={balances}
          selectedAccountId={selectedAccountId}
          onSelectAccount={setSelectedAccountId}
        />
      </section>

      {/* Son İşlemler */}
      <section className="reveal">
        <RecentTransactions 
          items={recent} 
          selectedAccountId={selectedAccountId}
          accounts={accounts}
          balances={balances}
        />
      </section>
    </main>
  );
}