'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
    <main>
      {/* === HERO / PARALLAX === */}
      <section className="relative overflow-clip">
        {/* Parallax background blob */}
        <div
          className="pointer-events-none absolute -top-32 -left-24 size-[520px] rounded-full blur-3xl"
          style={{ backgroundColor: 'rgb(var(--primary) / 0.12)' }}
          data-speed="0.8"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-[-10rem] size-[420px] rounded-full blur-3xl"
          style={{ backgroundColor: 'rgb(var(--accent) / 0.14)' }}
          data-speed="0.9"
        />

        <div className="container mx-auto px-4 py-20">
          <h1 className="reveal text-4xl md:text-6xl font-semibold tracking-tight">
            WeTrackX
          </h1>
          <p className="reveal mt-4 max-w-xl text-base md:text-lg label-soft">
            Gelir–giderlerini kaydet, kategorize et; dashboard ve raporlarla akıcı bir
            deneyimle takip et.
          </p>
          <div className="reveal mt-8 flex flex-wrap items-center gap-3">
            <Link href="/dashboard" className="btn btn-primary">
              Dashboard’a Git
            </Link>
            <Link href="/reports" className="btn btn-outline">
              Raporları Gör
            </Link>
          </div>

          {/* Örnek kart */}
          <div className="reveal mt-12 card">
            <div className="flex items-center justify-between">
              <span className="text-sm label-soft">Hızlı Bakış</span>
              <Link href="/transactions" className="nav-link">
                İşlemler
              </Link>
            </div>
            <p className="mt-3 text-sm label-soft">
              Tema değişkenleri ve bileşen sınıfları ile sade, tutarlı UI.
            </p>
          </div>
        </div>
      </section>

      {/* === HEALTH SECTION === */}
      <section className="container mx-auto px-4 py-10">
        <h2 className="text-xl font-semibold">API Sağlık Durumu</h2>

        <div className="mt-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border
            ${
              status === 'ok'
                ? 'border-[rgb(34_197_94)]'
                : status === 'error'
                ? 'border-[rgb(239_68_68)]'
                : 'border-black/15'
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full
              ${
                status === 'ok'
                  ? 'bg-[rgb(34_197_94)]'
                  : status === 'error'
                  ? 'bg-[rgb(239_68_68)]'
                  : 'bg-black/30'
              }`}
            />
            <span>
              {status === 'loading' ? 'Yükleniyor…' : status === 'ok' ? 'OK' : 'HATA'}
            </span>
          </div>
        </div>

        <pre className="mt-3 text-xs bg-black/5 dark:bg-white/5 p-3 rounded-md max-w-full overflow-auto">
          {message}
        </pre>

        <p className="mt-4 text-sm label-soft">
          Giriş yaptıysan{' '}
          <Link href="/dashboard" className="underline">
            Dashboard
          </Link>
          ’a devam edebilirsin.
        </p>
      </section>
    </main>
  );
}