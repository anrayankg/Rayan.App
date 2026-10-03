"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import BottomNav from "../../components/BottomNav";
import { photoPublicUrl } from "../../components/PhotoUploader";
import { fullCharLine, priceBlock, categoryLabel, isPso } from "../../lib/listingFormat";
import { getCurrentAgent, isOwnListing } from "../../lib/agent";

// Избранное — объекты, отмеченные сердечком на этом телефоне.
export default function FavoritesPage() {
  const [items, setItems] = useState(null);
  const [me, setMe] = useState(null);

  useEffect(() => {
    setMe(getCurrentAgent());
    const ids = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("rayan_fav_") && localStorage.getItem(k) === "1") ids.push(k.slice(10));
      }
    } catch {}
    const uuids = ids.filter((x) => /^[0-9a-f-]{36}$/i.test(x));
    if (!uuids.length) { setItems([]); return; }
    supabase.from("listings").select("*").in("id", uuids).then(({ data }) => setItems(data || []));
  }, []);

  function remove(id) {
    try { localStorage.removeItem(`rayan_fav_${id}`); } catch {}
    setItems((arr) => (arr || []).filter((l) => l.id !== id));
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: 110 }}>
      <div style={{ padding: "20px 16px 6px", fontSize: 24, fontWeight: 800, color: "var(--text)" }}>Избранное</div>
      {items === null && <div style={{ padding: 16, color: "var(--muted)" }}>Загрузка…</div>}
      {items && items.length === 0 && (
        <div style={{ padding: 16, color: "var(--muted)", fontSize: 15, lineHeight: 1.5 }}>
          Пока пусто. Откройте объект и нажмите сердечко на фото — он появится здесь.
        </div>
      )}
      {items && items.length > 0 && (
        <div className="feed-grid" style={{ paddingTop: 10 }}>
          {items.map((l) => {
            const photo = (l.photos || [])[0] ? photoPublicUrl(l.photos[0]) : null;
            const { usd, kgs } = priceBlock(l);
            const href = me && isOwnListing(l, me) ? `/listing/${l.id}` : me ? `/a/${l.id}` : `/p/${l.display_id || l.id}`;
            return (
              <div key={l.id} style={{ position: "relative" }}>
                <a href={href} className="feed-card" style={{ display: "block", textDecoration: "none" }}>
                  <div className="feed-card-photo">
                    {photo ? <img src={photo} alt="" /> : <div className="feed-card-noimg">Нет фото</div>}
                  </div>
                  <div className="feed-card-body">
                    <div className="feed-price-usd">${usd.toLocaleString("ru-RU")}</div>
                    <div className="feed-price-kgs">{kgs.toLocaleString("ru-RU")} сом</div>
                    <div className="feed-chars">{fullCharLine(l)}</div>
                    <div className="feed-category">{categoryLabel(l.type)}{isPso(l) && <b className="pso-tag"> (СДАН ПСО)</b>}</div>
                    {l.display_id && <div className="feed-date" style={{ marginTop: 6 }}>ID {l.display_id}</div>}
                  </div>
                </a>
                <button onClick={() => remove(l.id)} aria-label="Убрать из избранного" className="round-glass-btn"
                  style={{ position: "absolute", top: 8, right: 8, width: 38, height: 38 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF8A00" stroke="#FF8A00" strokeWidth="2">
                    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
      <BottomNav active="Избранное" />
    </div>
  );
}
