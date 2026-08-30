"use client";
import { useRouter, useParams } from "next/navigation";

const LABELS = {
  pervichka: "Первичка",
  vtorichka: "Вторичка",
  dom: "Дом",
  uchastok: "Участок",
  kommerciya: "Коммерция",
  arenda: "Аренда",
  investicii: "Инвестиции",
  issykkul: "Иссык-Куль",
};

export default function SearchByType() {
  const router = useRouter();
  const params = useParams();
  const label = LABELS[params.type] || "Объекты";

  return (
    <div className="app-shell" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6F1E4" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="page-title">{label} — поиск</div>
      </div>

      <div style={{ margin: "60px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 34, marginBottom: 14 }}>🔎</div>
        <div style={{ color: "#F3D477", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, marginBottom: 10 }}>
          Функция находится в разработке
        </div>
        <div style={{ color: "#9FC2B2", fontSize: 13, lineHeight: 1.5 }}>
          Поиск готовых объектов по разделу «{label}» будет доступен в следующем обновлении.
        </div>
      </div>

      <button
        className="next-btn"
        onClick={() => router.push(`/add/${params.type}`)}
      >
        ДОБАВИТЬ ОБЪЕКТ ЭТОГО ТИПА
      </button>
    </div>
  );
}
