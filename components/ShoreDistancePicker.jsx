"use client";
import { useState } from "react";
import { SHORE_OPTIONS } from "../lib/issykkul";

// Расстояние до берега: «На первой линии берега», затем 20–40, 40–60 … до 1 км, затем 1.1, 1.2 … до 50 км.
// Выбор из списка с поиском (введите, например, «300» или «2.5»).
export default function ShoreDistancePicker({ value, onPick }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ql = q.trim().toLowerCase().replace(",", ".");
  const shown = SHORE_OPTIONS.filter((o) => !ql || o.label.toLowerCase().includes(ql));
  return (
    <div className="field-group" style={{ position: "relative", zIndex: 35 }}>
      <div className="field-label">Расстояние до берега</div>
      <button type="button" className="field-input ik-pickbtn" onClick={() => setOpen((v) => !v)}>
        {value || "Выберите расстояние"}<span className="ik-arrow">›</span>
      </button>
      {open && (
        <div className="ik-list">
          <input className="ik-search" autoFocus placeholder="Поиск: 300, 1.5, 12…" value={q} onChange={(e) => setQ(e.target.value)} />
          {value && <button type="button" className="ik-item ik-out" onClick={() => { setOpen(false); setQ(""); onPick("", null); }}>Очистить выбор</button>}
          {shown.slice(0, 120).map((o) => (
            <button type="button" key={o.label} className="ik-item" onClick={() => { setOpen(false); setQ(""); onPick(o.label, o.m); }}>{o.label}</button>
          ))}
          {shown.length > 120 && <div className="ik-head">Показаны первые 120 вариантов — уточните поиск.</div>}
          {shown.length === 0 && <div className="ik-head">Такого варианта нет. Расстояние выбирается из списка.</div>}
          <button type="button" className="ik-close" onClick={() => setOpen(false)}>Закрыть список</button>
        </div>
      )}
      <div className="field-hint">Вводится по реальным данным, а не по названию села или пансионата.</div>
    </div>
  );
}
