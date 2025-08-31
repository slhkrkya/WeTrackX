'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { type CategoryKind, CATEGORY_KIND_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';
import SuspenseFallback from '@/components/SuspenseFallback';

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
      className="inline-flex items-center rounded-xl ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm"
      role="tablist"
      aria-label="Kategori türü filtresi"
    >
      {KINDS.map((k) => {
        const active = value === k;
        const clr =
          k === 'INCOME'
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400';
        return (
          <button
            key={k}
            role="tab"
            aria-selected={active}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50',
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

// function LoadingSkeleton() {
//   const rows = Array.from({ length: 6 });
//   return (
//     <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
//       <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
//         <div>Ad</div>
//         <div>Tür</div>
//         <div>Öncelik</div>
//         <div>Renk</div>
//         <div className="text-right">İşlemler</div>
//       </div>
//       <ul className="divide-y divide-gray-100 dark:divide-gray-700">
//         {rows.map((_, i) => (
//           <li key={i} className="grid md:grid-cols-5 grid-cols-2 gap-4 px-6 py-4">
//             <div className="col-span-2 md:col-span-1 h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//             <div className="h-4 g rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//             <div className="h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//             <div className="h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//             <div className="h-4 rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

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
        
        // Kategorileri önceliğe göre sırala (1 en yüksek öncelik)
        const sortedData = data.sort((a, b) => a.priority - b.priority);
        setItems(sortedData);
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
    } catch (error: unknown) {
      let message = 'Kategori silinirken beklenmeyen bir hata oluştu';
      
      // Backend'den gelen hata mesajlarını kontrol et
      if (error instanceof Error) {
        if (error.message.includes('related transactions')) {
          message = 'Bu kategoriye ait işlemler bulunduğu için silinemez. Önce işlemleri silin veya başka bir kategoriye taşıyın.';
        } else if (error.message.includes('not found')) {
          message = 'Kategori bulunamadı. Sayfayı yenileyip tekrar deneyin.';
        } else if (error.message.includes('system')) {
          message = 'Sistem kategorileri silinemez.';
        } else {
          message = error.message;
        }
      }
      
      show(message, 'error');
    } finally {
      setDeletingId(null);
    }
  }

  const headerPillColor = useMemo(
    () =>
      kind === 'INCOME'
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400',
    [kind]
  );

  // Öncelik rengini belirle
  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    if (priority <= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
  };

  // Öncelik etiketini belirle
  const getPriorityLabel = (priority: number) => {
    if (priority <= 3) return 'Yüksek';
    if (priority <= 6) return 'Orta';
    return 'Düşük';
  };

  return (
    <main className="min-h-dvh p-4 md:p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Başlık + Aksiyonlar */}
      <div className="reveal flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Kategoriler
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gelir ve gider kategorilerinizi yönetin
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SegmentedKind value={kind} onChange={onChangeKind} />
          <Link 
            href={`/categories/new?kind=${kind}`} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Yeni Kategori
          </Link>
        </div>
      </div>

      {/* Hata */}
      {err && (
        <div className="reveal bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4" role="alert">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <SuspenseFallback message="Kategoriler yükleniyor..." />
      ) : (
        <div className="reveal bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden" role="table" aria-label="Kategori listesi">
          {/* Başlık (md+) */}
          <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-4 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50" role="rowgroup">
            <div role="columnheader">Ad</div>
            <div role="columnheader">Tür</div>
            <div role="columnheader">Öncelik</div>
            <div role="columnheader">Renk</div>
            <div role="columnheader" className="text-right">İşlemler</div>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Henüz Kategori Yok</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {kind === 'INCOME' ? 'Gelir' : 'Gider'} kategorilerinizi oluşturarak işlemlerinizi daha iyi organize edebilirsiniz.
              </p>
              <Link 
                href={`/categories/new?kind=${kind}`} 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Kategori Oluştur
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700" role="rowgroup">
              {items.map((c) => (
                <li
                  key={c.id}
                  role="row"
                  className={[
                    'grid md:grid-cols-5 grid-cols-2 gap-4 px-6 py-4 text-sm',
                    'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200',
                    'focus-within:bg-gray-50 dark:focus-within:bg-gray-700/50',
                  ].join(' ')}
                >
                  {/* Ad */}
                  <div role="cell" className="truncate order-1 md:order-none md:col-auto col-span-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                      {c.isSystem && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                          Sistem
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tür */}
                  <div role="cell" className="order-3 md:order-none">
                    <span
                      className={[
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border',
                        c.kind === 'INCOME'
                          ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                          : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
                      ].join(' ')}
                      title={CATEGORY_KIND_LABELS_TR[c.kind]}
                    >
                      {CATEGORY_KIND_LABELS_TR[c.kind]}
                    </span>
                  </div>

                  {/* Öncelik */}
                  <div role="cell" className="order-4 md:order-none">
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                          getPriorityColor(c.priority),
                        ].join(' ')}
                        title={`Öncelik: ${c.priority} (${getPriorityLabel(c.priority)})`}
                      >
                        {c.priority}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getPriorityLabel(c.priority)}
                      </span>
                    </div>
                  </div>

                  {/* Renk */}
                  <div role="cell" className="flex items-center gap-3 order-2 md:order-none">
                    {c.color ? (
                      <>
                        <span
                          className="inline-block h-4 w-4 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                          style={{ background: c.color }}
                          title={c.color}
                          aria-label={`Renk ${c.color}`}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{c.color}</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </div>

                  {/* İşlemler */}
                  <div role="cell" className="flex items-center justify-end gap-2 order-5 md:order-none">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/categories/${c.id}/edit`}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 rounded-lg"
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
                          className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50 rounded-lg"
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

      {/* Aktif filtre bilgisi */}
      <div className="reveal flex items-center justify-between">
        <p className={['text-xs text-gray-500 dark:text-gray-400', headerPillColor].join(' ')}>
          Aktif tür: <span className="font-medium">{CATEGORY_KIND_LABELS_TR[kind]}</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Toplam: {items.length} kategori
        </p>
      </div>
    </main>
  );
}