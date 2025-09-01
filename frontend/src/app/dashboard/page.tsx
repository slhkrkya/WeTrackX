'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
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
import SuspenseFallback from '@/components/SuspenseFallback';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [catIncome, setCatIncome] = useState<CategoryTotal[]>([]);
  const [catExpense, setCatExpense] = useState<CategoryTotal[]>([]);
  const [recent, setRecent] = useState<TxItem[]>([]);
  const [cashflow, setCashflow] = useState<Cashflow | null>(null);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  
  // Hesap seçimi state'i
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  // Abort controller ref'i
  const abortControllerRef = useRef<AbortController | null>(null);

     // ScrollSmoother refs
   const accountsRef = useRef<HTMLElement>(null);
  const chartRef = useRef<HTMLElement>(null);
  const categoriesRef = useRef<HTMLElement>(null);
  const cashflowRef = useRef<HTMLElement>(null);
  const transactionsRef = useRef<HTMLElement>(null);

  // Ana veri yükleme fonksiyonu
  const loadDashboardData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setErr('');

      const [b, a, ci, ce, cf] = await Promise.all([
        ReportsAPI.balances(),
        AccountsAPI.list(),
        ReportsAPI.categoryTotals('INCOME'),
        ReportsAPI.categoryTotals('EXPENSE'),
        ReportsAPI.cashflow(),
      ]);

      // Abort signal kontrolü
      if (signal?.aborted) return;

      setBalances(b);
      setAccounts(a);
      setCatIncome(ci);
      setCatExpense(ce);
      setCashflow(cf);
      
      // İşlemleri hesap seçimi durumuna göre yükle
      const accountIdParam = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined;
      const recentData = await ReportsAPI.recentTransactions(5, accountIdParam);
      
      // Abort signal kontrolü
      if (signal?.aborted) return;
      
      setRecent(recentData.items);
      setIsInitialized(true);
    } catch (e) {
      // Abort signal kontrolü
      if (signal?.aborted) return;

      const errorMessage = e instanceof Error ? e.message : String(e);
      
      // Authentication hatası kontrolü
      if (errorMessage.includes('401') || errorMessage.includes('unauthorized') || errorMessage.includes('token')) {
        router.replace('/auth/login');
        return;
      }
      
      setErr(errorMessage);
      console.error('Dashboard veri yükleme hatası:', e);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [router, selectedAccountId]);

  // İlk yükleme
  useEffect(() => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    loadDashboardData(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadDashboardData]); // loadDashboardData dependency'si eklendi

     // Hesap seçimi değiştiğinde sadece işlemleri yenile
   useEffect(() => {
     if (!isInitialized) return; // İlk yükleme tamamlanmadan çalışmasın

     const loadRecentTransactions = async () => {
       try {
         const accountIdParam = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined;
         const recentData = await ReportsAPI.recentTransactions(5, accountIdParam);
         setRecent(recentData.items);
       } catch (e) {
         console.error('İşlemler yenilenirken hata:', e);
         // Hata durumunda kullanıcıyı login'e yönlendirme, sadece log
       }
     };

     loadRecentTransactions();
   }, [selectedAccountId, isInitialized]);

   // Nakit akışı değerleri değiştiğinde animasyonu yeniden tetikle
   useEffect(() => {
     if (!cashflowRef.current || !cashflow) return;

     // Mevcut nakit akışı animasyonlarını temizle
     const existingAnimations = ScrollTrigger.getAll().filter(trigger => 
       trigger.vars.trigger === cashflowRef.current
     );
     existingAnimations.forEach(trigger => trigger.kill());

     // Yeni animasyonları başlat
     const cashflowValues = cashflowRef.current.querySelectorAll('.cashflow-value');
     const animations: gsap.core.Tween[] = [];

     cashflowValues.forEach((element, index) => {
       const targetValue = Number(element.getAttribute('data-value') || 0);
       const currency = element.getAttribute('data-currency') || 'TRY';
       
       // Önce değeri sıfırla
       element.textContent = '0';
       
       const valueAnim = gsap.fromTo(element,
         { innerText: '0' },
         {
           innerText: targetValue,
           duration: 1.2,
           ease: 'power2.out',
           delay: 0.1 + (index * 0.1), // Her değer için farklı gecikme
           roundProps: 'innerText',
           onUpdate: function() {
             const currentValue = Math.round(this.targets()[0].innerText);
             element.textContent = fmtMoney(currentValue, currency);
           }
         }
       );
       animations.push(valueAnim);
     });

     return () => {
       animations.forEach(anim => anim.kill());
     };
   }, [cashflow]);

   // Kategoriler değiştiğinde progress bar animasyonlarını yeniden tetikle
   useEffect(() => {
     if (!categoriesRef.current || (!catIncome.length && !catExpense.length)) return;

     // Kategoriler için animasyon yeniden tetikleme
     const categoryContainers = categoriesRef.current.querySelectorAll('.reveal');
     categoryContainers.forEach(container => {
       const progressBars = container.querySelectorAll('.progress-bar-fill');
       progressBars.forEach((bar, index) => {
         const targetWidth = bar.getAttribute('data-width') || '0';
         
         // Progress bar'ı sıfırla
         gsap.set(bar, { width: '0%' });
         
         // Yeni animasyon başlat
         gsap.to(bar, {
           width: `${targetWidth}%`,
           duration: 1.2,
           ease: 'power2.out',
           delay: 0.1 + (index * 0.05), // Daha hızlı gecikme
         });
       });
     });
   }, [catIncome, catExpense]);

  // ScrollSmoother animasyonları - Sadece ilk yüklemede çalışsın
  useEffect(() => {
    if (!isInitialized) return;

    // GSAP plugins'ini kaydet
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

    const animations: gsap.core.Tween[] = [];

    // Hesap kartları animasyonu
    if (accountsRef.current) {
      const anim = gsap.fromTo(accountsRef.current,
        { opacity: 0, y: 60 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: accountsRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse',
          }
        }
      );
      animations.push(anim);
    }

    // Grafik animasyonu
    if (chartRef.current) {
      const anim = gsap.fromTo(chartRef.current,
        { opacity: 0, y: 60 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: chartRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse',
          }
        }
      );
      animations.push(anim);
    }

    // Kategoriler animasyonu
    if (categoriesRef.current) {
      const anim = gsap.fromTo(categoriesRef.current,
        { opacity: 0, y: 60 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: categoriesRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse',
          }
        }
      );
      animations.push(anim);
    }

         // Nakit akışı animasyonu
     if (cashflowRef.current) {
       const anim = gsap.fromTo(cashflowRef.current,
         { opacity: 0, y: 60 },
         { 
           opacity: 1, 
           y: 0, 
           duration: 0.8, 
           ease: 'power2.out',
           scrollTrigger: {
             trigger: cashflowRef.current,
             start: 'top 80%',
             end: 'bottom 20%',
             toggleActions: 'play reverse play reverse',
           }
         }
       );
       animations.push(anim);

       // Nakit akışı değer animasyonları
       const cashflowValues = cashflowRef.current.querySelectorAll('.cashflow-value');
       cashflowValues.forEach((element, index) => {
         const targetValue = Number(element.getAttribute('data-value') || 0);
         const currency = element.getAttribute('data-currency') || 'TRY';
         
         const valueAnim = gsap.fromTo(element,
           { innerText: '0' },
           {
             innerText: targetValue,
             duration: 1.5,
             ease: 'power2.out',
             delay: 0.3 + (index * 0.1), // Her değer için farklı gecikme
             roundProps: 'innerText',
             onUpdate: function() {
               const currentValue = Math.round(this.targets()[0].innerText);
               element.textContent = fmtMoney(currentValue, currency);
             },
             scrollTrigger: {
               trigger: cashflowRef.current,
               start: 'top 80%',
               end: 'bottom 20%',
               toggleActions: 'play reverse play reverse',
             }
           }
         );
         animations.push(valueAnim);
       });
     }

    // Son işlemler animasyonu
    if (transactionsRef.current) {
      const anim = gsap.fromTo(transactionsRef.current,
        { opacity: 0, y: 60 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.8, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: transactionsRef.current,
            start: 'top 80%',
            end: 'bottom 20%',
            toggleActions: 'play reverse play reverse',
          }
        }
      );
      animations.push(anim);
    }

    return () => {
      // Sadece dashboard'ın kendi animasyonlarını temizle
      animations.forEach(anim => anim.kill());
      const currentChartRef = chartRef.current;
      ScrollTrigger.getAll().forEach(trigger => {
        // MonthlySeriesChart'ın ScrollTrigger'larını temizleme
        if (trigger.vars.trigger !== currentChartRef) {
          trigger.kill();
        }
      });
    };
  }, [isInitialized]);

  // Component unmount olduğunda cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Tüm ScrollTrigger'ları temizle (component unmount olduğunda)
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [loadDashboardData]);

  if (loading) {
    return (
      <SuspenseFallback 
        message="Dashboard yükleniyor..." 
        fullScreen 
        timeout={30000}
        onTimeout={() => {
          setErr('Dashboard yüklenirken zaman aşımı oluştu. Lütfen sayfayı yenileyin.');
          setLoading(false);
        }}
      />
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
          <button 
            onClick={() => loadDashboardData()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Modern Hesap Kartları */}
      <section ref={accountsRef} className="reveal space-y-3">
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
             // Tüm verileri yenile: işlemler, bakiyeler, nakit akışı, kategoriler
             try {
               const accountIdParam = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined;
               const [recentData, balancesData, cashflowData, catIncomeData, catExpenseData] = await Promise.all([
                 ReportsAPI.recentTransactions(5, accountIdParam),
                 ReportsAPI.balances(),
                 ReportsAPI.cashflow(),
                 ReportsAPI.categoryTotals('INCOME'),
                 ReportsAPI.categoryTotals('EXPENSE'),
               ]);
               setRecent(recentData.items);
               setBalances(balancesData);
               setCashflow(cashflowData);
               setCatIncome(catIncomeData);
               setCatExpense(catExpenseData);
             } catch (e: unknown) {
               console.error('Veriler yenilenirken hata:', e);
             }
           }}
                     onRestore={async () => {
             // Hesap geri yüklendiğinde tüm verileri yenile
             try {
               const accountIdParam = selectedAccountId && selectedAccountId !== 'all' ? selectedAccountId : undefined;
               const [accountsData, balancesData, recentData, cashflowData, catIncomeData, catExpenseData] = await Promise.all([
                 AccountsAPI.list(),
                 ReportsAPI.balances(),
                 ReportsAPI.recentTransactions(5, accountIdParam),
                 ReportsAPI.cashflow(),
                 ReportsAPI.categoryTotals('INCOME'),
                 ReportsAPI.categoryTotals('EXPENSE'),
               ]);
               setAccounts(accountsData);
               setBalances(balancesData);
               setRecent(recentData.items);
               setCashflow(cashflowData);
               setCatIncome(catIncomeData);
               setCatExpense(catExpenseData);
             } catch (e: unknown) {
               console.error('Hesap listesi yenilenirken hata:', e);
             }
           }}
        />
      </section>

             {/* Nakit Akışı (özet) */}
       {cashflow && (
         <section ref={cashflowRef} className="reveal">
           <h2 className="text-lg md:text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
             <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
             </svg>
             Nakit Akışı (Toplam)
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
             <div className="bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/20 dark:to-green-800/20 backdrop-blur-sm rounded-2xl border border-green-200/50 dark:border-green-800/30 p-4 text-center">
               <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Gelir</div>
               <div 
                 className="text-lg font-bold text-green-600 dark:text-green-400 cashflow-value"
                 data-value={Number(cashflow.income)}
                 data-currency={baseCurrency}
               >
                 0
               </div>
             </div>
             <div className="bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/20 dark:to-red-800/20 backdrop-blur-sm rounded-2xl border border-red-200/50 dark:border-red-800/30 p-4 text-center">
               <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Gider</div>
               <div 
                 className="text-lg font-bold text-red-600 dark:text-red-400 cashflow-value"
                 data-value={Number(cashflow.expense)}
                 data-currency={baseCurrency}
               >
                 0
               </div>
             </div>
             <div className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/20 dark:to-blue-800/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-4 text-center">
               <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Net</div>
               <div 
                 className="text-lg font-bold text-blue-600 dark:text-blue-400 cashflow-value"
                 data-value={Number(cashflow.net)}
                 data-currency={baseCurrency}
               >
                 0
               </div>
             </div>
           </div>
         </section>
       )}

       {/* Son İşlemler */}
       <section ref={transactionsRef} className="reveal">
         <RecentTransactions 
           items={recent} 
           selectedAccountId={selectedAccountId}
           accounts={accounts}
           balances={balances}
           onSelectAccount={setSelectedAccountId}
         />
       </section>

       {/* Finansal Analiz */}
       <section ref={chartRef} className="reveal">
         <MonthlySeriesChart incomeCategories={catIncome} expenseCategories={catExpense} />
       </section>

       {/* Kategoriler */}
       <section ref={categoriesRef} className="reveal grid gap-4 lg:grid-cols-2 lg:items-stretch">
         <div className="flex flex-col h-full">
           <CategoryTotals title="Gelir Kategorileri" items={catIncome} currency={baseCurrency} />
         </div>
         <div className="flex flex-col h-full">
           <CategoryTotals title="Gider Kategorileri" items={catExpense} currency={baseCurrency} />
         </div>
       </section>
    </main>
  );
}