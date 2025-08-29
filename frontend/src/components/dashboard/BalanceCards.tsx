'use client';

import { type BalanceItem } from '@/lib/reports';
import { fmtMoney } from '@/lib/format';

type Props = { items: BalanceItem[] };

export default function BalanceCards({ items }: Props) {
  if (!items?.length) {
    return <div className="label-soft text-sm">Henüz hesap bulunmuyor.</div>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => {
        const val = Number(it.balance) || 0;
        const isNeg = val < 0;
        const isZero = val === 0;
        const amountColor = isNeg
          ? 'text-[rgb(var(--error))]'
          : isZero
            ? 'text-muted-foreground'
            : 'text-[rgb(var(--success))]';

        return (
          <article
            key={it.accountId}
            className={[
              'reveal h-full rounded-2xl p-4',
              'bg-[rgb(var(--surface-1))] ring-1 ring-black/5',
              'transition-all hover:shadow-sm hover:-translate-y-[1px]',
              'focus-within:shadow-sm',
            ].join(' ')}
            aria-label={`${it.name} hesabı bakiyesi`}
            title={`${it.name} • ${it.currency}`}
          >
            <div className="flex items-start justify-between gap-2">
              {/* Hesap adı */}
              <div className="min-w-0">
                <div className="label-soft text-sm truncate">{it.name}</div>
                {/* Para birimi etiketi */}
                <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 h-6 text-[11px] ring-1 ring-black/5 bg-[rgb(var(--card))]">
                  <span className="uppercase tracking-wide">{it.currency}</span>
                </div>
              </div>

              {/* Odak için görünmez buton (a11y) – burada ileride “Detay” gibi aksiyon eklenebilir */}
              <button
                className="sr-only focus:not-sr-only focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded"
                aria-label={`${it.name} kartı odak`}
              />
            </div>

            {/* Tutar */}
            <div className={['mt-3 text-2xl font-semibold tabular-nums', amountColor].join(' ')}>
              {fmtMoney(it.balance, it.currency)}
            </div>
          </article>
        );
      })}
    </div>
  );
}