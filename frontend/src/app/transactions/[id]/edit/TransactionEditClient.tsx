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
      <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="reveal">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-600 animate-pulse mb-6" />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
                <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="reveal bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4" role="alert">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!transaction) {
    return (
      <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">İşlem Bulunamadı</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Aradığınız işlem bulunamadı veya silinmiş olabilir.
          </p>
          <button
            onClick={() => router.push('/transactions')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            İşlemlere Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            İşlem Düzenle
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            İşlem bilgilerini güncelleyin
          </p>
        </div>
        <button
          onClick={() => router.push('/transactions')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          İptal
        </button>
      </div>

      {/* Mevcut İşlem Bilgileri */}
      <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Mevcut İşlem</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Başlık:</span>
            <p className="font-medium text-gray-900 dark:text-white">{transaction.title}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tutar:</span>
            <p className="font-medium text-gray-900 dark:text-white">{fmtMoney(Number(transaction.amount), transaction.currency)}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tarih:</span>
            <p className="font-medium text-gray-900 dark:text-white">{fmtDate(transaction.date)}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tür:</span>
            <p className="font-medium text-gray-900 dark:text-white">{transaction.type === 'INCOME' ? 'Gelir' : transaction.type === 'EXPENSE' ? 'Gider' : 'Transfer'}</p>
          </div>
        </div>
      </div>

      {/* Düzenleme Formu */}
      <form onSubmit={handleSubmit} className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-4 p-6">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Düzenleme</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Başlık</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tutar</label>
            <input
              type="number"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarih</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hesap</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori</label>
            <select
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="İsteğe bağlı açıklama..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Güncelleniyor...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Güncelle
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push('/transactions')}
            className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            İptal
          </button>
        </div>
      </form>
    </main>
  );
}
