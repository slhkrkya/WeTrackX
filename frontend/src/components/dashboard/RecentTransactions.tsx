'use client';

import { type TxItem } from '@/lib/reports';
import { fmtMoney, fmtDate } from '@/lib/format';

type Props = { items: TxItem[] };

const KIND_LABELS_TR: Record<TxItem['type'], string> = {
  INCOME: 'Gelir',
  EXPENSE: 'Gider',
  TRANSFER: 'Transfer',
};

const typeStyles: Record<TxItem['type'], { text: string }> = {
  INCOME:   { text: 'text-[rgb(var(--success))]' },
  EXPENSE:  { text: 'text-[rgb(var(--error))]' },
  TRANSFER: { text: 'text-[rgb(var(--accent))]' },
};

function TypePill({ type }: { type: TxItem['type'] }) {
  const clr = typeStyles[type]?.text ?? '';
  return (
    <span
      className={[
        'pill text-[11px] h-6 px-2',
        'bg-elevated',
        clr,
      ].join(' ')}
    >
      {KIND_LABELS_TR[type]}
    </span>
  );
}

export default function RecentTransactions({ items }: Props) {
  if (!items?.length) {
    return (
      <div className="reveal card">
        <div className="subtext text-sm">Henüz işlem yok.</div>
      </div>
    );
  }

  return (
    <div className="reveal card overflow-hidden">
      {/* Başlık */}
      <div className="px-4 py-3 text-sm font-medium">Son İşlemler</div>

      <div className="border-t border-black/5">
        {/* Tablo başlığı: sadece md+ */}
        <div className="hidden md:grid grid-cols-6 gap-2 px-4 py-2 text-[11px] subtext">
          <div>Tarih</div>
          <div>Tür</div>
          <div className="col-span-2">Hesap / Karşı Hesap</div>
          <div>Kategori</div>
          <div className="text-right">Tutar</div>
        </div>

        <ul className="divide-y">
          {items.map((t) => {
            const income = t.type === 'INCOME';
            const expense = t.type === 'EXPENSE';

            return (
              <li
                key={t.id}
                className={[
                  'grid md:grid-cols-6 grid-cols-2 gap-2 px-4 py-2 text-sm',
                  'hover:bg-[rgb(var(--surface-1))]/60 transition-colors',
                  'focus-within:bg-[rgb(var(--surface-1))]/60',
                ].join(' ')}
              >
                {/* Tarih */}
                <div className="subtext order-1">{fmtDate(t.date)}</div>

                {/* Tür */}
                <div className="order-2">
                  <TypePill type={t.type} />
                </div>

                {/* Hesap / Karşı Hesap + açıklama */}
                <div
                  className={[
                    'md:col-span-2 col-span-2 order-3',
                  ].join(' ')}
                >
                  {t.type === 'TRANSFER' ? (
                    <span className="truncate block">
                      {t.fromAccount?.name} → {t.toAccount?.name}
                    </span>
                  ) : (
                    <span className="truncate block">{t.account?.name || '-'}</span>
                  )}
                  {t.description ? (
                    <span className="subtext text-xs truncate block">{t.description}</span>
                  ) : null}
                </div>

                {/* Kategori */}
                <div className="truncate order-4">
                  {t.category?.name || (t.type === 'TRANSFER' ? '—' : '-')}
                </div>

                {/* Tutar */}
                <div
                  className={[
                    'tabular-nums text-right md:col-span-1 col-span-2 order-5',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--card))]',
                  ].join(' ')}
                >
                  {income ? (
                    <span className="money-in">
                      + {fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                    </span>
                  ) : expense ? (
                    <span className="money-out">
                      - {fmtMoney(Math.abs(Number(t.amount)), t.currency)}
                    </span>
                  ) : (
                    fmtMoney(Math.abs(Number(t.amount)), t.currency)
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}