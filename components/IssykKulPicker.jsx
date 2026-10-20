"use client";
import { useEffect, useRef, useState } from "react";
import { IK_DISTRICTS, IK_OUTSIDE, ikSettlementsOf } from "../lib/issykkul";
import { Picker } from "./Picker";

// Географический блок Иссык-Куля: Область (автоматически) → Район → Населённый пункт.
// Населённые пункты берутся ТОЛЬКО из справочника выбранного района. Сменили район — село очищается.
// Нет подходящего села: «Вне населённого пункта» + точка на карте (не нужно выбирать неверное село).
export default function IssykKulGeo({ district, city, errorDistrict, errorCity, onChange }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const list = district ? ikSettlementsOf(district) : [];
  const ql = q.trim().toLowerCase();
  const shown = list.filter((x) => !ql || x.n.toLowerCase().includes(ql) || x.a.toLowerCase().includes(ql));

  useEffect(() => { if (!open) setQ(""); }, [open]);

  async function coords(item, d) {
    // Координат в справочнике нет — пробуем найти точку по карте; ставим её, только если результат однозначный
    try {
      const r = await fetch(`/api/geocode?region=issykkul&exact=1&q=${encodeURIComponent(item.n)}`);
      const j = await r.json();
      const c = (j && j.candidates) || [];
      const stem = (d || "").split(" ")[0].slice(0, 5).toLowerCase();
      const best = c.length === 1 ? c[0] : c.find((x) => stem && String(x.sub || "").toLowerCase().includes(stem));
      return best ? [best.lat, best.lng] : [];
    } catch { return []; }
  }

  async function pick(item) {
    setOpen(false);
    onChange(district, item.v, item.a || "", item.k || "");
    const [la, lo] = await coords(item, district);
    if (la && lo) onChange(district, item.v, item.a || "", item.k || "", la, lo);
  }

  return (
    <div>
      <div className="field-group">
        <div className="field-label">Область</div>
        <div className="ik-fixed">Иссык-Кульская область</div>
      </div>
      <div className="field-group">
        <Picker label="Район" required options={IK_DISTRICTS} value={district || ""} error={errorDistrict}
          onChange={(d) => { if (d !== district) onChange(d, "", "", ""); }} />
      </div>
      <div className="field-group" style={{ position: "relative", zIndex: 40 }} ref={box}>
        <div className="field-label">Населённый пункт <span className="star">*</span></div>
        <button type="button" disabled={!district}
          className={`field-input required-input ik-pickbtn ${errorCity ? "field-error" : ""}`}
          onClick={() => district && setOpen((v) => !v)}>
          {district ? (city || "Выберите населённый пункт") : "Сначала выберите район"}
          <span className="ik-arrow">›</span>
        </button>
        {open && (
          <div className="ik-list">
            <input className="ik-search" autoFocus placeholder="Поиск по названию" value={q} onChange={(e) => setQ(e.target.value)} />
            {shown.map((x) => (
              <button type="button" key={x.v} className="ik-item" onClick={() => pick(x)}>
                <b>{x.n}</b>
                <small>{[x.k, x.a].filter(Boolean).join(" · ")}</small>
              </button>
            ))}
            {shown.length === 0 && <div className="ik-head">В этом районе такого пункта нет в справочнике.</div>}
            <button type="button" className="ik-item ik-out" onClick={() => { setOpen(false); onChange(district, IK_OUTSIDE, "", ""); }}>
              {IK_OUTSIDE}
              <small>объект вне села: поставьте точку на карте и опишите местоположение</small>
            </button>
            <button type="button" className="ik-close" onClick={() => setOpen(false)}>Закрыть список</button>
          </div>
        )}
        <div className="field-hint">Справочник: официальный классификатор СОАТЕ. Нужного села нет — напишите, и мы обновим справочник.</div>
      </div>
    </div>
  );
}
