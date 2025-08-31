'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TransactionsAPI } from '@/lib/transactions';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { fmtDate, fmtMoney } from '@/lib/format';
import { useToast } from '@/components/ToastProvider';
import SuspenseFallback from '@/components/SuspenseFallback';
import DatePicker from '@/components/ui/DatePicker';

type TxItem = {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  title: string;
  amount: string;
  currency: string;
  date: string;
  description?: string;
  account?: { id: string; name: string };
  fromAccount?: { id: string; name: string };
  toAccount?: { id: string; name: string };
  category?: { id: string; name: string };
};

type Kind = 'INCOME' | 'EXPENSE' | 'TRANSFER';
type TxType = Kind | '';

const KIND_LABELS_TR: Record<Kind, string> = {
  INCOME: 'Gelir',
  EXPENSE: 'Gider',
  TRANSFER: 'Transfer',
};

const typeStyles: Record<Kind, { text: string; bg: string; border: string; icon: string }> = {
  INCOME:   { 
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'bg-green-500'
  },
  EXPENSE:  { 
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-500'
  },
  TRANSFER: { 
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'bg-blue-500'
  },
};

function parseType(value: string | null): TxType {
  return value === 'INCOME' || value === 'EXPENSE' || value === 'TRANSFER' ? value : '';
}

function TypePill({ type }: { type: Kind }) {
  const style = typeStyles[type] ?? typeStyles.INCOME;
  return (
    <span
      className={[
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
        style.bg,
        style.text,
        style.border,
      ].join(' ')}
    >
      {KIND_LABELS_TR[type]}
    </span>
  );
}

function SegmentedType({
  value,
  onChange,
}: {
  value: TxType;
  onChange: (t: TxType) => void;
}) {
  const tabs: { key: TxType; label: string }[] = [
    { key: '', label: 'Tümü' },
    { key: 'INCOME', label: 'Gelir' },
    { key: 'EXPENSE', label: 'Gider' },
    { key: 'TRANSFER', label: 'Transfer' },
  ];
  return (
    <div
      className="inline-flex items-center rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm"
      role="tablist"
      aria-label="İşlem türü filtresi"
    >
      {tabs.map((t) => {
        const active = value === t.key;
        const color =
          t.key === 'INCOME' ? 'text-green-600 dark:text-green-400' : 
          t.key === 'EXPENSE' ? 'text-red-600 dark:text-red-400' : 
          'text-gray-600 dark:text-gray-400';
        return (
          <button
            key={t.key || 'ALL'}
            role="tab"
            aria-selected={active}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
              color,
            ].join(' ')}
            onClick={() => onChange(t.key)}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// function FiltersSkeleton() {
//   return (
//     <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 grid lg:grid-cols-6 gap-4 p-6">
//       {Array.from({ length: 6 }).map((_, i) => (
//         <div key={i} className="space-y-2">
//           <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//           <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//         </div>
//       ))}
//       <div className="lg:col-span-6 flex gap-3">
//         <div className="h-10 w-28 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//         <div className="h-10 w-28 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//       </div>
//     </div>
//   );
// }

// function ListSkeleton() {
//   return (
//     <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
//       <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
//         <div>Tarih</div><div>Tür</div><div>Başlık</div><div>Hesap / Karşı Hesap</div><div>Kategori</div><div className="text-right">Tutar</div><div className="text-right">İşlemler</div>
//       </div>
//       <ul className="divide-y divide-gray-100 dark:divide-gray-700">
//         {Array.from({ length: 8 }).map((_, i) => (
//           <li key={i} className="grid md:grid-cols-7 grid-cols-2 gap-4 px-6 py-4">
//             {Array.from({ length: 7 }).map((__, k) => (
//               <div key={k} className="h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse md:block" />
//             ))}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

export default function TransactionsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { show } = useToast();

  // URL güncelleme yardımcı fonksiyonu
  function updateUrlParams(next: Record<string, string | number | undefined | null>) {
    const params = new URLSearchParams(Array.from(sp.entries()));
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === null) params.delete(k);
      else params.set(k, String(v));
    });
    router.replace('/transactions' + (params.toString() ? `?${params.toString()}` : ''));
  }

  // State variables
  const [items, setItems] = useState<TxItem[]>([]);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [catsIncome, setCatsIncome] = useState<CategoryDTO[]>([]);
  const [catsExpense, setCatsExpense] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // URL → başlangıç filtreleri
  const [type, setType] = useState<TxType>(parseType(sp.get('type')));
  const [accountId, setAccountId] = useState<string>(sp.get('accountId') || '');
  const [categoryId, setCategoryId] = useState<string>(sp.get('categoryId') || '');
  const [from, setFrom] = useState<string>(sp.get('from') || '');
  const [to, setTo] = useState<string>(sp.get('to') || '');
  const [q, setQ] = useState<string>(sp.get('q') || '');
  const [page, setPage] = useState<number>(Number(sp.get('page') || 1));
  const [pageSize, setPageSize] = useState<number>(Number(sp.get('pageSize') || 20));
  const [total, setTotal] = useState<number>(0);

  // Form filtreleri (henüz uygulanmamış)
  const [formType, setFormType] = useState<TxType>(parseType(sp.get('type')));
  const [formAccountId, setFormAccountId] = useState<string>(sp.get('accountId') || '');
  const [formCategoryId, setFormCategoryId] = useState<string>(sp.get('categoryId') || '');
  const [formFrom, setFormFrom] = useState<string>(sp.get('from') || '');
  const [formTo, setFormTo] = useState<string>(sp.get('to') || '');
  const [formQ, setFormQ] = useState<string>(sp.get('q') || '');

  // Geri/ileri ile URL değişirse state'i senkronla
  useEffect(() => {
    const urlType = parseType(sp.get('type'));
    const urlAccountId = sp.get('accountId') || '';
    const urlCategoryId = sp.get('categoryId') || '';
    const urlFrom = sp.get('from') || '';
    const urlTo = sp.get('to') || '';
    const urlQ = sp.get('q') || '';
    const urlPage = Number(sp.get('page') || 1);
    const urlPageSize = Number(sp.get('pageSize') || 20);

    // Aktif filtreleri güncelle
    setType(urlType);
    setAccountId(urlAccountId);
    setCategoryId(urlCategoryId);
    setFrom(urlFrom);
    setTo(urlTo);
    setQ(urlQ);
    setPage(urlPage);
    setPageSize(urlPageSize);

    // Form filtrelerini de güncelle
    setFormType(urlType);
    setFormAccountId(urlAccountId);
    setFormCategoryId(urlCategoryId);
    setFormFrom(urlFrom);
    setFormTo(urlTo);
    setFormQ(urlQ);
  }, [sp]);

  const catsForSelectedType = useMemo<CategoryDTO[]>(
    () => (formType === 'INCOME' ? catsIncome : formType === 'EXPENSE' ? catsExpense : []),
    [formType, catsIncome, catsExpense],
  );

  // Form tür değişince geçersiz kategori temizlensin
  useEffect(() => {
    if (formType === '' || formType === 'TRANSFER') setFormCategoryId('');
  }, [formType]);

  // Statik veriler: hesap/kategori listeleri – sadece ilk yüklemede
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [accs, inc, exp] = await Promise.all([
          AccountsAPI.list(),
          CategoriesAPI.list('INCOME'),
          CategoriesAPI.list('EXPENSE'),
        ]);
        if (!alive) return;
        setAccounts(accs);
        setCatsIncome(inc);
        setCatsExpense(exp);
      } catch (e) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : String(e));
        router.replace('/auth/login');
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // İşlem listesi – filtrelere bağlı
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const typeParam: Kind | undefined = type === '' ? undefined : type;
        const data = await TransactionsAPI.list({
          type: typeParam,
          accountId: accountId || undefined,
          categoryId: categoryId || undefined,
          from: from || undefined,
          to: to || undefined,
          q: q || undefined,
          page,
          pageSize,
          sort: 'date',
          order: 'desc',
        });
        if (!alive) return;
        setItems(data.items as unknown as TxItem[]);
        setTotal(data.total);
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : String(e);
        setErr(msg);
        show(msg, 'error');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [type, accountId, categoryId, from, to, q, page, pageSize, show]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    // Form filtrelerini aktif filtrelere kopyala
    setType(formType);
    setAccountId(formAccountId);
    setCategoryId(formCategoryId);
    setFrom(formFrom);
    setTo(formTo);
    setQ(formQ);
    setPage(1);
    
    // URL'i güncelle
    updateUrlParams({
      type: formType || undefined,
      accountId: formAccountId || undefined,
      categoryId: formCategoryId || undefined,
      from: formFrom || undefined,
      to: formTo || undefined,
      q: formQ || undefined,
      page: 1,
      pageSize,
    });
  }

  // İşlem silme fonksiyonu
  async function deleteTransaction(id: string) {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setDeletingId(id);
      await TransactionsAPI.delete(id);
      
      // Başarılı silme sonrası listeyi yenile
      setItems(items.filter(item => item.id !== id));
      setTotal(prev => prev - 1);
      
      show('İşlem başarıyla silindi', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'İşlem silinirken hata oluştu';
      show(message, 'error');
      setErr(message);
    } finally {
      setDeletingId(null);
    }
  }

  function clearFilters() {
    // Form filtrelerini temizle
    setFormType('');
    setFormAccountId('');
    setFormCategoryId('');
    setFormFrom('');
    setFormTo('');
    setFormQ('');
    
    // Aktif filtreleri temizle
    setType('');
    setAccountId('');
    setCategoryId('');
    setFrom('');
    setTo('');
    setQ('');
    setPage(1);
    setPageSize(20);
    
    router.replace('/transactions');
  }

  if (loading) {
    return <SuspenseFallback message="İşlemler yükleniyor..." fullScreen />;
  }

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            İşlemler
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Finansal işlemlerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <Link 
          href="/transactions/new" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Yeni İşlem
        </Link>
      </div>

      {/* Hata */}
      {err && (
        <div className="reveal bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4" role="alert">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
          </div>
        </div>
      )}

      {/* Filtreler */}
      <form onSubmit={applyFilters} className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 grid lg:grid-cols-6 gap-4 p-6">
        {/* Segmented tür seçimi */}
        <div className="lg:col-span-6 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tür</label>
          <SegmentedType value={formType} onChange={setFormType} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hesap</label>
          <select
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={formAccountId}
            onChange={(e) => setFormAccountId(e.target.value)}
          >
            <option value="">Tümü</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
          <select
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
            value={formCategoryId}
            onChange={(e) => setFormCategoryId(e.target.value)}
            disabled={formType === '' || formType === 'TRANSFER'}
            aria-disabled={formType === '' || formType === 'TRANSFER'}
            title={formType === '' || formType === 'TRANSFER' ? 'Kategori yalnızca INCOME/EXPENSE için' : 'Kategori'}
          >
            <option value="">Tümü</option>
            {catsForSelectedType.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formType === 'TRANSFER' || formType === '' ? 'Kategori yalnızca INCOME/EXPENSE için' : '\u00A0'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Başlangıç</label>
          <DatePicker
            value={formFrom}
            onChange={setFormFrom}
            type="datetime-local"
            placeholder="Başlangıç tarihi"
            showTime={true}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bitiş</label>
          <DatePicker
            value={formTo}
            onChange={setFormTo}
            type="datetime-local"
            placeholder="Bitiş tarihi"
            showTime={true}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ara</label>
          <input
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="başlık / açıklama"
            value={formQ}
            onChange={(e) => setFormQ(e.target.value)}
          />
        </div>

        <div className="lg:col-span-6 flex gap-3">
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5" 
            type="submit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Uygula
          </button>
          <button 
            type="button" 
            onClick={clearFilters} 
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Temizle
          </button>
        </div>
      </form>

      {/* Liste */}
      <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden" role="table" aria-label="İşlem listesi">
        {/* Başlık: md+ */}
        <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50" role="rowgroup">
          <div role="columnheader">Tarih</div>
          <div role="columnheader">Tür</div>
          <div role="columnheader">Başlık</div>
          <div role="columnheader">Hesap / Karşı Hesap</div>
          <div role="columnheader">Kategori</div>
          <div role="columnheader" className="text-right">Tutar</div>
          <div role="columnheader" className="text-right">İşlemler</div>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            {/* Silinmiş hesaplar bilgisi */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 max-w-md mx-auto">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Silinmiş Hesaplar</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Silinmiş hesaplara ait işlemler burada görünmez. Hesabı geri yüklediğinizde işlemler de geri gelir.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Henüz İşlem Yok</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {q || accountId || categoryId || from || to 
                ? 'Arama kriterlerinize uygun işlem bulunamadı. Filtreleri değiştirmeyi deneyin.'
                : 'İlk işleminizi oluşturarak finansal takibinize başlayabilirsiniz.'
              }
            </p>
            {!q && !accountId && !categoryId && !from && !to && (
              <Link 
                href="/transactions/new" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                İlk İşlemi Oluştur
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700" role="rowgroup">
            {items.map((t) => {
              const income = t.type === 'INCOME';
              const expense = t.type === 'EXPENSE';
              const amt = Number(t.amount);
              const safeAmt = Number.isFinite(amt) ? Math.abs(amt) : 0;
              const style = typeStyles[t.type] ?? typeStyles.INCOME;

              return (
                <li
                  key={t.id}
                  role="row"
                  className={[
                    'grid md:grid-cols-7 grid-cols-2 gap-4 px-6 py-4 text-sm',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200',
                    'focus-within:bg-gray-50 dark:focus-within:bg-gray-700/50',
                  ].join(' ')}
                >
                  {/* Tarih */}
                  <div role="cell" className="order-1 md:order-none text-gray-600 dark:text-gray-400">
                    <time dateTime={t.date}>{fmtDate(t.date)}</time>
                  </div>

                  {/* Tür */}
                  <div role="cell" className="order-3 md:order-none">
                    <TypePill type={t.type} />
                  </div>

                  {/* Başlık + açıklama */}
                  <div role="cell" className="order-2 md:order-none">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${style.icon} flex items-center justify-center flex-shrink-0`}>
                        {t.type === 'INCOME' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                          </svg>
                        ) : t.type === 'EXPENSE' ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white block">{t.title}</span>
                        {t.description ? (
                          <span className="text-xs text-gray-500 dark:text-gray-400 block">{t.description}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Hesap / Karşı Hesap */}
                  <div role="cell" className="order-4 md:order-none">
                    {t.type === 'TRANSFER' ? (
                      <span className="text-gray-700 dark:text-gray-300 block">
                        {t.fromAccount?.name} → {t.toAccount?.name}
                      </span>
                    ) : (
                      <span className="text-gray-700 dark:text-gray-300 block">{t.account?.name || '-'}</span>
                    )}
                  </div>

                  {/* Kategori */}
                  <div role="cell" className="truncate order-5 md:order-none text-gray-600 dark:text-gray-400">
                    {t.category?.name || (t.type === 'TRANSFER' ? '—' : '-')}
                  </div>

                  {/* Tutar */}
                  <div
                    role="cell"
                    className={[
                      'tabular-nums text-right order-6 md:order-none font-semibold',
                    ].join(' ')}
                  >
                    {income ? (
                      <span className="text-green-600 dark:text-green-400">
                        + {fmtMoney(safeAmt, t.currency)}
                      </span>
                    ) : expense ? (
                      <span className="text-red-600 dark:text-red-400">
                        - {fmtMoney(safeAmt, t.currency)}
                      </span>
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400">
                        {fmtMoney(safeAmt, t.currency)}
                      </span>
                    )}
                  </div>

                  {/* İşlemler */}
                  <div role="cell" className="flex items-center justify-end gap-2 order-7 md:order-none">
                    <Link
                      href={`/transactions/${t.id}/edit`}
                      className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg"
                      title="Düzenle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      disabled={deletingId === t.id}
                      className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50 rounded-lg"
                      title="Sil"
                    >
                      {deletingId === t.id ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Sayfalama */}
      <div className="reveal flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">Toplam: {total.toLocaleString()} kayıt</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              updateUrlParams({ page: next });
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Önceki
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Sayfa {page}</span>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            disabled={page * pageSize >= total}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              updateUrlParams({ page: next });
            }}
          >
            Sonraki
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <select
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-32"
            value={pageSize}
            onChange={(e) => {
              const size = Number(e.target.value) || 20;
              setPageSize(size);
              setPage(1);
              updateUrlParams({ page: 1, pageSize: size });
            }}
            title="Sayfa boyutu"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / sayfa</option>
            ))}
          </select>
        </div>
      </div>
    </main>
  );
}