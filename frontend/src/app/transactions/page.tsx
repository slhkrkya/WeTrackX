import { Suspense } from 'react';
import TransactionsClient from './TransactionsClient';

export default function TransactionsPage() {
  return (
    <Suspense fallback={<main className="p-6">Yükleniyor…</main>}>
      <TransactionsClient />
    </Suspense>
  );
}