'use client';

import { useMemo } from 'react';
import { type CategoryTotal } from '@/lib/reports';
import { fmtMoney } from '@/lib/format';

type Props = { title: string; currency?: string; items: CategoryTotal[] };

export default function CategoryTotals({ title, currency = 'TRY', items }: Props) {
  const totals = useMemo(
    () =>
      (items ?? []).map((c) => ({
        ...c,
        _value: Math.abs(Number(c.total) || 0),
      })),
    [items]
  );

  const grand = useMemo(
    () => totals.reduce((acc, it) => acc + it._value, 0),
    [totals]
  );

  const colorClass = useMemo(() => {
    const t = (title || '').toLowerCase();
    if (t.includes('gelir')) return 'from-green-500 to-emerald-600';
    if (t.includes('gider')) return 'from-red-500 to-pink-600';
    return 'from-blue-500 to-purple-600';
  }, [title]);

  const iconColor = useMemo(() => {
    const t = (title || '').toLowerCase();
    if (t.includes('gelir')) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (t.includes('gider')) return 'bg-gradient-to-r from-red-500 to-red-600';
    return 'bg-gradient-to-r from-blue-500 to-blue-600';
  }, [title]);

  if (!items?.length) {
    return (
      <div className="reveal">
        <div className="bg-gradient-to-br from-gray-50/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-900/20 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 dark:border-gray-700/50">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-medium">Veri yok.</p>
            <p className="text-xs text-gray-400 mt-1">Kategori verileri burada görünecek</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal">
      {/* Başlık */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Kategori bazlı dağılım</p>
      </div>

      {/* Kategoriler */}
      <div className="space-y-4">
        {totals.map((c) => {
          const percent = grand > 0 ? Math.min(100, Math.round((c._value / grand) * 100)) : 0;
          return (
            <div
              key={c.categoryId}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 p-5 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                {/* Kategori İkonu */}
                <div className={`w-10 h-10 rounded-2xl ${iconColor} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>

                {/* Kategori Adı ve Tutar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate text-lg" title={c.name}>
                      {c.name}
                    </h4>
                    <span className="tabular-nums font-bold text-gray-900 dark:text-white text-lg">
                      {fmtMoney(Math.abs(Number(c.total)), currency || 'TRY')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div
                  className="h-4 w-full rounded-xl bg-gray-100/50 dark:bg-gray-700/50 overflow-hidden backdrop-blur-sm"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-label={`${c.name} payı`}
                  title={`${percent}%`}
                >
                  <div
                    className={`h-full rounded-xl bg-gradient-to-r ${colorClass} transition-all duration-500 ease-out shadow-sm`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                
                {/* Yüzde Etiketi */}
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 border border-white/20 dark:border-gray-700/50 shadow-lg backdrop-blur-sm">
                    {percent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toplam Özeti */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/20 dark:to-purple-900/20 backdrop-blur-sm rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-lg">Toplam</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title} toplamı</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {fmtMoney(grand, currency || 'TRY')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              {totals.length} kategori
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}