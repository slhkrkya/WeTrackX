import { Suspense } from 'react';
import NewCategoryClient from './NewCategoryClient';

export default function NewCategoryPage() {
  return (
    <Suspense fallback={<main className="p-6">Yükleniyor…</main>}>
      <NewCategoryClient />
    </Suspense>
  );
}