'use client';

import { useState, useEffect } from 'react';
import { type AccountDTO } from '@/lib/accounts';
import { AccountsAPI } from '@/lib/accounts';
import { ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (id: string) => void;
};

// Hesap türüne göre renkler
const accountTypeColors = {
  BANK: 'bg-gray-100 text-gray-800',
  CASH: 'bg-amber-100 text-amber-800',
  CARD: 'bg-blue-100 text-blue-800',
  WALLET: 'bg-green-100 text-green-800',
};

export default function DeletedAccountsModal({ isOpen, onClose, onRestore }: Props) {
  const [deletedAccounts, setDeletedAccounts] = useState<AccountDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { show } = useToast();

  // Silinmiş hesapları yükle
  useEffect(() => {
    if (isOpen) {
      loadDeletedAccounts();
    }
  }, [isOpen]);

  async function loadDeletedAccounts() {
    try {
      setLoading(true);
      const accounts = await AccountsAPI.listDeleted();
      setDeletedAccounts(accounts);
    } catch (error: any) {
      console.error('Silinmiş hesaplar yüklenirken hata:', error);
      show('Silinmiş hesaplar yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(id: string) {
    const account = deletedAccounts.find(acc => acc.id === id);
    const accountName = account?.name || 'Hesap';
    
    if (!confirm(`${accountName} hesabını geri yüklemek istediğinizden emin misiniz?\n\n✅ Hesap ve tüm işlemleri geri yüklenecek.\n📊 İşlem geçmişi korunacak.`)) {
      return;
    }

    try {
      setRestoringId(id);
      const result = await AccountsAPI.restore(id);
      
      // Eğer result boşsa veya geçersizse hata olarak kabul et
      if (!result || !result.id) {
        throw new Error('Hesap geri yüklendi ancak doğrulanamadı');
      }
      
      // Listeyi güncelle
      setDeletedAccounts(prev => prev.filter(acc => acc.id !== id));
      
      // Parent component'e bildir
      onRestore(id);
      
      show(`${accountName} hesabı başarıyla geri yüklendi`, 'success');
    } catch (error: any) {
      console.error('Hesap geri yükleme hatası:', error);
      let message = 'Hesap geri yüklenirken hata oluştu';
      
      if (error?.message?.includes('not found') || error?.message?.includes('bulunamadı')) {
        message = 'Hesap bulunamadı. Sayfayı yenileyip tekrar deneyin.';
      } else if (error?.message?.includes('not deleted') || error?.message?.includes('aktif durumda')) {
        message = 'Bu hesap zaten aktif durumda.';
      } else if (error?.message?.includes('beklenmeyen bir hata')) {
        message = 'Hesap geri yüklenirken teknik bir hata oluştu. Lütfen tekrar deneyin.';
      } else if (error?.message) {
        message = error.message;
      }
      
      show(message, 'error');
    } finally {
      setRestoringId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Silinmiş Hesaplar
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Silinmiş hesaplar 7 gün sonra otomatik olarak kalıcı silinir
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
            </div>
          ) : deletedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
                             <h3 className="text-lg font-semibold mb-2">Silinmiş Hesap Yok</h3>
               <p className="text-gray-600 dark:text-gray-400 mb-4">
                 Henüz silinmiş hesap bulunmuyor.
               </p>
               <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                 <div className="flex items-start space-x-3">
                   <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <div>
                     <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Bilgi</h4>
                     <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                       Hesap sildiğinizde 7 gün boyunca geri yükleyebilirsiniz. Bu süre sonunda hesap kalıcı olarak silinir.
                     </p>
                   </div>
                 </div>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              {deletedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 gap-3"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${accountTypeColors[account.type]}`}>
                      {ACCOUNT_TYPE_LABELS_TR[account.type]}
                    </div>
                                         <div className="min-w-0 flex-1">
                       <h3 className="font-medium text-gray-900 dark:text-white truncate">
                         {account.name}
                       </h3>
                       <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                         <p className="text-sm text-gray-500 dark:text-gray-400">
                           Silinme: {new Date(account.deletedAt || '').toLocaleDateString('tr-TR')}
                         </p>
                         {(() => {
                           const deletedDate = new Date(account.deletedAt || '');
                           const now = new Date();
                           const expiryDate = new Date(deletedDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                           const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
                           
                           if (daysDiff <= 0) {
                             return (
                               <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded-full font-medium">
                                 Bugün silinecek
                               </span>
                             );
                           } else if (daysDiff <= 3) {
                             return (
                               <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 px-2 py-1 rounded-full font-medium">
                                 {daysDiff} gün kaldı
                               </span>
                             );
                           } else {
                             return (
                               <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
                                 {daysDiff} gün kaldı
                               </span>
                             );
                           }
                         })()}
                       </div>
                     </div>
                  </div>
                  
                  <button
                    onClick={() => handleRestore(account.id)}
                    disabled={restoringId === account.id}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                  >
                    {restoringId === account.id ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Geri Yükleniyor...</span>
                      </div>
                    ) : (
                      'Geri Yükle'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
