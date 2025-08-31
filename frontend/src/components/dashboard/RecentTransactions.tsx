'use client';

import { useRouter } from 'next/navigation';
import { type TxItem } from '@/lib/reports';
import { type AccountDTO } from '@/lib/accounts';
import { type BalanceItem } from '@/lib/reports';
import { fmtMoney, fmtDate } from '@/lib/format';
import { ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';

type Props = { 
  items: TxItem[];
  selectedAccountId?: string;
  accounts?: AccountDTO[];
  balances?: BalanceItem[];
  onSelectAccount?: (accountId: string) => void;
};

const typeStyles = {
  INCOME:   { 
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50/50 dark:bg-green-900/10',
    border: 'border-green-200/50 dark:border-green-800/30',
    icon: 'bg-gradient-to-r from-green-500 to-green-600'
  },
  EXPENSE:  { 
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50/50 dark:bg-red-900/10',
    border: 'border-red-200/50 dark:border-red-800/30',
    icon: 'bg-gradient-to-r from-red-500 to-red-600'
  },
  TRANSFER: { 
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50/50 dark:bg-blue-900/10',
    border: 'border-blue-200/50 dark:border-blue-800/30',
    icon: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
};

// Hesap türüne göre küçük kart stilleri
const accountCardStyles = {
  BANK: {
    gradient: 'bg-gradient-to-br from-gray-600 via-slate-700 to-gray-800',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  CASH: {
    gradient: 'bg-gradient-to-br from-amber-800 via-yellow-600 to-orange-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  CARD: {
    gradient: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  WALLET: {
    gradient: 'bg-gradient-to-tr from-green-300 via-teal-400 to-cyan-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  }
};

// function TypePill({ type }: { type: TxItem['type'] }) {
//   const style = typeStyles[type] ?? typeStyles.INCOME;
//   return (
//     <span
//       className={[
//         'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm',
//         style.bg,
//         style.text,
//         style.border,
//       ].join(' ')}
//     >
//       {KIND_LABELS_TR[type]}
//     </span>
//   );
// }

export default function RecentTransactions({ items, selectedAccountId, accounts, balances, onSelectAccount }: Props) {
  const router = useRouter();

  // Seçilen hesap bilgilerini al
  const selectedAccount = selectedAccountId && selectedAccountId !== 'all' 
    ? accounts?.find(a => a.id === selectedAccountId) 
    : null;
  
  const selectedBalance = selectedAccountId && selectedAccountId !== 'all'
    ? balances?.find(b => b.accountId === selectedAccountId)
    : null;

  // Toplam bakiye (tüm hesaplar için)
  const totalBalance = balances?.reduce((sum, balance) => sum + Number(balance.balance), 0) || 0;

  // Hesap bakiyesini bul
  const getBalanceForAccount = (accountId: string) => {
    const balance = balances?.find(b => b.accountId === accountId);
    return balance?.balance || '0';
  };

  if (!items?.length) {
    return (
      <div className="reveal">
        <div className="bg-gradient-to-br from-gray-50/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/20 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">
              {selectedAccount 
                ? `${selectedAccount.name} hesabında henüz işlem yok.`
                : 'Henüz işlem yok.'
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {selectedAccount 
                ? 'Bu hesapta işlem yaptığınızda burada görünecek'
                : 'İşlem yaptığınızda burada görünecek'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal">
      {/* Başlık */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Son İşlemler
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Son finansal aktiviteleriniz</p>
      </div>

      {/* Hesap Seçimi */}
      {accounts && balances && onSelectAccount && (
        <div className="mb-6">
          {/* Başlık */}
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Hesap Seçimi
            </h4>
          </div>

          {/* Hesap Seçiciler */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Tüm Hesaplar */}
            <button
              onClick={() => onSelectAccount('all')}
              className={[
                'relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg',
                'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20',
                'border-blue-200 dark:border-blue-800/30',
                selectedAccountId === 'all' || !selectedAccountId
                  ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                  : 'hover:border-blue-300 dark:hover:border-blue-700'
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0V5a2 2 0 00-2-2H5a2 2 0 00-2 2v4" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">Tüm Hesaplar</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    ₺{totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </button>

            {/* Bireysel Hesaplar */}
            {accounts.map((account) => {
              const styles = accountCardStyles[account.type] || accountCardStyles.BANK;
              const balance = getBalanceForAccount(account.id);
              const isSelected = selectedAccountId === account.id;

              return (
                <button
                  key={account.id}
                  onClick={() => onSelectAccount(account.id)}
                  className={[
                    'relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg',
                    styles.gradient,
                    'border-white/20 dark:border-gray-700/50',
                    isSelected
                      ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                      : 'hover:border-white/40 dark:hover:border-gray-600'
                  ].join(' ')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                      {styles.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-white text-sm truncate" title={account.name}>
                        {account.name}
                      </p>
                      <p className="text-xs text-white/80">
                        ₺{Number(balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hesap Türü Etiketi */}
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm text-white">
                      {ACCOUNT_TYPE_LABELS_TR[account.type]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Hesap Özeti (Seçilen hesap için) */}
      {selectedAccount && selectedBalance && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{selectedAccount.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Seçili hesap</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {fmtMoney(Number(selectedBalance.balance), selectedBalance.currency)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Mevcut bakiye
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tüm Hesaplar Özeti */}
      {(!selectedAccountId || selectedAccountId === 'all') && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/20 dark:to-blue-900/20 backdrop-blur-sm rounded-2xl border border-green-100/50 dark:border-green-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white text-lg">Tüm Hesaplar</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Toplam bakiye</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {fmtMoney(totalBalance, 'TRY')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {balances?.length || 0} hesap
              </p>
            </div>
          </div>
        </div>
      )}

      {/* İşlemler Listesi */}
      <div className="space-y-4">
        {items.map((t) => {
          const income = t.type === 'INCOME';
          const expense = t.type === 'EXPENSE';
          const style = typeStyles[t.type] ?? typeStyles.INCOME;

          return (
            <div
              key={t.id}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-5 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                {/* İkon */}
                <div className={`w-12 h-12 rounded-2xl ${style.icon} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  {t.type === 'INCOME' ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  ) : t.type === 'EXPENSE' ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  )}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                      {t.type === 'TRANSFER' 
                        ? `${t.fromAccount?.name} → ${t.toAccount?.name}`
                        : selectedAccountId && selectedAccountId !== 'all'
                          ? t.title || t.category?.name || '-'
                          : t.account?.name || '-'
                      }
                    </h4>
                    <div className="text-right">
                      {income ? (
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                          +{fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                        </span>
                      ) : expense ? (
                        <span className="text-red-600 dark:text-red-400 font-bold text-lg">
                          -{fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                        </span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                          {fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {selectedAccountId && selectedAccountId !== 'all'
                          ? (t.category?.name || (t.type === 'TRANSFER' ? 'Transfer' : 'İşlem'))
                          : (t.category?.name || (t.type === 'TRANSFER' ? '—' : '-'))
                        }
                      </span>
                      {t.description && selectedAccountId && selectedAccountId !== 'all' && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-500 truncate max-w-40">
                            {t.description}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {fmtDate(t.date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daha Fazla Butonu */}
      <div className="mt-8 text-center">
        <button 
          onClick={() => router.push('/transactions')}
          className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Tüm İşlemleri Gör
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}