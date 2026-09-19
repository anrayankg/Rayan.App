"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

export default function CollectionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [collection, setCollection] = useState(null);
  const [listings, setListings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: col, error: e } = await supabase.from("collections").select("*").eq("id", id).single();
      if (e) { setError("Подборка не найдена"); return; }
      setCollection(col);
      const ids = col.listing_ids || [];
      if (ids.length > 0) {
        const { data: ls } = await supabase.from("listings")
          .select("id, display_id, type, price, currency, currency_new, district, zhk, room_type, rooms, area_m2, floor, floors_total, photos, status")
          .in("id", ids);
        setListings(ls || []);
      }
    }
    load();
  }, [id]);

  async function removeFromCollection(listingId) {
    const newIds = (collection.listing_ids || []).filter((x) => x !== listingId);
    await supabase.from("collections").update({ listing_ids: newIds }).eq("id", id);
    setCollection({ ...collection, listing_ids: newIds });
    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  if (error) return <div style={sx.page}><div style={sx.center}>{error}</div></div>;
  if (!collection) return <div style={sx.page}><div style={sx.center}>Загрузка…</div></div>;

  return (
    <div style={sx.page}>
      <div style={sx.header}>
        <button onClick={() => router.push("/")} style={sx.backBtn}>‹</button>
        <div style={sx.title}>{collection.name}</div>
      </div>
      <div style={sx.count}>{listings.length} объект(ов)</div>

      {listings.length === 0 ? (
        <div style={sx.empty}>Подборка пока пустая. Добавляйте объекты кнопкой «+ Добавить в подборку» на странице объекта.</div>
      ) : (
        <div style={sx.grid}>
          {listings.map((l) => (
            <div key={l.id} style={sx.card}>
              <a href={`/a/${l.id}`} style={sx.cardLink}>
                <div style={sx.cardPhotoWrap}>
                  {(l.photos || [])[0] ? (
                    <img src={photoUrl(l.photos[0])} alt="" style={sx.cardPhoto} />
                  ) : (
                    <div style={{ ...sx.cardPhoto, display: "flex", alignItems: "center", justifyContent: "center", color: "#8B8B90", fontSize: 11 }}>Нет фото</div>
                  )}
                </div>
                <div style={sx.cardPrice}>${priceUsd(l).toLocaleString("ru-RU")}</div>
                <div style={sx.cardChar}>{l.room_type || l.rooms} · {l.area_m2} м²</div>
                <div style={sx.cardLoc}>{[l.zhk, l.district].filter(Boolean).join(", ")}</div>
              </a>
              <button onClick={() => removeFromCollection(l.id)} style={sx.removeBtn}>Убрать из подборки</button>
            </div>
          ))}
        </div>
      )}

      <div style={sx.hint}>
        Сохраните эту ссылку себе — по ней вы вернётесь к подборке позже: {typeof window !== "undefined" ? window.location.href : ""}
      </div>
    </div>
  );
}

const sx = {
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: "#fff", padding: "18px 20px 40px" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", color: "#8B8B90" },
  header: { display: "flex", alignItems: "center", gap: 12 },
  backBtn: { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "#fff",
    border: "none", fontSize: 20, lineHeight: "32px" },
  title: { fontSize: 19, fontWeight: 800 },
  count: { fontSize: 12.5, color: "#8B8B90", marginTop: 4, marginBottom: 16 },
  empty: { color: "#8B8B90", fontSize: 13.5, lineHeight: 1.6, marginTop: 20 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  card: { background: "rgba(255,255,255,0.04)", borderRadius: 12, overflow: "hidden", paddingBottom: 8 },
  cardLink: { textDecoration: "none", color: "#fff", display: "block" },
  cardPhotoWrap: { width: "100%", aspectRatio: "1/1", background: "#1A1A1C" },
  cardPhoto: { width: "100%", height: "100%", objectFit: "cover" },
  cardPrice: { fontSize: 14, fontWeight: 800, margin: "8px 10px 0" },
  cardChar: { fontSize: 11.5, color: "#8B8B90", margin: "2px 10px 0" },
  cardLoc: { fontSize: 10.5, color: "#7FA396", margin: "1px 10px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  removeBtn: { width: "calc(100% - 20px)", margin: "8px 10px 0", background: "none", border: "1px solid rgba(255,255,255,0.15)",
    color: "#E8877A", fontSize: 11, padding: "6px 0", borderRadius: 8 },
  hint: { marginTop: 24, fontSize: 11, color: "#7FA396", lineHeight: 1.6, wordBreak: "break-all" },
};
