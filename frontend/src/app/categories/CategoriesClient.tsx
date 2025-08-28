'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoriesAPI, type CategoryDTO, type CategoryKind } from '@/lib/categories';

const KINDS: CategoryKind[] = ['INCOME', 'EXPENSE'];

export default function CategoriesClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialKind = (sp.get('kind') as CategoryKind) || 'EXPENSE';

  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [items, setItems] = useState<CategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const data = await CategoriesAPI.list(kind);
        setItems(data);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        router.replace('/auth/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [kind, router]);

  function onChangeKind(k: CategoryKind) {
    setKind(k);
    router.replace(`/categories?kind=${k}`);
  }

  if (loading) return <main className="p-6">Yükleniyor…</main>;

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Kategoriler</h1>
        <div className="flex items-center gap-2">
          <select
            className="rounded border px-3 py-1.5 bg-transparent text-sm"
            value={kind}
            onChange={(e) => onChangeKind(e.target.value as CategoryKind)}
          >
            {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <a href={`/categories/new?kind=${kind}`} className="border rounded px-3 py-1.5 text-sm">
            Yeni Kategori
          </a>
        </div>
      </div>

      {err && <div className="text-sm border rounded p-3">{err}</div>}

      <div className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-3 gap-2 px-4 py-2 text-[11px] opacity-60">
          <div>Ad</div>
          <div>Tür</div>
          <div>Renk</div>
        </div>
        {items.length === 0 ? (
          <div className="p-4 text-sm opacity-70">Henüz kategori yok.</div>
        ) : (
          <ul className="divide-y">
            {items.map(c => (
              <li key={c.id} className="grid grid-cols-3 gap-2 px-4 py-2 text-sm">
                <div className="truncate">{c.name}</div>
                <div>{c.kind}</div>
                <div className="flex items-center gap-2">
                  {c.color ? (
                    <span className="inline-block h-3 w-3 rounded-full border" style={{ background: c.color }} />
                  ) : <span className="opacity-60">—</span>}
                  <span className="text-xs opacity-70">{c.color || ''}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}