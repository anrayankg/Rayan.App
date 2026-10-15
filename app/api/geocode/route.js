// Серверный поиск адресов для карты.
//  • ?q=текст          — подсказки при вводе адреса (улица, дом, ЖК, район) — Photon (OpenStreetMap), с приоритетом Бишкека
//  • ?q=текст&exact=1  — точный поиск (кнопка «Найти») — Nominatim
//  • ?lat=..&lng=..    — какой адрес в этой точке (нажали на карту / «Определить адрес»)
// Если в настройках Vercel добавить DGIS_API_KEY — вместо OpenStreetMap используется 2ГИС (точнее по домам и ЖК Бишкека).
// Ответ всегда один: { candidates: [{ lat, lng, name, label, sub }] }

const UA = "RAYAN-real-estate (agency tool, Bishkek)";
const BISHKEK = { lat: 42.8746, lon: 74.5698 };
const KG = { minLon: 69.0, minLat: 39.0, maxLon: 80.5, maxLat: 43.3 };
const PHOTON = process.env.GEOCODER_URL || "https://photon.komoot.io";
const DGIS_KEY = process.env.DGIS_API_KEY || "";

const inKg = (lat, lng) => lat >= KG.minLat && lat <= KG.maxLat && lng >= KG.minLon && lng <= KG.maxLon;
const json = (candidates, cache) =>
  Response.json({ candidates }, { headers: cache ? { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } : {} });

function fromPhoton(data) {
  const out = [];
  for (const f of (data && data.features) || []) {
    const c = f.geometry && f.geometry.coordinates;
    if (!c) continue;
    const [lng, lat] = c;
    if (!inKg(lat, lng)) continue;
    const p = f.properties || {};
    const street = [p.street, p.housenumber].filter(Boolean).join(", ");
    const title = p.name || street || p.district || p.city || "";
    const sub = [p.name && street ? street : null, p.district, p.city || p.county, p.state].filter(Boolean).join(", ");
    out.push({ lat, lng, label: title, sub, name: [title, sub].filter(Boolean).join(", ") });
  }
  return out;
}

function fromNominatim(arr) {
  return (arr || [])
    .map((r) => ({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), name: r.display_name || "", label: (r.display_name || "").split(",")[0], sub: (r.display_name || "").split(",").slice(1, 4).join(",").trim() }))
    .filter((c) => inKg(c.lat, c.lng));
}

function fromDgis(data) {
  const items = (data && data.result && data.result.items) || [];
  const out = [];
  for (const it of items) {
    const pt = it.point || (it.geometry && it.geometry.centroid);
    let lat = pt && pt.lat, lng = pt && pt.lon;
    if ((lat == null || lng == null) && it.geometry && typeof it.geometry.centroid === "string") {
      const m = it.geometry.centroid.match(/POINT\(([\d.]+)\s+([\d.]+)\)/);
      if (m) { lng = parseFloat(m[1]); lat = parseFloat(m[2]); }
    }
    if (lat == null || lng == null || !inKg(lat, lng)) continue;
    out.push({ lat, lng, label: it.name || it.address_name || "", sub: it.full_name || it.address_name || "", name: it.full_name || it.name || "" });
  }
  return out;
}

async function get(url, headers) {
  const r = await fetch(url, { headers: { "User-Agent": UA, ...(headers || {}) }, signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error("bad status " + r.status);
  return r.json();
}

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const lat = parseFloat(sp.get("lat"));
  const lng = parseFloat(sp.get("lng"));
  const exact = sp.get("exact") === "1";

  // ===== какой адрес в точке =====
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    try {
      if (DGIS_KEY) {
        const d = await get(`https://catalog.api.2gis.com/3.0/items/geocode?lon=${lng}&lat=${lat}&fields=items.point,items.full_name&key=${DGIS_KEY}`);
        const c = fromDgis(d); if (c.length) return json(c, true);
      }
      const d = await get(`${PHOTON}/reverse?lon=${lng}&lat=${lat}&limit=1`);
      const c = fromPhoton(d); if (c.length) return json(c, true);
    } catch {}
    try {
      const d = await get(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lng}`, { "Accept-Language": "ru" });
      if (d && d.display_name) return json(fromNominatim([{ lat: d.lat, lon: d.lon, display_name: d.display_name }]), true);
    } catch {}
    return json([], false);
  }

  if (!q) return json([], false);

  // ===== поиск по тексту =====
  try {
    if (DGIS_KEY) {
      const d = await get(`https://catalog.api.2gis.com/3.0/items/geocode?q=${encodeURIComponent(q)}&location=${BISHKEK.lon},${BISHKEK.lat}&fields=items.point,items.full_name&page_size=7&key=${DGIS_KEY}`);
      const c = fromDgis(d); if (c.length) return json(c, true);
    }
  } catch {}

  if (!exact) {
    try {
      const d = await get(`${PHOTON}/api/?q=${encodeURIComponent(q)}&limit=7&lat=${BISHKEK.lat}&lon=${BISHKEK.lon}&bbox=${KG.minLon},${KG.minLat},${KG.maxLon},${KG.maxLat}`);
      const c = fromPhoton(d); if (c.length) return json(c, true);
    } catch {}
  }

  try {
    const d = await get(
      `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=kg&viewbox=${KG.minLon},${KG.maxLat},${KG.maxLon},${KG.minLat}&q=${encodeURIComponent(q)}`,
      { "Accept-Language": "ru" }
    );
    return json(fromNominatim(d), true);
  } catch {}
  return json([], false);
}
