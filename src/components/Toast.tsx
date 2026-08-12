"use client";
import { createContext, useContext, useState, useCallback, ReactNode, JSX } from "react";

export type ToastType = "success" | "error" | "info" | "loading";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms — 0 = sticky until dismissed
}

interface ToastCtx {
  toast: (message: string, type?: ToastType, duration?: number) => string;
  dismiss: (id: string) => void;
  promise: <T>(
    fn: Promise<T>,
    messages: { loading: string; success: string; error?: string }
  ) => Promise<T>;
}

const ToastContext = createContext<ToastCtx>({
  toast: () => "",
  dismiss: () => {},
  promise: async (fn) => fn,
});

let idCounter = 0;

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  const icons: Record<ToastType, JSX.Element> = {
    success: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    error: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6L6 10M6 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 7v4M8 5.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    loading: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3"/>
        <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  };

  const colors: Record<ToastType, string> = {
    success: "border-[var(--border)] text-[var(--text)]",
    error:   "border-[var(--border)] text-[var(--text)]",
    info:    "border-[var(--border)] text-[var(--text)]",
    loading: "border-[var(--border)] text-[var(--text)]",
  };

  const iconColors: Record<ToastType, string> = {
    success: "#00D4AA",
    error:   "#EF4444",
    info:    "#6C63FF",
    loading: "#6C63FF",
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border text-sm
        shadow-xl min-w-[280px] max-w-[380px]
        animate-toast-in
        ${colors[t.type]}
      `}
      style={{ backgroundColor: "var(--surface)" }}
    >
      <span style={{ color: iconColors[t.type] }} className="shrink-0 mt-0.5">{icons[t.type]}</span>
      <span className="flex-1 leading-snug" style={{ color: "var(--text)" }}>
        {t.message}
      </span>
      {t.type !== "loading" && (
        <button
          onClick={() => onDismiss(t.id)}
          className="text-[var(--muted)] hover:text-[var(--text)] transition-colors leading-none mt-0.5 shrink-0"
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

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000): string => {
      const id = String(++idCounter);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
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
    <ToastContext.Provider value={{ toast, dismiss, promise }}>
      {children}
      {/* Toast portal */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
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
