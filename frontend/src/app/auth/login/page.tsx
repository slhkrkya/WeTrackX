'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

const LS_KEY_REMEMBER = 'wt:remember';
const LS_KEY_EMAIL = 'wt:rememberEmail';

export default function LoginPage() {
  const router = useRouter();

  // Varsayılan değerler kaldırıldı
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // Remember ayarını ve e-postayı yükle
  useEffect(() => {
    try {
      const r = localStorage.getItem(LS_KEY_REMEMBER);
      const saved = localStorage.getItem(LS_KEY_EMAIL);
      if (r != null) setRemember(r === '1');
      if (saved) setEmail(saved);
    } catch {
      // storage erişilemezse sessizce geç
    }
  }, []);

  // remember değişince localStorage'a yaz
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY_REMEMBER, remember ? '1' : '0');
      if (!remember) localStorage.removeItem(LS_KEY_EMAIL);
    } catch {}
  }, [remember]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErr('');
    try {
      const res = await api<LoginRes>('/auth/login', {
        method: 'POST',
        jsonBody: { email, password },
      });
      setAuth(res.token, res.user);

      // E-postayı isteğe bağlı hatırla (şifre ASLA kaydedilmez)
      try {
        if (remember) localStorage.setItem(LS_KEY_EMAIL, email);
        else localStorage.removeItem(LS_KEY_EMAIL);
      } catch {}

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
        className="reveal w-full max-w-sm space-y-5 card"
        aria-busy={loading}
      >
        <h1 className="text-2xl font-bold">Giriş Yap</h1>

        {err && (
          <div className="card ring-1 ring-[rgb(var(--error))]/25" role="alert" aria-live="polite">
            <p className="text-sm text-[rgb(var(--error))]">{err}</p>
          </div>
        )}

        {/* E-posta */}
        <div className="space-y-1">
          <label htmlFor="email" className="label-soft">E-posta</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="off"
            required
            disabled={loading}
          />
        </div>

        {/* Şifre + göster/gizle */}
        <div className="space-y-1">
          <label htmlFor="password" className="label-soft">Şifre</label>
          <div className="relative">
            <input
              id="password"
              className="input pr-10"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              autoComplete="off"
              required
              minLength={8}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute inset-y-0 right-0 px-3 text-sm label-soft hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded-r-md"
              aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}
              tabIndex={-1}
            >
              {showPw ? 'Gizle' : 'Göster'}
            </button>
          </div>
        </div>

        {/* Beni hatırla + Kayıt bağlantısı */}
        <div className="flex items-center justify-between pt-1">
          <label className="label cursor-pointer gap-2 flex items-center">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
            />
            <span className="label-soft text-sm">Beni hatırla</span>
          </label>

          <Link href="/auth/register" className="nav-link text-sm">
            Kayıt ol
          </Link>
        </div>

        <button disabled={loading} className="btn btn-primary w-full" type="submit">
          {loading ? 'Gönderiliyor…' : 'Giriş Yap'}
        </button>

        <p className="text-xs label-soft">
          Şifreni mi unuttun? <span className="opacity-80">Yakında “şifre sıfırla” eklenecek.</span>
        </p>
      </form>
    </main>
  );
}