'use client';

import { type BalanceItem } from '@/lib/reports';
import { fmtMoney } from '@/lib/format';

type Props = { items: BalanceItem[] };

export default function BalanceCards({ items }: Props) {
  if (!items?.length) {
    return (
      <div className="reveal">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-sm font-medium">Henüz hesap bulunmuyor.</p>
          <p className="text-xs text-gray-400 mt-1">Hesap eklediğinizde burada görünecek</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => {
        const val = Number(it.balance) || 0;
        const isNeg = val < 0;
        const isZero = val === 0;
        const amountColor = isNeg
          ? 'text-red-600 dark:text-red-400'
          : isZero
            ? 'text-gray-500 dark:text-gray-400'
            : 'text-green-600 dark:text-green-400';

        return (
          <article
            key={it.accountId}
            className="reveal bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg hover:-translate-y-2 transition-all duration-300"
            aria-label={`${it.name} hesabı bakiyesi`}
            title={`${it.name} • ${it.currency}`}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              {/* Hesap adı */}
              <div className="min-w-0">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium truncate">{it.name}</div>
                {/* Para birimi etiketi */}
                <div className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200/50 dark:border-blue-800/30 backdrop-blur-sm">
                  <span className="uppercase tracking-wide text-blue-600 dark:text-blue-400">{it.currency}</span>
                </div>
              </div>

              {/* Odak için görünmez buton (a11y) – burada ileride "Detay" gibi aksiyon eklenebilir */}
              <button
                className="sr-only focus:not-sr-only focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                aria-label={`${it.name} kartı odak`}
              />
            </div>

            {/* Tutar */}
            <div className={`text-3xl font-bold tabular-nums ${amountColor}`}>
              {fmtMoney(it.balance, it.currency)}
            </div>
          </article>
        );
      })}
    </div>
  );
}