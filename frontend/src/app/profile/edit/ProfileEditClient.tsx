'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UsersAPI, type UserProfile } from '@/lib/users';
import { useToast } from '@/components/ToastProvider';

export default function ProfileEditClient() {
  const router = useRouter();
  const { show } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        
        const profileData = await UsersAPI.getProfile();

        if (!alive) return;

        setProfile(profileData);

        // Form verilerini doldur
        setFormData({
          name: profileData.name || '',
        });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!profile) return;

    try {
      setSaving(true);
      
      await UsersAPI.updateProfile(formData);

      show('Profil başarıyla güncellendi', 'success');
      router.push('/profile');
    } catch (error: any) {
      const message = error?.message || 'Profil güncellenirken hata oluştu';
      show(message, 'error');
      setErr(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal">
          <div className="h-8 w-48 rounded bg-elevated animate-pulse mb-6" />
          <div className="card space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
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
            onClick={() => router.push('/profile')}
            className="btn btn-primary"
          >
            Profile Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Profil Düzenle</h1>
        <button
          onClick={() => router.push('/profile')}
          className="btn btn-ghost h-9"
        >
          İptal
        </button>
      </div>

      {/* Mevcut Profil Bilgileri */}
      <div className="reveal card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Mevcut Bilgiler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="label-soft">Ad Soyad:</span>
            <p className="font-medium">{profile.name || 'Belirtilmemiş'}</p>
          </div>
          <div>
            <span className="label-soft">E-posta:</span>
            <p className="font-medium">{profile.email}</p>
          </div>
        </div>
      </div>

      {/* Düzenleme Formu */}
      <form onSubmit={handleSubmit} className="reveal card space-y-4">
        <h3 className="font-semibold text-sm">Düzenleme</h3>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="subtext">Ad Soyad</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Adınızı ve soyadınızı girin"
            />
          </div>

          <div className="space-y-1">
            <label className="subtext">E-posta (Değiştirilemez)</label>
            <input
              type="email"
              className="input bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
              value={profile.email}
              disabled
              readOnly
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              E-posta adresiniz güvenlik nedeniyle değiştirilemez
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Güncelleniyor...' : 'Güncelle'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="btn btn-ghost"
          >
            İptal
          </button>
        </div>
      </form>
    </main>
  );
}
