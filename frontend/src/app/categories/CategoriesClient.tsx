'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { type CategoryKind, CATEGORY_KIND_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

const KINDS: CategoryKind[] = ['INCOME', 'EXPENSE'];

function SegmentedKind({
  value,
  onChange,
}: {
  value: CategoryKind;
  onChange: (k: CategoryKind) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg ring-1 ring-black/10 bg-[rgb(var(--card))] p-0.5"
      role="tablist"
      aria-label="Kategori türü filtresi"
    >
      {KINDS.map((k) => {
        const active = value === k;
        const clr =
          k === 'INCOME'
            ? 'text-[rgb(var(--success))]'
            : 'text-[rgb(var(--error))]';
        return (
          <button
            key={k}
            role="tab"
            aria-selected={active}
            className={[
              'px-3 h-9 rounded-md text-sm transition-colors',
              active
                ? 'bg-[rgb(var(--surface-1))] ring-1 ring-black/5'
                : 'hover:bg-[rgb(var(--surface-1))]/60',
              clr,
            ].join(' ')}
            onClick={() => onChange(k)}
          >
            {CATEGORY_KIND_LABELS_TR[k]}
          </button>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  const rows = Array.from({ length: 6 });
  return (
    <div className="reveal card overflow-hidden">
      <div className="hidden md:grid grid-cols-4 gap-2 px-4 py-2 text-[11px] label-soft">
        <div>Ad</div>
        <div>Tür</div>
        <div>Renk</div>
        <div className="text-right">İşlemler</div>
      </div>
      <ul className="divide-y">
        {rows.map((_, i) => (
          <li key={i} className="grid md:grid-cols-4 grid-cols-2 gap-2 px-4 py-3">
            <div className="col-span-2 md:col-span-1 h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
            <div className="h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CategoriesClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { show } = useToast();
  const initialKind = (sp.get('kind') as CategoryKind) || 'EXPENSE';

  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [items, setItems] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // URL değişikliğini state'e yansıt (örn. geri/ileri)
  useEffect(() => {
    const k = (sp.get('kind') as CategoryKind) || 'EXPENSE';
    setKind(k);
  }, [sp]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const data = await CategoriesAPI.list(kind);
        if (!alive) return;
        setItems(data);
      } catch (e: unknown) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : String(e));
        router.replace('/auth/login');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [kind, router]);

  function onChangeKind(k: CategoryKind) {
    // sadece URL'i değiştir; effect state'i güncelleyecek
    router.replace(`/categories?kind=${k}`);
  }

  // Kategori silme fonksiyonu
  async function deleteCategory(id: string) {
    const category = items.find(item => item.id === id);
    const categoryName = category?.name || 'Kategori';
    
    if (!confirm(`${categoryName} kategorisini silmek istediğinizden emin misiniz?\n\n⚠️ Bu işlem geri alınamaz ve kategoriye ait tüm işlemler de etkilenecektir.`)) {
      return;
    }

    try {
      setDeletingId(id);
      await CategoriesAPI.delete(id);
      
      // Başarılı silme sonrası listeyi yenile
      setItems(items.filter(item => item.id !== id));
      show(`${categoryName} kategorisi başarıyla silindi`, 'success');
    } catch (error: any) {
      let message = 'Kategori silinirken beklenmeyen bir hata oluştu';
      
      // Backend'den gelen hata mesajlarını kontrol et
      if (error?.message?.includes('related transactions')) {
        message = 'Bu kategoriye ait işlemler bulunduğu için silinemez. Önce işlemleri silin veya başka bir kategoriye taşıyın.';
      } else if (error?.message?.includes('not found')) {
        message = 'Kategori bulunamadı. Sayfayı yenileyip tekrar deneyin.';
      } else if (error?.message?.includes('system')) {
        message = 'Sistem kategorileri silinemez.';
      } else if (error?.message) {
        message = error.message;
      }
      
      show(message, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const headerPillColor = useMemo(
    () =>
      kind === 'INCOME'
        ? 'text-[rgb(var(--success))]'
        : 'text-[rgb(var(--error))]',
    [kind]
  );

  return (
    <main className="min-h-dvh p-6 space-y-6">
      {/* Başlık + Aksiyonlar */}
      <div className="reveal flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kategoriler</h1>
        <div className="flex items-center gap-2">
          <SegmentedKind value={kind} onChange={onChangeKind} />
          <Link href={`/categories/new?kind=${kind}`} className="btn btn-primary h-9">
            Yeni Kategori
          </Link>
        </div>
      </div>

      {/* Hata */}
      {err && (
        <div className="reveal card ring-1 ring-[rgb(var(--error))]/25" role="alert">
          <p className="text-sm text-[rgb(var(--error))]">{err}</p>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="reveal card overflow-hidden" role="table" aria-label="Kategori listesi">
          {/* Başlık (md+) */}
          <div className="hidden md:grid grid-cols-4 gap-2 px-4 py-2 text-[11px] label-soft" role="rowgroup">
            <div role="columnheader">Ad</div>
            <div role="columnheader">Tür</div>
            <div role="columnheader">Renk</div>
            <div role="columnheader" className="text-right">İşlemler</div>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Henüz Kategori Yok</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
                {kind === 'INCOME' ? 'Gelir' : 'Gider'} kategorilerinizi oluşturarak işlemlerinizi daha iyi organize edebilirsiniz.
              </p>
              <Link href={`/categories/new?kind=${kind}`} className="btn btn-primary">
                Kategori Oluştur
              </Link>
            </div>
          ) : (
            <ul className="divide-y" role="rowgroup">
              {items.map((c) => (
                <li
                  key={c.id}
                  role="row"
                  className={[
                    'grid md:grid-cols-4 grid-cols-2 gap-2 px-4 py-2 text-sm',
                    'hover:bg-[rgb(var(--surface-1))]/60 transition-colors',
                    'focus-within:bg-[rgb(var(--surface-1))]/60',
                  ].join(' ')}
                >
                  {/* Ad */}
                  <div role="cell" className="truncate order-1 md:order-none md:col-auto col-span-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.name}</span>
                      {c.isSystem && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          Sistem
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tür */}
                  <div role="cell" className="order-3 md:order-none">
                    <span
                      className={[
                        'pill h-6 px-2 text-[11px]',
                        c.kind === 'INCOME'
                          ? 'text-[rgb(var(--success))]'
                          : 'text-[rgb(var(--error))]',
                        'bg-[rgb(var(--surface-1))]',
                      ].join(' ')}
                      title={CATEGORY_KIND_LABELS_TR[c.kind]}
                    >
                      {CATEGORY_KIND_LABELS_TR[c.kind]}
                    </span>
                  </div>

                  {/* Renk */}
                  <div role="cell" className="flex items-center gap-2 order-2 md:order-none">
                    {c.color ? (
                      <>
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-black/10"
                          style={{ background: c.color }}
                          title={c.color}
                          aria-label={`Renk ${c.color}`}
                        />
                        <span className="text-xs label-soft">{c.color}</span>
                      </>
                    ) : (
                      <span className="text-xs label-soft">—</span>
                    )}
                  </div>

                  {/* İşlemler */}
                  <div role="cell" className="flex items-center justify-end gap-2 order-4 md:order-none">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Link
                        href={`/categories/${c.id}/edit`}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded"
                        title="Düzenle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      {!c.isSystem && (
                        <button
                          onClick={() => deleteCategory(c.id)}
                          disabled={deletingId === c.id}
                          className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors disabled:opacity-50 rounded"
                          title="Sil"
                        >
                          {deletingId === c.id ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Aktif filtre bilgisi (soft) */}
      <p className={['label-soft text-xs', headerPillColor].join(' ')}>
        Aktif tür: <span className="font-medium">{kind}</span>
      </p>
    </main>
  );
}