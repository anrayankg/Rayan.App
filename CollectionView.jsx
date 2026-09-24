"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { fullCharLine, priceBlock, categoryLabel } from "../../../lib/listingFormat";
const R_ICON = "/r-icon.png";
import { collectionLink, getCurrentAgent } from "../../../lib/agent";
import BottomNav from "../../../components/BottomNav";
import AgentContactBlock from "../../../components/AgentContactBlock";
import ShareSheet from "../../../components/ShareSheet";

// Подборка — то, что агент отправляет КЛИЕНТУ. Вид карточек — ТОЧНО как на главной
// (2 в ряд). Каждый объект ведёт на клиентскую страницу /p/..., без комиссии и
// внутренней информации. ?manage=1 — режим агента (можно убирать объекты).

function photoUrl(path) {
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data?.publicUrl || "";
}
function similarRoomMatch(roomType) {
  if (roomType === "2-комн. полноценная") return ["2-комн. полноценная", "2-комн. студия"];
  if (roomType === "3-комн. полноценная") return ["3-комн. полноценная", "3-комн. студия"];
  return [roomType];
}
function locationLine(l) {
  const parts = [l.district, l.zhk].filter(Boolean);
  if (l.city && l.city !== "Бишкек") parts.unshift(l.city);
  return parts.length > 0 ? parts.join(", ") : (l.city || "Бишкек");
}

const FIELDS = "id, display_id, type, price, currency, currency_new, district, zhk, city, room_type, rooms, area_m2, floor, floors_total, series, construction_status, delivery_year, delivery_quarter, extra_details, photos, status, description, plot_sotka";

export default function CollectionView() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManageMode = searchParams.get("manage") === "1";
  const agParam = searchParams.get("ag");
  const [collection, setCollection] = useState(null);
  const [listings, setListings] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState(null);
  const [agentInfo, setAgentInfo] = useState(null);
  const [me, setMe] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => { setMe(getCurrentAgent()); }, []);

  useEffect(() => {
    async function load() {
      const { data: col, error: e } = await supabase.from("collections").select("*").eq("id", id).single();
      if (e) { setError("Подборка не найдена"); return; }
      setCollection(col);

      // Кому звонить клиенту: агент из ссылки (?ag=), иначе — хозяин подборки.
      const agentId = agParam || col.agent_id;
      if (agentId) {
        const { data: ag } = await supabase.from("agents").select("id, name, phone").eq("id", agentId).maybeSingle();
        if (ag) setAgentInfo(ag);
      }

      const entries = col.listing_ids || [];
      const ids = entries.map((x) => (typeof x === "string" ? x : x.id));
      if (ids.length > 0) {
        const { data: ls } = await supabase.from("listings").select(FIELDS).in("id", ids).eq("status", "активен");
        // Порядок — как агент добавлял.
        const ordered = ids.map((x) => (ls || []).find((l) => l.id === x)).filter(Boolean);
        setListings(ordered);

        const combos = new Set(ordered.map((l) => `${l.city || "Бишкек"}|${l.type}|${l.room_type || l.rooms}`));
        const found = [];
        for (const combo of combos) {
          const [city, type, roomType] = combo.split("|");
          const { data: sim } = await supabase.from("listings").select(FIELDS)
            .eq("status", "активен").eq("city", city).eq("type", type).in("room_type", similarRoomMatch(roomType))
            .not("id", "in", `(${ids.join(",")})`).limit(6);
          if (sim) found.push(...sim);
        }
        setSimilar(Array.from(new Map(found.map((s) => [s.id, s])).values()).slice(0, 8));
      }
    }
    load();
  }, [id, agParam]);

  async function removeFromCollection(listingId) {
    const newIds = (collection.listing_ids || []).filter((x) => (typeof x === "string" ? x : x.id) !== listingId);
    await supabase.from("collections").update({ listing_ids: newIds }).eq("id", id);
    setCollection({ ...collection, listing_ids: newIds });
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  const agQuery = agParam ? `?ag=${encodeURIComponent(agParam)}` : (collection && collection.agent_id ? `?ag=${encodeURIComponent(collection.agent_id)}` : "");

  if (error) return <div style={sx.page}><div style={sx.center}>{error}</div></div>;
  if (!collection) return <div style={sx.page}><div style={sx.center}>Загрузка…</div></div>;

  return (
    <div style={sx.page}>
      <div style={sx.header}>
        {isManageMode && <button onClick={() => router.push("/collections")} style={sx.backBtn}>‹</button>}
        <div>
          <div style={sx.title}>{isManageMode ? collection.name : "Подборка для вас"}</div>
          <div style={sx.count}>{listings.length} объект(ов)</div>
        </div>
      </div>

      {isManageMode && (
        <button className="btn-primary btn-block" style={{ marginBottom: 16 }} onClick={() => setShareOpen(true)}>
          Отправить подборку клиенту
        </button>
      )}

      {listings.length === 0 ? (
        <div style={sx.empty}>Подборка пока пустая. Ваш агент скоро добавит сюда варианты.</div>
      ) : (
        <div className="feed-grid" style={{ paddingBottom: 10 }}>
          {listings.map((l) => {
            const { usd, kgs } = priceBlock(l);
            const photo = (l.photos || [])[0] ? photoUrl(l.photos[0]) : null;
            return (
              <div key={l.id} style={{ minWidth: 0 }}>
                <a href={`/p/${l.id}${agQuery}`} className="feed-card" style={{ display: "block", textDecoration: "none" }}>
                  <div className="feed-card-photo">
                    {photo ? <img src={photo} alt="" /> : <div className="feed-card-noimg">Нет фото</div>}
                  </div>
                  <div className="feed-card-body">
                    <div className="feed-price-usd">${usd.toLocaleString("ru-RU")}</div>
                    <div className="feed-price-kgs">{kgs.toLocaleString("ru-RU")} сом</div>
                    <div className="feed-chars">{fullCharLine(l)}</div>
                    <div className="feed-category">{categoryLabel(l.type)}</div>
                    <div className="feed-location">{locationLine(l)}</div>
                    {l.description && <div className="feed-desc">{l.description}</div>}
                    <div className="feed-agent">
                      <img src={R_ICON} alt="" className="feed-agent-avatar" />
                      <span>RAYAN</span>
                      {l.display_id && <span style={{ marginLeft: "auto" }}>ID {l.display_id}</span>}
                    </div>
                  </div>
                </a>
                {isManageMode && (
                  <button onClick={() => removeFromCollection(l.id)} className="btn-danger btn-block" style={{ marginTop: 6, padding: "10px 0", fontSize: 13 }}>
                    Убрать из подборки
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isManageMode && agentInfo && (
        <AgentContactBlock name={agentInfo.name} phone={agentInfo.phone}
          waText={`Здравствуйте! Я по подборке: ${typeof window !== "undefined" ? window.location.href : ""}`} />
      )}

      {!isManageMode && (
        <div style={sx.hint}>Сохраните себе эту ссылку — сюда ваш агент будет добавлять подходящие варианты.</div>
      )}

      {similar.length > 0 && (
        <div style={sx.similarSection}>
          <div style={sx.similarTitle}>Смотреть похожие объекты</div>
          <div style={sx.similarRow}>
            {similar.map((s) => (
              <a key={s.id} href={`/p/${s.id}${agQuery}`} style={sx.similarCard}>
                <div style={sx.similarPhotoWrap}>
                  {(s.photos || [])[0]
                    ? <img src={photoUrl(s.photos[0])} alt="" style={sx.cardPhoto} />
                    : <div className="feed-card-noimg">Нет фото</div>}
                </div>
                <div style={sx.similarPrice}>${priceBlock(s).usd.toLocaleString("ru-RU")}</div>
                <div style={sx.similarChar}>{fullCharLine(s)}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} url={collectionLink(id, me)}
        note={me ? `В подборке клиенту будет показан ваш номер: ${me.name || ""} ${me.phone || ""}` : undefined} />
      {isManageMode && <BottomNav active="Профиль" />}
    </div>
  );
}

// Подборку смотрят в тёмном виде (как страницу объекта у клиента) — переменные цвета
// переопределены здесь, чтобы карточки выглядели так же, как на главной в тёмной теме.
const DARK_VARS = {
  "--bg-card": "#1A1A1C", "--bg-card-alt": "#232326", "--bg-card-hover": "#28282B",
  "--text-primary": "#FFFFFF", "--text-secondary": "#8B8B90", "--border-subtle": "rgba(255,255,255,0.08)",
};

const sx = {
  page: { ...DARK_VARS, maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: "#fff", padding: "18px 16px 110px", overflowX: "hidden" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", color: "#8B8B90" },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "#fff",
    border: "none", fontSize: 22, lineHeight: "40px", flexShrink: 0 },
  title: { fontSize: 20, fontWeight: 800 },
  count: { fontSize: 13, color: "#8B8B90", marginTop: 2 },
  empty: { color: "#8B8B90", fontSize: 14, lineHeight: 1.6, marginTop: 20 },
  cardPhoto: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  hint: { marginTop: 20, fontSize: 12, color: "#7FA396", lineHeight: 1.6 },
  similarSection: { marginTop: 26, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" },
  similarTitle: { fontSize: 13, fontWeight: 700, color: "#7FA396", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  similarRow: { display: "flex", gap: 10, overflowX: "auto" },
  similarCard: { flex: "0 0 140px", textDecoration: "none", color: "#fff", minWidth: 0 },
  similarPhotoWrap: { width: 140, height: 140, borderRadius: "var(--r)", overflow: "hidden", background: "#FFFFFF" },
  similarPrice: { fontSize: 14, fontWeight: 800, marginTop: 6 },
  similarChar: { fontSize: 11, color: "#8B8B90", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
};
