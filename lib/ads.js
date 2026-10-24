"use client";
import { supabase } from "./supabase";

// Правила рекламного кабинета. ДОЛЖНЫ совпадать с файлом RAYAN_reklama.sql (там то же самое для статистики).
export const AD_UPDATE_DAYS = 7;   // с последнего обновления прошло столько дней → «Пора обновить»
export const AD_NEW_DAYS = 30;     // с создания рекламы прошло столько дней → «Новая реклама»
export const AD_NEW_UPDATES = 5;   // или сделано столько обновлений → «Новая реклама»
const DAY = 864e5;

// row: { created_at, started_at, last_update_at, updates_count } из базы (started_at пусто — реклама ещё не отмечена)
export function adInfo(row, now = Date.now()) {
  if (!row || !row.started_at) return { status: "new", never: true, daysCreated: null, daysUpdate: null, updates: 0, reason: "never" };
  const daysCreated = Math.floor((now - new Date(row.started_at).getTime()) / DAY);
  const ref = row.last_update_at || row.started_at;
  const daysUpdate = Math.floor((now - new Date(ref).getTime()) / DAY);
  const updates = Number(row.updates_count || 0);
  let status = "ok", reason = "";
  if (daysCreated >= AD_NEW_DAYS || updates >= AD_NEW_UPDATES) { status = "new"; reason = updates >= AD_NEW_UPDATES ? "updates" : "age"; }
  else if (daysUpdate >= AD_UPDATE_DAYS) status = "update";
  return { status, never: false, daysCreated, daysUpdate, updates, reason, everUpdated: !!row.last_update_at };
}

export const AD_LABEL = { new: "Новая реклама", update: "Пора обновить", ok: "Недавно обновлено" };

export function daysAgoText(n) {
  if (n === null || n === undefined) return "";
  if (n <= 0) return "сегодня";
  const a = n % 10, b = n % 100;
  const w = a === 1 && b !== 11 ? "день" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "дня" : "дней";
  return `${n} ${w} назад`;
}
export function timesText(n) {
  const a = n % 10, b = n % 100;
  const w = a === 1 && b !== 11 ? "раз" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "раза" : "раз";
  return `${n} ${w}`;
}

// Порядок: 1) пора создать новую рекламу (сначала самые просроченные, затем те, где реклама не отмечена — от самых старых объектов),
// 2) пора обновить — с самой давней датой обновления, 3) остальные.
export function sortAds(items) {
  const g = { new: 0, update: 1, ok: 2 };
  return [...items].sort((x, y) => {
    if (g[x.info.status] !== g[y.info.status]) return g[x.info.status] - g[y.info.status];
    if (x.info.status === "new") {
      if (x.info.never !== y.info.never) return x.info.never ? 1 : -1;
      if (!x.info.never) return (y.info.daysCreated - x.info.daysCreated) || (y.info.updates - x.info.updates);
      return new Date(x.row.created_at || 0) - new Date(y.row.created_at || 0);
    }
    return (y.info.daysUpdate - x.info.daysUpdate) || (y.info.daysCreated - x.info.daysCreated);
  });
}

export function adCounts(rows, now = Date.now()) {
  let nw = 0, up = 0;
  for (const r of rows || []) { const s = adInfo(r, now).status; if (s === "new") nw++; else if (s === "update") up++; }
  return { need: nw + up, update: up, new: nw };
}

const auth = (me) => ({ p_phone: me.phone, p_pin: me.pin || "" });
function fail(error) {
  const m = (error && error.message) || "";
  if (/ads_state|ad_mark_updated|ad_start_new|ad_history/.test(m)) return "В базе ещё не включена реклама. Выполните файл RAYAN_reklama.sql в Supabase.";
  if (/Нет доступа/.test(m)) return "Нет доступа. Выйдите из Профиля и войдите заново по номеру и ПИН-коду.";
  if (/Нет прав/.test(m)) return "Нет прав на этот объект.";
  return "Ошибка: " + m;
}
export async function adLoadState(me) {
  const { data, error } = await supabase.rpc("ads_state", auth(me));
  if (error) throw new Error(fail(error));
  return data || [];
}
export async function adMarkUpdated(me, listingId) {
  const { data, error } = await supabase.rpc("ad_mark_updated", { ...auth(me), p_listing: listingId });
  if (error) throw new Error(fail(error));
  return data;
}
export async function adStartNew(me, listingId) {
  const { data, error } = await supabase.rpc("ad_start_new", { ...auth(me), p_listing: listingId, p_removed_old: true });
  if (error) throw new Error(fail(error));
  return data;
}
export async function adHistory(me, listingId) {
  const { data, error } = await supabase.rpc("ad_history", { ...auth(me), p_listing: listingId });
  if (error) throw new Error(fail(error));
  return data;
}
// Красная цифра на кнопке «Реклама» обновляется после любого действия
export function adNotifyChanged() { try { sessionStorage.removeItem("rayan_ad_badge"); window.dispatchEvent(new Event("rayan-ads-changed")); } catch {} }
