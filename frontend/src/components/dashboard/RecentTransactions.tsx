'use client';

import { TxItem } from '@/lib/reports';
import { fmtMoney, fmtDate } from '@/lib/format';

type Props = { items: TxItem[] };

function badge(type: TxItem['type']) {
  const base = 'inline-flex items-center px-2 py-0.5 text-xs rounded-full border';
  if (type === 'INCOME') return `${base}`;
  if (type === 'EXPENSE') return `${base}`;
  return `${base}`;
}

export default function RecentTransactions({ items }: Props) {
  if (!items?.length) {
    return (
      <div className="rounded-xl border p-4">
        <div className="text-sm opacity-70">Henüz işlem yok.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <div className="px-4 py-3 text-sm font-medium">Son İşlemler</div>
      <div className="border-t">
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-[11px] opacity-60">
          <div>Tarih</div>
          <div>Tür</div>
          <div className="col-span-2">Hesap / Karşı Hesap</div>
          <div>Kategori</div>
          <div className="text-right">Tutar</div>
        </div>
        <ul className="divide-y">
          {items.map((t) => (
            <li key={t.id} className="grid grid-cols-6 gap-2 px-4 py-2 text-sm">
              <div>{fmtDate(t.date)}</div>
              <div><span className={badge(t.type)}>{t.type}</span></div>
              <div className="col-span-2">
                {t.type === 'TRANSFER' ? (
                  <span className="truncate inline-block">
                    {t.fromAccount?.name} → {t.toAccount?.name}
                  </span>
                ) : (
                  <span className="truncate inline-block">
                    {t.account?.name || '-'}
                  </span>
                )}
                {t.description ? (
                  <div className="text-xs opacity-60 truncate">{t.description}</div>
                ) : null}
              </div>
              <div className="truncate">{t.category?.name || (t.type === 'TRANSFER' ? '—' : '-')}</div>
              <div className="text-right tabular-nums">
                {/* Gelir +, Gider -; Transfer tutarı nötr */}
                {t.type === 'INCOME'
                  ? `+ ${fmtMoney(t.amount, t.currency)}`
                  : t.type === 'EXPENSE'
                  ? `- ${fmtMoney(t.amount, t.currency)}`
                  : fmtMoney(t.amount, t.currency)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
