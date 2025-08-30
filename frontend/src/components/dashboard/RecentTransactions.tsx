'use client';

import { type TxItem } from '@/lib/reports';
import { fmtMoney, fmtDate } from '@/lib/format';

type Props = { items: TxItem[] };

const KIND_LABELS_TR: Record<TxItem['type'], string> = {
  INCOME: 'Gelir',
  EXPENSE: 'Gider',
  TRANSFER: 'Transfer',
};

const typeStyles = {
  INCOME:   { 
    text: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'bg-green-500'
  },
  EXPENSE:  { 
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'bg-red-500'
  },
  TRANSFER: { 
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'bg-blue-500'
  },
};

function TypePill({ type }: { type: TxItem['type'] }) {
  const style = typeStyles[type] ?? typeStyles.INCOME;
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
        style.bg,
        style.text,
        style.border,
      ].join(' ')}
    >
      {KIND_LABELS_TR[type]}
    </span>
  );
}

export default function RecentTransactions({ items }: Props) {
  if (!items?.length) {
    return (
      <div className="reveal">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 shadow-lg">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm">Henüz işlem yok.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal">
      {/* Başlık */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Son İşlemler</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Son finansal aktiviteleriniz</p>
      </div>

      {/* İşlemler Listesi */}
      <div className="space-y-3">
        {items.map((t) => {
          const income = t.type === 'INCOME';
          const expense = t.type === 'EXPENSE';
          const style = typeStyles[t.type] ?? typeStyles.INCOME;

          return (
            <div
              key={t.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                {/* İkon */}
                <div className={`w-10 h-10 rounded-full ${style.icon} flex items-center justify-center flex-shrink-0`}>
                  {t.type === 'INCOME' ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  ) : t.type === 'EXPENSE' ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  )}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                      {t.type === 'TRANSFER' 
                        ? `${t.fromAccount?.name} → ${t.toAccount?.name}`
                        : t.account?.name || '-'
                      }
                    </h4>
                    <div className="text-right">
                      {income ? (
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          +{fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                        </span>
                      ) : expense ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          -{fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                        </span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                          {fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t.category?.name || (t.type === 'TRANSFER' ? '—' : '-')}
                      </span>
                      {t.description && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-500 truncate max-w-32">
                            {t.description}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
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
      <div className="mt-6 text-center">
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium text-sm">
          Tüm İşlemleri Gör
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}