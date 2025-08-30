'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoriesAPI, type CategoryDTO } from '@/lib/categories';
import { type CategoryKind, CATEGORY_KIND_LABELS_TR } from '@/lib/types';

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
      <div className="hidden md:grid grid-cols-3 gap-2 px-4 py-2 text-[11px] label-soft">
        <div>Ad</div>
        <div>Tür</div>
        <div>Renk</div>
      </div>
      <ul className="divide-y">
        {rows.map((_, i) => (
          <li key={i} className="grid md:grid-cols-3 grid-cols-2 gap-2 px-4 py-3">
            <div className="col-span-2 md:col-span-1 h-4 rounded bg-[rgb(var(--surface-1))] animate-pulse" />
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
  const initialKind = (sp.get('kind') as CategoryKind) || 'EXPENSE';

  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [items, setItems] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

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
          <div className="hidden md:grid grid-cols-3 gap-2 px-4 py-2 text-[11px] label-soft" role="rowgroup">
            <div role="columnheader">Ad</div>
            <div role="columnheader">Tür</div>
            <div role="columnheader">Renk</div>
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
                    'grid md:grid-cols-3 grid-cols-2 gap-2 px-4 py-2 text-sm',
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