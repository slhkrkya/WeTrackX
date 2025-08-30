'use client';

import { type AccountDTO } from '@/lib/accounts';
import { ACCOUNT_TYPE_LABELS_TR } from '@/lib/types';
import Link from 'next/link';

type Props = { items: AccountDTO[] };

const typeColor: Record<AccountDTO['type'], string> = {
  BANK: 'text-[rgb(var(--accent))]',
  CASH: 'text-[rgb(var(--success))]',
  CARD: 'text-[rgb(var(--warning))]',
  WALLET: 'text-[rgb(var(--primary))]',
};

export default function AccountsList({ items }: Props) {
  if (!items?.length) {
    return (
      <div className="reveal card text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Henüz Hesap Yok</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
          Finansal takibinize başlamak için önce bir hesap oluşturmanız gerekiyor. 
          Hesap oluşturduktan sonra işlemlerinizi kaydetmeye başlayabilirsiniz.
        </p>
        <Link href="/accounts/new" className="btn btn-primary">
          Hesap Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="reveal card overflow-hidden" role="table" aria-label="Hesap listesi">
      {/* Tablo başlığı: sadece md+ */}
      <div className="hidden md:grid grid-cols-4 gap-2 px-4 py-2 text-[11px] label-soft" role="rowgroup">
        <div role="columnheader">Ad</div>
        <div role="columnheader">Tür</div>
        <div role="columnheader">Para Birimi</div>
        <div role="columnheader">Oluşturma</div>
      </div>

      <ul className="divide-y" role="rowgroup">
        {items.map((a) => (
          <li
            key={a.id}
            role="row"
            className={[
              'grid md:grid-cols-4 grid-cols-2 gap-2 px-4 py-2 text-sm',
              'hover:bg-[rgb(var(--surface-1))]/60 transition-colors',
              'focus-within:bg-[rgb(var(--surface-1))]/60',
            ].join(' ')}
          >
            {/* Ad */}
            <div role="cell" className="truncate order-1 md:order-none md:col-auto col-span-2">
              <span className="font-medium">{a.name}</span>
            </div>

            {/* Tür */}
            <div role="cell" className="order-3 md:order-none">
              <span
                className={[
                  'pill h-6 px-2 text-[11px]',
                  typeColor[a.type] ?? 'text-foreground',
                  'bg-[rgb(var(--surface-1))]',
                ].join(' ')}
                title={ACCOUNT_TYPE_LABELS_TR[a.type]}
              >
                {ACCOUNT_TYPE_LABELS_TR[a.type]}
              </span>
            </div>

            {/* Para Birimi */}
            <div role="cell" className="order-4 md:order-none">
              <span
                className="pill h-6 px-2 text-[11px] uppercase tracking-wide bg-[rgb(var(--card))] ring-1 ring-black/5"
                title={a.currency}
              >
                {a.currency}
              </span>
            </div>

            {/* Oluşturma Tarihi */}
            <div role="cell" className="label-soft order-2 md:order-none text-xs md:text-sm">
              {new Date(a.createdAt).toLocaleDateString('tr-TR')}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}