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

export default function MapPicker({ label, required, lat, lng, flyToQuery, flyToCity, onChange }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    function initMap() {
      const L = window.L;
      if (!mapRef.current || mapInstance.current) return;

      const start = lat && lng ? [lat, lng] : DEFAULT_CENTER;
      const map = L.map(mapRef.current).setView(start, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      if (lat && lng) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      map.on("click", (e) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          markerRef.current = L.marker([newLat, newLng]).addTo(map);
        }
        onChange(newLat, newLng);
      });

      mapInstance.current = map;
      setReady(true);
    }

    if (window.L) {
      initMap();
    } else {
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(cssLink);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.body.appendChild(script);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [flyStatus, setFlyStatus] = useState(null);

  // Авто-перелёт карты к нужному району при выборе — сначала пробуем район
  // (с несколькими формулировками для номерных микрорайонов), если не
  // нашли ничего подтверждённого — хотя бы до уровня города.
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
      if (result) {
        mapInstance.current.flyTo([result.lat, result.lng], result.zoom);
        setFlyStatus("found");
      } else {
        setFlyStatus("notfound");
      }
    })();
    return () => { cancelled = true; };
  }, [flyToQuery, flyToCity]);

  return (
    <div>
      {label && (
        <div className="field-label">
          {label} {required && <span className="star">*</span>}
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          width: "100%", height: 220, borderRadius: "var(--r)", overflow: "hidden",
          border: "1px solid rgba(212,164,55,0.3)", background: "#0A4A38",
        }}
      />
      <div style={{ color: "#7FA396", fontSize: 10.5, marginTop: 6 }}>
        {lat && lng
          ? `Точка выбрана: ${lat.toFixed(5)}, ${lng.toFixed(5)}`
          : flyStatus === "notfound"
          ? "Не нашли автоматически — найдите место на карте и тапните по нему"
          : "Найдите нужное место на карте и тапните по нему, чтобы поставить точку"}
      </div>
    </div>
  );
}
