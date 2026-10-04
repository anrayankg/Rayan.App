"use client";
import { useEffect, useRef, useState } from "react";

// Запоминает значение (фильтр, поиск, вкладку) на время работы с приложением.
// Открыли объект → вернулись назад → фильтр и найденные варианты на месте.
// Сбрасывается только кнопкой «Сбросить»/«Очистить» или после закрытия вкладки браузера.
export function useKeptState(key, initial) {
  const [value, setValue] = useState(initial);
  const restored = useRef(false);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rayan_keep_" + key);
      if (raw != null) setValue(JSON.parse(raw));
    } catch {}
    restored.current = true;
  }, [key]);
  useEffect(() => {
    if (!restored.current) return;
    try { sessionStorage.setItem("rayan_keep_" + key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue];
}

// Запоминает, докуда прокрутили список, и возвращает туда, когда данные загрузились.
export function useKeptScroll(key, ready) {
  const done = useRef(false);
  useEffect(() => {
    let t = null;
    const onScroll = () => {
      clearTimeout(t);
      t = setTimeout(() => { try { sessionStorage.setItem("rayan_scroll_" + key, String(window.scrollY)); } catch {} }, 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(t); };
  }, [key]);
  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    try {
      const y = Number(sessionStorage.getItem("rayan_scroll_" + key) || 0);
      if (y > 0) setTimeout(() => window.scrollTo(0, y), 60);
    } catch {}
  }, [key, ready]);
}
