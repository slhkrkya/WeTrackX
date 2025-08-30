'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAuth, type AuthUser } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';

type RegisterRes = { user: AuthUser; token: string };

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { show } = useToast();

  // Varsayılan değerler kaldırıldı
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // alan bazlı hatalar
  const [nameErr, setNameErr] = useState<string>('');
  const [emailErr, setEmailErr] = useState<string>('');
  const [passwordErr, setPasswordErr] = useState<string>('');

  function validate() {
    let ok = true;

    if (!name.trim()) {
      setNameErr('Ad zorunlu');
      ok = false;
    } else if (name.trim().length < 2) {
      setNameErr('Ad en az 2 karakter olmalı');
      ok = false;
    } else {
      setNameErr('');
    }

    if (!email.trim()) {
      setEmailErr('E-posta zorunlu');
      ok = false;
    } else {
      setEmailErr('');
    }

    if (!password) {
      setPasswordErr('Şifre zorunlu');
      ok = false;
    } else if (password.length < 8) {
      setPasswordErr('Şifre en az 8 karakter olmalı');
      ok = false;
    } else {
      setPasswordErr('');
    }

    return ok;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setErr('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api<RegisterRes>('/auth/register', {
        method: 'POST',
        jsonBody: { email: email.trim(), password, name: name.trim() },
      });
      setAuth(res.token, res.user);
      show('Hesabınız başarıyla oluşturuldu!', 'success');
      router.replace('/dashboard');
    } catch (e: unknown) {
      const errorMessage = getErrorMessage(e);
      setErr(errorMessage);
      show(errorMessage, 'error');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="reveal w-full max-w-sm space-y-5 card" aria-busy={loading}>
        <h1 className="text-2xl font-bold">Kayıt Ol</h1>

        {err && (
          <div className="card ring-1 ring-[rgb(var(--error))]/25" role="alert" aria-live="polite">
            <p className="text-sm text-[rgb(var(--error))]">{err}</p>
          </div>
        )}

        {/* Ad */}
        <div className="space-y-1">
          <label htmlFor="name" className="label-soft">Ad</label>
          <input
            id="name"
            className="input"
            type="text"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
            onBlur={() => {
              if (!name.trim()) setNameErr('Ad zorunlu');
              else if (name.trim().length < 2) setNameErr('Ad en az 2 karakter olmalı');
              else setNameErr('');
            }}
            maxLength={64}
            required
            disabled={loading}
            aria-invalid={!!nameErr}
            aria-describedby={nameErr ? 'name-err' : undefined}
          />
          {nameErr && <p id="name-err" className="text-xs text-[rgb(var(--error))]">{nameErr}</p>}
        </div>

        {/* E-posta */}
        <div className="space-y-1">
          <label htmlFor="email" className="label-soft">E-posta</label>
          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            onBlur={() => {
              if (!email.trim()) setEmailErr('E-posta zorunlu'); else setEmailErr('');
            }}
            autoComplete="off"
            required
            disabled={loading}
            aria-invalid={!!emailErr}
            aria-describedby={emailErr ? 'email-err' : undefined}
          />
          {emailErr && <p id="email-err" className="text-xs text-[rgb(var(--error))]">{emailErr}</p>}
        </div>

        {/* Şifre */}
        <div className="space-y-1">
          <label htmlFor="password" className="label-soft">Şifre</label>
          <div className="relative">
            <input
              id="password"
              className="input pr-10"
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              onBlur={() => {
                if (!password) setPasswordErr('Şifre zorunlu');
                else if (password.length < 8) setPasswordErr('Şifre en az 8 karakter olmalı');
                else setPasswordErr('');
              }}
              autoComplete="off"
              required
              minLength={8}
              disabled={loading}
              aria-invalid={!!passwordErr}
              aria-describedby={passwordErr ? 'password-err' : undefined}
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
          {passwordErr && <p id="password-err" className="text-xs text-[rgb(var(--error))]">{passwordErr}</p>}
        </div>

        <button disabled={loading} className="btn btn-primary w-full" type="submit">
          {loading ? 'Gönderiliyor…' : 'Kayıt Ol'}
        </button>

        <p className="text-sm label-soft">
          Zaten hesabın var mı?{' '}
          <Link href="/auth/login" className="nav-link">
            Giriş yap
          </Link>
        </p>
      </form>
    </main>
  );
}