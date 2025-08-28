'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Health = { status: string };

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export default function Home() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api<Health>('/health');
        setStatus(res.status === 'ok' ? 'ok' : 'error');
        setMessage(JSON.stringify(res));
      } catch (e: unknown) {
        setStatus('error');
        setMessage(getErrorMessage(e));
      }
    })();
  }, []);

  return (
    <main className="min-h-dvh p-6">
      <h1 className="text-2xl font-bold">WeTrackX</h1>
      <section className="space-y-2 mt-4">
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