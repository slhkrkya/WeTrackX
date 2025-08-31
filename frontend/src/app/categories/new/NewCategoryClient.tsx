'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CategoriesAPI } from '@/lib/categories';
import { type CategoryKind, CATEGORY_KIND_LABELS_TR } from '@/lib/types';
import { useToast } from '@/components/ToastProvider';

const KINDS: CategoryKind[] = ['INCOME', 'EXPENSE'];

function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function defaultHexForKind(k: CategoryKind) {
  return k === 'INCOME' ? '#22C55E' : '#EF4444';
}

export default function NewCategoryClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { show } = useToast();
  const initialKind = (sp.get('kind') as CategoryKind) || 'EXPENSE';

  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>(initialKind);
  const [color, setColor] = useState<string>(''); // opsiyonel; boş bırakılabilir
  const [priority, setPriority] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>('');

  // Alan bazlı hatalar
  const [nameErr, setNameErr] = useState('');
  const [colorErr, setColorErr] = useState('');
  const [priorityErr, setPriorityErr] = useState('');

  // Panel başlığına küçük renk vurgusu
  const headerClr = useMemo(
    () => (kind === 'INCOME' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'),
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
    if (priority < 1 || priority > 10) {
      setPriorityErr('Öncelik 1 ile 10 arasında olmalı');
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
      show('Kategori başarıyla oluşturuldu!', 'success');
      router.replace(`/categories?kind=${kind}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setErr(errorMessage);
      show(errorMessage, 'error');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh p-4 md:p-6 flex justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <form onSubmit={onSubmit} className="reveal w-full max-w-md space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        {/* Başlık */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={['text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent', headerClr].join(' ')}>
              Yeni Kategori
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {kind === 'INCOME' ? 'Gelir' : 'Gider'} kategorisi oluşturun
            </p>
          </div>
          <Link 
            href={`/categories?kind=${kind}`} 
            className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Listeye Dön
          </Link>
        </div>

        {/* Genel hata */}
        {err && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4" role="alert">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{err}</p>
            </div>
          </div>
        )}

        {/* Ad */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Ad</label>
          <input
            id="name"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
          {nameErr && <p id="name-err" className="text-xs text-red-600 dark:text-red-400">{nameErr}</p>}
        </div>

        {/* Tür */}
        <div className="space-y-2">
          <label htmlFor="kind" className="text-sm font-medium text-gray-700 dark:text-gray-300">Tür</label>
          <select
            id="kind"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={kind}
            onChange={(e) => setKind(e.target.value as CategoryKind)}
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>{CATEGORY_KIND_LABELS_TR[k]}</option>
            ))}
          </select>
        </div>

        {/* Öncelik */}
        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium text-gray-700 dark:text-gray-300">Öncelik</label>
          <input
            id="priority"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            type="number"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            onBlur={() => {
              if (priority < 1 || priority > 10) setPriorityErr('Öncelik 1 ile 10 arasında olmalı');
              else setPriorityErr('');
            }}
            placeholder="5"
            min="1"
            max="10"
            aria-invalid={!!priorityErr}
            aria-describedby={priorityErr ? 'priority-err' : 'priority-help'}
          />
          {priorityErr ? (
            <p id="priority-err" className="text-xs text-red-600 dark:text-red-400">{priorityErr}</p>
          ) : (
            <p id="priority-help" className="text-xs text-gray-500 dark:text-gray-400">1 = En yüksek öncelik, 10 = En düşük öncelik. 1-10 arası.</p>
          )}
        </div>

        {/* Renk (opsiyonel) */}
        <div className="space-y-2">
          <label htmlFor="color-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">Renk (opsiyonel)</label>
          <div className="flex items-center gap-3">
            {/* Renk seçici */}
            <input
              aria-label="Renk seçici"
              className={[
                'h-10 w-16 p-0 rounded-lg',
                'ring-1 ring-gray-200 dark:ring-gray-600 bg-white dark:bg-gray-700',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              ].join(' ')}
              type="color"
              value={color || defaultHexForKind(kind)}
              onChange={(e) => setColor(e.target.value)}
              title="Renk seç"
            />
            {/* Hex text input */}
            <input
              id="color-text"
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono uppercase"
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
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-4 w-4 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
              style={{ background: color || defaultHexForKind(kind) }}
              aria-hidden="true"
            />
            {colorErr ? (
              <p id="color-err" className="text-xs text-red-600 dark:text-red-400">{colorErr}</p>
            ) : (
              <p id="color-help" className="text-xs text-gray-500 dark:text-gray-400">Renk belirtmek zorunlu değil.</p>
            )}
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center gap-3 pt-4">
          <button 
            disabled={loading} 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none" 
            type="submit"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Kaydediliyor…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Kaydet
              </>
            )}
          </button>
          <Link 
            href={`/categories?kind=${kind}`} 
            className="inline-flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            İptal
          </Link>
        </div>
      </form>
    </main>
  );
}