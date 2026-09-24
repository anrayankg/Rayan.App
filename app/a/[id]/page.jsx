"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { publicExtraEntries, extraLabel, extraDisplayValue } from "../../../lib/extraFields";
import { PLATFORM_LABELS, PLATFORM_ICON } from "../../../lib/videoLinks";
import { fullCharLine } from "../../../lib/listingFormat";
import BottomNav from "../../../components/BottomNav";
import AddToCollectionButton from "../../../components/AddToCollectionButton";

// Страница объекта для АГЕНТА, который смотрит ЧУЖОЙ объект (не свой) — ссылка вида /a/<id>.
// Отличия от клиентской (/p/<id>): виден статус объекта, статус рекламы (без кнопки
// управления — это только для владельца-договорника), точка на карте, можно добавить фото.
// Как и клиентская, НЕ запрашивает listing_contacts/listing_financial — контакты
// собственника, комиссия и точный адрес сюда не попадают.

const RAYAN_INSTAGRAM = "https://www.instagram.com/rayan.pro.kg?stkn=MTQzaGJ6c3huZXFtdQ%3D%3D&utm_source=qr";
const RAYAN_TELEGRAM = "https://t.me/anrayankg";
const USD_KGS_RATE = 87.45;

const STATUS_LABELS = {
  "активен": "Активен", "на проверке": "На проверке", "черновик": "Черновик",
  "забронирован": "Забронирован", "сделка в процессе": "Сделка в процессе",
  "продан": "Продан", "снят с продажи": "Снят с продажи", "архив": "Архив",
};

function priceBlock(l) {
  const price = Number(l.price) || 0;
  const rawCurrency = l.currency_new || l.currency || "USD";
  const isUSD = String(rawCurrency).toUpperCase() === "USD" || rawCurrency === "$";
  const usd = isUSD ? price : Math.round(price / USD_KGS_RATE);
  const kgs = isUSD ? Math.round(price * USD_KGS_RATE) : price;
  return { usd, kgs };
}

function roomsLabel(l) { const rt = l.room_type || l.rooms || ""; return rt ? String(rt) : "—"; }

function categoryLabel(type) {
  const t = type || "";
  if (t === "первичка") return "Продажа квартир в новостройке";
  if (t === "вторичка") return "Продажа квартир";
  if (t === "дом") return "Продажа домов";
  if (t === "участок") return "Продажа земельного участка";
  return "Продажа недвижимости";
}

function photoUrl(path) {
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data?.publicUrl || "";
}

export default function AgentListingPage() {
  const router = useRouter();
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const touchX = useRef(null);

  useEffect(() => {
    async function load() {
      const { data, error: e } = await supabase
        .from("listings")
        .select("id, display_id, type, status, price, currency, currency_new, district, city, zhk, sk, series, room_type, rooms, area_m2, floor, floors_total, construction_status, delivery_year, delivery_quarter, documents, heating, description, photos, video_links, extra_details, agent_name, agent_phone, created_at, map_lat, map_lng")
        .eq("id", id).single();
      if (e) { setError("Объект не найден"); return; }
      // Коллеги-агенты ДОЛЖНЫ видеть комиссию, "в руки" и комментарий агента — это их
      // рабочая информация для сделки. НЕ видят: контакты и точный адрес собственника
      // (listing_contacts) и сканы документов — их эта страница сознательно не запрашивает.
      const { data: fin } = await supabase.from("listing_financial").select("*").eq("listing_id", id).maybeSingle();
      setListing({ ...data, financial: fin || null });
    }
    load();
  }, [id]);

  if (error) return <div style={sx.page}><div style={sx.centerMsg}>{error}</div></div>;
  if (!listing) return <div style={sx.page}><div style={sx.centerMsg}>Загрузка…</div></div>;

  const l = listing;
  const { usd, kgs } = priceBlock(l);
  const photos = l.photos || [];
  const isPervichka = l.type === "первичка";

  let classOrSeries = null;
  let extraParsed = {};
  try { extraParsed = l.extra_details ? (typeof l.extra_details === "string" ? JSON.parse(l.extra_details) : l.extra_details) : {}; } catch {}
  if (isPervichka && extraParsed.jilyeClass) classOrSeries = { label: "Класс жилья", value: extraParsed.jilyeClass };
  else if (!isPervichka && l.series) classOrSeries = { label: "Серия", value: l.series };

  let statusLine = null;
  if (isPervichka) {
    statusLine = l.construction_status === "Сдан ПСО (ключи)" ? "ПСО сдан"
      : (l.delivery_year && l.delivery_quarter ? `сдача ${l.delivery_year}г ${l.delivery_quarter} квартал` : null);
  }

  const extraRows = publicExtraEntries(l.extra_details);
  const waNumber = (l.agent_phone || "").replace(/[^\d]/g, "");
  // Когда один агент пишет другому по этому объекту — сразу вставляем ссылку на него,
  // чтобы не объяснять словами, о каком объекте речь.
  const agentPageUrl = typeof window !== "undefined" ? window.location.href : "";
  const waMsgToColleague = encodeURIComponent(`Здравствуйте, я по поводу объекта Id: ${l.display_id || id}\n${agentPageUrl}`);
  const hasMap = l.map_lat && l.map_lng;

  function handleShare() {
    // "Поделиться" всегда ведёт на КЛИЕНТСКУЮ страницу (/p/...), никогда на эту (/a/...) —
    // так агент физически не может случайно отправить клиенту внутреннюю информацию.
    // Если агент вошёл в свой личный кабинет — в ссылку подставляется ЕГО телефон/имя
    // вместо телефона, указанного в самом объекте (по просьбе Айгуль, это важно).
    let agentOverride = null;
    try { agentOverride = JSON.parse(localStorage.getItem("rayan_agent") || "null"); } catch {}
    const base = `${window.location.origin}/p/${l.id}`;
    const url = agentOverride
      ? `${base}?agent_phone=${encodeURIComponent(agentOverride.phone)}&agent_name=${encodeURIComponent(agentOverride.name)}`
      : base;
    if (navigator.share) {
      navigator.share({ title: "RAYAN — объект недвижимости", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert("Клиентская ссылка скопирована" + (agentOverride ? ` (с вашим номером — ${agentOverride.name})` : ""));
    }
  }

  return (
    <div style={sx.page}>
      <div
        style={sx.photoWrap}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null || photos.length < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) {
            if (dx < 0) setActivePhoto((p) => (p + 1) % photos.length);
            else setActivePhoto((p) => (p - 1 + photos.length) % photos.length);
          }
          touchX.current = null;
        }}
      >
        {photos.length > 0 ? (
          <img src={photoUrl(photos[activePhoto])} alt="" style={sx.photo} draggable={false} />
        ) : (
          <div style={sx.photoPlaceholder}>Нет фото</div>
        )}
        <button style={sx.backBtn} onClick={() => router.back()}>‹</button>
        <div style={sx.statusBadge}>{STATUS_LABELS[l.status] || l.status}</div>
        <button style={sx.shareBtn} onClick={handleShare} aria-label="Поделиться">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" /><line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
          </svg>
        </button>
        {photos.length > 1 && <div style={sx.photoCounter}>{activePhoto + 1} / {photos.length}</div>}
      </div>
      {photos.length > 1 && (
        <div style={sx.thumbRow}>
          {photos.map((p, i) => (
            <img key={i} src={photoUrl(p)} alt="" onClick={() => setActivePhoto(i)}
              style={{ ...sx.thumb, border: i === activePhoto ? "2px solid #1FA35C" : "2px solid transparent" }} />
          ))}
        </div>
      )}

      <div style={sx.body}>
        <div style={sx.priceUsd}>${usd.toLocaleString("ru-RU")}</div>
        <div style={sx.priceKgs}>{kgs.toLocaleString("ru-RU")} сом</div>

        <div style={sx.charLine}>{fullCharLine(l)}</div>
        <div style={sx.category}>{categoryLabel(l.type)}</div>
        <div style={sx.location}>{[l.zhk, l.district].filter(Boolean).join(", ") || l.city || "Бишкек"}</div>

        {hasMap && (
          <a href={`https://maps.google.com/?q=${l.map_lat},${l.map_lng}`} target="_blank" rel="noopener noreferrer" style={sx.mapLink}>
            📍 Открыть на карте
          </a>
        )}

        {(l.financial && (l.financial.commission_percent || l.financial.v_ruki || l.financial.agent_notes)) && (
          <div style={sx.workPanel}>
            <div style={sx.workPanelTitle}>Рабочая информация (только для агентов)</div>
            {l.financial.commission_percent && <Row label="Комиссия" value={`${l.financial.commission_percent}${l.financial.commission_terms ? " — " + l.financial.commission_terms : ""}`} />}
            {l.financial.v_ruki && <Row label="В руки" value={`${l.financial.v_ruki} ${l.financial.v_ruki_currency || ""}`} />}
            {l.financial.agent_notes && <Row label="Комментарий" value={l.financial.agent_notes} />}
          </div>
        )}

        {(l.video_links || []).length > 0 && (
          <div style={sx.videoRow}>
            {l.video_links.map((v) => (
              <a key={v.platform} href={v.url} target="_blank" rel="noopener noreferrer" style={sx.videoBtn}>
                {PLATFORM_ICON[v.platform]} Видеообзор {l.video_links.length > 1 ? `— ${PLATFORM_LABELS[v.platform]}` : ""}
              </a>
            ))}
          </div>
        )}

        <div style={sx.ctaRow}>
          <a href={`tel:${(l.agent_phone || "").replace(/[^\d+]/g, "")}`} style={sx.callBtn}>Позвонить</a>
          {waNumber && <a href={`https://wa.me/${waNumber}?text=${waMsgToColleague}`} target="_blank" rel="noopener noreferrer" style={sx.waBtn}>WhatsApp</a>}
        </div>

        {l.description && (
          <div style={sx.section}>
            <div style={sx.sectionTitle}>Описание</div>
            <div style={sx.description}>{l.description}</div>
          </div>
        )}

        {l.documents && l.documents.length > 0 && (
          <div style={sx.section}>
            <div style={sx.sectionTitle}>Документы</div>
            <div style={sx.rowValue}>{l.documents.join(", ")}</div>
          </div>
        )}

        {extraRows.length > 0 && (
          <div style={sx.section}>
            <div style={sx.sectionTitle}>Детали объекта</div>
            {l.heating && <Row label="Отопление" value={l.heating} />}
            {extraRows.map(([k, v]) => <Row key={k} label={extraLabel(k)} value={extraDisplayValue(v)} />)}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
          <AddToCollectionButton listingId={l.id} />
          <button onClick={handleShare} className="action-btn">↗ Поделиться</button>
        </div>

        <div style={sx.agentCard}>
          <div style={sx.agentAvatar}>R</div>
          <div>
            <div style={sx.agentName}>{l.agent_name || "RAYAN — центр недвижимости"}</div>
            <div style={sx.agentSub}>Агент по объекту</div>
          </div>
        </div>

        <div style={sx.contactBlock}>
          <div style={sx.contactTopRow}>
            <div style={sx.contactPhoneLine}>
              <IconPhone />
              <span style={sx.contactPhoneText}>{l.agent_phone || "—"}</span>
              {waNumber && <a href={`https://t.me/+${waNumber}`} target="_blank" rel="noopener noreferrer" style={sx.iconLink}><IconTelegram /></a>}
              {waNumber && <a href={`https://wa.me/${waNumber}?text=${waMsgToColleague}`} target="_blank" rel="noopener noreferrer" style={sx.iconLink}><IconWhatsapp /></a>}
            </div>
            <a href={`tel:${(l.agent_phone || "").replace(/[^\d+]/g, "")}`} style={sx.contactCallLink}>Позвонить</a>
          </div>
        </div>

        <div style={sx.metaRow}>
          {l.created_at && <span>Создано: {new Date(l.created_at).toLocaleDateString("ru-RU")}</span>}
          {l.display_id && <span> &nbsp;|&nbsp; ID {l.display_id}</span>}
        </div>
      </div>
      <BottomNav active="Профиль" />
    </div>
  );
}

function IconPhone() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B8B90" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
}
function IconTelegram() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="2"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>;
}
function IconWhatsapp() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3ED07A" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>;
}

function Row({ label, value }) {
  if (!value || value === "—") return null;
  return (
    <div style={sx.row}>
      <div style={sx.rowLabel}>{label}</div>
      <div style={sx.rowValue}>{value}</div>
    </div>
  );
}

const sx = {
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#fff", paddingBottom: 90 },
  centerMsg: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#8B8B90" },
  photoWrap: { position: "relative", width: "100%", aspectRatio: "1/1", background: "#1A1A1C" },
  photo: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  photoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B8B90", background: "#FFFFFF" },
  backBtn: { position: "absolute", top: 14, left: 14, width: 36, height: 36, borderRadius: "50%",
    background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", fontSize: 22, lineHeight: "36px" },
  statusBadge: { position: "absolute", bottom: 14, left: 14, background: "rgba(31,163,92,0.85)", color: "#fff",
    fontSize: 11.5, fontWeight: 700, padding: "5px 11px", borderRadius: 8 },
  shareBtn: { position: "absolute", top: 14, right: 14, width: 36, height: 36, borderRadius: "50%",
    background: "rgba(0,0,0,0.45)", border: "none", display: "flex", alignItems: "center", justifyContent: "center" },
  photoCounter: { position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.55)", color: "#fff",
    fontSize: 12, padding: "3px 10px", borderRadius: 10 },
  thumbRow: { display: "flex", gap: 6, padding: "8px 16px", overflowX: "auto" },
  thumb: { width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  body: { padding: "18px 20px 0" },
  addPhotoBtn: { background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#8B8B90",
    fontSize: 12, fontWeight: 700, padding: "6px 12px", borderRadius: 8, marginBottom: 14 },
  priceUsd: { fontSize: 26, fontWeight: 800 },
  priceKgs: { fontSize: 13, color: "#8B8B90", marginTop: 2 },
  charLine: { fontSize: 14.5, fontWeight: 700, marginTop: 12 },
  category: { fontSize: 12.5, color: "#8B8B90", marginTop: 3 },
  location: { fontSize: 12.5, color: "#8B8B90" },
  mapLink: { display: "inline-block", marginTop: 10, color: "#5BD98A", fontSize: 13, fontWeight: 700, textDecoration: "none" },
  adBadge: { marginTop: 10, fontSize: 12.5, color: "#EDEDEF" },
  workPanel: { marginTop: 14, background: "rgba(212,164,55,0.08)", border: "1px solid rgba(212,164,55,0.25)",
    borderRadius: 12, padding: "12px 14px" },
  workPanelTitle: { fontSize: 11, fontWeight: 700, color: "#D4A437", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 },
  videoRow: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 },
  videoBtn: { display: "flex", alignItems: "center", gap: 6, background: "rgba(212,164,55,0.14)",
    border: "1px solid rgba(212,164,55,0.4)", color: "#F3D477", textDecoration: "none",
    padding: "9px 14px", borderRadius: 10, fontSize: 13, fontWeight: 700 },
  ctaRow: { display: "flex", gap: 8, marginTop: 16 },
  callBtn: { flex: 1, background: "#1FA35C", color: "#fff", textAlign: "center", padding: "12px 0",
    borderRadius: 10, fontWeight: 700, fontSize: 14.5, textDecoration: "none" },
  waBtn: { flex: 1, background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
    textAlign: "center", padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14.5, textDecoration: "none" },
  section: { marginTop: 22, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#7FA396", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 },
  description: { fontSize: 14, lineHeight: 1.6, color: "#EDEDEF", whiteSpace: "pre-wrap" },
  row: { display: "flex", justifyContent: "space-between", gap: 12, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  rowLabel: { fontSize: 13, color: "#8B8B90" },
  rowValue: { fontSize: 13, color: "#EDEDEF", textAlign: "right" },
  agentCard: { display: "flex", alignItems: "center", gap: 10, marginTop: 24, padding: "14px 0" },
  agentAvatar: { width: 40, height: 40, borderRadius: "50%", background: "rgba(31,163,92,0.16)", color: "#5BD98A",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 },
  agentName: { fontSize: 14, fontWeight: 700 },
  agentSub: { fontSize: 12, color: "#8B8B90" },
  contactBlock: { marginTop: 6, background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden" },
  contactTopRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 14px" },
  contactPhoneLine: { display: "flex", alignItems: "center", gap: 10 },
  contactPhoneText: { fontSize: 14, fontWeight: 700 },
  iconLink: { display: "flex" },
  contactCallLink: { color: "#5BD98A", fontWeight: 700, fontSize: 13.5, textDecoration: "none" },
  metaRow: { fontSize: 11.5, color: "#7FA396", marginTop: 14, paddingBottom: 10 },
};
