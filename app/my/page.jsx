"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

const STATUSES = ["активен", "на проверке", "забронирован", "продан", "снят с продажи", "архив"];

function badgeClass(status) {
  const slug = (status || "").replace(/ /g, "_");
  return `status-badge st-${slug}`;
}

function MyListingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "все";

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        let query = supabase.from("listings").select("*").order("created_at", { ascending: false });
        if (statusFilter !== "все") {
          query = query.eq("status", statusFilter);
        }
        const { data, error: err } = await query;
        if (err) throw err;
        setListings(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  return (
    <div className="app-shell">
      <div className="page-header">
        <a className="back-link" onClick={() => router.push("/")}>←</a>
        <div className="page-title">Мои объекты</div>
      </div>

      <div className="filter-row">
        <div className={`filter-chip ${statusFilter === "все" ? "selected" : ""}`} onClick={() => setStatusFilter("все")}>Все</div>
        {STATUSES.map((s) => (
          <div key={s} className={`filter-chip ${statusFilter === s ? "selected" : ""}`} onClick={() => setStatusFilter(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>

      {loading && <div className="empty-state">Загрузка…</div>}
      {error && <div className="status-msg error" style={{ margin: "0 20px" }}>Не удалось загрузить: {error}</div>}

      {!loading && !error && listings.length === 0 && (
        <div className="empty-state">Пока нет объектов с таким статусом</div>
      )}

      {!loading && !error && listings.length > 0 && (
        <div className="listing-list">
          {listings.map((l) => (
            <a key={l.id} className="listing-row" onClick={() => router.push(`/listing/${l.id}`)}>
              <div className="listing-row-top">
                <div>
                  <div className="listing-row-title">
                    {l.type || "объект"}{l.room_type ? `, ${l.room_type}` : ""}{l.area_m2 ? `, ${l.area_m2} м²` : ""}
                  </div>
                  <div className="listing-row-sub">
                    {[l.district, l.city].filter(Boolean).join(", ") || "район/город не указан"}
                    {l.zhk ? ` · ЖК ${l.zhk}` : ""}
                  </div>
                </div>
                <div className="listing-row-price">
                  {l.price ? `${Number(l.price).toLocaleString("ru-RU")} ${l.currency || ""}` : "цена не указана"}
                </div>
              </div>
              <div className="listing-row-bottom">
                <span className={badgeClass(l.status)}>{l.status || "без статуса"}</span>
                <span className="listing-row-id">{l.display_id || l.legacy_id || l.id.slice(0, 8)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyListingsPage() {
  return (
    <Suspense fallback={<div className="app-shell"><div className="empty-state">Загрузка…</div></div>}>
      <MyListingsInner />
    </Suspense>
  );
}
