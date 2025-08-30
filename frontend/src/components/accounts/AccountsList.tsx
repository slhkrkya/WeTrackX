'use client';

import { useState } from 'react';
import { type AccountDTO } from '@/lib/accounts';
import { AccountsAPI } from '@/lib/accounts';
import { ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';
import Link from 'next/link';

type Props = { 
  items: AccountDTO[];
  onDelete?: (id: string) => void;
};

const typeColor: Record<AccountDTO['type'], string> = {
  BANK: 'text-[rgb(var(--accent))]',
  CASH: 'text-[rgb(var(--success))]',
  CARD: 'text-[rgb(var(--warning))]',
  WALLET: 'text-[rgb(var(--primary))]',
};

export default function AccountsList({ items, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { show } = useToast();

  // Hesap silme fonksiyonu
  async function deleteAccount(id: string) {
    const account = items.find(item => item.id === id);
    const accountName = account?.name || 'Hesap';
    
    if (!confirm(`${accountName} hesabını silmek istediğinizden emin misiniz?\n\n⚠️ Bu işlem geri alınamaz ve hesaba ait tüm işlemler de silinecektir.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await AccountsAPI.delete(id);
      
      // Başarılı silme sonrası callback çağır
      onDelete?.(id);
      show(`${accountName} hesabı başarıyla silindi`, 'success');
    } catch (error: any) {
      let message = 'Hesap silinirken beklenmeyen bir hata oluştu';
      
      // Backend'den gelen hata mesajlarını kontrol et
      if (error?.message?.includes('related transactions')) {
        message = 'Bu hesaba ait işlemler bulunduğu için silinemez. Önce işlemleri silin veya başka bir hesaba taşıyın.';
      } else if (error?.message?.includes('not found')) {
        message = 'Hesap bulunamadı. Sayfayı yenileyip tekrar deneyin.';
      } else if (error?.message) {
        message = error.message;
      }
      
      show(message, 'error');
    } finally {
      setDeletingId(null);
    }
  }
  if (!items?.length) {
    return (
      <div className="reveal card text-center py-8 sm:py-12">
        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h3 className="text-base sm:text-lg font-semibold mb-2">Henüz Hesap Yok</h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto px-4">
          Finansal takibinize başlamak için önce bir hesap oluşturmanız gerekiyor. 
          Hesap oluşturduktan sonra işlemlerinizi kaydetmeye başlayabilirsiniz.
        </p>
        <Link href="/accounts/new" className="btn btn-primary text-sm sm:text-base">
          Hesap Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="reveal card overflow-hidden" role="table" aria-label="Hesap listesi">
      {/* Tablo başlığı: sadece md+ */}
      <div className="hidden md:grid grid-cols-5 gap-2 px-4 py-2 text-[11px] label-soft" role="rowgroup">
        <div role="columnheader">Ad</div>
        <div role="columnheader">Tür</div>
        <div role="columnheader">Para Birimi</div>
        <div role="columnheader">Oluşturma</div>
        <div role="columnheader" className="text-right">İşlemler</div>
      </div>

      <ul className="divide-y" role="rowgroup">
        {items.map((a) => (
          <li
            key={a.id}
            role="row"
            className={[
              'grid md:grid-cols-5 grid-cols-1 gap-2 px-3 sm:px-4 py-3 sm:py-2 text-sm',
              'hover:bg-[rgb(var(--surface-1))]/60 transition-colors',
              'focus-within:bg-[rgb(var(--surface-1))]/60',
              'md:gap-2',
            ].join(' ')}
          >
            {/* Ad */}
            <div role="cell" className="truncate order-1 md:order-none">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-base sm:text-sm">{a.name}</span>
                <div className="flex items-center gap-2 mt-1 sm:mt-0 sm:hidden">
                  <span
                    className={[
                      'pill h-5 px-2 text-[10px]',
                      typeColor[a.type] ?? 'text-foreground',
                      'bg-[rgb(var(--surface-1))]',
                    ].join(' ')}
                  >
                    {ACCOUNT_TYPE_LABELS_TR[a.type]}
                  </span>
                  <span className="pill h-5 px-2 text-[10px] uppercase tracking-wide bg-[rgb(var(--card))] ring-1 ring-black/5">
                    {a.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Tür - Desktop */}
            <div role="cell" className="hidden md:block order-3 md:order-none">
              <span
                className={[
                  'pill h-6 px-2 text-[11px]',
                  typeColor[a.type] ?? 'text-foreground',
                  'bg-[rgb(var(--surface-1))]',
                ].join(' ')}
                title={ACCOUNT_TYPE_LABELS_TR[a.type]}
              >
                {ACCOUNT_TYPE_LABELS_TR[a.type]}
              </span>
            </div>

            {/* Para Birimi - Desktop */}
            <div role="cell" className="hidden md:block order-4 md:order-none">
              <span
                className="pill h-6 px-2 text-[11px] uppercase tracking-wide bg-[rgb(var(--card))] ring-1 ring-black/5"
                title={a.currency}
              >
                {a.currency}
              </span>
            </div>

            {/* Oluşturma Tarihi */}
            <div role="cell" className="label-soft order-2 md:order-none text-xs md:text-sm">
              <div className="flex items-center justify-between sm:block">
                <span className="text-xs text-gray-500 sm:hidden">Oluşturma:</span>
                <span>{new Date(a.createdAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>

            {/* İşlemler */}
            <div role="cell" className="flex items-center justify-end gap-2 order-5 md:order-none">
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href={`/accounts/${a.id}/edit`}
                  className="p-1.5 sm:p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <button
                  onClick={() => deleteAccount(a.id)}
                  disabled={deletingId === a.id}
                  className="p-1.5 sm:p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-50 rounded"
                  title="Sil"
                >
                  {deletingId === a.id ? (
                    <svg className="w-4 h-4 sm:w-4 sm:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}