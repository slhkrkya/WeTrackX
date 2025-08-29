"use client";

import { useEffect, useMemo, useState } from "react";
import { ReportsAPI, type CategoryTotal, type Cashflow } from "@/lib/reports";

function MonthInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="input w-[12rem]"
      type="month"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function SummaryCards({ data }: { data: Cashflow | null }) {
  if (!data) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="card p-3">
        <div className="subtext">Gelir</div>
        <div className="money-in text-lg font-semibold">{Number(data.income).toLocaleString()}</div>
      </div>
      <div className="card p-3">
        <div className="subtext">Gider</div>
        <div className="money-out text-lg font-semibold">{Number(data.expense).toLocaleString()}</div>
      </div>
      <div className="card p-3">
        <div className="subtext">Bakiye</div>
        <div className="text-lg font-semibold">{Number(data.net).toLocaleString()}</div>
      </div>
    </div>
  );
}

function BarList({ items }: { items: CategoryTotal[] }) {
  const max = useMemo(() => Math.max(1, ...items.map((i) => Math.abs(Number(i.total)))), [items]);
  return (
    <div className="space-y-2">
      {items.map((i) => {
        const v = Math.abs(Number(i.total));
        const w = `${Math.round((v / max) * 100)}%`;
        return (
          <div key={i.categoryId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate">{i.name}</span>
              <span className="subtext">{v.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-elevated overflow-hidden">
              <div className="h-full bg-brand-500/80" style={{ width: w }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const [ym, setYm] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });
  const [summary, setSummary] = useState<Cashflow | null>(null);
  const [byCatExp, setByCatExp] = useState<CategoryTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const [sum, catE] = await Promise.all([
          ReportsAPI.cashflow(),
          ReportsAPI.byCategory('month', ym),
        ]);
        if (!alive) return;
        setSummary(sum);
        setByCatExp(catE);
      } catch (e) {
        if (!alive) return;
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ym]);

  if (loading) return <main className="p-6">Yükleniyor…</main>;

  return (
    <main className="min-h-dvh p-6 space-y-6">
      <div className="reveal flex items-center justify-between">
        <h1 className="h1">Raporlar</h1>
        <MonthInput value={ym} onChange={setYm} />
      </div>

      {err && (
        <div className="reveal card border">
          <p className="form-error">{err}</p>
        </div>
      )}

      <section className="reveal space-y-3">
        <h2 className="h2">Özet</h2>
        <SummaryCards data={summary} />
      </section>

      <section className="reveal space-y-3">
        <h2 className="h2">Kategori Bazlı (Gider)</h2>
        <div className="card p-4">
          <BarList items={byCatExp} />
        </div>
      </section>
    </main>
  );
}
