import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

function Toast({ toast, onClose }) {
  const tone = toast.tone || "info";
  const toneCls =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-900"
        : "border-slate-200 bg-[rgb(var(--surface))] text-slate-900";

  return (
    <div
      className={[
        "pointer-events-auto w-full max-w-sm rounded-2xl border px-4 py-3 shadow-[var(--shadow)]",
        toneCls,
      ].join(" ")}
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {toast.title ? <div className="text-sm font-extrabold">{toast.title}</div> : null}
          {toast.message ? <div className="mt-1 text-sm opacity-90">{toast.message}</div> : null}
        </div>
        <button
          className="cursor-pointer rounded-lg px-2 py-1 text-xs font-bold opacity-70 hover:opacity-100"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    ({ title, message, tone = "info", durationMs = 2500 } = {}) => {
      const id = crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
      const toast = { id, title, message, tone };
      setToasts((t) => [toast, ...t].slice(0, 3));
      window.setTimeout(() => dismiss(id), durationMs);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,420px)] flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

