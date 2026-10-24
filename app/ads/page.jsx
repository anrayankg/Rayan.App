"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../../components/BottomNav";
import FilterWizard from "../../components/FilterWizard";
import ConfirmDialog from "../../components/ConfirmDialog";
import { EMPTY, matchListing, activeCount } from "../../lib/filterConfig";
import { fullCharLine, shortDate, priceBlock, isPso, listingCategory, priceSuffix } from "../../lib/listingFormat";
import { getCurrentAgent, isOwnListing, isManager } from "../../lib/agent";
import { useAgentsDir, agentByPhone, agentPhoto, agentDisplayName } from "../../lib/agentsDir";
import { R_ICON } from "../../lib/logo";
import { useKeptState } from "../../lib/keepState";
import { adInfo, sortAds, AD_LABEL, daysAgoText, timesText, adLoadState, adMarkUpdated, adStartNew, adNotifyChanged } from "../../lib/ads";

const last9 = (s) => String(s || "").replace(/\D/g, "").slice(-9);

// Реклама: объекты, по которым нужно рекламное действие. Карточки такие же, как на главной.
// RAYAN только записывает действия агента: на сайтах (Lalafo и др.) ничего автоматически не меняется.
export default function AdsPage() {
  const router = useRouter();
  const agentsDir = useAgentsDir();
  const [me, setMe] = useState(undefined);
  const [listings, setListings] = useState(null);
  const [adMap, setAdMap] = useState(null);
  const [error, setError] = useState("");
  const [show, setShow] = useKeptState("ads_show", "need");     // need | update | new | all
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useKeptState("ads_filter", EMPTY);
  const [filterOpen, setFilterOpen] = useState(false);
  const [agentFilter, setAgentFilter] = useKeptState("ads_agent", "all");
  const [busyId, setBusyId] = useState(null);
  const [askId, setAskId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { setMe(getCurrentAgent()); }, []);

  async function load(m) {
    setError("");
    try {
      const rows = await adLoadState(m);
      setAdMap(new Map(rows.map((r) => [r.id, r])));
      const { data, error: e } = await supabase.from("listings").select("*").eq("status", "активен");
      if (e) throw new Error("Не удалось загрузить объекты: " + e.message);
      setListings(data || []);
    } catch (e) { setError(e.message); setAdMap(new Map()); setListings([]); }
  }
  useEffect(() => { if (me && me.pin) load(me); else if (me === null || (me && !me.pin)) { setListings([]); setAdMap(new Map()); } }, [me]); // eslint-disable-line

  // переход из статистики: /ads?agent=<код>&show=need
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("agent")) setAgentFilter(q.get("agent"));
      if (q.get("show")) setShow(q.get("show"));
      if (q.get("agent") || q.get("show")) window.history.replaceState(null, "", "/ads");
    } catch {}
  }, []); // eslint-disable-line

  const items = useMemo(() => {
    if (!listings || !adMap) return [];
    return listings.filter((l) => adMap.has(l.id)).map((l) => { const row = adMap.get(l.id); return { l, row, info: adInfo(row) }; });
  }, [listings, adMap]);

  const counts = useMemo(() => {
    const c = { new: 0, update: 0, ok: 0 };
    items.forEach((x) => { c[x.info.status] += 1; });
    return { need: c.new + c.update, update: c.update, new: c.new, all: items.length };
  }, [items]);

  const agentOptions = useMemo(() => {
    if (!me || !isManager(me)) return [];
    const by = {};
    items.forEach((x) => { const k = last9(x.l.agent_phone); if (k) by[k] = (by[k] || 0) + 1; });
    return Object.keys(by).map((k) => ({ v: k, t: `${agentDisplayName(agentsDir, "+996" + k, "")} (${by[k]})` })).sort((a, b) => a.t.localeCompare(b.t, "ru"));
  }, [items, me, agentsDir]);

  const shown = useMemo(() => {
    let list = items;
    if (show === "need") list = list.filter((x) => x.info.status !== "ok");
    else if (show === "update") list = list.filter((x) => x.info.status === "update");
    else if (show === "new") list = list.filter((x) => x.info.status === "new");
    if (agentFilter !== "all") list = list.filter((x) => last9(x.l.agent_phone) === agentFilter);
    list = list.filter((x) => matchListing(x.l, filter));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((x) => {
        const l = x.l;
        return [l.district, l.zhk, l.city, l.display_id, l.description, l.agent_name, listingCategory(l)].filter(Boolean).join(" ").toLowerCase().includes(q);
      });
    }
    return sortAds(list);
  }, [items, show, agentFilter, filter, search]);

  function patchRow(id, cycle) {
    setAdMap((m) => { const n = new Map(m); const r = n.get(id) || { id }; n.set(id, { ...r, ...cycle }); return n; });
  }
  async function doUpdate(l) {
    setBusyId(l.id); setError("");
    try { patchRow(l.id, await adMarkUpdated(me, l.id)); adNotifyChanged(); } catch (e) { setError(e.message); }
    setBusyId(null);
  }
  async function doNew(id) {
    setAskId(null); setBusyId(id); setError("");
    try { patchRow(id, await adStartNew(me, id)); adNotifyChanged(); } catch (e) { setError(e.message); }
    setBusyId(null);
  }
  function copyId(did) { try { navigator.clipboard.writeText(String(did)); setCopiedId(did); setTimeout(() => setCopiedId((c) => (c === did ? null : c)), 1500); } catch {} }
  function photoUrl(l) {
    const p = l.photos && l.photos.length > 0 ? l.photos[0] : null;
    if (!p) return null;
    return (supabase.storage.from("listing-photos").getPublicUrl(p).data || {}).publicUrl || null;
  }
  function locationLine(l) {
    const parts = [l.district, l.zhk].filter(Boolean);
    if (l.city && l.city !== "Бишкек") parts.unshift(l.city);
    return parts.length > 0 ? parts.join(", ") : (l.city || "Бишкек");
  }

  const head = (
    <>
      <div className="ad-title">Реклама {counts.need > 0 && <span className="ad-count">{counts.need}</span>}</div>
      <div className="ad-sub">Объекты, по которым нужно выполнить рекламное действие</div>
    </>
  );

  if (me === undefined) return <div className="ad-page">{head}<BottomNav active="Реклама" /></div>;
  if (!me || !me.pin) {
    return (
      <div className="ad-page">{head}
        <div className="ad-error">Чтобы видеть рекламные задачи, войдите в <a href="/profile" style={{ color: "var(--accent-text)" }}>Профиль</a> по номеру и ПИН-коду.</div>
        <BottomNav active="Реклама" />
      </div>
    );
  }

  const tabs = [["need", "need", counts.need, "Требуют рекламы"], ["update", "update", counts.update, "Пора обновить"], ["new", "new", counts.new, "Новая реклама"]];
  return (
    <div className="ad-page">
      {head}
      <div className="ad-search">
        <div className="ad-search-box">
          <span>🔍</span>
          <input type="search" enterKeyHint="search" placeholder="Поиск: район, ЖК, ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="ad-filter-btn" onClick={() => setFilterOpen(true)}>☰ Фильтр{activeCount(filter) > 0 && <b>{activeCount(filter)}</b>}</button>
      </div>

      <div className="ad-stats">
        {tabs.map(([key, cls, n, label]) => (
          <button key={key} className={`ad-stat ${cls} ${show === key ? "on" : ""}`} onClick={() => setShow(key)}>
            <div className="n">{n}</div><div className="t">{label}</div>
          </button>
        ))}
      </div>
      <div className="ad-tools">
        <button className={`ad-all ${show === "all" ? "on" : ""}`} onClick={() => setShow("all")}>Все объекты ({counts.all})</button>
        {agentOptions.length > 1 && (
          <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
            <option value="all">Все агенты</option>
            {agentOptions.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
          </select>
        )}
      </div>

      {error && <div className="ad-error">{error}</div>}
      {listings === null && <div className="ad-sub">Загрузка…</div>}

      <div className="feed-grid" style={{ paddingBottom: 0 }}>
        {listings !== null && shown.length === 0 && !error && (
          <div className="ad-empty">{show === "need" ? "Сейчас нет объектов, по которым нужна реклама. Хорошая работа! 🎉" : "В этом списке пока нет объектов."}</div>
        )}
        {shown.map(({ l, info }) => {
          const { usd, kgs } = priceBlock(l);
          const photo = photoUrl(l);
          const ag = agentByPhone(agentsDir, l.agent_phone);
          const ph = agentPhoto(ag);
          return (
            <div key={l.id} className="ad-card-wrap">
              <div className="feed-card" onClick={() => router.push(me && isOwnListing(l, me) ? `/listing/${l.id}` : `/a/${l.id}`)}>
                <div className="feed-card-photo">
                  {photo ? <img src={photo} alt="" /> : <div className="feed-card-noimg">Нет фото</div>}
                  <span className={`ad-badge ad-badge-on-photo ${info.status}`}>{AD_LABEL[info.status]}</span>
                </div>
                <div className="feed-card-body">
                  <div className="feed-price-usd">${usd.toLocaleString("ru-RU")}{priceSuffix(l)}</div>
                  <div className="feed-price-kgs">{kgs.toLocaleString("ru-RU")} сом{priceSuffix(l)}</div>
                  <div className="feed-chars">{fullCharLine(l)}</div>
                  <div className="feed-category">{listingCategory(l)}{isPso(l) && <b className="pso-tag"> (СДАН ПСО)</b>}</div>
                  <div className="feed-location">{locationLine(l)}</div>
                  {l.description && <div className="feed-desc">{l.description}</div>}
                  <div className="feed-agent">
                    <span className="feed-agent-ava">{ph ? <img src={ph} alt="" /> : <img src={R_ICON} alt="" className="feed-agent-r" />}</span>
                    <span className="feed-agent-name">{agentDisplayName(agentsDir, l.agent_phone, l.agent_name)}</span>
                  </div>
                  <div className="feed-meta">
                    <span className="feed-date">{shortDate(l.created_at)}</span>
                    {l.display_id && (
                      <button className="feed-id-copy" aria-label="Скопировать ID" onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyId(l.display_id); }}>
                        <span>ID {l.display_id}</span>
                        {copiedId === l.display_id ? <span style={{ color: "var(--accent-text)" }}>✓</span> : <span>⧉</span>}
                      </button>
                    )}
                  </div>
                  <div className="ad-block" onClick={(e) => e.stopPropagation()}>
                    {info.never ? <b>Реклама ещё не отмечена</b> : (
                      <>
                        <div>Реклама создана: <b>{daysAgoText(info.daysCreated)}</b></div>
                        <div>Обновлена: <b>{info.everUpdated ? daysAgoText(info.daysUpdate) : "ещё нет"}</b> · <span className="g">{timesText(info.updates)}</span></div>
                      </>
                    )}
                    <div className="ad-btns">
                      <button className="ad-btn go" disabled={busyId === l.id} onClick={() => doUpdate(l)}>⟳ Обновил рекламу</button>
                      <button className="ad-btn" disabled={busyId === l.id} onClick={() => setAskId(l.id)}>＋ Новая реклама</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <FilterWizard open={filterOpen} onClose={() => setFilterOpen(false)} listings={items.map((x) => x.l)} value={filter} onApply={setFilter} />
      <ConfirmDialog open={!!askId} title="Новая реклама" text="Вы удалили или сняли старое объявление с площадки?"
        confirmText="Да, снял" cancelText="Отмена" onConfirm={() => doNew(askId)} onCancel={() => setAskId(null)} />
      <BottomNav active="Реклама" />
    </div>
  );
}
