import { Suspense } from 'react';
import NewTransactionClient from './NewTransactionClient';

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<main className="p-6">Yükleniyor…</main>}>
      <NewTransactionClient />
    </Suspense>
  );
}