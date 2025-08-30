'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UsersAPI } from '@/lib/users';
import { useToast } from '@/components/ToastProvider';

export default function ChangePasswordClient() {
  const router = useRouter();
  const { show } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
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
    if (formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
      setConfirmPasswordErr('Şifreler eşleşmiyor');
    } else if (formData.confirmPassword && formData.newPassword === formData.confirmPassword) {
      setConfirmPasswordErr('');
    }
  }, [formData.newPassword, formData.confirmPassword]);

  // Real-time new password validation
  useEffect(() => {
    if (formData.newPassword && formData.newPassword.length < 6) {
      setNewPasswordErr('Şifre en az 6 karakter olmalıdır');
    } else if (formData.newPassword && formData.oldPassword === formData.newPassword) {
      setNewPasswordErr('Yeni şifre eski şifre ile aynı olamaz');
    } else if (formData.newPassword) {
      setNewPasswordErr('');
    }
  }, [formData.newPassword, formData.oldPassword]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Clear previous errors
    setErr('');
    setOldPasswordErr('');
    setNewPasswordErr('');
    setConfirmPasswordErr('');

    // Validation
    let hasError = false;

    if (!formData.oldPassword) {
      setOldPasswordErr('Mevcut şifre zorunlu');
      hasError = true;
    }

    if (!formData.newPassword) {
      setNewPasswordErr('Yeni şifre zorunlu');
      hasError = true;
    } else if (formData.newPassword.length < 6) {
      setNewPasswordErr('Yeni şifre en az 6 karakter olmalıdır');
      hasError = true;
    } else if (formData.oldPassword === formData.newPassword) {
      setNewPasswordErr('Yeni şifre eski şifre ile aynı olamaz');
      hasError = true;
    }

    if (!formData.confirmPassword) {
      setConfirmPasswordErr('Şifre tekrarı zorunlu');
      hasError = true;
    } else if (formData.newPassword !== formData.confirmPassword) {
      setConfirmPasswordErr('Şifreler eşleşmiyor');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      setSaving(true);
      
      await UsersAPI.changePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      show('Şifreniz başarıyla değiştirildi', 'success');
      router.push('/profile');
    } catch (error: any) {
      const message = error?.message || 'Şifre değiştirilirken hata oluştu';
      show(message, 'error');
      setErr(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Şifre Değiştir</h1>
        <button
          onClick={() => router.push('/profile')}
          className="btn btn-ghost h-9"
        >
          İptal
        </button>
      </div>

      {/* Bilgilendirme */}
      <div className="reveal card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
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

      {/* Hata */}
      {err && (
        <div className="reveal card ring-1 ring-negative-500/25" role="alert">
          <p className="text-sm text-negative-500">{err}</p>
        </div>
      )}

      {/* Şifre Değiştirme Formu */}
      <form onSubmit={handleSubmit} className="reveal card space-y-4">
        <h3 className="font-semibold text-sm">Şifre Değiştirme</h3>
        
        <div className="space-y-4">
          {/* Mevcut Şifre */}
          <div className="space-y-1">
            <label className="subtext">Mevcut Şifre</label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                className={`input pr-10 ${oldPasswordErr ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                value={formData.oldPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, oldPassword: e.target.value }))}
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
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {oldPasswordErr}
              </p>
            )}
          </div>

          {/* Yeni Şifre */}
          <div className="space-y-1">
            <label className="subtext">Yeni Şifre</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                className={`input pr-10 ${newPasswordErr ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                value={formData.newPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
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
            {newPasswordErr && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {newPasswordErr}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              En az 6 karakter olmalıdır
            </p>
          </div>

          {/* Şifre Tekrar */}
          <div className="space-y-1">
            <label className="subtext">Yeni Şifre (Tekrar)</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className={`input pr-10 ${confirmPasswordErr ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
            {confirmPasswordErr && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {confirmPasswordErr}
              </p>
            )}
            {formData.newPassword && formData.confirmPassword && !confirmPasswordErr && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Şifreler eşleşiyor
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Değiştiriliyor...' : 'Şifreyi Değiştir'}
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
