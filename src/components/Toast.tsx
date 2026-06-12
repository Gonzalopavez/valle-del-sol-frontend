import { useEffect } from "react";

export type ToastKind = "alert" | "success" | "error";

interface ToastProps {
  kind: ToastKind;
  title: string;
  message: string;
  onClose: () => void;
}

// Notificacion flotante que aparece por encima de la vista y se cierra sola.
// Para la "alerta de evacuacion" usamos kind="alert".
export default function Toast({ kind, title, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${kind}`} role="status">
      <div className="toast-icon">
        {kind === "alert" && "!"}
        {kind === "success" && "\u2713"}
        {kind === "error" && "\u2715"}
      </div>
      <div className="toast-body">
        <p className="toast-title">{title}</p>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Cerrar">
        &times;
      </button>
    </div>
  );
}
