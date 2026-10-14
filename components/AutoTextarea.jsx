"use client";
import { useEffect, useRef } from "react";

// Текстовое поле, которое растёт вместе с текстом: описание видно целиком,
// его удобно читать и править без прокрутки внутри маленького окошка.
export default function AutoTextarea({ value, className = "", minRows = 8, ...rest }) {
  const ref = useRef(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + 4 + "px";
  };
  useEffect(() => { fit(); }, [value]);
  useEffect(() => { const t = setTimeout(fit, 150); return () => clearTimeout(t); }, []);
  return <textarea ref={ref} rows={minRows} value={value} className={`${className} auto-ta`} onInput={fit} {...rest} />;
}
