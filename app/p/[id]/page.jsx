"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { publicExtraEntries, extraLabel, extraDisplayValue } from "../../../lib/extraFields";

// Публичная страница объекта — то, что видит КЛИЕНТ по прямой ссылке, без входа.
// Специально запрашивает только таблицу listings (без listing_contacts/listing_financial) —
// так собственник, комиссия, точный адрес и сканы документов физически не попадают
// в эту страницу, даже если Supabase-права (RLS) ещё не настроены до конца.

const USD_KGS_RATE = 87.45;

function priceBlock(l) {
  const price = Number(l.price) || 0;
  const rawCurrency = l.currency_new || l.currency || "USD";
  const isUSD = String(rawCurrency).toUpperCase() === "USD" || rawCurrency === "$";
  const usd = isUSD ? price : Math.round(price / USD_KGS_RATE);
  const kgs = isUSD ? Math.round(price * USD_KGS_RATE) : price;
  return { usd, kgs };
}

function roomsLabel(l) {
  const rt = l.room_type || l.rooms || "";
  return rt ? String(rt) : "—";
}

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

export default function PublicListingPage() {
  const router = useRouter();
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    async function load() {
      const { data, error: e } = await supabase
        .from("listings")
        // Только публичные колонки — сознательно НЕ трогаем listing_contacts / listing_financial.
        .select("id, display_id, type, status, price, currency, currency_new, district, city, zhk, sk, series, room_type, rooms, area_m2, floor, floors_total, construction_status, delivery_year, delivery_quarter, documents, heating, description, photos, extra_details, agent_name, agent_phone")
        .eq("id", id).eq("status", "активен").single();
      if (e) { setError("Объект не найден или снят с публикации"); return; }
      setListing(data);
    }
    load();
  }, [id]);

  if (error) return <div style={sx.page}><div style={sx.centerMsg}>{error}</div></div>;
  if (!listing) return <div style={sx.page}><div style={sx.centerMsg}>Загрузка…</div></div>;

  const l = listing;
  const { usd, kgs } = priceBlock(l);
  const photos = l.photos || [];
  const isPervichka = l.type === "первичка";

  // Класс жилья — только для первички; серия — только для вторички (не оба сразу).
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

  return (
    <div style={sx.page}>
      {/* Фото */}
      <div style={sx.photoWrap}>
        {photos.length > 0 ? (
          <img src={photoUrl(photos[activePhoto])} alt="" style={sx.photo} />
        ) : (
          <div style={sx.photoPlaceholder}>Нет фото</div>
        )}
        <button style={sx.backBtn} onClick={() => router.back()}>‹</button>
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
        {/* Цена */}
        <div style={sx.priceUsd}>${usd.toLocaleString("ru-RU")}</div>
        <div style={sx.priceKgs}>{kgs.toLocaleString("ru-RU")} сом</div>

        {/* Характеристики */}
        <div style={sx.charLine}>
          {roomsLabel(l)}
          {classOrSeries && ` · ${classOrSeries.value}`}
          {statusLine && ` · ${statusLine}`}
          {l.floor && l.floors_total ? ` · ${l.floor}/${l.floors_total} эт.` : ""}
          {l.area_m2 ? ` · ${l.area_m2} м²` : ""}
        </div>
        <div style={sx.category}>{categoryLabel(l.type)}</div>
        <div style={sx.location}>{[l.zhk, l.district].filter(Boolean).join(", ") || l.city || "Бишкек"}</div>

        {/* Кнопки контакта — агент RAYAN, не собственник */}
        <div style={sx.ctaRow}>
          <a href={`tel:${(l.agent_phone || "").replace(/[^\d+]/g, "")}`} style={sx.callBtn}>Позвонить</a>
          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" style={sx.waBtn}>WhatsApp</a>
        </div>
        <div style={sx.quickReplies}>
          <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Здравствуйте, ещё актуально?")}`}
            target="_blank" rel="noopener noreferrer" style={sx.chip}>Ещё актуально?</a>
          <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Здравствуйте, можно узнать подробнее?")}`}
            target="_blank" rel="noopener noreferrer" style={sx.chip}>Узнать подробнее</a>
        </div>

        {/* Описание */}
        {l.description && (
          <div style={sx.section}>
            <div style={sx.sectionTitle}>Описание</div>
            <div style={sx.description}>{l.description}</div>
          </div>
        )}

        {/* Документы — список какие есть (публично) */}
        {l.documents && l.documents.length > 0 && (
          <div style={sx.section}>
            <div style={sx.sectionTitle}>Документы</div>
            <div style={sx.rowValue}>{l.documents.join(", ")}</div>
          </div>
        )}

        {/* Все остальные публичные детали из формы */}
        {extraRows.length > 0 && (
          <div style={sx.section}>
            <div style={sx.sectionTitle}>Детали объекта</div>
            {l.heating && <Row label="Отопление" value={l.heating} />}
            {extraRows.map(([k, v]) => <Row key={k} label={extraLabel(k)} value={extraDisplayValue(v)} />)}
          </div>
        )}

        {/* Агент RAYAN */}
        <div style={sx.agentCard}>
          <div style={sx.agentAvatar}>R</div>
          <div>
            <div style={sx.agentName}>{l.agent_name || "RAYAN — центр недвижимости"}</div>
            <div style={sx.agentSub}>Агент по объекту</div>
          </div>
        </div>
      </div>
    </div>
  );
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
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#fff", paddingBottom: 40 },
  centerMsg: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#8B8B90" },
  photoWrap: { position: "relative", width: "100%", aspectRatio: "1/1", background: "#1A1A1C" },
  photo: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  photoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B8B90", background: "#FFFFFF" },
  backBtn: { position: "absolute", top: 14, left: 14, width: 36, height: 36, borderRadius: "50%",
    background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", fontSize: 22, lineHeight: "36px" },
  photoCounter: { position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.55)", color: "#fff",
    fontSize: 12, padding: "3px 10px", borderRadius: 10 },
  thumbRow: { display: "flex", gap: 6, padding: "8px 16px", overflowX: "auto" },
  thumb: { width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 },
  body: { padding: "18px 20px 0" },
  priceUsd: { fontSize: 26, fontWeight: 800 },
  priceKgs: { fontSize: 13, color: "#8B8B90", marginTop: 2 },
  charLine: { fontSize: 14.5, fontWeight: 700, marginTop: 12 },
  category: { fontSize: 12.5, color: "#8B8B90", marginTop: 3 },
  location: { fontSize: 12.5, color: "#8B8B90" },
  ctaRow: { display: "flex", gap: 8, marginTop: 16 },
  callBtn: { flex: 1, background: "#1FA35C", color: "#fff", textAlign: "center", padding: "12px 0",
    borderRadius: 10, fontWeight: 700, fontSize: 14.5, textDecoration: "none" },
  waBtn: { flex: 1, background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#fff",
    textAlign: "center", padding: "12px 0", borderRadius: 10, fontWeight: 700, fontSize: 14.5, textDecoration: "none" },
  quickReplies: { display: "flex", gap: 8, marginTop: 10, overflowX: "auto" },
  chip: { whiteSpace: "nowrap", background: "rgba(31,163,92,0.14)", color: "#5BD98A", fontSize: 12.5,
    padding: "7px 13px", borderRadius: 14, textDecoration: "none" },
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
};
