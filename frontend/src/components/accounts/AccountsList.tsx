'use client';

import { type AccountDTO } from '@/lib/accounts';

type Props = { items: AccountDTO[] };

export default function AccountsList({ items }: Props) {
  if (!items?.length) {
    return (
      <div className="rounded-xl border p-4 text-sm opacity-70">
        Hiç hesap yok. Sağ üstten “Yeni Hesap” oluşturabilirsin.
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="grid grid-cols-4 gap-2 px-4 py-2 text-[11px] opacity-60">
        <div>Ad</div>
        <div>Tür</div>
        <div>Para Birimi</div>
        <div>Oluşturma</div>
      </div>
      <ul className="divide-y">
        {items.map((a) => (
          <li key={a.id} className="grid grid-cols-4 gap-2 px-4 py-2 text-sm">
            <div className="truncate">{a.name}</div>
            <div>{a.type}</div>
            <div>{a.currency}</div>
            <div className="opacity-70">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
