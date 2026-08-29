"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const DOC_OPTIONS = ["Техпаспорт", "ДКП", "Красная книга", "Зелёная книга"];
const ROOM_TYPES = ["Студия", "1", "2", "3", "4", "5+"];
const HEATING_OPTS = ["Центральное", "Электро-конвекторы", "Электро-паровое", "Газовый котёл", "Газовая котельная", "Другое"];
const DEAL_TERMS_OPTS = ["Наличные", "Ипотека", "Рассрочка от Госрегистра", "Обмен"];

function Accordion({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="accordion">
      <div className="accordion-head" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F3D477" strokeWidth="2"
          style={{ transform: open ? "rotate(180deg)" : "none" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {open && <div className="accordion-body">{children}</div>}
    </div>
  );
}

function MiniField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div className="mini-field-label">{label}</div>
      <input className="field-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || ""} />
    </div>
  );
}

export default function VtorichkaForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [district, setDistrict] = useState("");
  const [roomType, setRoomType] = useState("");
  const [series, setSeries] = useState("");
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [floorsTotal, setFloorsTotal] = useState("");
  const [docs, setDocs] = useState([]);
  const [heating, setHeating] = useState("");
  const [gas, setGas] = useState(null);
  const [water, setWater] = useState(null);
  const [electricity, setElectricity] = useState(null);
  const [sewerage, setSewerage] = useState(null);
  const [price, setPrice] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [commissionTerms, setCommissionTerms] = useState("");
  const [vRuki, setVRuki] = useState("");
  const [dealTerms, setDealTerms] = useState("");

  const [zhk, setZhk] = useState("");
  const [sk, setSk] = useState("");
  const [description, setDescription] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [contractStatus, setContractStatus] = useState("без договора");

  const [extra, setExtra] = useState({});
  const setEx = (key) => (val) => setExtra((p) => ({ ...p, [key]: val }));

  function toggleDoc(d) {
    setDocs((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  const canSubmit =
    district && roomType && series && area && floor && floorsTotal &&
    docs.length > 0 && heating && gas !== null && water !== null &&
    electricity !== null && sewerage !== null && price && ownerPhone &&
    commissionPercent && commissionTerms && vRuki && dealTerms;

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
          room_type: roomType,
          rooms: roomType,
          series,
          area_m2: Number(area),
          floor: Number(floor),
          floors_total: Number(floorsTotal),
          zhk,
          sk,
          documents: docs,
          heating,
          gas, water, electricity, sewerage,
          deal_terms: dealTerms,
          commission_percent: commissionPercent,
          commission_terms: commissionTerms,
          description,
          contract_status: contractStatus,
          extra_details: extra,
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
        commission: `${commissionPercent} (${commissionTerms})`,
        v_ruki: vRuki ? Number(vRuki) : null,
        deal_terms: vRuki ? `В руки: ${vRuki}$` : "",
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
        <div className="step-dot done">1</div><div className="step-line" />
        <div className="step-dot active">2</div><div className="step-line" />
        <div className="step-dot">3</div><div className="step-line" />
        <div className="step-dot">4</div>
      </div>

      <div className="section-divider"><div className="section-divider-title">Обязательные поля</div></div>

      <div className="field-group">
        <div className="field-label">Район <span className="star">*</span></div>
        <input className="field-input" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Например: Асанбай" />
      </div>

      <div className="field-group">
        <div className="field-label">Комнатность <span className="star">*</span></div>
        <div className="chip-group">
          {ROOM_TYPES.map((r) => (
            <div key={r} className={`chip ${roomType === r ? "selected" : ""}`} onClick={() => setRoomType(r)}>{r}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Серия дома <span className="star">*</span></div>
        <input className="field-input" value={series} onChange={(e) => setSeries(e.target.value)} placeholder="105 серия, индивидуалка и т.д." />
      </div>

      <div className="field-group">
        <div className="field-row">
          <div>
            <div className="field-label">Площадь, м² <span className="star">*</span></div>
            <input className="field-input" type="number" value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div>
            <div className="field-label">Этаж <span className="star">*</span></div>
            <input className="field-input" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
          </div>
          <div>
            <div className="field-label">Этажность <span className="star">*</span></div>
            <input className="field-input" type="number" value={floorsTotal} onChange={(e) => setFloorsTotal(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Документы <span className="star">*</span></div>
        <div className="chip-group">
          {DOC_OPTIONS.map((d) => (
            <div key={d} className={`chip ${docs.includes(d) ? "selected" : ""}`} onClick={() => toggleDoc(d)}>{d}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Отопление <span className="star">*</span></div>
        <div className="chip-group">
          {HEATING_OPTS.map((h) => (
            <div key={h} className={`chip ${heating === h ? "selected" : ""}`} onClick={() => setHeating(h)}>{h}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Коммуникации <span className="star">*</span></div>
        <div className="chip-group">
          {[["Газ", gas, setGas], ["Вода", water, setWater], ["Электричество", electricity, setElectricity], ["Канализация", sewerage, setSewerage]].map(([label, val, setter]) => (
            <div key={label} className={`chip ${val === true ? "selected" : ""}`} onClick={() => setter(val === true ? false : true)}>
              {label}: {val === null ? "?" : val ? "да" : "нет"}
            </div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Цена, $ <span className="star">*</span></div>
        <input className="field-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Общая стоимость, не за м²" />
      </div>

      <div className="field-group">
        <div className="field-label">Условия сделки <span className="star">*</span></div>
        <div className="chip-group">
          {DEAL_TERMS_OPTS.map((d) => (
            <div key={d} className={`chip ${dealTerms === d ? "selected" : ""}`} onClick={() => setDealTerms(d)}>{d}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-row">
          <div>
            <div className="field-label">Комиссия, % / сумма <span className="star">*</span></div>
            <input className="field-input" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} placeholder="3% или $500" />
          </div>
          <div>
            <div className="field-label">Условия комиссии <span className="star">*</span></div>
            <input className="field-input" value={commissionTerms} onChange={(e) => setCommissionTerms(e.target.value)} placeholder="50/50, 100% и т.д." />
          </div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Цена в руки, $ <span className="star">*</span></div>
        <input className="field-input" type="number" value={vRuki} onChange={(e) => setVRuki(e.target.value)} />
      </div>

      <div className="field-group">
        <div className="field-label">Телефон собственника <span className="star">*</span></div>
        <input className="field-input" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+996..." />
      </div>

      <div className="section-divider"><div className="section-divider-title">Дополнительно (не обязательно)</div></div>
      <div className="field-group">
        <div className="field-row">
          <div><div className="field-label">СК</div><input className="field-input" value={sk} onChange={(e) => setSk(e.target.value)} /></div>
          <div><div className="field-label">ЖК</div><input className="field-input" value={zhk} onChange={(e) => setZhk(e.target.value)} /></div>
        </div>
      </div>
      <div className="field-group">
        <div className="field-label">Описание для клиента</div>
        <textarea className="field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опишите объект своими словами..." />
        <button className="ai-btn" type="button" disabled>✨ Сформировать описание с ИИ (следующий этап)</button>
      </div>

      <div className="photo-drop">📷 Загрузка фото/видео — следующий этап</div>

      <div className="section-divider"><div className="section-divider-title">Полный бриф — остальные детали</div></div>

      <Accordion title="ДОМ И ТЕРРИТОРИЯ">
        <MiniField label="Планировка (сквозная/в линейку)" value={extra.planirovka || ""} onChange={setEx("planirovka")} />
        <MiniField label="Балкон/лоджия, количество" value={extra.balkon || ""} onChange={setEx("balkon")} />
        <MiniField label="Технический этаж (если последний)" value={extra.tehEtazh || ""} onChange={setEx("tehEtazh")} />
        <MiniField label="Высота потолков" value={extra.potolki || ""} onChange={setEx("potolki")} />
        <MiniField label="Лифт (производитель, работает ли)" value={extra.lift || ""} onChange={setEx("lift")} />
        <MiniField label="Расположение окон" value={extra.okna || ""} onChange={setEx("okna")} />
        <MiniField label="Материал / состояние фасада" value={extra.fasad || ""} onChange={setEx("fasad")} />
        <MiniField label="Состояние подъезда / двора" value={extra.podjezd || ""} onChange={setEx("podjezd")} />
        <MiniField label="Двор закрытый/охраняемый" value={extra.dvor || ""} onChange={setEx("dvor")} />
        <MiniField label="Детская площадка" value={extra.detskaya || ""} onChange={setEx("detskaya")} />
      </Accordion>

      <Accordion title="ДОКУМЕНТЫ — ПОДРОБНО">
        <MiniField label="Правоустанавливающие документы" value={extra.pravoust || ""} onChange={setEx("pravoust")} />
        <MiniField label="Арест / залог / обременения" value={extra.obremeneniya || ""} onChange={setEx("obremeneniya")} />
        <MiniField label="Проверка Госрегистра" value={extra.gosregistr || ""} onChange={setEx("gosregistr")} />
        <MiniField label="Соответствие площади документам" value={extra.ploshadSootv || ""} onChange={setEx("ploshadSootv")} />
        <MiniField label="Перепланировка" value={extra.pereplanirovka || ""} onChange={setEx("pereplanirovka")} />
      </Accordion>

      <Accordion title="КВАРТИРА">
        <MiniField label="Ремонт (тип + год)" value={extra.remont || ""} onChange={setEx("remont")} />
        <MiniField label="Мебель / что остаётся" value={extra.mebel || ""} onChange={setEx("mebel")} />
        <MiniField label="Техника / что остаётся" value={extra.tehnika || ""} onChange={setEx("tehnika")} />
        <MiniField label="Вид из окон" value={extra.vidOkna || ""} onChange={setEx("vidOkna")} />
        <MiniField label="Состояние окон" value={extra.sostOkna || ""} onChange={setEx("sostOkna")} />
        <MiniField label="Кол-во квартир на этаже" value={extra.kvNaEtazhe || ""} onChange={setEx("kvNaEtazhe")} />
      </Accordion>

      <Accordion title="ИНФРАСТРУКТУРА">
        <MiniField label="Магазины / школы / сады / остановки рядом" value={extra.infra || ""} onChange={setEx("infra")} />
      </Accordion>

      <Accordion title="ПОКАЗ">
        <MiniField label="Время показа" value={extra.vremyaPokaza || ""} onChange={setEx("vremyaPokaza")} />
        <MiniField label="Кто показывает" value={extra.ktoPokazyvaet || ""} onChange={setEx("ktoPokazyvaet")} />
        <MiniField label="Телефон показывающего" value={extra.telPokazyvayushego || ""} onChange={setEx("telPokazyvayushego")} />
      </Accordion>

      <div className="section-divider private">
        <div className="section-divider-title">Информация для агента</div>
        <span className="lock-badge">🔒 ТОЛЬКО ДЛЯ ВАС</span>
      </div>
      <div className="field-group">
        <div className="field-row">
          <div><div className="field-label">ФИО собственника</div><input className="field-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} /></div>
          <div><div className="field-label">Ваш телефон (агент)</div><input className="field-input" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} /></div>
        </div>
      </div>
      <div className="field-group">
        <div className="field-label">Точный адрес</div>
        <input className="field-input" value={exactAddress} onChange={(e) => setExactAddress(e.target.value)} />
      </div>

      <div className="section-divider private"><div className="section-divider-title">Договор</div></div>
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
      <div className="progress-note">Поля со звёздочкой * обязательны, остальное можно дозаполнить позже</div>
    </div>
  );
}
