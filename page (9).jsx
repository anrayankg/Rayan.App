"use client";
import { useRouter } from "next/navigation";

// Заглушка раздела "Реклама" (см. RAYAN_FUTURE_INTEGRATIONS.md, Этап 5 в ROADMAP.md).
// Кнопки, которые сюда ведут (нижнее меню и статус-бейдж на карточке объекта),
// уже есть и никуда не денутся — сам раздел с площадками появится позже.
export default function AdsPage() {
  const router = useRouter();
  return (
    <div style={{
      maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#fff", textAlign: "center",
    }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Раздел в разработке</div>
      <div style={{ fontSize: 13.5, color: "#8B8B90", lineHeight: 1.5, maxWidth: 320 }}>
        Здесь появится центр рекламы — площадки, статус объявлений по каждому объекту
        и кнопка «Запустить рекламу».
      </div>
      <button
        onClick={() => router.back()}
        style={{ marginTop: 24, background: "none", border: "1px solid rgba(255,255,255,0.15)",
          color: "#fff", borderRadius: "var(--r)", padding: "10px 20px", fontSize: 14, fontWeight: 700 }}
      >
        Назад
      </button>
    </div>
  );
}
