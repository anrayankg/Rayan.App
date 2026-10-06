// Кто сейчас вошёл в личный кабинет на этом устройстве + сборка ссылок "Поделиться".
// Если агент вошёл — в клиентскую ссылку добавляется ?ag=<id агента>, и клиент видит
// телефон и имя ИМЕННО того агента, который отправил ссылку (а не того, кто завёл объект).

export const SITE_URL = "https://rayan-app.vercel.app";

// Вход только по номеру + ПИН-коду (проверяется в базе). Старые входы без ПИН не считаются.
export function getCurrentAgent() {
  if (typeof window === "undefined") return null;
  try {
    const a = JSON.parse(localStorage.getItem("rayan_agent") || "null");
    return a && a.pinOk ? a : null;
  } catch { return null; }
}

function origin() {
  return typeof window !== "undefined" ? window.location.origin : SITE_URL;
}

// Короткий код агента в ссылке — последние 9 цифр телефона (например 701229133).
export function agentCode(a) {
  const d = String((a && a.phone) || "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : "";
}

// Короткая ссылка клиенту: /p/000348?a=701229133
// listing — объект (берём его 6-значный ID) или просто id.
export function clientListingLink(listing, agent) {
  const a = agent === undefined ? getCurrentAgent() : agent;
  const key = listing && typeof listing === "object" ? (listing.display_id || listing.id) : listing;
  const code = agentCode(a);
  return `${origin()}/p/${key}${code ? `?a=${code}` : ""}`;
}

export function colleagueListingLink(listingId) {
  return `${origin()}/a/${listingId}`;
}

export function collectionLink(collectionId, agent) {
  const a = agent === undefined ? getCurrentAgent() : agent;
  const code = agentCode(a);
  return `${origin()}/c/${collectionId}${code ? `?a=${code}` : ""}`;
}

export function digitsOnly(s) { return String(s || "").replace(/\D/g, ""); }

// Объект "свой", если телефон агента в объекте совпадает с телефоном вошедшего агента.
// Руководитель агентства: видит ВСЕ объекты как свои — с контактами собственников,
// финансами и договором (последние 9 цифр телефона).
export const ADMIN_PHONES = ["553625010"]; // Айгуль Валеева +996 553 625 010
export function isAdmin(agent) {
  if (agent && agent.role === "admin") return true;
  const d = digitsOnly(agent && agent.phone);
  return d.length >= 9 && ADMIN_PHONES.includes(d.slice(-9));
}

export function isOwnListing(listing, agent) {
  if (!listing || !agent) return false;
  if (isAdmin(agent)) return true;
  const a = digitsOnly(agent.phone);
  return a.length > 0 && digitsOnly(listing.agent_phone) === a;
}
