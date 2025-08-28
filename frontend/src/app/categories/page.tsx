import { Suspense } from 'react';
import CategoriesClient from './CategoriesClient';

export default function CategoriesPage() {
  return (
    <Suspense fallback={<main className="p-6">Yükleniyor…</main>}>
      <CategoriesClient />
    </Suspense>
  );
}