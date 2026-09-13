"use client";
import { useRouter } from "next/navigation";

const TYPES = [
  { key: "pervichka", label: "Первичка" },
  { key: "vtorichka", label: "Вторичка" },
  { key: "dom", label: "Дом / Коттедж" },
  { key: "uchastok", label: "Участок" },
  { key: "kommerciya", label: "Коммерция" },
  { key: "arenda", label: "Аренда" },
  { key: "issykkul", label: "Иссык-Куль" },
  { key: "investicii", label: "Инвестиции" },
];

export default function AddObjectStart() {
  const router = useRouter();

  return (
    <div className="app-shell" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6F1E4" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="page-title">Добавление объекта</div>
      </div>

      <div className="steps">
        <div className="step-dot active">1</div>
        <div className="step-line" />
        <div className="step-dot">2</div>
        <div className="step-line" />
        <div className="step-dot">3</div>
        <div className="step-line" />
        <div className="step-dot">4</div>
      </div>

      <div style={{ padding: "0 20px 12px" }}>
        <div className="field-label">ВЫБЕРИТЕ ТИП НЕДВИЖИМОСТИ</div>
      </div>

      <div className="type-list">
        {TYPES.map((t) => (
          <div key={t.key} className="type-row" onClick={() => router.push(`/add/${t.key}`)}>
            <span>{t.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F3D477" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        ))}
      </div>

      <div style={{ margin: "20px 20px 0", textAlign: "center", color: "#7FA396", fontSize: 12 }}>
        Готовы формы «Вторичка» и «Первичка» — остальные достраиваются по очереди.
      </div>
    </div>
  );
}
