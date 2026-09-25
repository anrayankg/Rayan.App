"use client";
import { useState } from "react";
import { WhatsAppLogo, TelegramLogo, ShareLogo } from "./SocialIcons";

// Окно "Поделиться": WhatsApp / Telegram / другие приложения / скопировать ссылку.
// url — главная ссылка (по ней WhatsApp строит карточку с фото и параметрами),
// text — полный текст сообщения (если несколько объектов — список ссылок).
export default function ShareSheet({ open, onClose, url, text, title = "Поделиться", note }) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const message = text || url || "";

  function copy() {
    try { navigator.clipboard.writeText(message); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  function nativeShare() {
    if (navigator.share) navigator.share({ text: message }).catch(() => {});
    else copy();
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">{title}</div>
        {note && <div className="sheet-note">{note}</div>}
        <a className="share-row" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          <WhatsAppLogo size={40} /><span>WhatsApp</span>
        </a>
        <a className="share-row" href={`https://t.me/share/url?url=${encodeURIComponent(url || "")}${text && text !== url ? `&text=${encodeURIComponent(text.replace(url || "", "").trim())}` : ""}`} target="_blank" rel="noopener noreferrer" onClick={onClose}>
          <TelegramLogo size={40} /><span>Telegram</span>
        </a>
        <button className="share-row" onClick={nativeShare}>
          <ShareLogo size={40} /><span>Другие приложения</span>
        </button>
        <button className="share-row" onClick={copy}>
          <span className="share-copy-icon">⧉</span><span>{copied ? "Скопировано ✓" : "Скопировать ссылку"}</span>
        </button>
        <button className="sheet-cancel" onClick={onClose}>Отмена</button>
      </div>
    </div>
  );
}
