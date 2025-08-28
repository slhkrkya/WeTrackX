'use client';
import { CategoryTotal } from '@/lib/reports';
import { fmtMoney } from '@/lib/format';

type Props = { title: string; currency?: string; items: CategoryTotal[] };

export default function CategoryTotals({ title, currency = 'TRY', items }: Props) {
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {!items?.length && <div className="text-sm opacity-70">Veri yok.</div>}
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.categoryId} className="flex items-center justify-between text-sm">
            <span className="truncate">{c.name}</span>
            <span className="tabular-nums">{fmtMoney(c.total, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
