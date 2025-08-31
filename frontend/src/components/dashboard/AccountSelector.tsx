'use client';

import { type AccountDTO } from '@/lib/accounts';
import { type BalanceItem } from '@/lib/reports';
import { ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';

type Props = {
  accounts: AccountDTO[];
  balances: BalanceItem[];
  selectedAccountId?: string;
  onSelectAccount: (accountId: string) => void;
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

export default function AccountSelector({ accounts, balances, selectedAccountId, onSelectAccount }: Props) {
  // Hesap bakiyesini bul
  const getBalanceForAccount = (accountId: string) => {
    const balance = balances.find(b => b.accountId === accountId);
    return balance?.balance || '0';
  };

  // Toplam bakiye
  const totalBalance = balances.reduce((sum, balance) => sum + Number(balance.balance), 0);

  if (!accounts?.length) {
    return (
      <div className="reveal">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Hesap yok</p>
            <p className="text-xs text-gray-400 mt-1">Hesap ekleyerek başlayın</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal">
      {/* Başlık */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Hesap Seçimi</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Hangi hesabın işlemlerini görmek istiyorsunuz?</p>
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
  );
}
