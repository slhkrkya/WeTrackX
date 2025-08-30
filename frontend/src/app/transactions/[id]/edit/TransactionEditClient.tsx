'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TransactionsAPI, type TxListItem } from '@/lib/transactions';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { useToast } from '@/components/ToastProvider';
import { fmtDate, fmtMoney } from '@/lib/format';

type Props = { id: string };

export default function TransactionEditClient({ id }: Props) {
  const router = useRouter();
  const { show } = useToast();
  
  const [transaction, setTransaction] = useState<TxListItem | null>(null);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: '',
    description: '',
    accountId: '',
    categoryId: '',
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        
        // İşlem detayını ve gerekli listeleri yükle
        const [txData, accsData, catsData] = await Promise.all([
          TransactionsAPI.get(id),
          AccountsAPI.list(),
          CategoriesAPI.list(),
        ]);

        if (!alive) return;

        setTransaction(txData);
        setAccounts(accsData);
        setCategories(catsData.filter(c => c.kind === txData.type));

        // Form verilerini doldur
        setFormData({
          title: txData.title,
          amount: txData.amount,
          date: txData.date.split('T')[0],
          description: txData.description || '',
          accountId: txData.account?.id || '',
          categoryId: txData.category?.id || '',
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
    
    if (!transaction) return;

    try {
      setSaving(true);
      
      await TransactionsAPI.update(id, {
        ...formData,
        amount: Number(formData.amount),
        type: transaction.type,
      });

      show('İşlem başarıyla güncellendi', 'success');
      router.push('/transactions');
    } catch (error: any) {
      const message = error?.message || 'İşlem güncellenirken hata oluştu';
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
            {Array.from({ length: 6 }).map((_, i) => (
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

  if (!transaction) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal card text-center py-12">
          <h3 className="text-lg font-semibold mb-2">İşlem Bulunamadı</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Aradığınız işlem bulunamadı veya silinmiş olabilir.
          </p>
          <button
            onClick={() => router.push('/transactions')}
            className="btn btn-primary"
          >
            İşlemlere Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">İşlem Düzenle</h1>
        <button
          onClick={() => router.push('/transactions')}
          className="btn btn-ghost h-9"
        >
          İptal
        </button>
      </div>

      {/* Mevcut İşlem Bilgileri */}
      <div className="reveal card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Mevcut İşlem</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="label-soft">Başlık:</span>
            <p className="font-medium">{transaction.title}</p>
          </div>
          <div>
            <span className="label-soft">Tutar:</span>
            <p className="font-medium">{fmtMoney(Number(transaction.amount), transaction.currency)}</p>
          </div>
          <div>
            <span className="label-soft">Tarih:</span>
            <p className="font-medium">{fmtDate(transaction.date)}</p>
          </div>
          <div>
            <span className="label-soft">Tür:</span>
            <p className="font-medium">{transaction.type === 'INCOME' ? 'Gelir' : transaction.type === 'EXPENSE' ? 'Gider' : 'Transfer'}</p>
          </div>
        </div>
      </div>

      {/* Düzenleme Formu */}
      <form onSubmit={handleSubmit} className="reveal card space-y-4">
        <h3 className="font-semibold text-sm">Düzenleme</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="subtext">Başlık</label>
            <input
              type="text"
              className="input"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="subtext">Tutar</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="subtext">Tarih</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="subtext">Hesap</label>
            <select
              className="input"
              value={formData.accountId}
              onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
              required
            >
              <option value="">Hesap Seçin</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="subtext">Kategori</label>
            <select
              className="input"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              required
            >
              <option value="">Kategori Seçin</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="subtext">Açıklama</label>
          <textarea
            className="input"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="İsteğe bağlı açıklama..."
          />
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
            onClick={() => router.push('/transactions')}
            className="btn btn-ghost"
          >
            İptal
          </button>
        </div>
      </form>
    </main>
  );
}
