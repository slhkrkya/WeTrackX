'use client';
import { BalanceItem } from '@/lib/reports';
import { fmtMoney } from '@/lib/format';

type Props = { items: BalanceItem[] };

export default function BalanceCards({ items }: Props) {
  if (!items?.length) {
    return <div className="text-sm opacity-70">Henüz hesap bulunmuyor.</div>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div key={it.accountId} className="rounded-xl border p-4">
          <div className="text-sm opacity-70">{it.name}</div>
          <div className="mt-1 text-2xl font-semibold">
            {fmtMoney(it.balance, it.currency)}
          </div>
          <div className="text-xs opacity-60">{it.currency}</div>
        </div>
      ))}
    </div>
  );
}
