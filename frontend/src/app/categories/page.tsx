import { Suspense } from 'react';
import CategoriesClient from './CategoriesClient';
import SuspenseFallback from '@/components/SuspenseFallback';

export default function CategoriesPage() {
  return (
    <Suspense fallback={<SuspenseFallback message="Kategoriler yükleniyor..." />}>
      <CategoriesClient />
    </Suspense>
  );
}