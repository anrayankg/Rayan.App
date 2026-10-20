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

// Параметр ссылки: ?k=<код агента> (короткий, не меняется при смене номера).
// Если кода ещё нет (вошли до обновления) — по-старому ?a=<9 цифр номера>.
export function agentLinkParam(a) {
  if (a && a.link_code) return `k=${a.link_code}`;
  const c = agentCode(a);
  return c ? `a=${c}` : "";
}

// Короткая ссылка клиенту: /p/000348?k=a8x3q2
// listing — объект (берём его 6-значный ID) или просто id.
export function clientListingLink(listing, agent) {
  const a = agent === undefined ? getCurrentAgent() : agent;
  const key = listing && typeof listing === "object" ? (listing.display_id || listing.id) : listing;
  const q = agentLinkParam(a);
  return `${origin()}/p/${key}${q ? `?${q}` : ""}`;
}

export function colleagueListingLink(listingId) {
  return `${origin()}/a/${listingId}`;
}

export function collectionLink(collectionId, agent) {
  const a = agent === undefined ? getCurrentAgent() : agent;
  const q = agentLinkParam(a);
  return `${origin()}/c/${collectionId}${q ? `?${q}` : ""}`;
}

export function digitsOnly(s) { return String(s || "").replace(/\D/g, ""); }

// ===== РОЛИ =====
// admin — директор: видит всё (все объекты, контакты собственников, финансы, всех РОПов и агентов).
// rop   — руководитель отдела: видит контакты и всю информацию только по объектам СВОЕЙ команды.
// agent — агент: видит закрытую информацию только по своим объектам.
export const ADMIN_PHONES = ["553625010"]; // Айгуль Валеева +996 553 625 010 (директор)
const last9 = (s) => digitsOnly(s).slice(-9);

export function isAdmin(agent) {
  if (agent && agent.role === "admin") return true;
  const d = digitsOnly(agent && agent.phone);
  return d.length >= 9 && ADMIN_PHONES.includes(d.slice(-9));
}
export function isRop(agent) { return !!agent && agent.role === "rop"; }
// Может ли человек заходить в раздел «Агенты и ПИН-коды»
export function isManager(agent) { return isAdmin(agent) || isRop(agent); }

// "Свой" объект = можно видеть собственника, финансы, договор и редактировать.
export function isOwnListing(listing, agent) {
  if (!listing || !agent) return false;
  if (isAdmin(agent)) return true;
  const lp = last9(listing.agent_phone);
  if (lp.length < 9) return false;
  if (lp === last9(agent.phone)) return true;
  if (isRop(agent) && Array.isArray(agent.team)) return agent.team.map(last9).includes(lp);
  return false;
}
