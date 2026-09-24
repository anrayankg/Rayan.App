"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { fullCharLine } from "../../../lib/listingFormat";
import BottomNav from "../../../components/BottomNav";

// Подборка — то, что агент отправляет КЛИЕНТУ. Поэтому каждый объект внутри ссылается
// на клиентскую страницу (/p/...), а не на агентскую (/a/...) — иначе клиент увидел бы
// комиссию и прочую внутреннюю информацию. По той же причине здесь нет ни названия
// подборки (это внутренняя пометка агента), ни кнопки "убрать из подборки" — убирать
// объекты может только сам агент, не отсюда.

const USD_KGS_RATE = 87.45;
function priceUsd(l) {
  const price = Number(l.price) || 0;
  const isUSD = String(l.currency_new || l.currency || "USD").toUpperCase() === "USD";
  return isUSD ? price : Math.round(price / USD_KGS_RATE);
}
function photoUrl(path) {
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data?.publicUrl || "";
}
function similarRoomMatch(roomType) {
  if (roomType === "2-комн. полноценная") return ["2-комн. полноценная", "2-комн. студия"];
  if (roomType === "3-комн. полноценная") return ["3-комн. полноценная", "3-комн. студия"];
  return [roomType];
}

export default function CollectionPage() {
  const { id } = useParams();
  const router = useRouter();
  // ?manage=1 в ссылке — это режим агента (переход из "Мои подборки" в личном кабинете),
  // клиентская ссылка этот параметр никогда не несёт — значит кнопка "Убрать" клиенту не видна.
  const isManageMode = useSearchParams().get("manage") === "1";
  const [collection, setCollection] = useState(null);
  const [listings, setListings] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: col, error: e } = await supabase.from("collections").select("*").eq("id", id).single();
      if (e) { setError("Подборка не найдена"); return; }
      setCollection(col);
      const entries = col.listing_ids || [];
      const ids = entries.map((x) => (typeof x === "string" ? x : x.id));
      if (ids.length > 0) {
        const { data: ls } = await supabase.from("listings")
          .select("id, display_id, type, price, currency, currency_new, district, zhk, room_type, rooms, area_m2, floor, floors_total, series, construction_status, delivery_year, delivery_quarter, extra_details, photos, status, city")
          .in("id", ids).eq("status", "активен");
        setListings(ls || []);

        // Похожие варианты — по каждому уникальному сочетанию город+тип+комнатность из подборки.
        const combos = new Set(ls.map((l) => `${l.city || "Бишкек"}|${l.type}|${l.room_type || l.rooms}`));
        const found = [];
        for (const combo of combos) {
          const [city, type, roomType] = combo.split("|");
          const { data: sim } = await supabase.from("listings")
            .select("id, display_id, type, price, currency, currency_new, district, zhk, room_type, rooms, area_m2, floor, floors_total, series, construction_status, delivery_year, delivery_quarter, extra_details, photos")
            .eq("status", "активен").eq("city", city).eq("type", type).in("room_type", similarRoomMatch(roomType))
            .not("id", "in", `(${ids.join(",")})`).limit(6);
          if (sim) found.push(...sim);
        }
        const uniqueSim = Array.from(new Map(found.map((s) => [s.id, s])).values()).slice(0, 8);
        setSimilar(uniqueSim);
      }
    }
    load();
  }, [id]);

  async function removeFromCollection(listingId) {
    const newIds = (collection.listing_ids || []).filter((x) => (typeof x === "string" ? x : x.id) !== listingId);
    await supabase.from("collections").update({ listing_ids: newIds }).eq("id", id);
    setCollection({ ...collection, listing_ids: newIds });
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  if (error) return <div style={sx.page}><div style={sx.center}>{error}</div></div>;
  if (!collection) return <div style={sx.page}><div style={sx.center}>Загрузка…</div></div>;

  return (
    <div style={sx.page}>
      <div style={sx.header}>
        <button onClick={() => router.back()} style={sx.backBtn}>‹</button>
        {isManageMode && <div style={sx.title}>{collection.name}</div>}
      </div>
      <div style={sx.count}>{listings.length} объект(ов) для вас</div>

      {listings.length === 0 ? (
        <div style={sx.empty}>Подборка пока пустая. Ваш агент скоро добавит сюда варианты.</div>
      ) : (
        <div style={sx.grid}>
          {listings.map((l) => (
            <div key={l.id}>
              <a href={`/p/${l.id}`} style={sx.cardLink}>
                <div style={sx.card}>
                  <div style={sx.cardPhotoWrap}>
                    {(l.photos || [])[0] ? (
                      <img src={photoUrl(l.photos[0])} alt="" style={sx.cardPhoto} />
                    ) : (
                      <div style={{ ...sx.cardPhoto, display: "flex", alignItems: "center", justifyContent: "center", color: "#8B8B90", fontSize: 11 }}>Нет фото</div>
                    )}
                  </div>
                  <div style={sx.cardPrice}>${priceUsd(l).toLocaleString("ru-RU")}</div>
                  <div style={sx.cardChar}>{fullCharLine(l)}</div>
                  <div style={sx.cardLoc}>{[l.zhk, l.district].filter(Boolean).join(", ")}</div>
                </div>
              </a>
              {isManageMode && (
                <button onClick={() => removeFromCollection(l.id)} style={sx.removeBtn}>Убрать из подборки</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={sx.hint}>
        Сохраните себе эту ссылку — сюда ваш агент будет добавлять подходящие варианты для вас.
      </div>

      {similar.length > 0 && (
        <div style={sx.similarSection}>
          <div style={sx.similarTitle}>Смотреть похожие объекты</div>
          <div style={sx.similarRow}>
            {similar.map((s) => (
              <a key={s.id} href={`/p/${s.id}`} style={sx.similarCard}>
                <div style={sx.similarPhotoWrap}>
                  {(s.photos || [])[0] ? <img src={photoUrl(s.photos[0])} alt="" style={sx.cardPhoto} /> : <div style={{ ...sx.cardPhoto, display: "flex", alignItems: "center", justifyContent: "center", color: "#8B8B90", fontSize: 10 }}>Нет фото</div>}
                </div>
                <div style={sx.similarPrice}>${priceUsd(s).toLocaleString("ru-RU")}</div>
                <div style={sx.similarChar}>{fullCharLine(s)}</div>
              </a>
            ))}
          </div>
        </div>
      )}
      {isManageMode && <BottomNav active="Профиль" />}
    </div>
  );
}

const sx = {
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: "#fff", padding: "18px 20px 90px" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", color: "#8B8B90" },
  header: { display: "flex", alignItems: "center", gap: 12 },
  backBtn: { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "#fff",
    border: "none", fontSize: 20, lineHeight: "32px" },
  count: { fontSize: 13.5, fontWeight: 700, marginTop: 14, marginBottom: 16 },
  empty: { color: "#8B8B90", fontSize: 13.5, lineHeight: 1.6, marginTop: 20 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  cardLink: { textDecoration: "none", color: "#fff", display: "block" },
  card: { background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden", paddingBottom: 8 },
  cardPhotoWrap: { width: "100%", aspectRatio: "1/1", background: "#1A1A1C" },
  cardPhoto: { width: "100%", height: "100%", objectFit: "cover" },
  cardPrice: { fontSize: 14, fontWeight: 800, margin: "8px 10px 0" },
  cardChar: { fontSize: 11.5, color: "#8B8B90", margin: "2px 10px 0" },
  cardLoc: { fontSize: 10.5, color: "#7FA396", margin: "1px 10px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  removeBtn: { width: "100%", marginTop: 6, background: "none", border: "1px solid rgba(255,255,255,0.15)",
    color: "#E8877A", fontSize: 11, padding: "6px 0", borderRadius: 8 },
  hint: { marginTop: 24, fontSize: 11.5, color: "#7FA396", lineHeight: 1.6 },
  similarSection: { marginTop: 26, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" },
  similarTitle: { fontSize: 13, fontWeight: 700, color: "#7FA396", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  similarRow: { display: "flex", gap: 10, overflowX: "auto" },
  similarCard: { flex: "0 0 128px", textDecoration: "none", color: "#fff" },
  similarPhotoWrap: { width: 128, height: 128, borderRadius: 10, overflow: "hidden", background: "#1A1A1C" },
  similarPrice: { fontSize: 13, fontWeight: 800, marginTop: 6 },
  similarChar: { fontSize: 10.5, color: "#8B8B90", marginTop: 2 },
};
