'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { type AccountType, ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

type Props = { id: string };

export default function AccountEditClient({ id }: Props) {
  const router = useRouter();
  const { show } = useToast();
  
  const [account, setAccount] = useState<AccountDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'BANK' as AccountType,
    currency: 'TRY',
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        
        const accData = await AccountsAPI.get(id);

        if (!alive) return;

        setAccount(accData);

        // Form verilerini doldur
        setFormData({
          name: accData.name,
          type: accData.type,
          currency: accData.currency,
        });

      } catch (e: unknown) {
        if (!alive) return;
        const message = e instanceof Error ? e.message : String(e);
        setErr(message);
        show(message, 'error');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, show]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!account) return;

    try {
      setSaving(true);
      
      await AccountsAPI.update(id, formData);

      show('Hesap başarıyla güncellendi', 'success');
      router.push('/accounts');
    } catch (error: any) {
      const message = error?.message || 'Hesap güncellenirken hata oluştu';
      show(message, 'error');
      setErr(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal">
          <div className="h-8 w-48 rounded bg-elevated animate-pulse mb-6" />
          <div className="card space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-elevated animate-pulse" />
                <div className="h-10 w-full rounded bg-elevated animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal card ring-1 ring-negative-500/25" role="alert">
          <p className="text-sm text-negative-500">{err}</p>
        </div>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal card text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Hesap Bulunamadı</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Aradığınız hesap bulunamadı veya silinmiş olabilir.
          </p>
          <button
            onClick={() => router.push('/accounts')}
            className="btn btn-primary"
          >
            Hesaplara Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Hesap Düzenle</h1>
        <button
          onClick={() => router.push('/accounts')}
          className="btn btn-ghost h-9"
        >
          İptal
        </button>
      </div>

      {/* Mevcut Hesap Bilgileri */}
      <div className="reveal card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Mevcut Hesap</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="label-soft">Ad:</span>
            <p className="font-medium">{account.name}</p>
          </div>
          <div>
            <span className="label-soft">Tür:</span>
            <p className="font-medium">{ACCOUNT_TYPE_LABELS_TR[account.type]}</p>
          </div>
          <div>
            <span className="label-soft">Para Birimi:</span>
            <p className="font-medium">{account.currency}</p>
          </div>
        </div>
      </div>

      {/* Düzenleme Formu */}
      <form onSubmit={handleSubmit} className="reveal card space-y-4">
        <h3 className="font-semibold text-sm">Düzenleme</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="subtext">Hesap Adı</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="subtext">Hesap Türü</label>
            <select
              className="input"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AccountType }))}
              required
            >
              <option value="BANK">Banka</option>
              <option value="CASH">Nakit</option>
              <option value="CARD">Kart</option>
              <option value="WALLET">Cüzdan</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="subtext">Para Birimi</label>
            <select
              className="input"
              value={formData.currency}
              onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
              required
            >
              <option value="TRY">TRY - Türk Lirası</option>
              <option value="USD">USD - Amerikan Doları</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - İngiliz Sterlini</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Güncelleniyor...' : 'Güncelle'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/accounts')}
            className="btn btn-ghost"
          >
            İptal
          </button>
        </div>
      </form>
    </main>
  );
}
