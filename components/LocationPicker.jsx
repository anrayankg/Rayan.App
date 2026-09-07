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
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        className="field-input"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder="Печатайте буквы или нажмите, чтобы открыть весь список"
      />
      {open && (
        <div
          style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
            marginTop: 4, maxHeight: 260, overflowY: "auto",
            background: "#0A4A38", border: "1px solid rgba(212,164,55,0.4)",
            borderRadius: 12, boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          }}
        >
          {filtered.length === 0 && (
            <div style={{ padding: "12px 14px", color: "#9FC2B2", fontSize: 12 }}>Ничего не найдено</div>
          )}
          {filtered.map((o) => (
            <div
              key={o}
              onClick={() => pick(o)}
              style={{
                padding: "10px 14px", fontSize: 13, color: "#F6F1E4", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {o}
            </div>
          ))}
        </div>
      )}
      <div style={{ color: "#7FA396", fontSize: 10, marginTop: 5 }}>
        Показано: {filtered.length} из {options.length}
      </div>
    </div>
  );
}
