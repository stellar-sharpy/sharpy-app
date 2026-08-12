"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

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
  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    loading: "⟳",
  };

  const colors: Record<ToastType, string> = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    error: "border-red-500/30 bg-red-500/10 text-red-400",
    info: "border-[#6C63FF]/30 bg-[#6C63FF]/10 text-[#6C63FF]",
    loading: "border-[#6C63FF]/20 bg-[#6C63FF]/8 text-[#6C63FF]",
  };

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border text-sm
        shadow-lg backdrop-blur-sm min-w-[260px] max-w-[380px]
        animate-toast-in
        ${colors[t.type]}
      `}
      style={{ backgroundColor: "var(--surface)" }}
    >
      <span
        className={`text-base leading-none mt-0.5 shrink-0 ${t.type === "loading" ? "animate-spin-slow" : ""}`}
      >
        {icons[t.type]}
      </span>
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
