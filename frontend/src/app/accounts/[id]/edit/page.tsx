import { Suspense } from 'react';
import AccountEditClient from './AccountEditClient';

export default async function AccountEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<main className="p-6">Yükleniyor…</main>}>
      <AccountEditClient id={id} />
    </Suspense>
  );
}
