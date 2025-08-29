'use client';

import { useMemo, useRef, useState } from 'react';
import { type MonthlyPoint } from '@/lib/reports';

type Props = { data: MonthlyPoint[] };

export default function MonthlySeriesChart({ data }: Props) {
  // --- Ölçek & geometri ---
  const safeData = useMemo(() => data ?? [], [data]);
  const months = useMemo(() => safeData.map((d) => d.month), [safeData]);
  const incomes = useMemo(() => safeData.map((d) => Number(d.income)), [safeData]);
  const expenses = useMemo(() => safeData.map((d) => Number(d.expense)), [safeData]);
  const hasData = months.length > 0;
  const maxVal = Math.max(...(hasData ? incomes : [0]), ...(hasData ? expenses : [0]), 1);

  // Sabit viewBox (responsive boyutlandırma için), içeride padding ile iç alan
  const W = 640;
  const H = 240;
  const pad = 32;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const stepX = innerW / Math.max(months.length - 1, 1);

  const y = (v: number) => H - pad - (v / maxVal) * innerH;
  const x = (i: number) => pad + i * stepX;

  // Yol oluşturucu
  const line = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  // Area (taban çizgisine kadar kapama)
  const area = (vals: number[]) =>
    vals.length > 0
      ? `M ${x(0)} ${y(vals[0])} ` +
        vals.slice(1).map((v, i) => `L ${x(i + 1)} ${y(v)}`).join(' ') +
        ` L ${x(vals.length - 1)} ${H - pad} L ${x(0)} ${H - pad} Z`
      : '';

  // --- Tooltip state ---
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  function nearestIndexFromEvent(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    // viewBox -> pixel oranı
    const scaleX = W / rect.width;
    const viewX = px * scaleX;
    const i = Math.round((viewX - pad) / stepX);
    if (i < 0 || i > months.length - 1) return null;
    return i;
  }

  const showIdx = hoverIdx ?? (hasData ? months.length - 1 : null); // Hover yoksa son noktayı referans al

  // X ekseni etiketlerini dar ekranda seyrek göster
  const labelEvery = months.length > 8 ? 2 : 1;

  return (
    <div className="reveal card overflow-hidden">
      {/* Başlık + Lejant */}
      <div className="mb-3 flex items-center justify-between px-3 sm:px-4">
        <div className="text-sm font-medium text-foreground">Aylık Gelir / Gider</div>
        <div className="flex items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-2 text-[rgb(var(--success))]">
            <span className="inline-block h-3 w-3 rounded-full bg-current shadow-sm" /> Gelir
          </span>
          <span className="inline-flex items-center gap-2 text-[rgb(var(--error))]">
            <span className="inline-block h-3 w-3 rounded-full bg-current shadow-sm" /> Gider
          </span>
        </div>
      </div>
      {!hasData ? (
        <div className="subtext text-sm px-4 pb-4 text-center">Grafik için veri yok.</div>
      ) : null}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto touch-pan-x"
        role="img"
        aria-label="Aylık gelir-gider çizgi grafiği"
        onMouseMove={(e) => setHoverIdx(nearestIndexFromEvent(e))}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Grid: 4 yatay çizgi + eksenler */}
        <g className="text-foreground/20">
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="currentColor" opacity="0.3" />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="currentColor" opacity="0.15" />
          {[0.25, 0.5, 0.75, 1].map((p, i) => (
            <line
              key={i}
              x1={pad}
              x2={W - pad}
              y1={H - pad - innerH * p}
              y2={H - pad - innerH * p}
              stroke="currentColor"
              opacity="0.12"
            />
          ))}
        </g>

        {/* Areas (hafif) */}
        {hasData && <path d={area(incomes)} className="fill-[rgb(var(--success))] opacity-10" />}
        {hasData && <path d={area(expenses)} className="fill-[rgb(var(--error))] opacity-10" />}

        {/* Lines */}
        {hasData && (
          <path
            d={line(incomes)}
            className="stroke-[rgb(var(--success))]"
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {hasData && (
          <path
            d={line(expenses)}
            className="stroke-[rgb(var(--error))]"
            fill="none"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Noktalar (klavye ile odaklanabilir) */}
        <g>
          {incomes.map((v, i) => (
            <circle
              key={`i-${i}`}
              cx={x(i)}
              cy={y(v)}
              r={i === showIdx ? 5 : 3.5}
              className="fill-[rgb(var(--success))] stroke-white stroke-2 shadow-sm"
              tabIndex={0}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
            />
          ))}
          {expenses.map((v, i) => (
            <circle
              key={`e-${i}`}
              cx={x(i)}
              cy={y(v)}
              r={i === showIdx ? 5 : 3.5}
              className="fill-[rgb(var(--error))] stroke-white stroke-2 shadow-sm"
              tabIndex={0}
              onFocus={() => setHoverIdx(i)}
              onBlur={() => setHoverIdx(null)}
            />
          ))}
        </g>

        {/* Dikey rehber çizgisi + tooltip */}
        {showIdx != null && hasData && (
          <>
            <line
              x1={x(showIdx)}
              x2={x(showIdx)}
              y1={pad}
              y2={H - pad}
              className="stroke-foreground/30"
              strokeDasharray="3 3"
              strokeWidth={1}
            />
            {/* Tooltip kutusu */}
            <foreignObject
              x={Math.min(Math.max(x(showIdx) - 80, pad), W - pad - 160)}
              y={pad}
              width="160"
              height="64"
            >
                             <div className="rounded-lg shadow-lg ring-1 ring-black/20 bg-[rgb(var(--card))] p-3 text-xs leading-4">
                 <div className="font-medium text-foreground mb-2">{months[showIdx]}</div>
                 <div className="flex items-center gap-3">
                   <span className="inline-flex items-center gap-2 text-[rgb(var(--success))]">
                     <span className="inline-block h-2 w-2 rounded-full bg-current" /> {incomes[showIdx].toLocaleString()}
                   </span>
                   <span className="inline-flex items-center gap-2 text-[rgb(var(--error))]">
                     <span className="inline-block h-2 w-2 rounded-full bg-current" /> {expenses[showIdx].toLocaleString()}
                   </span>
                 </div>
               </div>
            </foreignObject>
          </>
        )}

        {/* X ekseni etiketleri */}
        <g className="text-foreground/70">
          {months.map((m, i) => {
            if (i % labelEvery !== 0) return null;
            const short = m.slice(2); // YY-MM
            return (
              <text
                key={`${m}-${i}`}
                x={x(i)}
                y={H - pad + 16}
                fontSize="10"
                textAnchor="middle"
              >
                {short}
              </text>
            );
          })}
        </g>
      </svg>
    </div>
  );
}