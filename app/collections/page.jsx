"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

function IconWhatsappSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="#3ED07A">
      <path d="M16 3C9 3 3 9 3 16c0 2.4.7 4.7 1.9 6.6L3 29l6.6-1.9c1.8 1 3.9 1.6 6.4 1.6 7 0 13-6 13-13S23 3 16 3zm7.5 18.4c-.3.9-1.7 1.7-2.4 1.8-.6.1-1.4.1-2.2-.1-.5-.2-1.2-.4-2-.8-3.5-1.5-5.8-5-6-5.3-.2-.3-1.4-1.9-1.4-3.6 0-1.7.9-2.5 1.2-2.9.3-.3.7-.4.9-.4h.6c.2 0 .5 0 .7.6.3.7.9 2.3 1 2.5.1.2.2.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.5-.6.6-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 1.9.4.2.6.1.8-.1.2-.3.9-1 1.1-1.4.2-.3.5-.3.8-.2.3.1 2 1 2.4 1.1.4.2.6.3.7.4.1.3.1.9-.2 1.7z"/>
    </svg>
  );
}
function IconTelegramSmall() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="2"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>;
}
function IconShareStandard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 6l-4-4-4 4" /><path d="M12 2v14" />
    </svg>
  );
}

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
  if (!agent) return <div style={sx.page}><div style={sx.center}>Войдите в личный кабинет, чтобы увидеть подборки.</div></div>;

  return (
    <div style={sx.page}>
      <button onClick={() => router.push("/profile")} style={sx.backBtn}>‹</button>
      <div style={sx.title}>Мои подборки ({collections.length})</div>

      {collections.length === 0 ? (
        <div style={sx.emptyMsg}>Подборок пока нет — создайте на странице любого объекта.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
          {collections.map((c) => {
            const link = typeof window !== "undefined" ? `${window.location.origin}/c/${c.id}` : "";
            const shareText = encodeURIComponent(`Подборка «${c.name}»: ${link}`);
            return (
              <div key={c.id} style={sx.collectionRow}>
                <a href={`/c/${c.id}?manage=1`} style={sx.collectionRowLink}>
                  <span style={sx.collectionRowName}>{c.name}</span>
                  <span style={sx.collectionRowCount}>{(c.listing_ids || []).length} объект(ов)</span>
                </a>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener noreferrer" style={sx.shareIconBtn} aria-label="WhatsApp"><IconWhatsappSmall /></a>
                  <a href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Подборка «" + c.name + "»")}`} target="_blank" rel="noopener noreferrer" style={sx.shareIconBtn} aria-label="Telegram"><IconTelegramSmall /></a>
                  <button
                    onClick={() => { if (navigator.share) navigator.share({ title: c.name, url: link }).catch(() => {}); else navigator.clipboard.writeText(link); }}
                    style={sx.shareIconBtn} aria-label="Поделиться"
                  >
                    <IconShareStandard />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const sx = {
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: "#fff", padding: "16px 20px 40px" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", color: "#8B8B90" },
  backBtn: { width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "#fff",
    border: "none", fontSize: 22, lineHeight: "36px", marginBottom: 14 },
  title: { fontSize: 19, fontWeight: 800 },
  emptyMsg: { color: "#8B8B90", fontSize: 13, lineHeight: 1.6, marginTop: 16 },
  collectionRow: { display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 14px" },
  collectionRowLink: { display: "flex", flexDirection: "column", gap: 3, textDecoration: "none", color: "#fff" },
  collectionRowName: { fontSize: 14, fontWeight: 700 },
  collectionRowCount: { color: "#7FA396", fontSize: 11.5 },
  shareIconBtn: { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
    border: "none", display: "flex", alignItems: "center", justifyContent: "center" },
};
