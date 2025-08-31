'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AccountsAPI, type AccountDTO } from '@/lib/accounts';
import { type AccountType, ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

type Props = { id: string };

// Hesap türüne göre kart stilleri (AccountCards'tan kopyalandı)
const accountCardStyles = {
  BANK: {
    gradient: 'bg-gradient-to-br from-gray-600 via-slate-700 to-gray-800',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    decoration: 'absolute -bottom-10 -right-10 w-32 h-32 bg-slate-500 rounded-full opacity-20'
  },
  CASH: {
    gradient: 'bg-gradient-to-br from-amber-800 via-yellow-600 to-orange-500',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M25.86 24.28l-1.73-1L21 22.72l3.14 5.44 6.29-3.64-1.73-1-2.57 1.5L25.86 24.28zm-13.14.5l5.16-8.66L11.39 13l-3.14 5.44 4.29 2.5 12.43-7.66L22.34 4l-6.29 3.64 4.43 7.34-13.57 8.5-1.73-1 2.57-1.5z"/%3E%3C/g%3E%3C/svg%3E")]',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    decoration: 'absolute bottom-2 right-10 w-16 h-16 bg-white/5 rounded-lg transform rotate-12'
  },
  CARD: {
    gradient: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M30 0l30 30-30 30L0 30z"/%3E%3C/g%3E%3C/svg%3E")]',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    decoration: 'absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full'
  },
  WALLET: {
    gradient: 'bg-gradient-to-tr from-green-300 via-teal-400 to-cyan-500',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M30 0l30 30-30 30L0 30z"/%3E%3C/g%3E%3C/svg%3E")]',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    decoration: 'absolute -top-10 -left-10 w-28 h-28 border-4 border-black/10 rounded-full'
  }
};

const TYPES: AccountType[] = ['BANK', 'CASH', 'CARD', 'WALLET'];

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
    currency: 'TRY', // Sabit Türk Lirası
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
          currency: 'TRY', // Her zaman TRY kullan
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
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Hesap güncellenirken hata oluştu';
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
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-6" />
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
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
        <div className="reveal bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">Hesap Bulunamadı</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Aradığınız hesap bulunamadı veya silinmiş olabilir.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            Dashboard&apos;a Dön
          </button>
        </div>
      </main>
    );
  }

  const selectedStyles = accountCardStyles[formData.type];

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hesap Düzenle
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Hesap bilgilerini güncelleyin
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard&apos;a Dön
        </button>
      </div>

      {/* Hata */}
      {err && (
        <div className="reveal bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{err}</p>
        </div>
      )}

      {/* Hesap Kartı Önizleme */}
      <div className="reveal">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hesap Önizleme</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Güncellenmiş hesap kartının nasıl görüneceği</p>
        </div>
        
        <div className="relative w-full max-w-sm mx-auto">
          <div
            className={[
              'relative w-full h-48 rounded-3xl shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105',
              selectedStyles.gradient,
              selectedStyles.pattern
            ].join(' ')}
          >
            {/* Dekoratif Element */}
            <div className={selectedStyles.decoration} />
            
            {/* Kart İçeriği */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6 text-white">
              {/* Üst Kısım */}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  {selectedStyles.icon}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium opacity-80">Bakiye</p>
                  <p className="text-2xl font-bold">₺0,00</p>
                </div>
              </div>
              
              {/* Alt Kısım */}
              <div>
                <p className="text-lg font-semibold mb-1">
                  {formData.name.trim() || account?.name || 'Hesap Adı'}
                </p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
                    {ACCOUNT_TYPE_LABELS_TR[formData.type]}
                  </span>
                  <p className="text-sm opacity-80">TRY</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="reveal">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Hesap Bilgileri</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Hesap detaylarını güncelleyin</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-6 space-y-6">
          {/* Hesap Adı */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hesap Adı
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-3 rounded-xl border transition-all duration-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Vadesiz TL, Nakit, Kredi Kartı..."
              required
            />
          </div>

          {/* Hesap Türü */}
          <div className="space-y-2">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hesap Türü
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TYPES.map((t) => {
                const styles = accountCardStyles[t];
                const isSelected = formData.type === t;
                
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                    className={[
                      'relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105',
                      styles.gradient,
                      'border-white/20 dark:border-gray-700/50',
                      isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                        : 'hover:border-white/40 dark:hover:border-gray-600'
                    ].join(' ')}
                  >
                    <div className="flex flex-col items-center gap-2 text-white">
                      <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                        {styles.icon}
                      </div>
                      <span className="text-xs font-medium">{ACCOUNT_TYPE_LABELS_TR[t]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aksiyonlar */}
          <div className="flex items-center gap-3 pt-4">
            <button
              disabled={saving}
              className={[
                'flex-1 px-6 py-3 rounded-xl font-medium transition-all duration-300',
                'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
                'hover:from-blue-700 hover:to-purple-700',
                'focus:ring-2 focus:ring-blue-500/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transform hover:scale-105'
              ].join(' ')}
              type="submit"
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Güncelleniyor...
                </div>
              ) : (
                'Hesabı Güncelle'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 rounded-xl font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
