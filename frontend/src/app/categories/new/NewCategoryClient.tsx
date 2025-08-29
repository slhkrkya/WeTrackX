'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoriesAPI } from '@/lib/categories';
import { type CategoryKind, CATEGORY_KIND_LABELS_TR } from '@/lib/types';

const KINDS: CategoryKind[] = ['INCOME', 'EXPENSE'];

// Basit hex doğrulama (#RGB veya #RRGGBB)
function isValidHexColor(s: string) {
  return /^#([0-9A-F]{3}|[0-9A-F]{6})$/i.test(s.trim());
}

// Tür bazlı makul varsayılan hex (global tokenlara yakın tonlar)
function defaultHexForKind(k: CategoryKind) {
  return k === 'INCOME' ? '#16A34A' /* success-600 */ : '#DC2626' /* error-600 */;
}

export default function NewCategoryClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const initialKind = (sp.get('kind') as CategoryKind) || 'EXPENSE';

  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [color, setColor] = useState<string>(''); // opsiyonel; boş bırakılabilir
  const [priority, setPriority] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // Alan bazlı hatalar
  const [nameErr, setNameErr] = useState('');
  const [colorErr, setColorErr] = useState('');
  const [priorityErr, setPriorityErr] = useState('');

  // Panel başlığına küçük renk vurgusu
  const headerClr = useMemo(
    () => (kind === 'INCOME' ? 'text-[rgb(var(--success))]' : 'text-[rgb(var(--error))]'),
    [kind]
  );

  // Tür değiştiğinde, kullanıcı renk alanını boş bırakmışsa otomatik makul hex ata
  useEffect(() => {
    if (!color.trim()) setColor(defaultHexForKind(kind));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  function validate() {
    let ok = true;

    if (!name.trim()) {
      setNameErr('Kategori adı zorunlu');
      ok = false;
    } else {
      setNameErr('');
    }

    if (color.trim()) {
      if (!isValidHexColor(color)) {
        setColorErr('Geçerli bir HEX renk girin (örn: #22C55E veya #2C3)');
        ok = false;
      } else {
        setColorErr('');
      }
    } else {
      // boş bırakılabilir
      setColorErr('');
    }

    // Öncelik kontrolü
    if (priority < -100 || priority > 100) {
      setPriorityErr('Öncelik -100 ile 100 arasında olmalı');
      ok = false;
    } else {
      setPriorityErr('');
    }

    return ok;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setErr('');
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        kind,
        color: color.trim() ? color.trim().toUpperCase() : undefined,
        priority,
      };
      await CategoriesAPI.create(payload);
      router.replace(`/categories?kind=${kind}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh p-6 flex justify-center">
      <form onSubmit={onSubmit} className="reveal w-full max-w-md space-y-5 card">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <h1 className={['text-2xl font-bold', headerClr].join(' ')}>Yeni Kategori</h1>
          <Link href={`/categories?kind=${kind}`} className="nav-link">
            Listeye Dön
          </Link>
        </div>

        {/* Genel hata */}
        {err && (
          <div className="card ring-1 ring-[rgb(var(--error))]/25" role="alert">
            <p className="text-sm text-[rgb(var(--error))]">{err}</p>
          </div>
        )}

        {/* Ad */}
        <div className="space-y-1">
          <label htmlFor="name" className="label-soft">Ad</label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (!name.trim()) setNameErr('Kategori adı zorunlu');
              else setNameErr('');
            }}
            placeholder="Market, Maaş, Ulaşım..."
            required
            aria-invalid={!!nameErr}
            aria-describedby={nameErr ? 'name-err' : undefined}
          />
          {nameErr && <p id="name-err" className="text-xs text-[rgb(var(--error))]">{nameErr}</p>}
        </div>

        {/* Tür */}
        <div className="space-y-1">
          <label htmlFor="kind" className="label-soft">Tür</label>
          <select
            id="kind"
            className="input bg-transparent"
            value={kind}
            onChange={(e) => setKind(e.target.value as CategoryKind)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>{CATEGORY_KIND_LABELS_TR[k]}</option>
            ))}
          </select>
        </div>

        {/* Öncelik */}
        <div className="space-y-1">
          <label htmlFor="priority" className="label-soft">Öncelik</label>
          <input
            id="priority"
            className="input"
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            onBlur={() => {
              if (priority < -100 || priority > 100) setPriorityErr('Öncelik -100 ile 100 arasında olmalı');
              else setPriorityErr('');
            }}
            placeholder="0"
            min="-100"
            max="100"
            aria-invalid={!!priorityErr}
            aria-describedby={priorityErr ? 'priority-err' : 'priority-help'}
          />
          {priorityErr ? (
            <p id="priority-err" className="text-xs text-[rgb(var(--error))]">{priorityErr}</p>
          ) : (
            <p id="priority-help" className="text-xs label-soft">Yüksek sayı = yüksek öncelik. -100 ile 100 arası.</p>
          )}
        </div>

        {/* Renk (opsiyonel) */}
        <div className="space-y-1">
          <label htmlFor="color-text" className="label-soft">Renk (opsiyonel)</label>
          <div className="flex items-center gap-2">
            {/* Renk seçici */}
            <input
              aria-label="Renk seçici"
              className={[
                'h-9 w-16 p-0 rounded',
                'ring-1 ring-black/10 bg-[rgb(var(--card))]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]',
              ].join(' ')}
              type="color"
              value={color || defaultHexForKind(kind)}
              onChange={(e) => setColor(e.target.value)}
              title="Renk seç"
            />
            {/* Hex text input */}
            <input
              id="color-text"
              className="input flex-1 font-mono uppercase"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              onBlur={() => {
                const v = color.trim();
                if (!v) { setColor(''); setColorErr(''); return; }
                if (!isValidHexColor(v)) setColorErr('Geçerli bir HEX renk girin (örn: #22C55E veya #2C3)');
                else {
                  // normalize: büyük harf
                  setColor(v.toUpperCase());
                  setColorErr('');
                }
              }}
              placeholder="#22C55E"
              aria-invalid={!!colorErr}
              aria-describedby={colorErr ? 'color-err' : 'color-help'}
            />
          </div>

          {/* Canlı önizleme satırı */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full border border-black/10"
              style={{ background: color || defaultHexForKind(kind) }}
              aria-hidden="true"
            />
            {colorErr ? (
              <p id="color-err" className="text-xs text-[rgb(var(--error))]">{colorErr}</p>
            ) : (
              <p id="color-help" className="text-xs label-soft">Renk belirtmek zorunlu değil.</p>
            )}
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-2">
          <button disabled={loading} className="btn btn-primary" type="submit">
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <Link href={`/categories?kind=${kind}`} className="nav-link">İptal</Link>
        </div>
      </form>
    </main>
  );
}