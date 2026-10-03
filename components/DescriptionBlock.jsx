"use client";
import { useState } from "react";

// Описание объекта + строка "id: 000362" внизу (автоматически).
// Кнопка «Скопировать описание» копирует текст ЦЕЛИКОМ вместе с id —
// агент сразу вставляет его в WhatsApp/Telegram-группы.
export function descriptionWithId(l) {
  const text = String(l.description || "").trim();
  const idLine = l.display_id ? `id: ${l.display_id}` : "";
  return [text, idLine].filter(Boolean).join("\n\n");
}

export default function DescriptionBlock({ listing, titleStyle, textStyle, sectionStyle, withCopy = true }) {
  const [copied, setCopied] = useState(false);
  const full = descriptionWithId(listing);
  if (!full) return null;
  async function copy() {
    try { await navigator.clipboard.writeText(full); }
    catch {
      const ta = document.createElement("textarea"); ta.value = full; document.body.appendChild(ta);
      ta.select(); try { document.execCommand("copy"); } catch {} document.body.removeChild(ta);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={sectionStyle}>
      <div style={titleStyle}>Описание</div>
      <div style={{ ...textStyle, whiteSpace: "pre-wrap" }}>{full}</div>
      {withCopy && (
        <button className="copy-desc-btn" onClick={copy}>
          {copied ? "✓ Скопировано — вставьте в WhatsApp или Telegram" : "Скопировать описание"}
        </button>
      )}
    </div>
  );
}
