"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import BottomNav from "../../components/BottomNav";
import { SocialButton } from "../../components/SocialIcons";
import { collectionLink } from "../../lib/agent";

// "Мои подборки" агента. Кнопка "Смотреть" — крупная, во всю ширину по центру,
// значки WhatsApp / Telegram / Поделиться — большие, под палец.
export default function CollectionsPage() {
  const router = useRouter();
  const [agent, setAgent] = useState(undefined);
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rayan_agent");
      setAgent(saved ? JSON.parse(saved) : null);
    } catch { setAgent(null); }
  }, []);

  useEffect(() => {
    if (!agent) return;
    supabase.from("collections").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false })
      .then(({ data }) => setCollections(data || []));
  }, [agent]);

  if (agent === undefined) return <div style={sx.page}><div style={sx.center}>Загрузка…</div></div>;
  if (!agent) return <div style={sx.page}><div style={sx.center}>Войдите в личный кабинет, чтобы увидеть подборки.</div><BottomNav active="Профиль" /></div>;

  return (
    <div style={sx.page}>
      <button onClick={() => router.push("/profile")} style={sx.backBtn}>‹</button>
      <div style={sx.title}>Мои подборки ({collections.length})</div>

      {collections.length === 0 ? (
        <div style={sx.emptyMsg}>Подборок пока нет — выберите объекты кружочками и нажмите «Отправить в подборку».</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          {collections.map((c) => {
            const link = collectionLink(c.id, agent);
            const count = (c.listing_ids || []).length;
            return (
              <div key={c.id} style={sx.card}>
                <div style={sx.cardHead}>
                  <span style={sx.name}>{c.name}</span>
                  <span style={sx.count}>{count} объект(ов)</span>
                </div>
                <a href={`/c/${c.id}?manage=1`} className="btn-primary btn-block" style={{ marginTop: 12 }}>Смотреть</a>
                <div style={sx.shareRow}>
                  <SocialButton kind="whatsapp" size={52} label="Отправить в WhatsApp"
                    href={`https://wa.me/?text=${encodeURIComponent(link)}`} />
                  <SocialButton kind="telegram" size={52} label="Отправить в Telegram"
                    href={`https://t.me/share/url?url=${encodeURIComponent(link)}`} />
                  <SocialButton kind="share" size={52} label="Поделиться"
                    onClick={() => { if (navigator.share) navigator.share({ url: link }).catch(() => {}); else { navigator.clipboard.writeText(link); alert("Ссылка скопирована"); } }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <BottomNav active="Профиль" />
    </div>
  );
}

const sx = {
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: "#fff", padding: "16px 20px 110px" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", color: "#8B8B90", textAlign: "center" },
  backBtn: { width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "#fff",
    border: "none", fontSize: 22, lineHeight: "40px", marginBottom: 14 },
  title: { fontSize: 22, fontWeight: 800 },
  emptyMsg: { color: "#8B8B90", fontSize: 14, lineHeight: 1.6, marginTop: 16 },
  card: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--r)", padding: "14px 14px 12px" },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 },
  name: { fontSize: 17, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  count: { color: "#8B8B90", fontSize: 13, flexShrink: 0 },
  shareRow: { display: "flex", justifyContent: "space-around", alignItems: "center", marginTop: 12 },
};
