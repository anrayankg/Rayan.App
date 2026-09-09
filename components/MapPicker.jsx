"use client";
import { useEffect, useRef, useState } from "react";

// Бишкек по умолчанию — старт карты
const DEFAULT_CENTER = [42.8746, 74.5698];

export default function MapPicker({ label, required, lat, lng, onChange }) {
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
          width: "100%", height: 220, borderRadius: 14, overflow: "hidden",
          border: "1px solid rgba(212,164,55,0.3)", background: "#0A4A38",
        }}
      />
      <div style={{ color: "#7FA396", fontSize: 10.5, marginTop: 6 }}>
        {lat && lng ? `Точка выбрана: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : "Найдите нужное место на карте и тапните по нему, чтобы поставить точку"}
      </div>
    </div>
  );
}
