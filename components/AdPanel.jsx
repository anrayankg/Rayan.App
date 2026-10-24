"use client";
import { useEffect, useState } from "react";
import { getCurrentAgent } from "../lib/agent";
import { adInfo, AD_LABEL, daysAgoText, timesText, adHistory, adMarkUpdated, adStartNew, adNotifyChanged } from "../lib/ads";
import ConfirmDialog from "./ConfirmDialog";

// Блок «Реклама» на странице объекта: статус, даты, две кнопки и история действий.
export default function AdPanel({ listing }) {
  const [me, setMe] = useState(null);
  const [hist, setHist] = useState(undefined); // undefined — грузим, null — нет прав/ошибка
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  async function load(m) {
    try { setHist(await adHistory(m, listing.id)); } catch { setHist(null); }
  }
  useEffect(() => { const m = getCurrentAgent(); setMe(m); if (m && m.pin) load(m); else setHist(null); }, [listing.id]); // eslint-disable-line

  if (!me || hist === null || listing.status !== "активен") return null;
  if (hist === undefined) return null;
  const row = hist.cycle ? { created_at: listing.created_at, ...hist.cycle } : { created_at: listing.created_at };
  const info = adInfo(row);

  async function run(fn) {
    setBusy(true); setErr("");
    try { await fn(); await load(me); adNotifyChanged(); } catch (e) { setErr(e.message); }
    setBusy(false);
  }
  const evText = (e) => e.event === "updated" ? "обновил рекламу" : (e.note && e.note.startsWith("первая") ? "отметил рекламу" : "создал новую рекламу");
  const fmt = (iso) => { const d = new Date(iso); return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

  return (
    <div className="adp">
      <div className="adp-head">
        <b>Реклама</b>
        <span className={`ad-badge ${info.status}`}>{AD_LABEL[info.status]}</span>
      </div>
      {info.never ? (
        <div className="adp-line">Реклама ещё не отмечена</div>
      ) : (
        <>
          <div className="adp-line">Реклама создана: {daysAgoText(info.daysCreated)}</div>
          <div className="adp-line">Обновлена: {info.everUpdated ? daysAgoText(info.daysUpdate) : "ещё не обновлялась"} · {timesText(info.updates)}</div>
        </>
      )}
      {info.status === "new" && !info.never && <div className="adp-hint">Пора создать новую рекламу: старое объявление снять, сделать новое.</div>}
      <div className="ad-btns">
        <button className="ad-btn go" disabled={busy} onClick={() => run(() => adMarkUpdated(me, listing.id))}>⟳ Обновил рекламу</button>
        <button className="ad-btn" disabled={busy} onClick={() => setAsk(true)}>＋ Новая реклама</button>
      </div>
      {err && <div className="adp-err">{err}</div>}
      <button className="adp-toggle" onClick={() => setOpen((v) => !v)}>{open ? "Скрыть историю" : `История рекламы (${(hist.events || []).length})`}</button>
      {open && (
        <div className="adp-hist">
          {(hist.events || []).length === 0 && <div className="adp-line">Записей пока нет.</div>}
          {(hist.events || []).map((e, i) => (
            <div key={i} className="adp-ev"><span>{fmt(e.created_at)}</span><span>{e.by_name || "—"} · {evText(e)}</span></div>
          ))}
        </div>
      )}
      <ConfirmDialog open={ask} title="Новая реклама" text="Вы удалили или сняли старое объявление с площадки?"
        confirmText="Да, снял" cancelText="Отмена"
        onConfirm={() => { setAsk(false); run(() => adStartNew(me, listing.id)); }} onCancel={() => setAsk(false)} />
    </div>
  );
}
