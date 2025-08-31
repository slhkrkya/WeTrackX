'use client';

import { useEffect, useState } from 'react';
import { UsersAPI, type UserProfile } from '@/lib/users';
import { useToast } from '@/components/ToastProvider';
import { fmtDate } from '@/lib/format';
import { clearAuth } from '@/lib/auth';

export default function ProfileClient() {
  const { show } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  // Form states
  const [profileFormData, setProfileFormData] = useState({
    name: '',
  });

  const [passwordFormData, setPasswordFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field-specific errors
  const [oldPasswordErr, setOldPasswordErr] = useState<string>('');
  const [newPasswordErr, setNewPasswordErr] = useState<string>('');
  const [confirmPasswordErr, setConfirmPasswordErr] = useState<string>('');

  // Real-time password confirmation validation
  useEffect(() => {
    if (passwordFormData.confirmPassword && passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setConfirmPasswordErr('Şifreler eşleşmiyor');
    } else if (passwordFormData.confirmPassword && passwordFormData.newPassword === passwordFormData.confirmPassword) {
      setConfirmPasswordErr('');
    }
  }, [passwordFormData.newPassword, passwordFormData.confirmPassword]);

  // Real-time new password validation
  useEffect(() => {
    if (passwordFormData.newPassword && passwordFormData.newPassword.length < 6) {
      setNewPasswordErr('Şifre en az 6 karakter olmalıdır');
    } else if (passwordFormData.newPassword && passwordFormData.oldPassword === passwordFormData.newPassword) {
      setNewPasswordErr('Yeni şifre eski şifre ile aynı olamaz');
    } else if (passwordFormData.newPassword) {
      setNewPasswordErr('');
    }
  }, [passwordFormData.newPassword, passwordFormData.oldPassword]);

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
        setProfileFormData({
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

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!profile) return;

    try {
      setSaving(true);
      
      await UsersAPI.updateProfile(profileFormData);

      show('Profil başarıyla güncellendi', 'success', 4000, 'Başarılı');
      
      // Profil bilgilerini güncelle
      const updatedProfile = await UsersAPI.getProfile();
      setProfile(updatedProfile);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Profil güncellenirken hata oluştu';
      show(message, 'error', 5000, 'Hata');
      setErr(message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Clear previous errors
    setErr('');
    setOldPasswordErr('');
    setNewPasswordErr('');
    setConfirmPasswordErr('');

    // Validation
    let hasError = false;

    if (!passwordFormData.oldPassword) {
      setOldPasswordErr('Mevcut şifre zorunlu');
      hasError = true;
    }

    if (!passwordFormData.newPassword) {
      setNewPasswordErr('Yeni şifre zorunlu');
      hasError = true;
    } else if (passwordFormData.newPassword.length < 6) {
      setNewPasswordErr('Yeni şifre en az 6 karakter olmalıdır');
      hasError = true;
    } else if (passwordFormData.oldPassword === passwordFormData.newPassword) {
      setNewPasswordErr('Yeni şifre eski şifre ile aynı olamaz');
      hasError = true;
    }

    if (!passwordFormData.confirmPassword) {
      setConfirmPasswordErr('Şifre tekrarı zorunlu');
      hasError = true;
    } else if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setConfirmPasswordErr('Şifreler eşleşmiyor');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      setSaving(true);
      
      await UsersAPI.changePassword({
        oldPassword: passwordFormData.oldPassword,
        newPassword: passwordFormData.newPassword,
      });

      show('Şifreniz başarıyla değiştirildi. Güvenlik nedeniyle çıkış yapılıyor...', 'success');
      
      // Form'u temizle
      setPasswordFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Kısa bir gecikme ile çıkış yap (kullanıcının mesajı görmesi için)
      setTimeout(() => {
        clearAuth();
        window.location.href = '/';
      }, 2000);
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Şifre değiştirilirken hata oluştu';
      show(message, 'error');
      setErr(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="reveal">
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700 animate-pulse mb-6" />
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (err) {
    return (
      <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="reveal bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm rounded-2xl border border-red-200/50 dark:border-red-800/30 p-4" role="alert">
          <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="reveal bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Profil Bulunamadı</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Profil bilgileriniz yüklenirken bir hata oluştu.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tekrar Dene
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Başlık */}
      <div className="reveal">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Profil Yönetimi
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Hesap bilgilerinizi görüntüleyin, düzenleyin ve güvenlik ayarlarınızı yönetin
        </p>
      </div>

      {/* Profil Bilgileri */}
      <div className="reveal bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Hesap Bilgileri
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Ad Soyad</span>
            <p className="font-medium text-lg">{profile.name || 'Belirtilmemiş'}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">E-posta</span>
            <p className="font-medium text-lg">{profile.email}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Üyelik Tarihi</span>
            <p className="font-medium">{fmtDate(profile.createdAt)}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Hesap ID</span>
            <p className="font-mono text-sm bg-gray-100/80 dark:bg-gray-700/80 px-3 py-2 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
              {profile.id}
            </p>
          </div>
        </div>
      </div>

      {/* Profil Düzenleme */}
      <div className="reveal bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
          Profil Düzenle
        </h2>
        
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ad Soyad</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={profileFormData.name}
              onChange={(e) => setProfileFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Adınızı ve soyadınızı girin"
            />
            </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">E-posta (Değiştirilemez)</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              value={profile.email}
              disabled
              readOnly
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              E-posta adresiniz güvenlik nedeniyle değiştirilemez
              </p>
            </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Güncelleniyor...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Güncelle
                </>
              )}
            </button>
          </div>
        </form>
          </div>

      {/* Şifre Değiştirme */}
      <div className="reveal bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 p-6 space-y-6">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
          Şifre Değiştir
        </h2>

        {/* Bilgilendirme */}
        <div className="bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Güvenlik Notu</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Şifrenizi değiştirdikten sonra tüm cihazlardan çıkış yapılacak ve yeniden giriş yapmanız gerekecektir.
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Mevcut Şifre */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mevcut Şifre</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  oldPasswordErr ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
                value={passwordFormData.oldPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, oldPassword: e.target.value }))}
                placeholder="Mevcut şifrenizi girin"
                required
                disabled={saving}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setShowOldPassword(!showOldPassword)}
                disabled={saving}
              >
                {showOldPassword ? (
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
            {oldPasswordErr && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {oldPasswordErr}
              </div>
            )}
          </div>

          {/* Yeni Şifre */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yeni Şifre</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  newPasswordErr ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-600'
                }`}
                value={passwordFormData.newPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Yeni şifrenizi girin"
                required
                disabled={saving}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={saving}
              >
                {showNewPassword ? (
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
            <div className="text-xs text-gray-500 dark:text-gray-400">En az 6 karakter olmalıdır</div>
            {newPasswordErr && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {newPasswordErr}
              </div>
            )}
          </div>

          {/* Yeni Şifre Tekrar */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                  confirmPasswordErr ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 
                  passwordFormData.confirmPassword && passwordFormData.newPassword === passwordFormData.confirmPassword ? 'border-green-500 focus:border-green-500 focus:ring-green-500' : 
                  'border-gray-200 dark:border-gray-600'
                }`}
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Yeni şifrenizi tekrar girin"
                required
                disabled={saving}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={saving}
              >
                {showConfirmPassword ? (
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
            {passwordFormData.confirmPassword && passwordFormData.newPassword === passwordFormData.confirmPassword && !confirmPasswordErr && (
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Şifreler eşleşiyor
              </div>
            )}
            {confirmPasswordErr && (
              <div className="flex items-center gap-1 text-red-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {confirmPasswordErr}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Değiştiriliyor...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Şifreyi Değiştir
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
