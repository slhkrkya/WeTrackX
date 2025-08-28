'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TransactionsAPI } from '@/lib/transactions';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { CategoriesAPI, type CategoryDTO} from '@/lib/categories';
import { fmtDate, fmtMoney } from '@/lib/format';

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

const KINDS: Array<'INCOME' | 'EXPENSE' | 'TRANSFER'> = ['INCOME', 'EXPENSE', 'TRANSFER'];

export default function TransactionsClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // URL’den başlangıç filtreleri
  type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | '';

  function parseType(value: string | null): TxType {
  if (value === 'INCOME' || value === 'EXPENSE' || value === 'TRANSFER') return value;
  return '';
  }

  const [type, setType] = useState<TxType>(parseType(sp.get('type')));
  const [accountId, setAccountId] = useState<string>(sp.get('accountId') || '');
  const [categoryId, setCategoryId] = useState<string>(sp.get('categoryId') || '');
  const [from, setFrom] = useState<string>(sp.get('from') || '');
  const [to, setTo] = useState<string>(sp.get('to') || '');
  const [q, setQ] = useState<string>(sp.get('q') || '');

  const [items, setItems] = useState<TxItem[]>([]);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [catsIncome, setCatsIncome] = useState<CategoryDTO[]>([]);
  const [catsExpense, setCatsExpense] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  const catsForSelectedType = useMemo<CategoryDTO[]>(
    () => (type === 'INCOME' ? catsIncome : type === 'EXPENSE' ? catsExpense : []),
    [type, catsIncome, catsExpense],
  );

  useEffect(() => {
    (async () => {
      try {
        const [accs, inc, exp] = await Promise.all([
          AccountsAPI.list(),
          CategoriesAPI.list('INCOME'),
          CategoriesAPI.list('EXPENSE'),
        ]);
        setAccounts(accs);
        setCatsIncome(inc);
        setCatsExpense(exp);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        router.replace('/auth/login');
        return;
      } finally {
        // devam
      }

      try {
        const typeParam: 'INCOME' | 'EXPENSE' | 'TRANSFER' | undefined =
        type === '' ? undefined : type;

        const data = await TransactionsAPI.list({
        type: typeParam,
        accountId: accountId || undefined,
        categoryId: categoryId || undefined,
        from: from || undefined,
        to: to || undefined,
        q: q || undefined,
        limit: 50,
        });
        setItems(data as unknown as TxItem[]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [router, type, accountId, categoryId, from, to, q]);

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (accountId) params.set('accountId', accountId);
    if (categoryId) params.set('categoryId', categoryId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (q) params.set('q', q);
    router.replace('/transactions' + (params.toString() ? `?${params.toString()}` : ''));
  }

  function clearFilters() {
    setType('');
    setAccountId('');
    setCategoryId('');
    setFrom('');
    setTo('');
    setQ('');
    router.replace('/transactions');
  }

  if (loading) return <main className="p-6">Yükleniyor…</main>;

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">İşlemler</h1>
        <a href="/transactions/new" className="border rounded px-3 py-1.5 text-sm">Yeni İşlem</a>
      </div>

      {err && <div className="text-sm border rounded p-3">{err}</div>}

      {/* Filtreler */}
      <form onSubmit={applyFilters} className="rounded-xl border p-4 grid lg:grid-cols-6 gap-3">
        <div className="space-y-1">
          <label className="text-sm">Tür</label>
          <select className="w-full rounded border px-3 py-2 bg-transparent"
            value={type} onChange={(e) =>
              setType(e.target.value as '' | 'INCOME' | 'EXPENSE' | 'TRANSFER')
            }>
            <option value="">Tümü</option>
            {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Hesap</label>
          <select className="w-full rounded border px-3 py-2 bg-transparent"
            value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Tümü</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Kategori</label>
          <select className="w-full rounded border px-3 py-2 bg-transparent"
            value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={type === '' || type === 'TRANSFER'}>
            <option value="">Tümü</option>
            {catsForSelectedType.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="text-xs opacity-60">{type === 'TRANSFER' || type === '' ? 'Kategori yalnızca INCOME/EXPENSE için' : '\u00A0'}</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Başlangıç</label>
          <input className="w-full rounded border px-3 py-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Bitiş</label>
          <input className="w-full rounded border px-3 py-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Ara</label>
          <input className="w-full rounded border px-3 py-2" placeholder="başlık/açıklama"
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="lg:col-span-6 flex gap-2">
          <button className="rounded px-4 py-2 border">Uygula</button>
          <button type="button" onClick={clearFilters} className="rounded px-4 py-2 border">Temizle</button>
        </div>
      </form>

      {/* Liste */}
      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-[11px] opacity-60">
          <div>Tarih</div>
          <div>Tür</div>
          <div>Başlık</div>
          <div>Hesap / Karşı Hesap</div>
          <div>Kategori</div>
          <div className="text-right">Tutar</div>
        </div>
        {items.length === 0 ? (
          <div className="p-4 text-sm opacity-70">Kayıt bulunamadı.</div>
        ) : (
          <ul className="divide-y">
            {items.map(t => (
              <li key={t.id} className="grid grid-cols-6 gap-2 px-4 py-2 text-sm">
                <div>{fmtDate(t.date)}</div>
                <div>{t.type}</div>
                <div className="truncate" title={t.description || ''}>{t.title}</div>
                <div className="truncate">
                  {t.type === 'TRANSFER'
                    ? `${t.fromAccount?.name} → ${t.toAccount?.name}`
                    : (t.account?.name || '—')}
                </div>
                <div className="truncate">{t.category?.name || (t.type === 'TRANSFER' ? '—' : '')}</div>
                <div className="text-right tabular-nums">
                  {t.type === 'INCOME'
                    ? `+ ${fmtMoney(t.amount, t.currency)}`
                    : t.type === 'EXPENSE'
                    ? `- ${fmtMoney(t.amount, t.currency)}`
                    : fmtMoney(t.amount, t.currency)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}