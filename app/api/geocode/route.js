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


// «село Лесное, Чуйская обл.» → «Лесное»: убираем слова, которые мешают поиску по карте
const STOP = /(^|\s)(село|сел|с|пгт|поселок|посёлок|пос|город|г|область|обл|район|р-н|ул|улица|микрорайон|мкр)(?=\s|$)/gi;
const REGION = /(^|\s)(чуйская|чуйской|чуйский|чуй|иссык-кульская|ысык-кульская|нарынская|таласская|ошская|джалал-абадская|жалал-абадская|баткенская)(?=\s|$)/gi;
function variants(q) {
  const base = q.replace(/[.,;()]/g, " ").replace(/\s+/g, " ").trim();
  const noStop = base.replace(STOP, " ").replace(/\s+/g, " ").trim();
  const noRegion = noStop.replace(REGION, " ").replace(/\s+/g, " ").trim();
  const list = [q.trim(), base, noStop, noRegion];
  if (noRegion) list.push(noRegion + " Кыргызстан");
  return [...new Set(list.filter((x) => x && x.length >= 2))];
}

const IK = { minLon: 75.7, minLat: 41.0, maxLon: 80.5, maxLat: 43.3 };
const inIk = (lat, lng) => lat >= IK.minLat && lat <= IK.maxLat && lng >= IK.minLon && lng <= IK.maxLon;
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

  // ===== Иссык-Куль: только города и сёла области =====
  if (sp.get("region") === "issykkul") {
    const ik = variants(q);
    const only = (c) => c.filter((x) => inIk(x.lat, x.lng));
    for (const v of ik.slice(0, 3)) {
      try {
        const d = await get(`${PHOTON}/api/?q=${encodeURIComponent(v)}&limit=10&osm_tag=place&lat=42.5&lon=77.2&bbox=${IK.minLon},${IK.minLat},${IK.maxLon},${IK.maxLat}`);
        const c = only(fromPhoton(d)); if (c.length) return json(c.slice(0, 7), true);
      } catch {}
    }
    for (const v of ik.slice(0, 3)) {
      try {
        const d = await get(`https://nominatim.openstreetmap.org/search?format=json&limit=8&countrycodes=kg&bounded=1&viewbox=${IK.minLon},${IK.maxLat},${IK.maxLon},${IK.minLat}&q=${encodeURIComponent(v)}`, { "Accept-Language": "ru" });
        const c = only(fromNominatim(d)); if (c.length) return json(c.slice(0, 7), true);
      } catch {}
    }
    return json([], false);
  }

  // ===== поиск по тексту =====
  const vs = variants(q);
  try {
    if (DGIS_KEY) {
      for (const v of vs.slice(0, 3)) {
        const d = await get(`https://catalog.api.2gis.com/3.0/items/geocode?q=${encodeURIComponent(v)}&location=${BISHKEK.lon},${BISHKEK.lat}&fields=items.point,items.full_name&page_size=7&key=${DGIS_KEY}`);
        const c = fromDgis(d); if (c.length) return json(c, true);
      }
    }
  } catch {}

  if (!exact) {
    // подсказки при вводе: сначала как написано, потом без лишних слов («село», «обл.», «район»…)
    for (const v of vs.slice(0, 3)) {
      try {
        const d = await get(`${PHOTON}/api/?q=${encodeURIComponent(v)}&limit=7&lat=${BISHKEK.lat}&lon=${BISHKEK.lon}&bbox=${KG.minLon},${KG.minLat},${KG.maxLon},${KG.maxLat}`);
        const c = fromPhoton(d); if (c.length) return json(c, true);
      } catch {}
    }
    // сёла и посёлки: ищем только среди населённых пунктов
    try {
      const d = await get(`${PHOTON}/api/?q=${encodeURIComponent(vs[vs.length > 2 ? 2 : 0])}&limit=7&osm_tag=place&bbox=${KG.minLon},${KG.minLat},${KG.maxLon},${KG.maxLat}`);
      const c = fromPhoton(d); if (c.length) return json(c, true);
    } catch {}
  }

  for (const v of vs.slice(0, 4)) {
    try {
      const d = await get(
        `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=kg&viewbox=${KG.minLon},${KG.maxLat},${KG.maxLon},${KG.minLat}&q=${encodeURIComponent(v)}`,
        { "Accept-Language": "ru" }
      );
      const c = fromNominatim(d); if (c.length) return json(c, true);
    } catch {}
  }
  return json([], false);
}
