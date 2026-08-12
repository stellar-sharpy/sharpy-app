"use client";
import { createContext, useContext, useState, useCallback, ReactNode, JSX } from "react";

export type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType, duration?: number) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  promise: <T>(
    fn: Promise<T>,
    messages: { loading: string; success: string; error?: string }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastCtx>({
  toast: () => "",
  dismiss: () => {},
  dismissAll: () => {},
  promise: async (fn) => fn,
});

let idCounter = 0;

const iconColors: Record<ToastType, string> = {
  success: "#00D4AA",
  error:   "#EF4444",
  info:    "#6C63FF",
  loading: "#6C63FF",
};

function ToastIcon({ type }: { type: ToastType }): JSX.Element {
  if (type === "success") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type === "error") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  if (type === "loading") return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="animate-spin-slow">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.25"/>
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm shadow-xl animate-toast-in min-w-[300px] max-w-[420px]"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
    >
      <span style={{ color: iconColors[t.type] }} className="shrink-0">
        <ToastIcon type={t.type} />
      </span>
      <span className="flex-1 leading-snug">{t.message}</span>
      {t.type !== "loading" && (
        <button
          onClick={() => onDismiss(t.id)}
          className="shrink-0 text-lg leading-none transition-colors"
          style={{ color: "var(--muted)" }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000): string => {
      const id = String(++idCounter);
      // Replace any existing loading toast when a new one comes in
      setToasts((prev) => {
        const withoutLoading = type === "loading" ? prev.filter((t) => t.type !== "loading") : prev;
        return [...withoutLoading, { id, type, message, duration }];
      });
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const promise = useCallback(
    async <T,>(
      fn: Promise<T>,
      messages: { loading: string; success: string; error?: string }
    ): Promise<T> => {
      const id = toast(messages.loading, "loading", 0);
      try {
        const result = await fn;
        dismiss(id);
        toast(messages.success, "success");
        return result;
      } catch (err: any) {
        dismiss(id);
        toast(messages.error ?? err?.message ?? "Something went wrong", "error");
        throw err;
      }
    },
    [toast, dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll, promise }}>
      {children}
      {/* Top-center portal */}
      <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem t={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
