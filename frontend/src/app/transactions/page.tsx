import { Suspense } from 'react';
import TransactionsClient from './TransactionsClient';
import SuspenseFallback from '@/components/SuspenseFallback';

export default function TransactionsPage() {
  return (
    <Suspense fallback={<SuspenseFallback message="İşlemler yükleniyor..." />}>
      <TransactionsClient />
    </Suspense>
  );
}