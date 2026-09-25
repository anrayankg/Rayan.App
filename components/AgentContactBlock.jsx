"use client";
const R_ICON = "/r-icon.png";
import { WhatsAppLogo, TelegramLogo, waLink, tgLink } from "./SocialIcons";

// Блок "Агент по объекту" — ОДИН И ТОТ ЖЕ на странице клиента, агента и владельца:
// круглая аватарка, имя агента крупно белым, ниже серым "RAYAN — центр недвижимости",
// телефон + большие кнопки WhatsApp и Telegram (оригинальные значки, под палец).
export default function AgentContactBlock({ name, phone, waText }) {
  const tel = String(phone || "").replace(/[^\d+]/g, "");
  const hasPhone = tel.replace(/\D/g, "").length > 0;
  return (
    <div style={sx.wrap}>
      <div style={sx.agentRow}>
        <div style={sx.avatar}><img src={R_ICON} alt="" style={sx.avatarImg} /></div>
        <div style={{ minWidth: 0 }}>
          <div style={sx.name}>{name || "Агент RAYAN"}</div>
          <div style={sx.sub}>RAYAN — центр недвижимости</div>
        </div>
      </div>

      {hasPhone && (
        <div style={sx.box}>
          <div style={sx.phoneRow}>
            <span style={sx.phone}>{phone}</span>
            <a href={`tel:${tel}`} className="btn-primary" style={sx.callBtn}>Позвонить</a>
          </div>
          <div style={sx.msgRow}>
            <a href={waLink(phone, waText)} target="_blank" rel="noopener noreferrer" style={sx.msgBtn}>
              <WhatsAppLogo size={34} /><span>WhatsApp</span>
            </a>
            <a href={tgLink(phone)} target="_blank" rel="noopener noreferrer" style={sx.msgBtn}>
              <TelegramLogo size={34} /><span>Telegram</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const sx = {
  wrap: { marginTop: 24 },
  agentRow: { display: "flex", alignItems: "center", gap: 12, padding: "6px 0 14px" },
  avatar: { width: 56, height: 56, borderRadius: "50%", background: "#1C4638", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg: { height: 34, width: "auto" },
  name: { fontSize: 20, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 },
  sub: { fontSize: 13, color: "#8B8B90", marginTop: 3 },
  box: { background: "rgba(255,255,255,0.05)", borderRadius: "var(--r)", padding: 12 },
  phoneRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  phone: { fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: 0.3 },
  callBtn: { padding: "12px 18px", fontSize: 14.5, flexShrink: 0 },
  msgRow: { display: "flex", gap: 10, marginTop: 10 },
  msgBtn: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 54,
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--r)",
    color: "#fff", fontSize: 15.5, fontWeight: 700, textDecoration: "none" },
};
