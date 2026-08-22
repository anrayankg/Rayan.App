"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const DOC_OPTIONS = ["Техпаспорт", "ДКП", "Красная книга", "Зелёная книга"];

export default function VtorichkaForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [rooms, setRooms] = useState("");
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [floorsTotal, setFloorsTotal] = useState("");
  const [price, setPrice] = useState("");
  const [zhk, setZhk] = useState("");
  const [sk, setSk] = useState("");
  const [docs, setDocs] = useState([]);
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");

  // приватный блок — только для агента/руководителя
  const [ownerName, setOwnerName] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [vRuki, setVRuki] = useState("");
  const [commission, setCommission] = useState("");

  const [contractStatus, setContractStatus] = useState("без договора");

  function toggleDoc(d) {
    setDocs((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  const canSubmit = rooms && area && price && ownerPhone;

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const { data: listing, error: e1 } = await supabase
        .from("listings")
        .insert({
          type: "вторичка",
          status: "на проверке",
          price: Number(price),
          currency: "$",
          district,
          rooms,
          area_m2: Number(area),
          floor: floor ? Number(floor) : null,
          floors_total: floorsTotal ? Number(floorsTotal) : null,
          zhk,
          sk,
          documents: docs,
          description,
          contract_status: contractStatus,
        })
        .select()
        .single();

      if (e1) throw e1;

      const { error: e2 } = await supabase.from("listing_contacts").insert({
        listing_id: listing.id,
        source_type: "собственник",
        owner_name: ownerName,
        owner_phone: ownerPhone,
        agent_contact_phone: agentPhone,
        exact_address: exactAddress,
        commission: commission,
        deal_terms: vRuki ? `В руки: ${vRuki}` : "",
      });
      if (e2) throw e2;

      setSuccess(true);
      setTimeout(() => router.push("/"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6F1E4" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="page-title">Вторичка</div>
      </div>

      <div className="steps">
        <div className="step-dot done">1</div>
        <div className="step-line" />
        <div className="step-dot active">2</div>
        <div className="step-line" />
        <div className="step-dot">3</div>
        <div className="step-line" />
        <div className="step-dot">4</div>
      </div>

      {/* ПУБЛИЧНАЯ ИНФОРМАЦИЯ */}
      <div className="section-divider">
        <div className="section-divider-title">Публичная информация</div>
      </div>

      <div className="field-group">
        <div className="field-label">Комнаты <span className="req">*</span></div>
        <div className="chip-group">
          {["Студия", "1", "2", "3", "4", "5+"].map((r) => (
            <div key={r} className={`chip ${rooms === r ? "selected" : ""}`} onClick={() => setRooms(r)}>{r}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-row">
          <div>
            <div className="field-label">Площадь, м² <span className="req">*</span></div>
            <input className="field-input" type="number" value={area} onChange={(e) => setArea(e.target.value)} placeholder="65" />
          </div>
          <div>
            <div className="field-label">Этаж / этажность</div>
            <div className="field-row">
              <input className="field-input" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} placeholder="4" />
              <input className="field-input" type="number" value={floorsTotal} onChange={(e) => setFloorsTotal(e.target.value)} placeholder="9" />
            </div>
          </div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Цена, $ <span className="req">*</span></div>
        <input className="field-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Общая стоимость, не за м²" />
      </div>

      <div className="field-group">
        <div className="field-row">
          <div>
            <div className="field-label">СК</div>
            <input className="field-input" value={sk} onChange={(e) => setSk(e.target.value)} placeholder="Застройщик" />
          </div>
          <div>
            <div className="field-label">ЖК</div>
            <input className="field-input" value={zhk} onChange={(e) => setZhk(e.target.value)} placeholder="Название комплекса" />
          </div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Район</div>
        <input className="field-input" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Например: Асанбай" />
      </div>

      <div className="field-group">
        <div className="field-label">Документы</div>
        <div className="chip-group">
          {DOC_OPTIONS.map((d) => (
            <div key={d} className={`chip ${docs.includes(d) ? "selected" : ""}`} onClick={() => toggleDoc(d)}>{d}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Описание для клиента</div>
        <textarea className="field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опишите объект своими словами..." />
        <button className="ai-btn" type="button" disabled>
          ✨ Сформировать описание с ИИ (подключим на следующем этапе)
        </button>
      </div>

      <div className="photo-drop">📷 Загрузка фото/видео — появится на следующем этапе</div>

      {/* ИНФОРМАЦИЯ ДЛЯ АГЕНТА — приватный блок */}
      <div className="section-divider private">
        <div className="section-divider-title">Информация для агента</div>
        <span className="lock-badge">🔒 ТОЛЬКО ДЛЯ ВАС</span>
      </div>

      <div className="field-group">
        <div className="field-row">
          <div>
            <div className="field-label">ФИО собственника</div>
            <input className="field-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Имя" />
          </div>
          <div>
            <div className="field-label">Телефон собственника <span className="req">*</span></div>
            <input className="field-input" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+996..." />
          </div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Ваш телефон (агент)</div>
        <input className="field-input" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} placeholder="+996..." />
      </div>

      <div className="field-group">
        <div className="field-label">Точный адрес</div>
        <input className="field-input" value={exactAddress} onChange={(e) => setExactAddress(e.target.value)} placeholder="Улица, дом" />
      </div>

      <div className="field-group">
        <div className="field-row">
          <div>
            <div className="field-label">В руки, $</div>
            <input className="field-input" value={vRuki} onChange={(e) => setVRuki(e.target.value)} placeholder="Сумма собственнику" />
          </div>
          <div>
            <div className="field-label">Комиссия</div>
            <input className="field-input" value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="% или сумма" />
          </div>
        </div>
      </div>

      {/* ДОГОВОР */}
      <div className="section-divider private">
        <div className="section-divider-title">Договор</div>
      </div>
      <div className="field-group">
        <div className="chip-group">
          {["без договора", "с договором"].map((s) => (
            <div key={s} className={`chip ${contractStatus === s ? "selected" : ""}`} onClick={() => setContractStatus(s)}>
              {s === "без договора" ? "Без договора" : "С договором"}
            </div>
          ))}
        </div>
      </div>

      {error && <div className="status-msg error">Ошибка: {error}</div>}
      {success && <div className="status-msg success">Объект сохранён! Возвращаемся на главную...</div>}

      <button className="next-btn" disabled={!canSubmit || saving} onClick={handleSubmit}>
        {saving ? "СОХРАНЕНИЕ..." : "ОТПРАВИТЬ НА ПРОВЕРКУ"}
      </button>
      <div className="progress-note">Поля со звёздочкой * обязательны</div>
    </div>
  );
}
