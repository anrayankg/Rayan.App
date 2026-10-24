"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentAgent } from "../lib/agent";
import { adLoadState, adCounts } from "../lib/ads";
import { Home, Heart, Megaphone, User, Plus } from "lucide-react";

// Общее нижнее меню — на главной странице оно уже было, но на остальных страницах
// (личный кабинет, вид агента/клиента, подборки) его никто не добавлял, поэтому
// оно там не показывалось. Здесь — тот же набор кнопок, что и на главной.

const NAV = [
  { label: "Главная", path: "/" },
  { label: "Избранное", path: "/favorites" },
  { label: "Добавить", path: "/add" },
  { label: "Реклама", path: "/ads" },
  { label: "Профиль", path: "/profile" },
];
const NAV_ICONS = { "Главная": Home, "Избранное": Heart, "Реклама": Megaphone, "Профиль": User };
const NAV_FILLABLE = { "Главная": true, "Избранное": true, "Профиль": true, "Реклама": false };

export default function BottomNav({ active }) {
  const router = useRouter();
  // Сколько объектов ждут рекламного действия (кэш на минуту, чтобы не нагружать базу)
  const [adCount, setAdCount] = useState(0);
  useEffect(() => {
    let on = true;
    async function load() {
      const me = getCurrentAgent();
      if (!me || !me.pin) { setAdCount(0); return; }
      try {
        const raw = sessionStorage.getItem("rayan_ad_badge");
        if (raw) { const c = JSON.parse(raw); if (Date.now() - c.t < 60000) { if (on) setAdCount(c.n); return; } }
      } catch {}
      try {
        const n = adCounts(await adLoadState(me)).need;
        try { sessionStorage.setItem("rayan_ad_badge", JSON.stringify({ t: Date.now(), n })); } catch {}
        if (on) setAdCount(n);
      } catch { if (on) setAdCount(0); }
    }
    load();
    window.addEventListener("rayan-ads-changed", load);
    return () => { on = false; window.removeEventListener("rayan-ads-changed", load); };
  }, []);
  return (
    <div className="bottomnav">
      {NAV.map((n, i) => {
        if (n.label === "Добавить") {
          return (
            <div key={i} className="nav-fab-wrap" onClick={() => router.push(n.path)} style={{ cursor: "pointer" }}>
              <div className="nav-fab"><Plus size={28} color="#fff" strokeWidth={2.5} /></div>
              <span className="nav-fab-label">Добавить объект</span>
            </div>
          );
        }
        const Icon = NAV_ICONS[n.label];
        const isActive = active === n.label;
        const canFill = NAV_FILLABLE[n.label];
        const color = isActive ? "var(--green-accent)" : "var(--muted)";
        return (
          <div key={i} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => router.push(n.path)} style={{ cursor: "pointer" }}>
            <span className="nav-icon-wrap">
              <Icon size={21} color={color} fill={isActive && canFill ? color : "none"} strokeWidth={isActive && canFill ? 1.6 : 1.8} />
              {n.label === "Реклама" && adCount > 0 && <span className="nav-badge">{adCount > 99 ? "99+" : adCount}</span>}
            </span>
            <span>{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}
