import { Suspense } from 'react';
import CategoryEditClient from './CategoryEditClient';

export default async function CategoryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<main className="p-6">Yükleniyor…</main>}>
      <CategoryEditClient id={id} />
    </Suspense>
  );
}
