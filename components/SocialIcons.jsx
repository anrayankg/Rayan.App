// Оригинальные значки WhatsApp и Telegram (круглые, фирменного цвета) — одни и те же ВЕЗДЕ в приложении.
// size — диаметр кружка. Для нажатия пальцем используйте SocialButton (минимум 48px).

const WA_PATH = "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

const TG_PATH = "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z";

export function WhatsAppLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <g transform="translate(6.4 6.4) scale(0.8)"><path d={WA_PATH} fill="#FFFFFF" /></g>
    </svg>
  );
}

export function TelegramLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10.5" fill="#FFFFFF" />
      <path d={TG_PATH} fill="#2AABEE" />
    </svg>
  );
}

export function ShareLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="16" cy="16" r="16" fill="#3A3A3F" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 17v5a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 22 22v-5" />
        <path d="M19.5 11.5 16 8l-3.5 3.5" /><path d="M16 8v10" />
      </g>
    </svg>
  );
}

// Большая круглая кнопка-значок (удобно нажимать пальцем). Либо href (ссылка), либо onClick.
export function SocialButton({ kind, href, onClick, size = 48, label }) {
  const Logo = kind === "whatsapp" ? WhatsAppLogo : kind === "telegram" ? TelegramLogo : ShareLogo;
  const style = { width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center",
    justifyContent: "center", background: "none", border: "none", padding: 0, flexShrink: 0, cursor: "pointer" };
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label || kind} style={style}>
        <Logo size={size} />
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label || kind} style={style}>
      <Logo size={size} />
    </button>
  );
}

export function waLink(phone, text) {
  const n = String(phone || "").replace(/\D/g, "");
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
export function tgLink(phone) {
  const n = String(phone || "").replace(/\D/g, "");
  return `https://t.me/+${n}`;
}

// Оригинальный значок YouTube: красная скруглённая плашка с белым треугольником
export function YouTubeLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <rect x="1" y="4.5" width="22" height="15" rx="4.5" fill="#FF0000" />
      <path d="M10 8.6v6.8l5.9-3.4z" fill="#FFFFFF" />
    </svg>
  );
}

// Оригинальный значок Instagram: градиентный квадрат с камерой
export function InstagramLogo({ size = 28 }) {
  const id = "igg" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <radialGradient id={id} cx="30%" cy="107%" r="150%">
          <stop offset="0" stopColor="#FDF497" /><stop offset="0.05" stopColor="#FDF497" />
          <stop offset="0.45" stopColor="#FD5949" /><stop offset="0.6" stopColor="#D6249F" /><stop offset="0.9" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6.5" fill={`url(#${id})`} />
      <rect x="5.5" y="5.5" width="13" height="13" rx="4" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.3" cy="7.7" r="1" fill="#fff" />
    </svg>
  );
}

export function VideoPlatformLogo({ platform, size = 28 }) {
  if (platform === "youtube") return <YouTubeLogo size={size} />;
  if (platform === "instagram") return <InstagramLogo size={size} />;
  return <TelegramLogo size={size} />;
}
