"use client";
import { useEffect, useState } from "react";
import { IK_DISTRICTS, IK_OUTSIDE, IK_SETTLEMENTS, IK_ALIASES, ikSettlementsOf, ikCityOf, ikIsCity } from "../lib/issykkul";
import { Picker } from "./Picker";

// География Иссык-Куля: Область (сама) → «Район или город» → «Населённый пункт».
// Список — официальный классификатор СОАТЕ ГК 003-2025. Выбрали город — второй раз выбирать то же самое не нужно.
// Сменили район — село очищается. Нет подходящего села — «Вне населённого пункта» + точка на карте.
export default function IssykKulGeo({ district, city, errorDistrict, errorCity, onChange }) {
  const [q, setQ] = useState("");        // быстрый поиск по всем названиям
  const [q2, setQ2] = useState("");      // поиск внутри района
  const [open, setOpen] = useState(false);
  const isCity = ikIsCity(district);
  const list = district && !isCity ? ikSettlementsOf(district) : [];
  const norm = (s) => String(s || "").toLowerCase().replace(/ё/g, "е");

  useEffect(() => { if (!open) setQ2(""); }, [open]);

  async function coords(name, d) {
    // Координат в справочнике нет — пробуем найти точку по карте; ставим её, только если результат однозначный
    try {
      const r = await fetch(`/api/geocode?region=issykkul&exact=1&q=${encodeURIComponent(name)}`);
      const j = await r.json();
      const c = (j && j.candidates) || [];
      const stem = norm((d || "").replace("г. ", "").split(" ")[0]).slice(0, 5);
      const best = c.length === 1 ? c[0] : c.find((x) => stem && norm(x.sub).includes(stem));
      return best ? [best.lat, best.lng] : [];
    } catch { return []; }
  }

  async function choose(item, withCoords = true) {
    setOpen(false); setQ("");
    onChange(item.d, item.v, item.a || "", item.k || "", undefined, undefined, item.c || "");
    if (!withCoords) return;
    const [la, lo] = await coords(item.n, item.d);
    if (la && lo) onChange(item.d, item.v, item.a || "", item.k || "", la, lo, item.c || "");
  }
  function chooseDistrict(d) {
    if (d === district) return;
    if (ikIsCity(d)) { const c = ikCityOf(d); if (c) { choose(c); return; } }
    onChange(d, "", "", "", undefined, undefined, "");
  }

  // быстрый поиск: названия сёл и городов + села, вошедшие в состав городов
  const ql = norm(q.trim());
  const quick = ql.length < 2 ? [] : [
    ...IK_SETTLEMENTS.filter((x) => norm(x.n).includes(ql) || norm(x.v).includes(ql)).slice(0, 8).map((x) => ({ type: "place", item: x })),
    ...IK_ALIASES.filter((x) => norm(x.q).includes(ql)).map((x) => ({ type: "alias", alias: x })),
  ].slice(0, 10);
  const q2l = norm(q2.trim());
  const shown = list.filter((x) => !q2l || norm(x.n).includes(q2l) || norm(x.a).includes(q2l));

  return (
    <div>
      <div className="field-group">
        <div className="field-label">Область</div>
        <div className="ik-fixed">Иссык-Кульская область</div>
      </div>

      <div className="field-group" style={{ position: "relative", zIndex: 45 }}>
        <div className="field-label">Найти по названию (необязательно)</div>
        <input className="field-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Например: Бостери, Тамчы, Каджи-Сай" />
        {quick.length > 0 && (
          <div className="ik-list">
            {quick.map((r, i) => r.type === "place" ? (
              <button type="button" key={"p" + i} className="ik-item" onClick={() => choose(r.item)}>
                <b>{r.item.n}</b><small>{[r.item.d, r.item.k === "город" ? "город" : r.item.a].filter(Boolean).join(" · ")}</small>
              </button>
            ) : (
              <button type="button" key={"a" + i} className="ik-item" onClick={() => { const c = ikCityOf(r.alias.d); if (c) choose(c); }}>
                <b>{r.alias.q}</b><small>{r.alias.note}. Нажмите, чтобы выбрать {r.alias.d}</small>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="field-group">
        <Picker label="Район или город" required options={IK_DISTRICTS} value={district || ""} error={errorDistrict} onChange={chooseDistrict} />
      </div>

      {isCity ? (
        <div className="field-group">
          <div className="ik-fixed ik-city-note">Город «{city}» сохранён как место расположения объекта. Микрорайон, улицу и адрес укажите ниже.</div>
        </div>
      ) : (
        <div className="field-group" style={{ position: "relative", zIndex: 40 }}>
          <div className="field-label">Населённый пункт <span className="star">*</span></div>
          <button type="button" disabled={!district}
            className={`field-input required-input ik-pickbtn ${errorCity ? "field-error" : ""}`}
            onClick={() => district && setOpen((v) => !v)}>
            {district ? (city || "Выберите населённый пункт") : "Сначала выберите район или город"}
            <span className="ik-arrow">›</span>
          </button>
          {open && (
            <div className="ik-list">
              <input className="ik-search" autoFocus placeholder="Поиск по названию" value={q2} onChange={(e) => setQ2(e.target.value)} />
              {shown.map((x) => (
                <button type="button" key={x.c} className="ik-item" onClick={() => choose(x)}>
                  <b>{x.n}</b><small>{x.a ? `айылный аймак ${x.a}` : ""}</small>
                </button>
              ))}
              {shown.length === 0 && <div className="ik-head">В этом районе такого пункта нет в справочнике.</div>}
              <button type="button" className="ik-item ik-out" onClick={() => { setOpen(false); onChange(district, IK_OUTSIDE, "", "", undefined, undefined, ""); }}>
                {IK_OUTSIDE}
                <small>объект вне села: поставьте точку на карте и опишите местоположение</small>
              </button>
              <div className="ik-head">Не нашли населённый пункт? Напишите нам — мы проверим и обновим справочник. Добавить его самостоятельно нельзя.</div>
              <button type="button" className="ik-close" onClick={() => setOpen(false)}>Закрыть список</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
