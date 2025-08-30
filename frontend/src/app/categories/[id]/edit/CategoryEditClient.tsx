'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { type CategoryKind, CATEGORY_KIND_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

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
    } catch (error: any) {
      let message = 'Kategori güncellenirken hata oluştu';
      
      if (error?.message) {
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

  if (!category) {
    return (
      <main className="min-h-dvh p-6 space-y-6">
        <div className="reveal card text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Kategori Bulunamadı</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Aradığınız kategori bulunamadı veya silinmiş olabilir.
          </p>
          <button
            onClick={() => router.push('/categories')}
            className="btn btn-primary"
          >
            Kategorilere Dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık */}
      <div className="reveal flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kategori Düzenle</h1>
        <button
          onClick={() => router.push('/categories')}
          className="btn btn-ghost h-9"
        >
          İptal
        </button>
      </div>

      {/* Mevcut Kategori Bilgileri */}
      <div className="reveal card p-4 space-y-3">
        <h3 className="font-semibold text-sm">Mevcut Kategori</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="label-soft">Ad:</span>
            <p className="font-medium">{category.name}</p>
          </div>
          <div>
            <span className="label-soft">Tür:</span>
            <p className="font-medium">{CATEGORY_KIND_LABELS_TR[category.kind]}</p>
          </div>
          <div>
            <span className="label-soft">Renk:</span>
            <div className="flex items-center gap-2">
              {category.color && (
                <span
                  className="inline-block h-4 w-4 rounded-full border border-black/10"
                  style={{ background: category.color }}
                />
              )}
              <span className="font-medium">{category.color || '—'}</span>
            </div>
          </div>
          <div>
            <span className="label-soft">Öncelik:</span>
            <p className="font-medium">{category.priority}</p>
          </div>
        </div>
      </div>

      {/* Sistem Kategorisi Uyarısı */}
      {category.isSystem && (
        <div className="reveal card bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
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
      <form onSubmit={handleSubmit} className="reveal card space-y-4">
        <h3 className="font-semibold text-sm">Düzenleme</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="subtext">Kategori Adı</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="subtext">Tür</label>
            <select
              className={`input ${category.isSystem ? 'opacity-50 cursor-not-allowed' : ''}`}
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

          <div className="space-y-1">
            <label className="subtext">Renk</label>
            <input
              type="color"
              className="input h-12 w-full"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="subtext">Öncelik</label>
            <input
              type="number"
              className="input"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
              min="0"
              max="100"
            />
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
            onClick={() => router.push('/categories')}
            className="btn btn-ghost"
          >
            İptal
          </button>
        </div>
      </form>
    </main>
  );
}
