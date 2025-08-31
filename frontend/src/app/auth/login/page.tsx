'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setAuth, type AuthUser, isAuthenticated } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';

type LoginRes = { user: AuthUser; token: string };

function getErrorMessage(e: unknown) {
  if (e instanceof Error) {
    // JSON formatındaki hata mesajlarını parse et
    try {
      const errorData = JSON.parse(e.message);
      if (errorData.message) {
        return errorData.message;
      }
      if (errorData.error === 'Unauthorized') {
        return 'E-posta veya şifre hatalı';
      }
      if (errorData.statusCode === 401) {
        return 'E-posta veya şifre hatalı';
      }
      if (errorData.statusCode === 404) {
        return 'Kullanıcı bulunamadı';
      }
      if (errorData.statusCode === 400) {
        return 'Geçersiz bilgi gönderildi';
      }
      if (errorData.statusCode === 500) {
        return 'Sunucu hatası oluştu, lütfen tekrar deneyin';
      }
      return errorData.message || 'Bir hata oluştu';
    } catch {
      // JSON parse edilemezse orijinal mesajı kullan
      return e.message;
    }
  }
  
  try {
    const errorStr = JSON.stringify(e);
    const errorData = JSON.parse(errorStr);
    if (errorData.message) {
      return errorData.message;
    }
    if (errorData.error === 'Unauthorized') {
      return 'E-posta veya şifre hatalı';
    }
    if (errorData.statusCode === 401) {
      return 'E-posta veya şifre hatalı';
    }
    if (errorData.statusCode === 404) {
      return 'Kullanıcı bulunamadı';
    }
    if (errorData.statusCode === 400) {
      return 'Geçersiz bilgi gönderildi';
    }
    if (errorData.statusCode === 500) {
      return 'Sunucu hatası oluştu, lütfen tekrar deneyin';
    }
    return errorData.message || 'Bir hata oluştu';
  } catch {
    return String(e);
  }
}

const LS_KEY_REMEMBER = 'wt:remember';
const LS_KEY_EMAIL = 'wt:rememberEmail';

export default function LoginPage() {
  const router = useRouter();
  const { show } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // alan bazlı hatalar
  const [emailErr, setEmailErr] = useState<string>('');
  const [passwordErr, setPasswordErr] = useState<string>('');

  // Auth kontrolü - giriş yapmış kullanıcıyı dashboard'a yönlendir
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard');
    }
  }, [router]);

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

  function validate() {
    let ok = true;

    if (!email.trim()) {
      setEmailErr('E-posta zorunlu');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailErr('Geçerli bir e-posta adresi girin');
      ok = false;
    } else {
      setEmailErr('');
    }

    if (!password) {
      setPasswordErr('Şifre zorunlu');
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

      show('Başarıyla giriş yaptınız!', 'success');
      router.replace('/dashboard');
    } catch (e: unknown) {
      const errorMessage = getErrorMessage(e);
      setErr(errorMessage);
      show(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 md:p-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md">
        {/* Logo ve Başlık */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 cursor-pointer">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">WeTrackX</h1>
          <p className="text-gray-600 dark:text-gray-400">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={onSubmit} className="reveal space-y-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 md:p-8" aria-busy={loading}>
          {err && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4" role="alert" aria-live="polite">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
              </div>
            </div>
          )}

          {/* E-posta */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              E-posta
            </label>
            <input
              id="email"
              className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${emailErr ? 'border-red-500 focus:ring-red-500' : ''}`}
              type="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              onBlur={() => {
                if (!email.trim()) setEmailErr('E-posta zorunlu');
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) setEmailErr('Geçerli bir e-posta adresi girin');
                else setEmailErr('');
              }}
              placeholder="ornek@email.com"
              autoComplete="email"
              required
              disabled={loading}
              aria-invalid={!!emailErr}
              aria-describedby={emailErr ? 'email-err' : undefined}
            />
            {emailErr && (
              <p id="email-err" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {emailErr}
              </p>
            )}
          </div>

          {/* Şifre */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Şifre
            </label>
            <div className="relative">
              <input
                id="password"
                className={`w-full px-4 py-3 pr-12 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${passwordErr ? 'border-red-500 focus:ring-red-500' : ''}`}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                onBlur={() => {
                  if (!password) setPasswordErr('Şifre zorunlu');
                  else setPasswordErr('');
                }}
                placeholder="Şifrenizi girin"
                autoComplete="current-password"
                required
                disabled={loading}
                aria-invalid={!!passwordErr}
                aria-describedby={passwordErr ? 'password-err' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 px-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-r-xl transition-colors duration-200"
                aria-label={showPw ? 'Şifreyi gizle' : 'Şifreyi göster'}
                tabIndex={-1}
              >
                {showPw ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {passwordErr && (
              <p id="password-err" className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {passwordErr}
              </p>
            )}
          </div>

          {/* Beni hatırla + Kayıt bağlantısı */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={loading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Beni hatırla</span>
            </label>

            <Link 
              href="/auth/register" 
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
            >
              Kayıt ol
            </Link>
          </div>

          <button 
            disabled={loading} 
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none" 
            type="submit"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Giriş Yapılıyor...
              </div>
            ) : (
              'Giriş Yap'
            )}
          </button>

          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Şifrenizi mi unuttunuz?{' '}
              <span className="opacity-80">Yakında &quot;şifre sıfırla&quot; eklenecek.</span>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}