'use client';

import { useState, useEffect } from 'react';
import { type AccountDTO } from '@/lib/accounts';
import { type BalanceItem } from '@/lib/reports';
import { AccountsAPI } from '@/lib/accounts';
import { ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';
import { getUser } from '@/lib/auth';
import Link from 'next/link';
import React from 'react';
import DeletedAccountsModal from './DeletedAccountsModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Props = { 
  items: AccountDTO[];
  balances?: BalanceItem[];
  onDelete?: (id: string) => void;
  onRestore?: (id: string) => void;
};

// localStorage key'i - kullanıcıya özel
const getAccountOrderKey = (userId?: string) => `weTrackX_accountOrder_${userId || 'anonymous'}`;

// Hesap türüne göre kart stilleri
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

// Sürüklenebilir hesap kartı component'i
function SortableAccountCard({ 
  account, 
  styles, 
  isWallet, 
  getBalanceForAccount, 
  deleteAccount, 
  deletingId 
}: {
  account: AccountDTO;
  styles: {
    gradient: string;
    pattern: string;
    decoration: string;
    icon: React.ReactNode;
  };
  isWallet: boolean;
  getBalanceForAccount: (id: string) => string;
  deleteAccount: (id: string) => void;
  deletingId: string | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: account.id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`snap-center shrink-0 w-full h-48 rounded-2xl shadow-lg 
        ${styles.gradient} 
        ${isWallet ? 'text-gray-800 dark:text-gray-200' : 'text-white'} 
        p-6 flex flex-col justify-between relative overflow-hidden
        hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
        cursor-grab active:cursor-grabbing
        ${isDragging ? 'z-50' : ''}
        will-change-transform`}
    >
      {/* Arka plan deseni */}
      <div className={`absolute inset-0 ${styles.pattern} opacity-10`} style={{ backgroundSize: '50px' }}></div>
      
      {/* Dekoratif element */}
      <div className={styles.decoration}></div>

      {/* Sürükleme göstergesi */}
      <div className="absolute top-2 right-2 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Üst kısım - Hesap adı ve ikon */}
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold truncate">{account.name}</h3>
          <div className="flex-shrink-0">
            {styles.icon}
          </div>
        </div>
        <p className="text-sm opacity-80">{ACCOUNT_TYPE_LABELS_TR[account.type]}</p>
      </div>

      {/* Alt kısım - Bakiye ve işlemler */}
      <div className="relative z-10">
        <p className="text-2xl font-bold tracking-tight">
          ₺{getBalanceForAccount(account.id)}
        </p>
        <p className="text-xs opacity-80">
          Son güncelleme: {new Date(account.updatedAt).toLocaleDateString('tr-TR')}
        </p>
      </div>

      {/* Aksiyon butonları - Hover'da görünür */}
      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
        <Link
          href={`/accounts/${account.id}/edit`}
          className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
          title="Düzenle"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </Link>
        <button
          onClick={() => deleteAccount(account.id)}
          disabled={deletingId === account.id}
          className="p-2 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-500 transition-colors disabled:opacity-50"
          title="Sil"
        >
          {deletingId === account.id ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function AccountCards({ items, balances, onDelete, onRestore }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState<AccountDTO[]>(items);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const { show } = useToast();

  // Sürükleme sensörleri - performans optimizasyonu
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px hareket etmeden sürükleme başlamaz
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // localStorage'dan sıralama durumunu yükle
  const loadAccountOrder = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const user = getUser();
      const orderKey = getAccountOrderKey(user?.id);
      const savedOrder = localStorage.getItem(orderKey);
      return savedOrder ? JSON.parse(savedOrder) : [];
    } catch (error) {
      console.error('Sıralama durumu yüklenirken hata:', error);
      return [];
    }
  };

  // localStorage'a sıralama durumunu kaydet
  const saveAccountOrder = (order: string[]) => {
    if (typeof window === 'undefined') return;
    try {
      const user = getUser();
      const orderKey = getAccountOrderKey(user?.id);
      localStorage.setItem(orderKey, JSON.stringify(order));
    } catch (error) {
      console.error('Sıralama durumu kaydedilirken hata:', error);
    }
  };

  // Sürükleme bittiğinde çağrılır
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newOrderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Yeni sıralamayı localStorage'a kaydet
        const newOrder = newOrderedItems.map(item => item.id);
        saveAccountOrder(newOrder);
        
        return newOrderedItems;
      });
    }
  }

  // items değiştiğinde orderedItems'ı güncelle ve sıralama durumunu uygula
  useEffect(() => {
    if (!items?.length) {
      setOrderedItems([]);
      return;
    }

    const savedOrder = loadAccountOrder();
    
    // Eğer kaydedilmiş sıralama varsa ve tüm hesaplar mevcutsa, o sıralamayı kullan
    if (savedOrder.length > 0 && savedOrder.length === items.length) {
      const allIdsExist = savedOrder.every(id => items.some(item => item.id === id));
      
      if (allIdsExist) {
        // Kaydedilmiş sıralamaya göre hesapları düzenle
        const orderedAccounts = savedOrder.map(id => 
          items.find(item => item.id === id)!
        );
        setOrderedItems(orderedAccounts);
        return;
      }
    }
    
    // Kaydedilmiş sıralama yoksa veya geçersizse, varsayılan sıralamayı kullan
    setOrderedItems(items);
    
    // Yeni hesaplar için varsayılan sıralamayı kaydet
    const defaultOrder = items.map(item => item.id);
    saveAccountOrder(defaultOrder);
  }, [items]);

  // Hesap için bakiye bulma fonksiyonu
  function getBalanceForAccount(accountId: string): string {
    const balanceItem = balances?.find(b => b.accountId === accountId);
    if (!balanceItem) return '0.00';
    const balance = parseFloat(balanceItem.balance || '0');
    return balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  }

  // Toplam bakiye hesaplama
  function getTotalBalance(): string {
    if (!balances?.length) return '0.00';
    const total = balances.reduce((sum, balance) => sum + parseFloat(balance.balance || '0'), 0);
    return total.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  }

  // Hesap silme fonksiyonu
  async function deleteAccount(id: string) {
    const account = items.find(item => item.id === id);
    const accountName = account?.name || 'Hesap';
    
    if (!confirm(`${accountName} hesabını silmek istediğinizden emin misiniz?\n\n⚠️ Hesap silinecek ancak 7 gün boyunca geri yüklenebilir.\n💾 İşlemler korunacaktır.\n⏰ 7 gün sonra kalıcı olarak silinir.\n\n📊 Bu hesaba ait tüm işlemler de geçici olarak gizlenecek.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await AccountsAPI.delete(id);
      
      // Silinen hesabı localStorage'dan da çıkar
      const currentOrder = loadAccountOrder();
      const updatedOrder = currentOrder.filter(accountId => accountId !== id);
      saveAccountOrder(updatedOrder);
      
      onDelete?.(id);
      show(`${accountName} hesabı başarıyla silindi`, 'success');
    } catch (error: unknown) {
      let message = 'Hesap silinirken beklenmeyen bir hata oluştu';
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          message = 'Hesap bulunamadı. Sayfayı yenileyip tekrar deneyin.';
        } else {
          message = error.message;
        }
      }
      
      show(message, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  if (!items?.length) {
    return (
      <div className="reveal text-center py-8 sm:py-12">
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
    <div className="reveal space-y-6">
      {/* Modern Hesap Kartları */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={orderedItems.map(item => item.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {orderedItems.map((account) => {
              const styles = accountCardStyles[account.type];
              const isWallet = account.type === 'WALLET';
              
              return (
                <SortableAccountCard
                  key={account.id}
                  account={account}
                  styles={styles}
                  isWallet={isWallet}
                  getBalanceForAccount={getBalanceForAccount}
                  deleteAccount={deleteAccount}
                  deletingId={deletingId}
                />
              );
            })}
            
            {/* Yeni Hesap Ekleme Kartı */}
            <Link
              href="/accounts/new"
              className="snap-center shrink-0 w-full h-48 rounded-2xl shadow-lg 
                bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20
                border-2 border-dashed border-blue-300 dark:border-blue-600
                p-6 flex flex-col items-center justify-center relative overflow-hidden
                hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1
                hover:border-blue-400 dark:hover:border-blue-500
                group"
            >
              {/* Arka plan deseni */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 to-purple-100/10 opacity-20"></div>

              {/* İçerik */}
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Yeni Hesap Ekle
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Finansal takibinize yeni hesap ekleyin
                </p>
              </div>
            </Link>
          </div>
        </SortableContext>
      </DndContext>

      {/* Hesap Özeti */}
      <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-800/30 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hesap Özeti</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Toplam hesap sayınız</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={() => setShowDeletedModal(true)}
              className="w-full sm:w-auto px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center group"
            >
              <svg className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span className="hidden sm:inline">Silinmiş Hesaplar</span>
              <span className="sm:hidden">Silinenler</span>
            </button>
            <div className="text-center sm:text-right w-full sm:w-auto">
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                ₺{getTotalBalance()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {items.length} hesap
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Silinmiş Hesaplar Modal */}
      <DeletedAccountsModal
        isOpen={showDeletedModal}
        onClose={() => setShowDeletedModal(false)}
        onRestore={(id) => {
          // Hesap geri yüklendiğinde parent component'e bildir
          if (onRestore) {
            onRestore(id);
          }
          // Modal'ı kapat
          setShowDeletedModal(false);
        }}
      />
    </div>
  );
}
