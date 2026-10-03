"use client";
import { useState, useRef, useEffect } from "react";

export default function LocationPicker({ label, options, value, onChange, required }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const wrapRef = useRef(null);

  useEffect(() => setQuery(value || ""), [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery(value || ""); // не выбрали из списка — возвращаем как было
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
    : options; // пустой запрос = показываем ПОЛНЫЙ список гарантированно

  function pick(val) {
    setQuery(val);
    onChange(val);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {label && (
        <div className="field-label">
          {label} {required && <span className="star">*</span>}
        </div>
      )}
      <input
        className="field-input required-input"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Печатайте буквы или нажмите, чтобы открыть весь список"
      />
      {open && (
        <div
          style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999,
            marginTop: 4, maxHeight: 260, overflowY: "auto",
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--r)", boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: "12px 14px", color: "var(--muted)", fontSize: 12 }}>Ничего не найдено</div>
          )}
          {filtered.map((o) => (
            <div
              key={o}
              onClick={() => pick(o)}
              style={{
                padding: "10px 14px", fontSize: 13, color: "var(--text)", cursor: "pointer",
                borderBottom: "1px solid var(--line-soft)",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {o}
            </div>
          ))}
        </div>
      )}
      <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 5 }}>
        Показано: {filtered.length} из {options.length}
      </div>
    </div>
  );
}
