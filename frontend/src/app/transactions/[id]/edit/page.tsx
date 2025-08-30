import { Suspense } from 'react';
import TransactionEditClient from './TransactionEditClient';

export default async function TransactionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<main className="p-6">Yükleniyor…</main>}>
      <TransactionEditClient id={id} />
    </Suspense>
  );
}
