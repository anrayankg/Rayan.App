"use client";
import { useRouter } from "next/navigation";
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
        const color = isActive ? "var(--green-accent)" : "#7FA396";
        return (
          <div key={i} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => router.push(n.path)} style={{ cursor: "pointer" }}>
            <Icon size={21} color={color} fill={isActive && canFill ? color : "none"} strokeWidth={isActive && canFill ? 1.6 : 1.8} />
            <span>{n.label}</span>
          </div>
        );
      })}
    </div>
  );
}
