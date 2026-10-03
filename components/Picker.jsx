"use client";
import { useState, useRef, useEffect } from "react";

// Как в Lalafo: после выбора сразу предлагаем следующий шаг —
// прокручиваем к следующему полю и, если это пустой список выбора, открываем его.
export function goToNextField(fromEl) {
  if (typeof document === "undefined" || !fromEl) return;
  setTimeout(() => {
    const all = Array.from(document.querySelectorAll(".picker-box, .field-input, .field-textarea"));
    const mine = fromEl.querySelector(".picker-box");
    const i = all.indexOf(mine);
    const next = i >= 0 ? all[i + 1] : null;
    if (!next) return;
    next.scrollIntoView({ behavior: "smooth", block: "center" });
    if (next.classList.contains("picker-box") && !next.classList.contains("picker-filled")) {
      setTimeout(() => next.click(), 250);
    }
  }, 60);
}

// Один вариант из списка. Закрыт — показывает "Выберите значение ›",
// заполнен — значение + галочка. Нажатие открывает список вариантов.
export function Picker({ label, required, options, value, onChange, placeholder, error }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const filled = !!value;

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {label && (
        <div className="field-label">
          {label} {required && <span className="star">*</span>}
        </div>
      )}
      <div className={`picker-box ${filled ? "picker-filled" : ""} ${error ? "field-error" : ""}`} onClick={() => setOpen(!open)}>
        <span className={filled ? "" : "picker-placeholder"}>{value || placeholder || "Выберите значение"}</span>
        <span className="picker-arrow">{filled ? "✓" : "›"}</span>
      </div>
      {open && (
        <div className="picker-list">
          {options.map((o) => (
            <div key={o} className={`picker-item ${value === o ? "selected" : ""}`} onClick={() => { const was = value; onChange(o); setOpen(false); if (!was) goToNextField(wrapRef.current); }}>
              <span>{o}</span>{value === o && <span>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Несколько вариантов из списка. Закрыт — показывает список выбранного
// через запятую + галочка, или "Выберите значения ›". Открыт — чекбоксы
// и кнопка "Готово".
export function MultiPicker({ label, required, options, value, onChange, placeholder, error }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = value || [];
  const filled = selected.length > 0;

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle(o) {
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {label && (
        <div className="field-label">
          {label} {required && <span className="star">*</span>}
        </div>
      )}
      <div className={`picker-box ${filled ? "picker-filled" : ""} ${error ? "field-error" : ""}`} onClick={() => setOpen(!open)}>
        <span className={`picker-box-text ${filled ? "" : "picker-placeholder"}`}>
          {filled ? selected.join(", ") : (placeholder || "Выберите значения")}
        </span>
        <span className="picker-arrow">{filled ? "✓" : "›"}</span>
      </div>
      {open && (
        <div className="picker-list">
          {options.map((o) => (
            <div key={o} className={`picker-item ${selected.includes(o) ? "selected" : ""}`} onClick={() => toggle(o)}>
              <span>{o}</span>{selected.includes(o) && <span>✓</span>}
            </div>
          ))}
          <div className="picker-done-btn" onClick={() => { setOpen(false); if (selected.length) goToNextField(wrapRef.current); }}>Далее</div>
        </div>
      )}
    </div>
  );
}
