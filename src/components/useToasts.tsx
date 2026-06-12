import { useState, useCallback } from "react";
import Toast, { type ToastKind } from "./Toast";
import "./Toast.css";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
}

let nextId = 1;

// Hook que centraliza el estado de las notificaciones.
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (kind: ToastKind, title: string, message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, kind, title, message }]);
    },
    []
  );

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = useCallback(
    () => (
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            kind={t.kind}
            title={t.title}
            message={t.message}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    ),
    [toasts, removeToast]
  );

  return { showToast, ToastContainer };
}
