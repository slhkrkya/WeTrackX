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

function parseType(value: string | null): TxType {
  return value === 'INCOME' || value === 'EXPENSE' || value === 'TRANSFER' ? value : '';
}

function TypeChip({ type }: { type: Kind }) {
  const clr =
    type === 'INCOME'
      ? 'money-in'
      : type === 'EXPENSE'
        ? 'money-out'
        : 'text-brand-600';
  return <span className={['chip', clr].join(' ')}>{KIND_LABELS_TR[type]}</span>;
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
      <div className="hidden md:grid grid-cols-6 gap-2 px-4 py-2 text-[11px] subtext">
        <div>Tarih</div><div>Tür</div><div>Başlık</div><div>Hesap / Karşı Hesap</div><div>Kategori</div><div className="text-right">Tutar</div>
      </div>
      <ul className="divide-y">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="grid md:grid-cols-6 grid-cols-2 gap-2 px-4 py-3">
            {Array.from({ length: 6 }).map((__, k) => (
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

  // State variables
  const [items, setItems] = useState<TxItem[]>([]);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [catsIncome, setCatsIncome] = useState<CategoryDTO[]>([]);
  const [catsExpense, setCatsExpense] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

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

  // Geri/ileri ile URL değişirse state’i senkronla
  useEffect(() => {
    setType(parseType(sp.get('type')));
    setAccountId(sp.get('accountId') || '');
    setCategoryId(sp.get('categoryId') || '');
    setFrom(sp.get('from') || '');
    setTo(sp.get('to') || '');
    setQ(sp.get('q') || '');
    setPage(Number(sp.get('page') || 1));
    setPageSize(Number(sp.get('pageSize') || 20));
  }, [sp]);

  const catsForSelectedType = useMemo<CategoryDTO[]>(
    () => (type === 'INCOME' ? catsIncome : type === 'EXPENSE' ? catsExpense : []),
    [type, catsIncome, catsExpense],
  );

  // Veri çekimi
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
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
        return;
      }

      try {
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
        setErr(e instanceof Error ? e.message : String(e));
        show(e instanceof Error ? e.message : String(e), 'error');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, type, accountId, categoryId, from, to, q, page, pageSize, show]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (accountId) params.set('accountId', accountId);
    if (categoryId) params.set('categoryId', categoryId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    if (page) params.set('page', String(page));
    if (pageSize) params.set('pageSize', String(pageSize));
    router.replace('/transactions' + (params.toString() ? `?${params.toString()}` : ''));
  }

  function clearFilters() {
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
      <main className="min-h-dvh p-6 space-y-6">
        {/* Başlık + Yeni İşlem */}
        <div className="reveal flex items-center justify-between gap-3">
          <div className="h-7 w-40 rounded bg-elevated animate-pulse" />
          <div className="h-10 w-28 rounded bg-elevated animate-pulse" />
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
          <SegmentedType value={type} onChange={setType} />
        </div>

        <div className="space-y-1">
          <label className="subtext">Hesap</label>
          <select
            className="input bg-transparent"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
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
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={type === '' || type === 'TRANSFER'}
            title={type === '' || type === 'TRANSFER' ? 'Kategori yalnızca INCOME/EXPENSE için' : 'Kategori'}
          >
            <option value="">Tümü</option>
            {catsForSelectedType.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <p className="text-xs subtext">
            {type === 'TRANSFER' || type === '' ? 'Kategori yalnızca INCOME/EXPENSE için' : '\u00A0'}
          </p>
        </div>

        <div className="space-y-1">
          <label className="subtext">Başlangıç</label>
          <input
            className="input"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="subtext">Bitiş</label>
          <input
            className="input"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="subtext">Ara</label>
          <input
            className="input"
            placeholder="başlık / açıklama"
            value={q}
            onChange={(e) => setQ(e.target.value)}
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
        <div className="hidden md:grid grid-cols-6 gap-2 px-4 py-2 text-[11px] subtext" role="rowgroup">
          <div role="columnheader">Tarih</div>
          <div role="columnheader">Tür</div>
          <div role="columnheader">Başlık</div>
          <div role="columnheader">Hesap / Karşı Hesap</div>
          <div role="columnheader">Kategori</div>
          <div role="columnheader" className="text-right">Tutar</div>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
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
            {items.map((t) => (
              <li
                key={t.id}
                role="row"
                className={[
                  'grid md:grid-cols-6 grid-cols-2 gap-2 px-4 py-2 text-sm',
                  'hover:bg-elevated/70 transition-colors',
                  'focus-within:bg-elevated/70',
                ].join(' ')}
              >
                {/* Tarih */}
                <div role="cell" className="order-1 md:order-none subtext">{fmtDate(t.date)}</div>

                {/* Tür */}
                <div role="cell" className="order-3 md:order-none">
                  <TypeChip type={t.type} />
                </div>

                {/* Başlık + açıklama tooltip */}
                <div role="cell" className="truncate order-2 md:order-none" title={t.description || ''}>
                  {t.title}
                </div>

                {/* Hesap / Karşı Hesap */}
                <div role="cell" className="truncate order-4 md:order-none">
                  {t.type === 'TRANSFER'
                    ? `${t.fromAccount?.name ?? '—'} → ${t.toAccount?.name ?? '—'}`
                    : t.account?.name || '—'}
                </div>

                {/* Kategori */}
                <div role="cell" className="truncate order-5 md:order-none">
                  {t.category?.name || (t.type === 'TRANSFER' ? '—' : '')}
                </div>

                {/* Tutar */}
                <div role="cell" className="text-right tabular-nums order-6 md:order-none">
                  {t.type === 'INCOME' ? (
                    <span className="money-in">
                      + {fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                    </span>
                  ) : t.type === 'EXPENSE' ? (
                    <span className="money-out">
                      - {fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                    </span>
                  ) : (
                    fmtMoney(Math.abs(Number(t.amount)), t.currency)
                  )}
                </div>
              </li>
            ))}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Önceki
          </button>
          <span className="subtext text-sm">Sayfa {page}</span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Sonraki
          </button>
          <select
            className="input bg-transparent w-[6.5rem]"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) || 20)}
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