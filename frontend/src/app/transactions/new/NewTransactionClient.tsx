'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { TransactionsAPI } from '@/lib/transactions';
import DatePicker from '@/components/ui/DatePicker';

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
          amount: n, // Backend otomatik olarak EXPENSE için negatif yapar
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
      <main className="min-h-dvh p-4 md:p-6 flex justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="reveal w-full max-w-2xl space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
            <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
            </div>
          ))}
          <div className="flex gap-3">
            <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
            <div className="h-10 w-20 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-4 md:p-6 flex justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <form onSubmit={onSubmit} className="reveal w-full max-w-2xl space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Yeni İşlem
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Finansal işleminizi oluşturun
            </p>
          </div>
          <Link 
            href="/transactions" 
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Listeye Dön
          </Link>
        </div>

        {/* Genel hata */}
        {err && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4" role="alert">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
            </div>
          </div>
        )}

        {/* İşlem türü */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tür</label>
          <div className="inline-flex items-center rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm">
            {(['INCOME', 'EXPENSE', 'TRANSFER'] as const).map((t) => {
              const active = type === t;
              const color =
                t === 'INCOME' ? 'text-green-600 dark:text-green-400' :
                t === 'EXPENSE' ? 'text-red-600 dark:text-red-400' : 
                'text-blue-600 dark:text-blue-400';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    active 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
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
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">Başlık</label>
            <input
              id="title"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTitleErr(title.trim() ? '' : 'Başlık zorunlu')}
              placeholder={type === 'INCOME' ? 'Maaş' : type === 'EXPENSE' ? 'Yemek' : 'Banka Transferi'}
              required
              aria-invalid={!!titleErr}
              aria-describedby={titleErr ? 'title-err' : undefined}
            />
            {titleErr && <p id="title-err" className="text-xs text-red-600 dark:text-red-400">{titleErr}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="desc" className="text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama (ops.)</label>
            <input
              id="desc"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Not"
            />
          </div>
        </div>

        {/* Tutar & Tarih */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tutar</label>
            <input
              id="amount"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setAmountErr(parseAmountRaw(amount) > 0 ? '' : 'Tutar pozitif olmalı')}
              placeholder="0.00"
              required
              aria-invalid={!!amountErr}
              aria-describedby={amountErr ? 'amount-err' : undefined}
            />
            {amountErr && <p id="amount-err" className="text-xs text-red-600 dark:text-red-400">{amountErr}</p>}
            {type === 'EXPENSE' && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Gider tutarları sistem tarafından otomatik olarak negatif değere çevrilir
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarih</label>
            <DatePicker
              value={date}
              onChange={setDate}
              type="datetime-local"
              placeholder="Tarih ve saat seçin"
              showTime={true}
            />
            {dateErr && <p className="text-xs text-red-600 dark:text-red-400">{dateErr}</p>}
          </div>
        </div>

        {/* Tipe göre alanlar */}
        {type === 'TRANSFER' ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="from" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kaynak Hesap</label>
              <select
                id="from"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              {fromErr && <p id="from-err" className="text-xs text-red-600 dark:text-red-400">{fromErr}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="to" className="text-sm font-medium text-gray-700 dark:text-gray-300">Hedef Hesap</label>
              <select
                id="to"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              {toErr && <p id="to-err" className="text-xs text-red-600 dark:text-red-400">{toErr}</p>}
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="acc" className="text-sm font-medium text-gray-700 dark:text-gray-300">Hesap</label>
              <select
                id="acc"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              {accountErr && <p id="acc-err" className="text-xs text-red-600 dark:text-red-400">{accountErr}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="cat" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
              <select
                id="cat"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
              {categoryErr && <p id="cat-err" className="text-xs text-red-600 dark:text-red-400">{categoryErr}</p>}
            </div>
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="flex items-center gap-3 pt-4">
          <button 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5" 
            type="submit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Kaydet
          </button>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            İptal
          </Link>
        </div>
      </form>
    </main>
  );
}