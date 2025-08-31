'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { type CategoryKind, CATEGORY_KIND_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';
import ColorPicker from '@/components/ui/ColorPicker';

type Props = { id: string };

export default function CategoryEditClient({ id }: Props) {
  const router = useRouter();
  const { show } = useToast();
  
  const [category, setCategory] = useState<CategoryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    kind: 'EXPENSE' as CategoryKind,
    color: '',
    priority: 0,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        
        const catData = await CategoriesAPI.get(id);

        if (!alive) return;

        setCategory(catData);

        // Form verilerini doldur
        setFormData({
          name: catData.name,
          kind: catData.kind,
          color: catData.color || '',
          priority: catData.priority,
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
  }, [id, show]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!category) return;

    try {
      setSaving(true);
      
      // Tüm alanları gönder (sistem kategorileri için backend kopya oluşturacak)
      const updateData = { 
        ...formData, 
        priority: Number(formData.priority) 
      };
        
      await CategoriesAPI.update(id, updateData);

      show('Kategori başarıyla güncellendi', 'success');
      router.push('/categories');
    } catch (error: unknown) {
      let message = 'Kategori güncellenirken hata oluştu';
      
      if (error instanceof Error) {
        message = error.message;
      }
      
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
          <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-600 animate-pulse mb-6" />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
                <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
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
        <div className="reveal bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4" role="alert">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Kategori Bulunamadı</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Aradığınız kategori bulunamadı veya silinmiş olabilir.
          </p>
          <button
            onClick={() => router.push('/categories')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kategorilere Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Kategori Düzenle
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Kategori bilgilerini güncelleyin
          </p>
        </div>
        <button
          onClick={() => router.push('/categories')}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          İptal
        </button>
      </div>

      {/* Mevcut Kategori Bilgileri */}
      <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 space-y-4">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Mevcut Kategori</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Ad:</span>
            <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Tür:</span>
            <p className="font-medium text-gray-900 dark:text-white">{CATEGORY_KIND_LABELS_TR[category.kind]}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Renk:</span>
            <div className="flex items-center gap-2">
              {category.color && (
                <span
                  className="inline-block h-4 w-4 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                  style={{ background: category.color }}
                />
              )}
              <span className="font-medium text-gray-900 dark:text-white">{category.color || '—'}</span>
            </div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Öncelik:</span>
            <p className="font-medium text-gray-900 dark:text-white">{category.priority}</p>
          </div>
        </div>
      </div>

      {/* Sistem Kategorisi Uyarısı */}
      {category.isSystem && (
        <div className="reveal bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                Sistem Kategorisi
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Bu kategori sistem tarafından oluşturulmuştur. 
                Değişiklikler sadece sizin için geçerli olacaktır.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Düzenleme Formu - Tüm kategoriler için */}
      <form onSubmit={handleSubmit} className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-4 p-6">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Düzenleme</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kategori Adı</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tür</label>
            <select
              className={`w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${category.isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={formData.kind}
              onChange={(e) => !category.isSystem && setFormData(prev => ({ ...prev, kind: e.target.value as CategoryKind }))}
              required
              disabled={category.isSystem}
            >
              <option value="INCOME">Gelir</option>
              <option value="EXPENSE">Gider</option>
            </select>
            {category.isSystem && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sistem kategorilerinde tür değiştirilemez
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Renk</label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData(prev => ({ ...prev, color }))}
              placeholder="#000000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Öncelik</label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
              min="1"
              max="10"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">1 = En yüksek öncelik, 10 = En düşük öncelik</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
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
          <button
            type="button"
            onClick={() => router.push('/categories')}
            className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            İptal
          </button>
        </div>
      </form>
    </main>
  );
}
