'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UsersAPI, type UserProfile } from '@/lib/users';
import { useToast } from '@/components/ToastProvider';
import { fmtDate } from '@/lib/format';

export default function ProfileClient() {
  const { show } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        
        const profileData = await UsersAPI.getProfile();
        
        if (!alive) return;
        setProfile(profileData);
      } catch (e: unknown) {
        if (!alive) return;
        const message = e instanceof Error ? e.message : String(e);
        setErr(message);
        show(message, 'error');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [show]);

  if (loading) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal">
          <div className="h-8 w-48 rounded bg-elevated animate-pulse mb-6" />
          <div className="card space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-elevated animate-pulse" />
                <div className="h-10 w-full rounded bg-elevated animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal card ring-1 ring-negative-500/25" role="alert">
          <p className="text-sm text-negative-500">{err}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal card text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Profil Bulunamadı</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Profil bilgileriniz yüklenirken bir hata oluştu.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Tekrar Dene
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık */}
      <div className="reveal">
        <h1 className="text-2xl font-bold mb-2">Profil</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hesap bilgilerinizi görüntüleyin ve düzenleyin
        </p>
      </div>

      {/* Profil Bilgileri */}
      <div className="reveal card p-6 space-y-6">
        <h2 className="text-lg font-semibold">Hesap Bilgileri</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="label-soft">Ad Soyad</span>
            <p className="font-medium text-lg">{profile.name || 'Belirtilmemiş'}</p>
          </div>
          
          <div className="space-y-1">
            <span className="label-soft">E-posta</span>
            <p className="font-medium text-lg">{profile.email}</p>
          </div>
          
          <div className="space-y-1">
            <span className="label-soft">Üyelik Tarihi</span>
            <p className="font-medium">{fmtDate(profile.createdAt)}</p>
          </div>
          
          <div className="space-y-1">
            <span className="label-soft">Hesap ID</span>
            <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {profile.id}
            </p>
          </div>
        </div>
      </div>

      {/* İşlemler */}
      <div className="reveal grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/profile/edit" 
          className="card p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Profil Düzenle</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ad soyad bilgilerinizi güncelleyin
              </p>
            </div>
          </div>
        </Link>

        <Link 
          href="/profile/change-password" 
          className="card p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Şifre Değiştir</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Hesap güvenliğiniz için şifrenizi güncelleyin
              </p>
            </div>
          </div>
        </Link>
      </div>
    </main>
  );
}
