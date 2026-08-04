import { useCallback, useMemo, useRef, useState } from "react";
import { ToastContext } from "./toastContextObject";
import "./Toast.css";

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeoutId = timers.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { type = "info", duration = 4000 } = {}) => {
      const id = ++idCounter;
      setToasts((current) => [...current, { id, message, type }]);

      if (duration > 0) {
        const timeoutId = window.setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timeoutId);
      }

      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message, options) => push(message, { ...options, type: "success" }),
      error: (message, options) => push(message, { ...options, type: "error" }),
      info: (message, options) => push(message, { ...options, type: "info" }),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.type}`}>
            <span className="toast__icon">
              {toast.type === "success" ? "✓" : toast.type === "error" ? "!" : "i"}
            </span>
            <p className="toast__message">{toast.message}</p>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
