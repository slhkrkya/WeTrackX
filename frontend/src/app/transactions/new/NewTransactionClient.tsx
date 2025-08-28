'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { TransactionsAPI } from '@/lib/transactions';

type Kind = 'INCOME' | 'EXPENSE' | 'TRANSFER';

function todayIso() {
  const d = new Date();
  // yyyy-mm-ddTHH:MM (input[type=datetime-local] formatına yakın dursun)
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewTransactionClient() {
  const router = useRouter();

  const [type, setType] = useState<Kind>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState('TRY');
  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState('');

  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [catsIncome, setCatsIncome] = useState<CategoryDTO[]>([]);
  const [catsExpense, setCatsExpense] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  // seçimler
  const [accountId, setAccountId] = useState('');     // INCOME/EXPENSE
  const [categoryId, setCategoryId] = useState('');   // INCOME/EXPENSE
  const [fromAccountId, setFromAccountId] = useState(''); // TRANSFER
  const [toAccountId, setToAccountId] = useState('');     // TRANSFER

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
        // muhtemel 401
        router.replace('/auth/login');
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // type değiştiğinde ilgili alanları resetleyelim
  useEffect(() => {
    setErr('');
    if (type === 'TRANSFER') {
      setAccountId('');
      setCategoryId('');
    } else {
      setFromAccountId('');
      setToAccountId('');
    }
  }, [type]);

  const categoriesForType = useMemo(
    () => (type === 'INCOME' ? catsIncome : catsExpense),
    [type, catsIncome, catsExpense]
  );

  function normalizeCurrency(s: string) {
    return s.trim().toUpperCase().slice(0, 3) || 'TRY';
  }

  function parseAmount(): number {
    const n = Number(String(amount).replace(',', '.'));
    return Number.isFinite(n) ? Math.abs(n) : NaN; // her zaman pozitif
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    const n = parseAmount();
    if (!title.trim()) return setErr('Başlık zorunlu');
    if (!Number.isFinite(n) || n <= 0) return setErr('Tutar pozitif olmalı');

    try {
      if (type === 'TRANSFER') {
        if (!fromAccountId || !toAccountId) throw new Error('Kaynak ve hedef hesap zorunlu');
        if (fromAccountId === toAccountId) throw new Error('Aynı hesaplar arasında transfer olmaz');
        await TransactionsAPI.create({
          type: 'TRANSFER',
          title: title.trim(),
          amount: n,
          currency: normalizeCurrency(currency),
          date: new Date(date).toISOString(),
          description: description || undefined,
          fromAccountId,
          toAccountId,
        });
      } else {
        if (!accountId) throw new Error('Hesap seçimi zorunlu');
        if (!categoryId) throw new Error('Kategori seçimi zorunlu');
        await TransactionsAPI.create({
          type,
          title: title.trim(),
          amount: n,
          currency: normalizeCurrency(currency),
          date: new Date(date).toISOString(),
          description: description || undefined,
          accountId,
          categoryId,
        });
      }
      router.replace('/dashboard');
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  if (loading) return <main className="p-6">Yükleniyor…</main>;

  return (
    <main className="min-h-dvh p-6 flex justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-2xl space-y-4 border rounded-xl p-5">
        <h1 className="text-2xl font-bold">Yeni İşlem</h1>

        {err && <div className="text-sm border rounded p-2">{err}</div>}

        {/* İşlem türü */}
        <div className="space-y-1">
          <label className="text-sm">Tür</label>
          <div className="flex gap-2">
            {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded px-3 py-1.5 border text-sm ${type === t ? 'bg-black/5 dark:bg-white/10' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Başlık & Açıklama */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm">Başlık</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'INCOME' ? 'Maaş' : type === 'EXPENSE' ? 'Yemek' : 'Banka Transferi'}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Açıklama (ops.)</label>
            <input
              className="w-full rounded border px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Not"
            />
          </div>
        </div>

        {/* Tutar & Para birimi & Tarih */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm">Tutar</label>
            <input
              className="w-full rounded border px-3 py-2"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Para Birimi</label>
            <input
              className="w-full rounded border px-3 py-2 uppercase"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              maxLength={3}
              placeholder="TRY"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Tarih</label>
            <input
              className="w-full rounded border px-3 py-2"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Tipe göre alanlar */}
        {type === 'TRANSFER' ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm">Kaynak Hesap</label>
              <select
                className="w-full rounded border px-3 py-2 bg-transparent"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                required
              >
                <option value="">Seçiniz</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm">Hedef Hesap</label>
              <select
                className="w-full rounded border px-3 py-2 bg-transparent"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
              >
                <option value="">Seçiniz</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm">Hesap</label>
              <select
                className="w-full rounded border px-3 py-2 bg-transparent"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
              >
                <option value="">Seçiniz</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm">Kategori</label>
              <select
                className="w-full rounded border px-3 py-2 bg-transparent"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Seçiniz</option>
                {categoriesForType.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button className="rounded px-4 py-2 border">Kaydet</button>
          <a href="/dashboard" className="text-sm underline">İptal</a>
        </div>
      </form>
    </main>
  );
}