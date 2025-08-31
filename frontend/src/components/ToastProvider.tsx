"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastKind = "success" | "error" | "info" | "warning";
export type Toast = { id: number; kind: ToastKind; message: string; title?: string };

type ToastContextValue = {
  show: (message: string, kind?: ToastKind, timeoutMs?: number, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const toastStyles = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: 'text-green-600 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-800'
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-100 dark:bg-red-800'
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-800'
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-800'
  }
};

const getIcon = (kind: ToastKind) => {
  switch (kind) {
    case 'success':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'warning':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'info':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  
  const show = useCallback((message: string, kind: ToastKind = "info", timeoutMs = 4000, title?: string) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, kind, message, title }]);
    window.setTimeout(() => {
      setList((l) => l.filter((t) => t.id !== id));
    }, timeoutMs);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full sm:max-w-md">
        {list.map((t) => {
          const style = toastStyles[t.kind];
          return (
            <div
              key={t.id}
              className={[
                "pointer-events-auto relative overflow-hidden rounded-xl border shadow-lg",
                "transform transition-all duration-300 ease-out",
                "animate-in slide-in-from-right-full",
                style.bg,
                style.border,
                style.text,
              ].join(" ")}
              role="alert"
              aria-live="assertive"
            >
              {/* Progress bar */}
              <div className="absolute top-0 left-0 h-1 bg-current opacity-20 animate-pulse" style={{ width: '100%' }} />
              
              <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className={[
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  style.iconBg
                ].join(" ")}>
                  {getIcon(t.kind)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {t.title && (
                    <h4 className="font-semibold text-sm mb-1">{t.title}</h4>
                  )}
                  <p className="text-sm leading-relaxed">{t.message}</p>
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => setList((l) => l.filter((toast) => toast.id !== t.id))}
                  className="flex-shrink-0 w-5 h-5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                  aria-label="Bildirimi kapat"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
