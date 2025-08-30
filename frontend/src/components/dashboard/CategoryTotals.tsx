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
    if (t.includes('gelir')) return 'bg-green-500';
    if (t.includes('gider')) return 'bg-red-500';
    return 'bg-blue-500';
  }, [title]);

  if (!items?.length) {
    return (
      <div className="reveal">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 shadow-lg">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm">Veri yok.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reveal">
      {/* Başlık */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Kategori bazlı dağılım</p>
      </div>

      {/* Kategoriler */}
      <div className="space-y-3">
        {totals.map((c) => {
          const percent = grand > 0 ? Math.min(100, Math.round((c._value / grand) * 100)) : 0;
          return (
            <div
              key={c.categoryId}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-3">
                {/* Kategori İkonu */}
                <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>

                {/* Kategori Adı ve Tutar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate" title={c.name}>
                      {c.name}
                    </h4>
                    <span className="tabular-nums font-semibold text-gray-900 dark:text-white">
                      {fmtMoney(Math.abs(Number(c.total)), currency || 'TRY')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div
                  className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-label={`${c.name} payı`}
                  title={`${percent}%`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500 ease-out shadow-sm`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                
                {/* Yüzde Etiketi */}
                <div className="absolute -top-1 -right-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 shadow-sm">
                    {percent}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toplam Özeti */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">Toplam</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{title} toplamı</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {fmtMoney(grand, currency || 'TRY')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totals.length} kategori
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}