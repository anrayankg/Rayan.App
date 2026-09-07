"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { ALL_LOCATIONS } from "../../../lib/locations";
import LocationPicker from "../../../components/LocationPicker";


const ROOM_TYPES = [
  "Гостинка", "1-комн. студия", "1-комн. полноценная",
  "2-комн. студия", "2-комн. полноценная",
  "3-комн. студия", "3-комн. полноценная",
  "4-комн. студия", "4-комн. полноценная",
  "5-комнатная", "6+",
];

const SERIES_OPTIONS = [
  "Сталинка", "Хрущёвка", "Общежитие", "Малосемейка", "Гостиничного типа",
  "104 серия", "105 серия", "106 серия", "106 серии улучшенной", "107 серия", "108 серия",
  "Индивидуалка", "Элитка", "Другое",
];

const DOC_OPTIONS = [
  "Техпаспорт", "ДКП", "Красная книга", "Зелёная книга (частная собственность)",
  "Зелёная книга (аренда)", "Свидетельство о наследстве", "Договор мены",
  "ДДУ", "ПДКП", "Генеральная доверенность", "Акт ввода в эксплуатацию",
];

const HEATING_OPTS = [
  "Центральное (ТЭЦ)", "Автономная газовая котельная", "Автономная электрическая котельная",
  "Индивидуальный газовый котёл", "Индивидуальное электрическое отопление",
  "Комбинированное", "Угольное", "Другое",
];

const DEAL_TERMS_OPTS = ["Наличные", "Ипотека", "Рассрочка через Госрегистр", "Обмен"];

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
function MiniField({ label, value, onChange }) {
  return (
    <div>
      <div className="mini-field-label">{label}</div>
      <input className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function MiniChips({ label, options, value, onChange }) {
  return (
    <div>
      <div className="mini-field-label">{label}</div>
      <div className="chip-group">
        {options.map((o) => (
          <div key={o} className={`chip ${value === o ? "selected" : ""}`} onClick={() => onChange(o)}>{o}</div>
        ))}
      </div>
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
  const [torg, setTorg] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [commissionTerms, setCommissionTerms] = useState("");
  const [vRuki, setVRuki] = useState("");
  const [dealTerms, setDealTerms] = useState([]); // теперь массив — множественный выбор

  const [zhk, setZhk] = useState("");
  const [sk, setSk] = useState("");
  const [description, setDescription] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");

  // временное решение: запоминаем имя/телефон агента в этом браузере,
  // чтобы не вводить заново каждый раз (полноценный вход в аккаунт — следующий этап)
  useEffect(() => {
    const savedName = localStorage.getItem("rayan_agent_name");
    const savedPhone = localStorage.getItem("rayan_agent_phone");
    if (savedName) setAgentName(savedName);
    if (savedPhone) setAgentPhone(savedPhone);
  }, []); // теперь ПУБЛИЧНОЕ поле
  const [exactAddress, setExactAddress] = useState("");
  const [agentComment, setAgentComment] = useState("");
  const [contractStatus, setContractStatus] = useState("без договора");

  const [extra, setExtra] = useState({});
  const setEx = (key) => (val) => setExtra((p) => ({ ...p, [key]: val }));

  function toggle(setFn, arr, val) {
    setFn(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const canSubmit =
    district && roomType && series && area && floor && floorsTotal &&
    docs.length > 0 && heating && gas !== null && water !== null &&
    electricity !== null && sewerage !== null && price && ownerPhone &&
    agentPhone && commissionPercent && commissionTerms && vRuki && dealTerms.length > 0;

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const { data: listing, error: e1 } = await supabase
        .from("listings")
        .insert({
          type: "вторичка",
          status: "новый объект от собственника",
          price: Number(price),
          currency_new: currency,
          district,
          room_type: roomType,
          rooms: roomType,
          series,
          area_m2: Number(area),
          floor: Number(floor),
          floors_total: Number(floorsTotal),
          zhk, sk,
          documents: docs,
          heating,
          gas, water, electricity, sewerage,
          deal_terms: dealTerms.join(", "),
          torg,
          description,
          contract_status: contractStatus,
          extra_details: extra,
          agent_phone: agentPhone,
          agent_name: agentName,
        })
        .select()
        .single();

      if (e1) throw e1;

      const { error: e2 } = await supabase.from("listing_contacts").insert({
        listing_id: listing.id,
        source_type: "собственник",
        owner_name: ownerName,
        owner_phone: ownerPhone,
        exact_address: exactAddress,
        commission_percent: commissionPercent,
        commission_terms: commissionTerms,
        commission: `${commissionPercent} (${commissionTerms})`,
        v_ruki: vRuki ? Number(vRuki) : null,
        agent_notes: agentComment,
      });
      if (e2) throw e2;

      localStorage.setItem("rayan_agent_name", agentName);
      localStorage.setItem("rayan_agent_phone", agentPhone);

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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6F1E4" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
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
        <LocationPicker
          label="Район"
          required
          options={ALL_LOCATIONS}
          value={district}
          onChange={setDistrict}
        />
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
        <div className="chip-group">
          {SERIES_OPTIONS.map((s) => (
            <div key={s} className={`chip ${series === s ? "selected" : ""}`} onClick={() => setSeries(s)}>{s}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-row">
          <div><div className="field-label">Площадь, м² <span className="star">*</span></div>
            <input className="field-input" type="number" value={area} onChange={(e) => setArea(e.target.value)} /></div>
          <div><div className="field-label">Этаж <span className="star">*</span></div>
            <input className="field-input" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} /></div>
          <div><div className="field-label">Этажность <span className="star">*</span></div>
            <input className="field-input" type="number" value={floorsTotal} onChange={(e) => setFloorsTotal(e.target.value)} /></div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Документы (можно несколько) <span className="star">*</span></div>
        <div className="chip-group">
          {DOC_OPTIONS.map((d) => (
            <div key={d} className={`chip ${docs.includes(d) ? "selected" : ""}`} onClick={() => toggle(setDocs, docs, d)}>{d}</div>
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
        <div className="field-label">Цена <span className="star">*</span></div>
        <input className="field-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Общая стоимость, не за м²" />
        <div className="currency-toggle">
          {["USD", "KGS"].map((c) => (
            <div key={c} className={`currency-btn ${currency === c ? "selected" : ""}`} onClick={() => setCurrency(c)}>{c === "USD" ? "$ USD" : "KGS сом"}</div>
          ))}
        </div>
        <div style={{ marginTop: 10 }} className="chip-group">
          <div className={`chip ${torg ? "selected" : ""}`} onClick={() => setTorg(!torg)}>Торг возможен</div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Условия сделки (можно несколько) <span className="star">*</span></div>
        <div className="chip-group">
          {DEAL_TERMS_OPTS.map((d) => (
            <div key={d} className={`chip ${dealTerms.includes(d) ? "selected" : ""}`} onClick={() => toggle(setDealTerms, dealTerms, d)}>{d}</div>
          ))}
        </div>
      </div>

      <div className="section-divider">
        <div className="section-divider-title">Контакт агента</div>
        <span className="lock-badge" style={{ color: "#baf5d0", background: "rgba(20,120,80,0.15)", borderColor: "rgba(100,220,150,0.3)" }}>👁 ВИДЕН ВСЕМ</span>
      </div>
      <div className="field-group">
        <div className="field-row">
          <div><div className="field-label">Имя агента <span className="star">*</span></div>
            <input className="field-input" value={agentName} onChange={(e) => setAgentName(e.target.value)} /></div>
          <div><div className="field-label">Телефон агента <span className="star">*</span></div>
            <input className="field-input" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} placeholder="+996..." /></div>
        </div>
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
        <textarea className="field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="ai-btn" type="button" disabled>✨ Сформировать описание с ИИ (следующий этап)</button>
      </div>

      <div className="photo-drop">📷 Загрузка фото/видео — следующий этап</div>

      <div className="section-divider"><div className="section-divider-title">Полный бриф — остальные детали</div></div>
      <Accordion title="ДОМ И ТЕРРИТОРИЯ" defaultOpen={true}>
        <MiniChips label="Планировка" options={["Сквозная", "В линейку"]} value={extra.planirovka || ""} onChange={setEx("planirovka")} />
        <MiniField label="Балкон/лоджия, количество" value={extra.balkon || ""} onChange={setEx("balkon")} />
        <MiniField label="Лифт (производитель, работает ли)" value={extra.lift || ""} onChange={setEx("lift")} />
        <MiniChips label="Расположение окон" options={["Север", "Юг", "Запад", "Восток", "Комбинированное"]} value={extra.okna || ""} onChange={setEx("okna")} />
        <MiniChips label="Двор" options={["Закрытый", "Охраняемый", "Открытый"]} value={extra.dvor || ""} onChange={setEx("dvor")} />
        <MiniChips label="Детская площадка" options={["Есть", "Нет"]} value={extra.detskaya || ""} onChange={setEx("detskaya")} />
        <MiniField label="Фасад дома" value={extra.fasad || ""} onChange={setEx("fasad")} />
      </Accordion>
      <Accordion title="КВАРТИРА" defaultOpen={true}>
        <div className="field-row">
          <MiniField label="Жилая площадь, м²" value={extra.zhilayaPloshad || ""} onChange={setEx("zhilayaPloshad")} />
          <MiniField label="Площадь кухни, м²" value={extra.kuhnyaPloshad || ""} onChange={setEx("kuhnyaPloshad")} />
        </div>
        <MiniChips label="Ремонт" options={["Евро", "Дизайнерский", "Предчистовая", "ПСО", "Без ремонта"]} value={extra.remont || ""} onChange={setEx("remont")} />
        <MiniField label="Мебель / техника — что остаётся" value={extra.mebel || ""} onChange={setEx("mebel")} />
        <MiniField label="Вид из окон" value={extra.vidOkna || ""} onChange={setEx("vidOkna")} />
      </Accordion>
      <Accordion title="ПОКАЗ">
        <MiniField label="Время / кто показывает / телефон" value={extra.pokaz || ""} onChange={setEx("pokaz")} />
      </Accordion>

      <div className="section-divider private">
        <div className="section-divider-title">Информация для агента</div>
        <span className="lock-badge">🔒 ТОЛЬКО ДЛЯ ВАС</span>
      </div>
      <div className="field-group">
        <div className="field-label">ФИО собственника</div>
        <input className="field-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
      </div>
      <div className="field-group">
        <div className="field-label">Телефон собственника <span className="star">*</span></div>
        <input className="field-input" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+996..." />
      </div>
      <div className="field-group">
        <div className="field-label">Цена в руки <span className="star">*</span></div>
        <input className="field-input" type="number" value={vRuki} onChange={(e) => setVRuki(e.target.value)} />
      </div>
      <div className="field-group">
        <div className="field-row">
          <div><div className="field-label">Комиссия, % / сумма <span className="star">*</span></div>
            <input className="field-input" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} placeholder="3% или $500" /></div>
          <div><div className="field-label">Условия комиссии <span className="star">*</span></div>
            <input className="field-input" value={commissionTerms} onChange={(e) => setCommissionTerms(e.target.value)} placeholder="50/50, 100% и т.д." /></div>
        </div>
      </div>
      <div className="field-group">
        <div className="field-label">Точный адрес</div>
        <input className="field-input" value={exactAddress} onChange={(e) => setExactAddress(e.target.value)} />
      </div>
      <div className="field-group">
        <div className="field-label">Комментарий агента (внутренний)</div>
        <textarea className="field-textarea" value={agentComment} onChange={(e) => setAgentComment(e.target.value)} placeholder="Заметки для себя/коллег — клиент не видит" />
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
      <div className="progress-note">Поля со звёздочкой * обязательны</div>
    </div>
  );
}
