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
    if (t.includes('gelir')) return 'bg-[rgb(var(--success))]';
    if (t.includes('gider')) return 'bg-[rgb(var(--error))]';
    return 'bg-[rgb(var(--accent))]';
  }, [title]);

  return (
    <div className="reveal card">
      <div className="mb-3 text-sm font-semibold text-foreground">{title}</div>

      {!items?.length && <div className="label-soft text-sm">Veri yok.</div>}

      <ul className="space-y-2">
        {totals.map((c) => {
          const percent = grand > 0 ? Math.min(100, Math.round((c._value / grand) * 100)) : 0;
          return (
            <li
              key={c.categoryId}
              className="flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="truncate font-medium" title={c.name}>{c.name}</span>
                <span className="tabular-nums font-semibold">
                  {fmtMoney(Math.abs(Number(c.total)), currency || 'TRY')}
                </span>
              </div>

              {/* Progress (pay göstergesi) */}
              <div
                className="h-2.5 w-full rounded-full bg-[rgb(var(--surface-1))] overflow-hidden ring-1 ring-black/5"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                aria-label={`${c.name} payı`}
                title={`${percent}%`}
              >
                <div
                  className={[
                    'h-full rounded-full transition-[width] duration-500 ease-out shadow-sm',
                    colorClass,
                  ].join(' ')}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Yüzde etiketi (soluk) */}
              <div className="text-[11px] text-muted-foreground font-medium">{percent}%</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}