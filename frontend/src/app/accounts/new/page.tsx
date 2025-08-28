'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountType } from '@/lib/accounts';

const TYPES: AccountType[] = ['BANK', 'CASH', 'CARD', 'WALLET'];

function normalizeCurrency(s: string) {
  return s.trim().toUpperCase().slice(0, 3) || 'TRY';
}

export default function NewAccountPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [currency, setCurrency] = useState('TRY');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const payload = {
        name: name.trim(),
        type,
        currency: normalizeCurrency(currency),
      };
      if (!payload.name) throw new Error('Hesap adı zorunlu');
      await AccountsAPI.create(payload);
      router.replace('/accounts');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh p-6 flex justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 border rounded-xl p-5">
        <h1 className="text-2xl font-bold">Yeni Hesap</h1>

        {err && <div className="text-sm border rounded p-2">{err}</div>}

        <div className="space-y-1">
          <label className="text-sm">Ad</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vadesiz TL"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Tür</label>
          <select
            className="w-full rounded border px-3 py-2 bg-transparent"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Para Birimi</label>
          <input
            className="w-full rounded border px-3 py-2 uppercase"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            placeholder="TRY"
            maxLength={3}
          />
          <p className="text-xs opacity-70">Örn: TRY, USD, EUR</p>
        </div>

        <div className="flex items-center gap-2">
          <button disabled={loading} className="rounded px-4 py-2 border">
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <a href="/accounts" className="text-sm underline">
            İptal
          </a>
        </div>
      </form>
    </main>
  );
}