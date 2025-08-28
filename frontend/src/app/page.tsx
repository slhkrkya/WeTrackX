'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Health = { status: string };

export default function Home() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api<Health>('/health');
        setStatus(res.status === 'ok' ? 'ok' : 'error');
        setMessage(JSON.stringify(res));
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message ?? 'unknown error');
      }
    })();
  }, []);

  return (
    <main className="min-h-dvh p-8 flex flex-col items-start gap-6">
      <h1 className="text-3xl font-bold">WeTrackX</h1>
      <h1 className="text-3xl font-bold">WeTrackX</h1>
      <p className="mt-2 text-sm text-gray-600">
        Tailwind kurulum testi: bu metin gri görünmeli.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">API Sağlık Durumu</h2>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border
          ${status === 'ok' ? 'border-green-500' : status === 'error' ? 'border-red-500' : 'border-gray-400'}`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full
            ${status === 'ok' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`}
          />
          <span>
            {status === 'loading' ? 'Yükleniyor…' : status === 'ok' ? 'OK' : 'HATA'}
          </span>
        </div>
        <pre className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-md max-w-full overflow-auto">
          {message}
        </pre>
      </section>
    </main>
  );
}