'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoriesAPI, type CategoryKind } from '@/lib/categories';

const KINDS: CategoryKind[] = ['INCOME', 'EXPENSE'];

export default function NewCategoryClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialKind = (sp.get('kind') as CategoryKind) || 'EXPENSE';

  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [color, setColor] = useState('#22c55e');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const payload = { name: name.trim(), kind, color: color || undefined };
      if (!payload.name) throw new Error('Kategori adı zorunlu');
      await CategoriesAPI.create(payload);
      router.replace(`/categories?kind=${kind}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh p-6 flex justify-center">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 border rounded-xl p-5">
        <h1 className="text-2xl font-bold">Yeni Kategori</h1>

        {err && <div className="text-sm border rounded p-2">{err}</div>}

        <div className="space-y-1">
          <label className="text-sm">Ad</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Market, Maaş, Ulaşım..."
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm">Tür</label>
          <select
            className="w-full rounded border px-3 py-2 bg-transparent"
            value={kind}
            onChange={(e) => setKind(e.target.value as CategoryKind)}
          >
            {KINDS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm">Renk (opsiyonel)</label>
          <div className="flex items-center gap-2">
            <input
              className="h-9 w-16 p-0 border rounded"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <input
              className="flex-1 rounded border px-3 py-2"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#22c55e"
            />
          </div>
          <p className="text-xs opacity-70">Renk belirtmek zorunlu değil.</p>
        </div>

        <div className="flex items-center gap-2">
          <button disabled={loading} className="rounded px-4 py-2 border">
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <a href={`/categories?kind=${kind}`} className="text-sm underline">İptal</a>
        </div>
      </form>
    </main>
  );
}