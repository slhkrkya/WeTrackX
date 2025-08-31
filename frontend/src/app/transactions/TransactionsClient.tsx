'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { TransactionsAPI } from '@/lib/transactions';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { fmtDate, fmtMoney } from '@/lib/format';
import { useToast } from '@/components/ToastProvider';

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

const typeStyles: Record<Kind, { text: string; bg: string; border: string }> = {
  INCOME:   { 
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800'
  },
  EXPENSE:  { 
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800'
  },
  TRANSFER: { 
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800'
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
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
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
      className="inline-flex items-center rounded-lg ring-1 ring-muted-300 bg-card p-0.5"
      role="tablist"
      aria-label="İşlem türü filtresi"
    >
      {tabs.map((t) => {
        const active = value === t.key;
        const color =
          t.key === 'INCOME' ? 'money-in' : t.key === 'EXPENSE' ? 'money-out' : 'text-foreground';
        return (
          <button
            key={t.key || 'ALL'}
            role="tab"
            aria-selected={active}
            className={[
              'px-3 h-9 rounded-md text-sm transition-colors',
              active
                ? 'bg-elevated ring-1 ring-muted-300'
                : 'hover:bg-elevated/80',
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

function FiltersSkeleton() {
  return (
    <div className="reveal card grid lg:grid-cols-6 gap-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="h-3 w-16 rounded bg-elevated animate-pulse" />
          <div className="h-10 w-full rounded bg-elevated animate-pulse" />
        </div>
      ))}
      <div className="lg:col-span-6 flex gap-2">
        <div className="h-10 w-28 rounded bg-elevated animate-pulse" />
        <div className="h-10 w-28 rounded bg-elevated animate-pulse" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="reveal card overflow-hidden">
      <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2 text-[11px] subtext">
        <div>Tarih</div><div>Tür</div><div>Başlık</div><div>Hesap / Karşı Hesap</div><div>Kategori</div><div className="text-right">Tutar</div><div className="text-right">İşlemler</div>
      </div>
      <ul className="divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="grid md:grid-cols-7 grid-cols-2 gap-2 px-4 py-3">
            {Array.from({ length: 7 }).map((__, k) => (
              <div key={k} className="h-4 rounded bg-elevated animate-pulse md:block" />
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
    return (
      <main className="min-h-dvh p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Başlık + Yeni İşlem */}
        <div className="reveal flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="h-7 w-40 rounded bg-elevated animate-pulse" />
          <div className="h-10 w-full sm:w-28 rounded bg-elevated animate-pulse" />
        </div>
        <FiltersSkeleton />
        <ListSkeleton />
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <h1 className="h1">İşlemler</h1>
        <Link href="/transactions/new" className="btn btn-primary">
          Yeni İşlem
        </Link>
      </div>

      {/* Hata */}
      {err && (
        <div className="reveal card ring-1 ring-negative-500/25" role="alert">
          <p className="text-sm text-negative-500">{err}</p>
        </div>
      )}

      {/* Filtreler */}
      <form onSubmit={applyFilters} className="reveal card grid lg:grid-cols-6 gap-3 p-4">
        {/* Segmented tür seçimi */}
        <div className="lg:col-span-6 flex items-center gap-3">
          <label className="subtext text-sm">Tür</label>
          <SegmentedType value={formType} onChange={setFormType} />
        </div>

        <div className="space-y-1">
          <label className="subtext">Hesap</label>
          <select
            className="input bg-transparent"
            value={formAccountId}
            onChange={(e) => setFormAccountId(e.target.value)}
          >
            <option value="">Tümü</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="subtext">Kategori</label>
          <select
            className="input bg-transparent"
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
          <p className="text-xs subtext">
            {formType === 'TRANSFER' || formType === '' ? 'Kategori yalnızca INCOME/EXPENSE için' : '\u00A0'}
          </p>
        </div>

        <div className="space-y-1">
          <label className="subtext">Başlangıç</label>
          <input
            className="input"
            type="date"
            value={formFrom}
            onChange={(e) => setFormFrom(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="subtext">Bitiş</label>
          <input
            className="input"
            type="date"
            value={formTo}
            onChange={(e) => setFormTo(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="subtext">Ara</label>
          <input
            className="input"
            placeholder="başlık / açıklama"
            value={formQ}
            onChange={(e) => setFormQ(e.target.value)}
          />
        </div>

        <div className="lg:col-span-6 flex gap-2">
          <button className="btn btn-primary" type="submit">Uygula</button>
          <button type="button" onClick={clearFilters} className="btn btn-ghost">Temizle</button>
        </div>
      </form>

      {/* Liste */}
      <div className="reveal card overflow-hidden" role="table" aria-label="İşlem listesi">
        {/* Başlık: md+ */}
        <div className="hidden md:grid grid-cols-7 gap-2 px-4 py-2 text-[11px] subtext" role="rowgroup">
          <div role="columnheader">Tarih</div>
          <div role="columnheader">Tür</div>
          <div role="columnheader">Başlık</div>
          <div role="columnheader">Hesap / Karşı Hesap</div>
          <div role="columnheader">Kategori</div>
          <div role="columnheader" className="text-right">Tutar</div>
          <div role="columnheader" className="text-right">İşlemler</div>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
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
            
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Henüz İşlem Yok</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {q || accountId || categoryId || from || to 
                ? 'Arama kriterlerinize uygun işlem bulunamadı. Filtreleri değiştirmeyi deneyin.'
                : 'İlk işleminizi oluşturarak finansal takibinize başlayabilirsiniz.'
              }
            </p>
            {!q && !accountId && !categoryId && !from && !to && (
              <Link href="/transactions/new" className="btn btn-primary">
                İlk İşlemi Oluştur
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y" role="rowgroup">
            {items.map((t) => {
              const income = t.type === 'INCOME';
              const expense = t.type === 'EXPENSE';
              const amt = Number(t.amount);
              const safeAmt = Number.isFinite(amt) ? Math.abs(amt) : 0;

              return (
                <li
                  key={t.id}
                  role="row"
                  className={[
                    'grid md:grid-cols-7 grid-cols-2 gap-2 px-4 py-2 text-sm',
                    'hover:bg-[rgb(var(--surface-1))]/60 transition-colors',
                    'focus-within:bg-[rgb(var(--surface-1))]/60',
                  ].join(' ')}
                >
                  {/* Tarih */}
                  <div role="cell" className="order-1 md:order-none subtext">
                    <time dateTime={t.date}>{fmtDate(t.date)}</time>
                  </div>

                  {/* Tür */}
                  <div role="cell" className="order-3 md:order-none">
                    <TypePill type={t.type} />
                  </div>

                  {/* Başlık + açıklama */}
                  <div role="cell" className="order-2 md:order-none">
                    <span className="truncate block">{t.title}</span>
                    {t.description ? (
                      <span className="subtext text-xs truncate block">{t.description}</span>
                    ) : null}
                  </div>

                  {/* Hesap / Karşı Hesap */}
                  <div role="cell" className="order-4 md:order-none">
                    {t.type === 'TRANSFER' ? (
                      <span className="truncate block">
                        {t.fromAccount?.name} → {t.toAccount?.name}
                      </span>
                    ) : (
                      <span className="truncate block">{t.account?.name || '-'}</span>
                    )}
                  </div>

                  {/* Kategori */}
                  <div role="cell" className="truncate order-5 md:order-none">
                    {t.category?.name || (t.type === 'TRANSFER' ? '—' : '-')}
                  </div>

                  {/* Tutar */}
                  <div
                    role="cell"
                    className={[
                      'tabular-nums text-right order-6 md:order-none',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--card))]',
                    ].join(' ')}
                  >
                    {income ? (
                      <span className="money-in">
                        + {fmtMoney(safeAmt, t.currency)}
                      </span>
                    ) : expense ? (
                      <span className="money-out">
                        - {fmtMoney(safeAmt, t.currency)}
                      </span>
                    ) : (
                      fmtMoney(safeAmt, t.currency)
                    )}
                  </div>

                  {/* İşlemler */}
                  <div role="cell" className="flex items-center justify-end gap-2 order-7 md:order-none">
                    <Link
                      href={`/transactions/${t.id}/edit`}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      title="Düzenle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => deleteTransaction(t.id)}
                      disabled={deletingId === t.id}
                      className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-50"
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
        <div className="subtext text-sm">Toplam: {total.toLocaleString()} kayıt</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              updateUrlParams({ page: next });
            }}
          >
            Önceki
          </button>
          <span className="subtext text-sm">Sayfa {page}</span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page * pageSize >= total}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              updateUrlParams({ page: next });
            }}
          >
            Sonraki
          </button>
          <select
            className="input bg-transparent w-[6.5rem]"
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