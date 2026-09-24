"use client";
import { useEffect, useState } from "react";
import { R_ICON, RAYAN_WORD } from "../lib/logo";

// Заставка при открытии приложения — логотип на фирменном фоне 2 секунды,
// потом плавно исчезает и показывает саму страницу.
export default function Splash() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1700);
    const hideTimer = setTimeout(() => setVisible(false), 2000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{ ...sx.wrap, opacity: fading ? 0 : 1 }}>
      <img src={R_ICON} alt="" style={sx.icon} />
      <img src={RAYAN_WORD} alt="RAYAN" style={sx.word} />
    </div>
  );
}

const sx = {
  wrap: {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "#1C4638",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
    transition: "opacity 0.3s ease",
  },
  icon: { width: 84, height: 84, objectFit: "contain" },
  word: { width: 160, objectFit: "contain" },
};
