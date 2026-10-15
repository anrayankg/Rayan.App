"use client";
import { useEffect, useRef, useState } from "react";

// Бишкек по умолчанию — старт карты
const DEFAULT_CENTER = [42.8746, 74.5698];

// Грубые границы Кыргызстана — чтобы поиск не мог случайно
// улететь на похожее по названию место в другой стране
const KG_BOUNDS = { minLat: 39.0, maxLat: 43.3, minLng: 69.0, maxLng: 80.5 };

function inKyrgyzstan(pLat, pLng) {
  return pLat >= KG_BOUNDS.minLat && pLat <= KG_BOUNDS.maxLat && pLng >= KG_BOUNDS.minLng && pLng <= KG_BOUNDS.maxLng;
}

async function geocodeCandidates(query) {
  try {
    const r = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
    const data = await r.json();
    return (data && data.candidates) || [];
  } catch {
    return [];
  }
}

function firstValid(candidates) {
  return candidates.find((c) => inKyrgyzstan(c.lat, c.lng)) || null;
}

// Ищем район. Для номерных микрорайонов ("8 мкр") пробуем несколько
// формулировок запроса и проверяем, что в найденном названии реально
// встречается этот номер — иначе геосервис путает "8 мкр" с "Аламедин"
// и подобными. Для обычных (не номерных) районов ищем как есть.
async function geocodeDistrict(district, cityPart) {
  if (!district) return null;
  const m = district.match(/^(\d+)\s*мкр\.?$/i);
  if (m) {
    const num = m[1];
    const queries = [
      `${num}-й микрорайон, ${cityPart}, Киргизия`,
      `микрорайон ${num}, ${cityPart}, Киргизия`,
      `${num} микрорайон, ${cityPart}, Киргизия`,
      `${district}, ${cityPart}, Киргизия`,
    ];
    const numRe = new RegExp(`(^|\\D)${num}(\\D|$)`);
    for (const q of queries) {
      const candidates = await geocodeCandidates(q);
      const match = candidates.find((c) => inKyrgyzstan(c.lat, c.lng) && numRe.test(c.name));
      if (match) return { lat: match.lat, lng: match.lng, zoom: 15 };
    }
    return null;
  }
  const candidates = await geocodeCandidates(`${district}, ${cityPart}, Киргизия`);
  const valid = firstValid(candidates);
  return valid ? { lat: valid.lat, lng: valid.lng, zoom: 15 } : null;
}

export default function MapPicker({ label, required, lat, lng, flyToQuery, flyToCity, onChange, onAddress }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const onAddressRef = useRef(onAddress);
  onChangeRef.current = onChange;
  onAddressRef.current = onAddress;
  const [ready, setReady] = useState(false);
  const [flyStatus, setFlyStatus] = useState(null);

  // поиск адреса (как в Tamyr): печатаем — появляются подсказки — выбрали — карта переносит туда
  const [query, setQuery] = useState("");
  const [sugg, setSugg] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [addrText, setAddrText] = useState("");
  const [geoMsg, setGeoMsg] = useState("");
  const timer = useRef(null);
  const seq = useRef(0);

  function putMarker(plat, plng, zoom) {
    const L = window.L, map = mapInstance.current;
    if (!L || !map) return;
    if (markerRef.current) markerRef.current.setLatLng([plat, plng]);
    else markerRef.current = L.marker([plat, plng]).addTo(map);
    if (zoom) map.flyTo([plat, plng], zoom, { duration: 0.8 });
  }

  async function lookupAddress(plat, plng) {
    try {
      const r = await fetch(`/api/geocode?lat=${plat}&lng=${plng}`);
      const d = await r.json();
      const c = d && d.candidates && d.candidates[0];
      const text = c ? [c.label, c.sub].filter(Boolean).join(", ") : "";
      setAddrText(text);
      if (text && onAddressRef.current) onAddressRef.current(text);
    } catch { setAddrText(""); }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    function initMap() {
      const L = window.L;
      if (!mapRef.current || mapInstance.current) return;
      const start = lat && lng ? [lat, lng] : DEFAULT_CENTER;
      const map = L.map(mapRef.current).setView(start, lat && lng ? 16 : 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 19 }).addTo(map);
      if (lat && lng) markerRef.current = L.marker([lat, lng]).addTo(map);
      map.on("click", (e) => {
        const { lat: nLat, lng: nLng } = e.latlng;
        putMarker(nLat, nLng);
        onChangeRef.current(nLat, nLng);
        lookupAddress(nLat, nLng);
      });
      mapInstance.current = map;
      setReady(true);
    }
    if (window.L) initMap();
    else {
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(cssLink);
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.body.appendChild(script);
    }
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; markerRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // подсказки при вводе (с паузой, чтобы не слать запрос на каждую букву)
  function onType(v) {
    setQuery(v);
    setOpen(true);
    clearTimeout(timer.current);
    if (v.trim().length < 2) { setSugg([]); setSearching(false); return; }
    setSearching(true);
    const my = ++seq.current;
    timer.current = setTimeout(async () => {
      const list = await geocodeCandidates(v.trim());
      if (my !== seq.current) return;
      setSugg(list.slice(0, 7));
      setSearching(false);
    }, 350);
  }

  async function exactSearch() {
    const v = query.trim();
    if (v.length < 2) return;
    setSearching(true);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(v)}&exact=1`);
      const d = await r.json();
      setSugg(((d && d.candidates) || []).slice(0, 7));
    } catch { setSugg([]); }
    setSearching(false);
    setOpen(true);
  }

  function pick(c) {
    setOpen(false);
    setSugg([]);
    const text = [c.label, c.sub].filter(Boolean).join(", ");
    setQuery(c.label || text);
    setAddrText(text);
    putMarker(c.lat, c.lng, 17);
    onChangeRef.current(c.lat, c.lng);
    if (onAddressRef.current) onAddressRef.current(text);
  }

  function locateMe() {
    setGeoMsg("");
    if (!navigator.geolocation) { setGeoMsg("Телефон не даёт определить место"); return; }
    setGeoMsg("Определяем…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        putMarker(latitude, longitude, 17);
        onChangeRef.current(latitude, longitude);
        lookupAddress(latitude, longitude);
        setGeoMsg("");
      },
      () => setGeoMsg("Не удалось определить. Разрешите доступ к геопозиции в настройках браузера."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Авто-перелёт к выбранному району (как раньше)
  useEffect(() => {
    if (!mapInstance.current) return;
    if (!flyToQuery && !flyToCity) return;
    let cancelled = false;
    setFlyStatus(null);
    const cityPart = flyToCity || "Бишкек";
    (async () => {
      let result = flyToQuery ? await geocodeDistrict(flyToQuery, cityPart) : null;
      if (!result && flyToCity) {
        const candidates = await geocodeCandidates(`${flyToCity}, Киргизия`);
        const valid = firstValid(candidates);
        if (valid) result = { lat: valid.lat, lng: valid.lng, zoom: 12 };
      }
      if (cancelled) return;
      if (result) { mapInstance.current.flyTo([result.lat, result.lng], result.zoom); setFlyStatus("found"); }
      else setFlyStatus("notfound");
    })();
    return () => { cancelled = true; };
  }, [flyToQuery, flyToCity, ready]);

  return (
    <div>
      {label && (
        <div className="field-label">
          {label} {required && <span className="star">*</span>}
        </div>
      )}

      <div className="map-search">
        <div className="map-search-box">
          <span className="map-search-ico">🔍</span>
          <input
            type="search"
            enterKeyHint="search"
            value={query}
            placeholder="Найти: улица, дом, ЖК, район…"
            onChange={(e) => onType(e.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); exactSearch(); e.currentTarget.blur(); } }}
          />
          {query && <button type="button" className="map-search-x" aria-label="Очистить" onClick={() => { setQuery(""); setSugg([]); }}>✕</button>}
        </div>
        {open && query.trim().length >= 2 && (
          <div className="map-sugg">
            {searching && sugg.length === 0 && <div className="map-sugg-note">Ищем…</div>}
            {!searching && sugg.length === 0 && (
              <div className="map-sugg-note">
                Ничего не нашли. Нажмите «Найти» на клавиатуре для точного поиска или укажите точку на карте вручную.
              </div>
            )}
            {sugg.map((c, i) => (
              <button type="button" key={i} className="map-sugg-item" onClick={() => pick(c)}>
                <span className="map-sugg-pin">📍</span>
                <span className="map-sugg-text">
                  <b>{c.label || c.name}</b>
                  {c.sub && <small>{c.sub}</small>}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="map-wrap">
        <div ref={mapRef} className="map-box" />
        <button type="button" className="map-locate" onClick={locateMe}>◎ Определить адрес</button>
      </div>
      {geoMsg && <div className="map-note">{geoMsg}</div>}
      {addrText && <div className="map-addr">📍 {addrText}</div>}
      <div className="map-note">
        {lat && lng
          ? `Точка выбрана: ${lat.toFixed(5)}, ${lng.toFixed(5)}. Можно нажать на карту, чтобы поправить.`
          : flyStatus === "notfound"
          ? "Район не нашли автоматически — введите адрес в строке выше или нажмите на карту"
          : "Введите адрес в строке выше или нажмите на карту, чтобы поставить точку"}
      </div>
    </div>
  );
}
