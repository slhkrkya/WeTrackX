'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAuth, type AuthUser } from '@/lib/auth';

type LoginRes = { user: AuthUser; token: string };

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('salih@example.com'); // kolay test
  const [password, setPassword] = useState('12345678');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const res = await api<LoginRes>('/auth/login', {
        method: 'POST',
        jsonBody: { email, password },
      });
      setAuth(res.token, res.user);
      router.replace('/dashboard');
    } catch (e: unknown) {
      setErr(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 border rounded-xl p-5"
      >
        <h1 className="text-2xl font-bold">Giriş Yap</h1>

        {err && <div className="text-sm border rounded p-2">{err}</div>}

        <div className="space-y-1">
          <label className="text-sm">E-posta</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Şifre</label>
          <input
            className="w-full rounded border px-3 py-2"
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>

        <button
          disabled={loading}
          className="w-full rounded px-4 py-2 border"
        >
          {loading ? 'Gönderiliyor…' : 'Giriş Yap'}
        </button>

        <p className="text-sm">
          Hesabın yok mu?{' '}
          <a className="underline" href="/auth/register">
            Kayıt ol
          </a>
        </p>
      </form>
    </main>
  );
}