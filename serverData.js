// Только для СЕРВЕРА (generateMetadata): читает объект из Supabase напрямую через REST,
// чтобы WhatsApp / Telegram при вставке ссылки показывали карточку с фото, ценой и параметрами.
import { fullCharLine, priceBlock, categoryLabel } from "./listingFormat";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SITE_NAME = "RAYAN — центр недвижимости";
const DEFAULT_IMAGE = "/og-rayan.jpg";

async function sbSelect(table, query) {
  if (!SB_URL || !SB_KEY) return [];
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      cache: "no-store",
    });
    if (!r.ok) return [];
    return await r.json();
  } catch {
    return [];
  }
}

export function photoPublicUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${SB_URL}/storage/v1/object/public/listing-photos/${String(path).split("/").map(encodeURIComponent).join("/")}`;
}

function cleanChars(l) {
  return fullCharLine(l).split(" · ").filter((x) => x && x !== "—").join(" · ");
}
function locationOf(l) {
  const parts = [l.district, l.zhk].filter(Boolean);
  if (l.city && l.city !== "Бишкек") parts.unshift(l.city);
  return parts.join(", ") || l.city || "Бишкек";
}

export async function listingMetadata(id, path) {
  const rows = await sbSelect("listings", `id=eq.${encodeURIComponent(id)}&select=*`);
  const l = rows[0];
  if (!l) {
    return { title: SITE_NAME, openGraph: { title: SITE_NAME, siteName: SITE_NAME, images: [DEFAULT_IMAGE] } };
  }
  const { usd } = priceBlock(l);
  const chars = cleanChars(l);
  const title = `$${usd.toLocaleString("ru-RU")}${chars ? " · " + chars : ""}`;
  const descText = (l.description || "").replace(/\s+/g, " ").trim();
  const description = `${categoryLabel(l.type)} · ${locationOf(l)}${l.display_id ? " · ID " + l.display_id : ""}. ${descText}`.slice(0, 280);
  const image = photoPublicUrl((l.photos || [])[0]) || DEFAULT_IMAGE;
  return {
    title: `${title} — RAYAN`,
    description,
    openGraph: {
      title: `${title} — RAYAN`,
      description,
      siteName: SITE_NAME,
      type: "website",
      url: path,
      images: [{ url: image, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export async function collectionMetadata(id, path) {
  const rows = await sbSelect("collections", `id=eq.${encodeURIComponent(id)}&select=id,listing_ids`);
  const c = rows[0];
  const ids = c ? (c.listing_ids || []).map((x) => (typeof x === "string" ? x : x.id)).filter(Boolean) : [];
  let image = DEFAULT_IMAGE;
  if (ids.length > 0) {
    const ls = await sbSelect("listings", `id=in.(${ids.map(encodeURIComponent).join(",")})&status=eq.${encodeURIComponent("активен")}&select=id,photos`);
    const withPhoto = ls.find((x) => (x.photos || [])[0]);
    if (withPhoto) image = photoPublicUrl(withPhoto.photos[0]);
  }
  const title = `Подборка объектов (${ids.length}) — RAYAN`;
  const description = `${SITE_NAME}. Подобранные для вас варианты — нажмите, чтобы посмотреть.`;
  return {
    title, description,
    openGraph: { title, description, siteName: SITE_NAME, type: "website", url: path, images: [{ url: image, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
