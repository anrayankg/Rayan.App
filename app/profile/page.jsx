"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

// Личный кабинет агента. Входа с паролем пока нет (сознательно, по решению Айгуль) —
// агент вводит свой рабочий номер, если он найден в таблице agents, устройство
// запоминает, что это он (localStorage). Это НЕ настоящая защита — любой, кто знает
// номер, может представиться этим агентом с любого устройства. Для внутренней команды
// пока достаточно; когда понадобится реальная защита — это первое, что нужно будет заменить.

function digitsOnly(s) { return (s || "").replace(/\D/g, ""); }
function photoUrl(path) {
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data?.publicUrl || "";
}

export default function ProfilePage() {
  const router = useRouter();
  const [agent, setAgent] = useState(undefined); // undefined = ещё проверяем, null = не вошёл
  const [phoneInput, setPhoneInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [myCollections, setMyCollections] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rayan_agent");
      setAgent(saved ? JSON.parse(saved) : null);
    } catch { setAgent(null); }
  }, []);

  useEffect(() => {
    if (!agent) return;
    async function loadMine() {
      const myDigits = digitsOnly(agent.phone);
      // agent_phone в объектах мог быть внесён в разном формате (с пробелами/скобками) —
      // поэтому сверяем по "голым" цифрам, а не точным совпадением строки.
      const { data } = await supabase.from("listings")
        .select("id, display_id, type, status, price, currency, currency_new, district, zhk, room_type, rooms, area_m2, photos, agent_phone")
        .not("agent_phone", "is", null);
      setMyListings((data || []).filter((l) => digitsOnly(l.agent_phone) === myDigits));

      const { data: cols } = await supabase.from("collections").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false });
      setMyCollections(cols || []);
    }
    loadMine();
  }, [agent]);

  async function handleLogin() {
    setLoginError("");
    const digits = digitsOnly(phoneInput);
    if (digits.length < 9) { setLoginError("Введите номер телефона полностью"); return; }
    setBusy(true);
    const { data, error } = await supabase.from("agents").select("*");
    setBusy(false);
    if (error) { setLoginError("Ошибка: " + error.message); return; }
    const found = (data || []).find((a) => digitsOnly(a.phone) === digits);
    if (!found) { setLoginError("Номер не найден. Обратитесь к Айгуль, чтобы завести личный кабинет."); return; }
    localStorage.setItem("rayan_agent", JSON.stringify(found));
    setAgent(found);
  }

  function handleLogout() {
    localStorage.removeItem("rayan_agent");
    setAgent(null);
    setPhoneInput("");
  }

  if (agent === undefined) return <div style={sx.page}><div style={sx.center}>Загрузка…</div></div>;

  if (!agent) {
    return (
      <div style={sx.page}>
        <div style={sx.loginBox}>
          <div style={sx.loginTitle}>Вход в личный кабинет</div>
          <div style={sx.loginSub}>Введите ваш рабочий номер телефона</div>
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="+996 700 000 000"
            style={sx.input}
          />
          {loginError && <div style={sx.error}>{loginError}</div>}
          <button onClick={handleLogin} disabled={busy} style={sx.loginBtn}>{busy ? "Проверяю…" : "Войти"}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={sx.page}>
      <div style={sx.header}>
        <div style={sx.avatar}>{(agent.name || "?")[0]}</div>
        <div>
          <div style={sx.name}>{agent.name}</div>
          <div style={sx.phone}>{agent.phone}</div>
        </div>
      </div>
      <button onClick={handleLogout} style={sx.logoutBtn}>Выйти</button>

      <div style={sx.sectionTitle}>Мои объекты ({myListings.length})</div>
      {myListings.length === 0 ? (
        <div style={sx.emptyMsg}>Пока не найдено объектов с вашим номером.</div>
      ) : (
        <div style={sx.grid}>
          {myListings.map((l) => (
            <a key={l.id} href={`/listing/${l.id}`} style={sx.card}>
              <div style={sx.cardPhotoWrap}>
                {(l.photos || [])[0] ? <img src={photoUrl(l.photos[0])} alt="" style={sx.cardPhoto} /> : <div style={sx.cardPhoto} />}
              </div>
              <div style={sx.cardMeta}>{l.room_type || l.rooms} · {l.district || ""}</div>
            </a>
          ))}
        </div>
      )}

      <div style={sx.sectionTitle}>Мои подборки ({myCollections.length})</div>
      {myCollections.length === 0 ? (
        <div style={sx.emptyMsg}>Подборок пока нет — создайте на странице любого объекта.</div>
      ) : (
        myCollections.map((c) => (
          <a key={c.id} href={`/c/${c.id}`} style={sx.collectionRow}>
            <span>{c.name}</span>
            <span style={{ color: "#7FA396" }}>{(c.listing_ids || []).length} объект(ов) ›</span>
          </a>
        ))
      )}
    </div>
  );
}

const sx = {
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: "#fff", padding: "24px 20px 40px" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", color: "#8B8B90" },
  loginBox: { marginTop: 60 },
  loginTitle: { fontSize: 20, fontWeight: 800, textAlign: "center" },
  loginSub: { fontSize: 13, color: "#8B8B90", textAlign: "center", marginTop: 6, marginBottom: 20 },
  input: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 10, padding: "13px 14px", color: "#fff", fontSize: 15, textAlign: "center" },
  error: { color: "#E8877A", fontSize: 12.5, textAlign: "center", marginTop: 10 },
  loginBtn: { width: "100%", background: "#1FA35C", border: "none", color: "#fff", fontWeight: 700,
    fontSize: 15, padding: "13px 0", borderRadius: 10, marginTop: 14 },
  header: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: "50%", background: "rgba(31,163,92,0.16)", color: "#5BD98A",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 19 },
  name: { fontSize: 17, fontWeight: 800 },
  phone: { fontSize: 12.5, color: "#8B8B90" },
  logoutBtn: { background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#8B8B90",
    fontSize: 12, padding: "6px 12px", borderRadius: 8, marginTop: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#7FA396", textTransform: "uppercase",
    letterSpacing: 0.4, marginTop: 26, marginBottom: 10 },
  emptyMsg: { color: "#8B8B90", fontSize: 13, lineHeight: 1.6 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 },
  card: { textDecoration: "none", color: "#fff" },
  cardPhotoWrap: { width: "100%", aspectRatio: "1/1", borderRadius: 8, overflow: "hidden", background: "#1A1A1C" },
  cardPhoto: { width: "100%", height: "100%", objectFit: "cover" },
  cardMeta: { fontSize: 10, color: "#8B8B90", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  collectionRow: { display: "flex", justifyContent: "space-between", padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)", textDecoration: "none", color: "#fff", fontSize: 13.5 },
};
