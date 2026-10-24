import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type Toast = { id: string; title: string; description?: string };

const ToastContext = createContext<{ notify: (toast: Omit<Toast, 'id'>) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo(
    () => ({
      notify: (toast: Omit<Toast, 'id'>) => {
        const id = crypto.randomUUID();
        setToasts((current) => [...current, { id, ...toast }]);
        window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 2800);
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="surface w-80 p-4 shadow-glow">
            <p className="font-medium text-white">{toast.title}</p>
            {toast.description ? <p className="mt-1 text-sm text-slate-400">{toast.description}</p> : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
