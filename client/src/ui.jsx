import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

// --- Brand mark (three stacked survey sheets) -------------------------------
export function BrandMark({ className = "mark", light = false }) {
  const colors = light
    ? ["#EAF3EE", "#EAF3EE", "#EAF3EE"]
    : ["#C9942B", "#1F8A70", "#12463C"];
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <g fill="none" strokeWidth="2">
        <path d="M6 24 L20 17 L34 24 L20 31 Z" fill={colors[0]} stroke={colors[0]} />
        <path d="M6 18 L20 11 L34 18 L20 25 Z" fill={colors[1]} stroke={colors[1]} />
        <path d="M6 12 L20 5 L34 12 L20 19 Z" fill={colors[2]} stroke={colors[2]} />
      </g>
    </svg>
  );
}

// --- Modal ------------------------------------------------------------------
export function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={wide ? "modal wide" : "modal"} role="dialog" aria-modal="true">
        <div className="mhead">
          <h3>{title}</h3>
          <button className="close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="mbody">{children}</div>
        {footer ? <div className="mfoot">{footer}</div> : null}
      </div>
    </div>
  );
}

// --- Toast ------------------------------------------------------------------
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef(null);

  const toast = useCallback((message) => {
    setMsg(message);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2600);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={show ? "toast show" : "toast"}>{msg}</div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || (() => {});
}

// --- Tiny building blocks ---------------------------------------------------
export function Pill({ tone = "neutral", children }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function KV({ k, v, mono = false }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className={mono ? "v mono" : "v"}>{v}</span>
    </div>
  );
}
