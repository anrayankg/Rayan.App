"use client";
import { useEffect, useState } from "react";

// Кнопки на фото объекта, как в Lalafo:
//  справа вверху — «Поделиться» (три точки, соединённые треугольником);
//  справа внизу — сердечко «В избранное» (для общей базы) или карандаш «Редактировать» (свой объект).
export function ShareDotsIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" /><line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
    </svg>
  );
}

export function ShareOnPhoto({ onClick }) {
  return (
    <button className="round-glass-btn photo-btn-top" onClick={onClick} aria-label="Поделиться">
      <ShareDotsIcon />
    </button>
  );
}

export function PencilOnPhoto({ onClick }) {
  return (
    <button className="round-glass-btn photo-btn-bottom" onClick={onClick} aria-label="Редактировать">
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" />
      </svg>
    </button>
  );
}

// Избранное хранится на этом телефоне (rayan_fav_<id объекта>)
export function isFavorite(listingId) {
  try { return localStorage.getItem(`rayan_fav_${listingId}`) === "1"; } catch { return false; }
}
export function HeartOnPhoto({ listingId }) {
  const [on, setOn] = useState(false);
  useEffect(() => { if (listingId) setOn(isFavorite(listingId)); }, [listingId]);
  function toggle() {
    const next = !on;
    setOn(next);
    try { if (next) localStorage.setItem(`rayan_fav_${listingId}`, "1"); else localStorage.removeItem(`rayan_fav_${listingId}`); } catch {}
  }
  return (
    <button className="round-glass-btn photo-btn-bottom" onClick={toggle} aria-label={on ? "Убрать из избранного" : "В избранное"}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill={on ? "#FF8A00" : "none"} stroke={on ? "#FF8A00" : "#111"} strokeWidth="2">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
}
