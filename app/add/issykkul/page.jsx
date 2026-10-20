"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IK_KINDS } from "../../../lib/issykkul";
import BottomNav from "../../../components/BottomNav";

// Иссык-Куль: сначала что делаем (продажа / аренда), потом что за объект.
// Продажа — готовые формы по виду недвижимости; аренда — форма «Аренда». Везде общий выбор «Город / село» и блок про озеро.
export default function IssykKulStart() {
  const router = useRouter();
  const [deal, setDeal] = useState("sale");
  return (
    <div className="ik-page">
      <button className="ag-back" onClick={() => router.push("/add")}>‹</button>
      <div className="ag-title">Иссык-Куль</div>

      <div className="ag-section">1. Что делаем с объектом</div>
      <div className="fl-contract" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <button className={deal === "sale" ? "on" : ""} onClick={() => setDeal("sale")}>Продажа</button>
        <button className={deal === "rent" ? "on" : ""} onClick={() => setDeal("rent")}>Аренда</button>
      </div>
      <div className="fl-contract" style={{ gridTemplateColumns: "1fr", marginTop: 8 }}>
        <button className={deal === "invest" ? "on" : ""} onClick={() => setDeal("invest")}>Инвестиции</button>
      </div>

      {deal === "invest" ? (
        <>
          <div className="ag-section">2. Инвестиции</div>
          <button className="ik-kind" onClick={() => router.push("/add/investicii?region=issykkul")}>
            <span><b>Инвестиционный проект</b><small>предложение для инвесторов или поиск инвестора</small></span>
            <span className="ik-arrow">›</span>
          </button>
        </>
      ) : deal === "sale" ? (
        <>
          <div className="ag-section">2. Что продаём</div>
          {IK_KINDS.filter((k) => k.key !== "investicii").map((k) => (
            <button key={k.key} className="ik-kind" onClick={() => router.push(`/add/${k.key}?region=issykkul`)}>
              <span><b>{k.label}</b><small>{k.note}</small></span>
              <span className="ik-arrow">›</span>
            </button>
          ))}
        </>
      ) : (
        <>
          <div className="ag-section">2. Аренда</div>
          <button className="ik-kind" onClick={() => router.push("/add/arenda?region=issykkul")}>
            <span><b>Сдать в аренду</b><small>квартира, дом, гостевой дом, коммерческий объект, участок; посуточно, сезонно, долгосрочно</small></span>
            <span className="ik-arrow">›</span>
          </button>
        </>
      )}
      <BottomNav active="Добавить объект" />
    </div>
  );
}
