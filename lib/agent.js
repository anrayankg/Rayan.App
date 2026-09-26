// Кто сейчас вошёл в личный кабинет на этом устройстве + сборка ссылок "Поделиться".
// Если агент вошёл — в клиентскую ссылку добавляется ?ag=<id агента>, и клиент видит
// телефон и имя ИМЕННО того агента, который отправил ссылку (а не того, кто завёл объект).

export const SITE_URL = "https://rayan-app.vercel.app";

export function getCurrentAgent() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("rayan_agent") || "null"); } catch { return null; }
}

function origin() {
  return typeof window !== "undefined" ? window.location.origin : SITE_URL;
}

export function clientListingLink(listingId, agent) {
  const a = agent === undefined ? getCurrentAgent() : agent;
  if (!a || (!a.id && !a.phone)) return `${origin()}/p/${listingId}`;
  // ag — id агента; ap/an — его телефон и имя на всякий случай (если справочник агентов не ответит,
  // клиент всё равно увидит номер ТОГО агента, который отправил ссылку, а не владельца объекта).
  const q = new URLSearchParams();
  if (a.id) q.set("ag", a.id);
  if (a.phone) q.set("ap", String(a.phone).replace(/[^\d+]/g, ""));
  if (a.name) q.set("an", a.name);
  return `${origin()}/p/${listingId}?${q.toString()}`;
}

export function colleagueListingLink(listingId) {
  return `${origin()}/a/${listingId}`;
}

export function collectionLink(collectionId, agent) {
  const a = agent === undefined ? getCurrentAgent() : agent;
  return `${origin()}/c/${collectionId}${a && a.id ? `?ag=${encodeURIComponent(a.id)}` : ""}`;
}

export function digitsOnly(s) { return String(s || "").replace(/\D/g, ""); }

// Объект "свой", если телефон агента в объекте совпадает с телефоном вошедшего агента.
export function isOwnListing(listing, agent) {
  if (!listing || !agent) return false;
  const a = digitsOnly(agent.phone);
  return a.length > 0 && digitsOnly(listing.agent_phone) === a;
}
