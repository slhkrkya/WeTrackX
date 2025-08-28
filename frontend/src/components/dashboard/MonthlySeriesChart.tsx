'use client';
import { MonthlyPoint } from '@/lib/reports';

type Props = { data: MonthlyPoint[] };

export default function MonthlySeriesChart({ data }: Props) {
  if (!data?.length) return <div className="text-sm opacity-70">Grafik için veri yok.</div>;

  const months = data.map((d) => d.month);
  const incomes = data.map((d) => Number(d.income));
  const expenses = data.map((d) => Number(d.expense));
  const maxVal = Math.max(...incomes, ...expenses, 1);

  const W = 640;
  const H = 220;
  const pad = 28;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const stepX = innerW / Math.max(data.length - 1, 1);

  const y = (v: number) => H - pad - (v / maxVal) * innerH;

  const line = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pad + i * stepX} ${y(v)}`).join(' ');

  return (
    <div className="rounded-xl border p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium">Aylık Gelir / Gider</div>
        <div className="flex items-center gap-3 text-xs opacity-70">
          <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-current" /> Gelir</span>
          <span className="inline-flex items-center gap-1 opacity-70"><span className="inline-block h-2 w-2 rounded-full bg-current" style={{ opacity: 0.6 }} /> Gider</span>
        </div>
      </div>

      <svg width={W} height={H} className="max-w-full h-auto">
        {/* grid */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="currentColor" opacity="0.2" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="currentColor" opacity="0.2" />

        {/* lines */}
        <path d={line(incomes)} fill="none" stroke="currentColor" strokeWidth={2} />
        <path d={line(expenses)} fill="none" stroke="currentColor" strokeWidth={2} opacity={0.6} />

        {/* x labels */}
        {months.map((m, i) => (
          <text
            key={m}
            x={pad + i * stepX}
            y={H - pad + 16}
            fontSize="10"
            textAnchor="middle"
            opacity="0.7"
          >
            {m.slice(2)}{/* YY-MM kısaltma */}
          </text>
        ))}
      </svg>
    </div>
  );
}
