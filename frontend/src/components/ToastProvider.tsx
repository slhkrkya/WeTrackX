"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastKind = "success" | "error" | "info";
export type Toast = { id: number; kind: ToastKind; message: string };

type ToastContextValue = {
  show: (message: string, kind?: ToastKind, timeoutMs?: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const show = useCallback((message: string, kind: ToastKind = "info", timeoutMs = 3000) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, kind, message }]);
    window.setTimeout(() => {
      setList((l) => l.filter((t) => t.id !== id));
    }, timeoutMs);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {list.map((t) => (
          <div key={t.id} className={[
            "toast",
            t.kind === "success" ? "border-positive-500" : t.kind === "error" ? "border-negative-500" : "",
          ].join(" ")}
            role="status"
          >
            <span className={t.kind === "success" ? "money-in" : t.kind === "error" ? "money-out" : ""}>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
