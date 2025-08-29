'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { TransactionsAPI } from '@/lib/transactions';

type Kind = 'INCOME' | 'EXPENSE' | 'TRANSFER';

const KIND_LABELS_TR: Record<Kind, string> = {
  INCOME: 'Gelir',
  EXPENSE: 'Gider',
  TRANSFER: 'Transfer',
};

function todayIso() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseAmountRaw(v: string): number {
  // Virgülü noktaya çevir, boşlukları kırp
  const n = Number(String(v).replace(',', '.').trim());
  return Number.isFinite(n) ? Math.abs(n) : NaN; // her zaman pozitif
}

export default function NewTransactionClient() {
  const router = useRouter();

  const [type, setType] = useState<Kind>('EXPENSE');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<string>(''); // raw input

  const [date, setDate] = useState(todayIso());
  const [description, setDescription] = useState('');

  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [catsIncome, setCatsIncome] = useState<CategoryDTO[]>([]);
  const [catsExpense, setCatsExpense] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  // seçimler
  const [accountId, setAccountId] = useState('');         // INCOME/EXPENSE
  const [categoryId, setCategoryId] = useState('');       // INCOME/EXPENSE
  const [fromAccountId, setFromAccountId] = useState(''); // TRANSFER
  const [toAccountId, setToAccountId] = useState('');     // TRANSFER

  // alan bazlı hatalar
  const [titleErr, setTitleErr] = useState('');
  const [amountErr, setAmountErr] = useState('');
  const [dateErr, setDateErr] = useState('');
  const [accountErr, setAccountErr] = useState('');
  const [categoryErr, setCategoryErr] = useState('');
  const [fromErr, setFromErr] = useState('');
  const [toErr, setToErr] = useState('');

  const categoriesForType = useMemo(
    () => (type === 'INCOME' ? catsIncome : catsExpense),
    [type, catsIncome, catsExpense]
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
        
        // Hesap kontrolü - eğer hesap yoksa hesap oluşturma sayfasına yönlendir
        if (accs.length === 0) {
          setErr('İşlem yapabilmek için önce hesap oluşturmanız gerekiyor.');
          router.replace('/accounts/new');
          return;
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        router.replace('/auth/login');
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  // type değişince ilgili alanları sıfırla + hataları temizle
  useEffect(() => {
    setErr('');
    setAccountErr('');
    setCategoryErr('');
    setFromErr('');
    setToErr('');
    if (type === 'TRANSFER') {
      setAccountId('');
      setCategoryId('');
    } else {
      setFromAccountId('');
      setToAccountId('');
    }
  }, [type]);

  // Para birimi artık her zaman TL olacak
  // useEffect kaldırıldı

  function validateFields(): boolean {
    let ok = true;

    // Başlık
    if (!title.trim()) {
      setTitleErr('Başlık zorunlu');
      ok = false;
    } else setTitleErr('');

    // Tutar
    const n = parseAmountRaw(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setAmountErr('Tutar pozitif olmalı');
      ok = false;
    } else setAmountErr('');

          // Para birimi - her zaman TL olacak
      // Validasyon gerekmez

    // Tarih (datetime-local boş geçilmesin)
    if (!date) {
      setDateErr('Tarih zorunlu');
      ok = false;
    } else setDateErr('');

    if (type === 'TRANSFER') {
      if (!fromAccountId) { setFromErr('Kaynak hesap zorunlu'); ok = false; } else setFromErr('');
      if (!toAccountId) { setToErr('Hedef hesap zorunlu'); ok = false; } else setToErr('');
      if (fromAccountId && toAccountId && fromAccountId === toAccountId) {
        setToErr('Aynı hesaplar arasında transfer olmaz');
        ok = false;
      }
    } else {
      if (!accountId) { setAccountErr('Hesap seçimi zorunlu'); ok = false; } else setAccountErr('');
      if (!categoryId) { setCategoryErr('Kategori seçimi zorunlu'); ok = false; } else setCategoryErr('');
    }

    return ok;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    if (!validateFields()) return;

    const n = parseAmountRaw(amount);
    try {
      if (type === 'TRANSFER') {
        await TransactionsAPI.create({
          type: 'TRANSFER',
          title: title.trim(),
          amount: n, // TRANSFER için pozitif
          currency: 'TRY',
          date: new Date(date).toISOString(),
          description: description || undefined,
          fromAccountId,
          toAccountId,
        });
      } else {
        await TransactionsAPI.create({
          type,
          title: title.trim(),
          amount: n, // INCOME/EXPENSE için pozitif (backend otomatik negatif yapar)
          currency: 'TRY',
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

  if (loading) {
    return (
      <main className="min-h-dvh p-6 flex justify-center">
        <div className="reveal w-full max-w-2xl space-y-5 card p-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="h-6 w-24 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
              <div className="h-10 w-full rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            </div>
          ))}
          <div className="flex gap-2">
            <div className="h-10 w-24 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="h-10 w-20 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 flex justify-center">
      <form onSubmit={onSubmit} className="reveal w-full max-w-2xl space-y-5 card">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Yeni İşlem</h1>
          <Link href="/transactions" className="nav-link">Listeye Dön</Link>
        </div>

        {/* Genel hata */}
        {err && (
          <div className="card ring-1 ring-[rgb(var(--error))]/25" role="alert">
            <p className="text-sm text-[rgb(var(--error))]">{err}</p>
          </div>
        )}

        {/* İşlem türü */}
        <div className="space-y-1">
          <label className="label-soft">Tür</label>
          <div className="inline-flex items-center rounded-lg ring-1 ring-black/10 bg-[rgb(var(--card))] p-0.5">
            {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map((t) => {
              const active = type === t;
              const color =
                t === 'INCOME' ? 'text-[rgb(var(--success))]' :
                t === 'EXPENSE' ? 'text-[rgb(var(--error))]' : 'text-foreground';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={[
                    'px-3 h-9 rounded-md text-sm transition-colors',
                    active ? 'bg-[rgb(var(--surface-1))] ring-1 ring-black/5' : 'hover:bg-[rgb(var(--surface-1))]/60',
                    color,
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {KIND_LABELS_TR[t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Başlık & Açıklama */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="title" className="label-soft">Başlık</label>
            <input
              id="title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleErr(title.trim() ? '' : 'Başlık zorunlu')}
              placeholder={type === 'INCOME' ? 'Maaş' : type === 'EXPENSE' ? 'Yemek' : 'Banka Transferi'}
              required
              aria-invalid={!!titleErr}
              aria-describedby={titleErr ? 'title-err' : undefined}
            />
            {titleErr && <p id="title-err" className="text-xs text-[rgb(var(--error))]">{titleErr}</p>}
          </div>
          <div className="space-y-1">
            <label htmlFor="desc" className="label-soft">Açıklama (ops.)</label>
            <input
              id="desc"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Not"
            />
          </div>
        </div>

        {/* Tutar & Tarih */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="amount" className="label-soft">Tutar</label>
            <input
              id="amount"
              className="input"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setAmountErr(parseAmountRaw(amount) > 0 ? '' : 'Tutar pozitif olmalı')}
              placeholder="0.00"
              required
              aria-invalid={!!amountErr}
              aria-describedby={amountErr ? 'amount-err' : undefined}
            />
            {amountErr && <p id="amount-err" className="text-xs text-[rgb(var(--error))]">{amountErr}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="date" className="label-soft">Tarih</label>
            <input
              id="date"
              className="input"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => setDateErr(date ? '' : 'Tarih zorunlu')}
              required
              aria-invalid={!!dateErr}
              aria-describedby={dateErr ? 'date-err' : undefined}
            />
            {dateErr && <p id="date-err" className="text-xs text-[rgb(var(--error))]">{dateErr}</p>}
          </div>
        </div>

        {/* Tipe göre alanlar */}
        {type === 'TRANSFER' ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="from" className="label-soft">Kaynak Hesap</label>
              <select
                id="from"
                className="input bg-transparent"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                required
                aria-invalid={!!fromErr}
                aria-describedby={fromErr ? 'from-err' : undefined}
              >
                <option value="">Seçiniz</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
              {fromErr && <p id="from-err" className="text-xs text-[rgb(var(--error))]">{fromErr}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="to" className="label-soft">Hedef Hesap</label>
              <select
                id="to"
                className="input bg-transparent"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
                aria-invalid={!!toErr}
                aria-describedby={toErr ? 'to-err' : undefined}
              >
                <option value="">Seçiniz</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
              {toErr && <p id="to-err" className="text-xs text-[rgb(var(--error))]">{toErr}</p>}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="acc" className="label-soft">Hesap</label>
              <select
                id="acc"
                className="input bg-transparent"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                required
                aria-invalid={!!accountErr}
                aria-describedby={accountErr ? 'acc-err' : undefined}
              >
                <option value="">Seçiniz</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
              {accountErr && <p id="acc-err" className="text-xs text-[rgb(var(--error))]">{accountErr}</p>}
            </div>
            <div className="space-y-1">
              <label htmlFor="cat" className="label-soft">Kategori</label>
              <select
                id="cat"
                className="input bg-transparent"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                aria-invalid={!!categoryErr}
                aria-describedby={categoryErr ? 'cat-err' : undefined}
              >
                <option value="">Seçiniz</option>
                {categoriesForType.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categoryErr && <p id="cat-err" className="text-xs text-[rgb(var(--error))]">{categoryErr}</p>}
            </div>
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="flex items-center gap-2">
          <button className="btn btn-primary" type="submit">Kaydet</button>
          <Link href="/dashboard" className="nav-link">İptal</Link>
        </div>
      </form>
    </main>
  );
}