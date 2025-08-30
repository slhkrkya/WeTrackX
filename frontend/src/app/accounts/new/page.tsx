'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AccountsAPI } from '@/lib/accounts';
import { type AccountType, ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

const TYPES: AccountType[] = ['BANK', 'CASH', 'CARD', 'WALLET'];

export default function NewAccountPage() {
  const router = useRouter();
  const { show } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // alan bazlı hatalar
  const [nameErr, setNameErr] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr('');
    setNameErr('');

    if (!name.trim()) {
      setNameErr('Hesap adı zorunlu');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        currency: 'TRY', // Her zaman TRY olacak
      };
      await AccountsAPI.create(payload);
      show('Hesap başarıyla oluşturuldu!', 'success');
      router.replace('/accounts');
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setErr(errorMessage);
      show(errorMessage, 'error');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh p-6 flex justify-center">
      <form onSubmit={onSubmit} className="reveal w-full max-w-md space-y-5 card">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Yeni Hesap</h1>
          <Link href="/accounts" className="nav-link">Listeye Dön</Link>
        </div>

        {/* Genel hata (sunucu/istek) */}
        {err && (
          <div
            className="card ring-1 ring-[rgb(var(--error))]/25"
            role="alert"
          >
            <p className="text-sm text-[rgb(var(--error))]">{err}</p>
          </div>
        )}

        {/* Ad */}
        <div className="space-y-1">
          <label htmlFor="name" className="label-soft">Ad</label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (!nameErr && !name.trim()) setNameErr('Hesap adı zorunlu');
              if (name.trim()) setNameErr('');
            }}
            placeholder="Vadesiz TL"
            required
            aria-invalid={!!nameErr}
            aria-describedby={nameErr ? 'name-err' : undefined}
          />
          {nameErr && (
            <p id="name-err" className="text-xs text-[rgb(var(--error))]">{nameErr}</p>
          )}
        </div>

        {/* Tür */}
        <div className="space-y-1">
          <label htmlFor="type" className="label-soft">Tür</label>
          <select
            id="type"
            className="input bg-transparent"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{ACCOUNT_TYPE_LABELS_TR[t]}</option>
            ))}
          </select>
        </div>



        {/* Aksiyonlar */}
        <div className="flex items-center gap-2">
          <button
            disabled={loading}
            className="btn btn-primary"
            type="submit"
          >
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <Link href="/accounts" className="nav-link">İptal</Link>
        </div>
      </form>
    </main>
  );
}