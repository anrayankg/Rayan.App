"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { CITIES, CITY_DISTRICTS } from "../../../lib/locations";
import LocationPicker from "../../../components/LocationPicker";
import MapPicker from "../../../components/MapPicker";


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
  "Индивидуальный газовый котёл", "Электро-конвекторы", "Индивидуальное электрическое отопление",
  "Комбинированное", "Угольное", "Другое",
];

const OBMEN_OPTS = ["Квартира", "Машина", "Дом", "Иссык-Куль", "Другое"];
const WINDOW_DIRS = ["Север", "Юг", "Запад", "Восток", "Северо-восток", "Северо-запад", "Юго-восток", "Юго-запад"];
const FLOOR_COUNT_OPTS = Array.from({ length: 30 }, (_, i) => String(i + 1));

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
function MiniMultiChips({ label, options, value, onChange }) {
  const arr = value || [];
  function toggle(o) {
    onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o]);
  }
  return (
    <div>
      <div className="mini-field-label">{label}</div>
      <div className="chip-group">
        {options.map((o) => (
          <div key={o} className={`chip ${arr.includes(o) ? "selected" : ""}`} onClick={() => toggle(o)}>{o}</div>
        ))}
      </div>
    </div>
  );
}
function MiniYesNo({ label, value, onChange }) {
  return (
    <div>
      <div className="mini-field-label">{label}</div>
      <div className="chip-group">
        {["Да", "Нет"].map((o) => (
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

  const [city, setCity] = useState("Бишкек");
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
  const [hotWater, setHotWater] = useState(null);
  const [price, setPrice] = useState("");
  const [torg, setTorg] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [commissionPercent, setCommissionPercent] = useState("");
  const [commissionTerms, setCommissionTerms] = useState("");
  const [vRuki, setVRuki] = useState("");
  const [vRukiCurrency, setVRukiCurrency] = useState("USD");
  const [dealTerms, setDealTerms] = useState([]); // теперь массив — множественный выбор
  const [obmenNa, setObmenNa] = useState([]);
  const [obmenDrugoe, setObmenDrugoe] = useState("");
  const [mapLink, setMapLink] = useState("");
  const [mapLat, setMapLat] = useState(null);
  const [mapLng, setMapLng] = useState(null);

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
  const [docPhotos, setDocPhotos] = useState([]); // storage-пути для базы
  const [docPreviews, setDocPreviews] = useState([]); // локальные превью для показа
  const [contractPhotos, setContractPhotos] = useState([]);
  const [contractPreviews, setContractPreviews] = useState([]);

  async function handleContractFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      for (const file of files) {
        setContractPreviews((p) => [...p, URL.createObjectURL(file)]);
        const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
        const path = `contract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("listing-documents").upload(path, file);
        if (upErr) throw upErr;
        setContractPhotos((p) => [...p, path]);
      }
    } catch (err) {
      setError("Не удалось загрузить фото договора: " + err.message);
    } finally {
      e.target.value = "";
    }
  }
  const [docUploading, setDocUploading] = useState(false);

  async function handleDocFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setDocUploading(true);
    try {
      for (const file of files) {
        setDocPreviews((p) => [...p, URL.createObjectURL(file)]);
        const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
        const path = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("listing-documents").upload(path, file);
        if (upErr) throw upErr;
        setDocPhotos((p) => [...p, path]);
      }
    } catch (err) {
      setError("Не удалось загрузить файл: " + err.message);
    } finally {
      setDocUploading(false);
      e.target.value = "";
    }
  }
  const [contractStatus, setContractStatus] = useState("без договора");

  const [extra, setExtra] = useState({});
  const setEx = (key) => (val) => setExtra((p) => ({ ...p, [key]: val }));

  function toggle(setFn, arr, val) {
    setFn(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const districtRequired = city === "Бишкек";
  const canSubmit =
    city && (!districtRequired || district) && mapLat && mapLng && roomType && series && area && floor && floorsTotal &&
    docs.length > 0 && heating && gas !== null && water !== null &&
    electricity !== null && sewerage !== null && hotWater !== null && price && ownerPhone &&
    agentPhone && commissionPercent && commissionTerms && vRuki && dealTerms.length > 0 && description;

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
          currency_new: currency,
          district,
          city,
          room_type: roomType,
          rooms: roomType,
          series,
          area_m2: Number(area),
          floor: Number(floor),
          floors_total: Number(floorsTotal),
          zhk, sk,
          documents: docs,
          heating,
          gas, water, electricity, sewerage, hot_water: hotWater,
          map_lat: mapLat,
          map_lng: mapLng,
          deal_terms: dealTerms.join(", "),
          obmen_na: dealTerms.includes("Обмен") ? [...obmenNa, obmenDrugoe].filter(Boolean).join(", ") : null,
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
        document_photos: docPhotos,
        contract_photos: contractPhotos,
      });
      if (e2) throw e2;

      const { error: e3 } = await supabase.from("listing_financial").insert({
        listing_id: listing.id,
        commission_percent: commissionPercent,
        commission_terms: commissionTerms,
        v_ruki: vRuki ? Number(vRuki) : null,
        v_ruki_currency: vRukiCurrency,
        agent_notes: agentComment,
      });
      if (e3) throw e3;

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

      <div className="section-divider"><div className="section-divider-title big">ОБЯЗАТЕЛЬНЫЕ ПОЛЯ</div></div>

      <div className="field-group">
        <LocationPicker
          label="Город"
          required
          options={CITIES}
          value={city}
          onChange={(v) => { setCity(v); setDistrict(""); }}
        />
      </div>

      <div className="field-group">
        {CITY_DISTRICTS[city]?.length > 0 ? (
          <LocationPicker
            label="Район"
            required
            options={CITY_DISTRICTS[city]}
            value={district}
            onChange={setDistrict}
          />
        ) : (
          <div style={{ color: "#7FA396", fontSize: 12 }}>
            Деление на районы пока есть только для Бишкека
          </div>
        )}
      </div>

      <div className="field-group">
        <MapPicker
          label="Точка на карте"
          required
          lat={mapLat}
          lng={mapLng}
          onChange={(lat, lng) => { setMapLat(lat); setMapLng(lng); }}
        />
      </div>

      <div className="field-group">
        <div className="field-label">Комнатность <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <div className="chip-group">
          {ROOM_TYPES.map((r) => (
            <div key={r} className={`chip required-chip ${roomType === r ? "selected" : ""}`} onClick={() => setRoomType(r)}>{r}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Серия дома <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <div className="chip-group">
          {SERIES_OPTIONS.map((s) => (
            <div key={s} className={`chip required-chip ${series === s ? "selected" : ""}`} onClick={() => setSeries(s)}>{s}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Площадь, м² <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className="field-input required-input" type="number" value={area} onChange={(e) => setArea(e.target.value)} />
      </div>

      <div className="field-group">
        <div className="field-label">Этаж <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className="field-input required-input" type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
      </div>

      <div className="field-group">
        <div className="field-label">Этажность <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className="field-input required-input" type="number" value={floorsTotal} onChange={(e) => setFloorsTotal(e.target.value)} />
      </div>

      <div className="field-group">
        <div className="field-label">Документы (можно несколько) <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <div className="chip-group">
          {DOC_OPTIONS.map((d) => (
            <div key={d} className={`chip required-chip ${docs.includes(d) ? "selected" : ""}`} onClick={() => toggle(setDocs, docs, d)}>{d}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Отопление <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <div className="chip-group">
          {HEATING_OPTS.map((h) => (
            <div key={h} className={`chip required-chip ${heating === h ? "selected" : ""}`} onClick={() => setHeating(h)}>{h}</div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Коммуникации <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <div className="chip-group">
          {[["Газ", gas, setGas], ["Вода", water, setWater], ["Электричество", electricity, setElectricity], ["Канализация", sewerage, setSewerage], ["Горячая вода", hotWater, setHotWater]].map(([label, val, setter]) => (
            <div key={label} className={`chip required-chip ${val === true ? "selected" : ""}`} onClick={() => setter(val === true ? false : true)}>
              {label}: {val === null ? "?" : val ? "да" : "нет"}
            </div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Цена <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className="field-input required-input" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Общая стоимость, не за м²" />
        <div className="currency-toggle">
          {["USD", "KGS"].map((c) => (
            <div key={c} className={`currency-btn required-chip ${currency === c ? "selected" : ""}`} onClick={() => setCurrency(c)}>{c === "USD" ? "$ USD" : "KGS сом"}</div>
          ))}
        </div>
        <div style={{ marginTop: 10 }} className="chip-group">
          <div className={`chip required-chip ${torg ? "selected" : ""}`} onClick={() => setTorg(!torg)}>Торг возможен</div>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Условия сделки (можно несколько) <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <div className="chip-group">
          {DEAL_TERMS_OPTS.map((d) => (
            <div key={d} className={`chip required-chip ${dealTerms.includes(d) ? "selected" : ""}`} onClick={() => toggle(setDealTerms, dealTerms, d)}>{d}</div>
          ))}
        </div>
        {dealTerms.includes("Обмен") && (
          <div style={{ marginTop: 12 }}>
            <div className="mini-field-label">На что рассматривается обмен</div>
            <div className="chip-group">
              {OBMEN_OPTS.map((o) => (
                <div key={o} className={`chip required-chip ${obmenNa.includes(o) ? "selected" : ""}`} onClick={() => toggle(setObmenNa, obmenNa, o)}>{o}</div>
              ))}
            </div>
            <input className="field-input" style={{ marginTop: 8 }} value={obmenDrugoe} onChange={(e) => setObmenDrugoe(e.target.value)} placeholder="Уточнить, если «Другое»" />
          </div>
        )}
      </div>

      <div className="section-divider">
        <div className="section-divider-title big">ДОПОЛНИТЕЛЬНО <span style={{ fontSize: "0.4em", fontWeight: 500, textTransform: "none", letterSpacing: "0.02em" }}>(не обязательно)</span></div>
      </div>
      <div className="field-group">
        <div className="field-row">
          <div><div className="field-label">СК</div><input className="field-input" value={sk} onChange={(e) => setSk(e.target.value)} /></div>
          <div><div className="field-label">ЖК</div><input className="field-input" value={zhk} onChange={(e) => setZhk(e.target.value)} /></div>
        </div>
      </div>
      <Accordion title="ДОМ И ТЕРРИТОРИЯ" defaultOpen={true}>
        <MiniChips label="Планировка" options={["Сквозная", "В линейку"]} value={extra.planirovka || ""} onChange={setEx("planirovka")} />
        <MiniField label="Балкон/лоджия, количество" value={extra.balkon || ""} onChange={setEx("balkon")} />
        <MiniChips label="Лифт" options={["Да, работает", "Да, не работает", "Нет"]} value={extra.lift || ""} onChange={setEx("lift")} />
        <MiniField label="Производитель лифта" value={extra.liftProizvoditel || ""} onChange={setEx("liftProizvoditel")} />
        {floor && floorsTotal && floor === floorsTotal && (
          <MiniChips label="Технический этаж (последний этаж)" options={["Тех этаж есть", "Тех этаж нет"]} value={extra.tehEtazh || ""} onChange={setEx("tehEtazh")} />
        )}
        <MiniField label="Высота потолков" value={extra.potolki || ""} onChange={setEx("potolki")} />
        <MiniMultiChips label="Расположение окон (можно несколько)" options={WINDOW_DIRS} value={extra.okna} onChange={setEx("okna")} />
        <MiniField label="Материал фасада" value={extra.fasadMaterial || ""} onChange={setEx("fasadMaterial")} />
        <MiniField label="Состояние фасада" value={extra.fasadSostoyanie || ""} onChange={setEx("fasadSostoyanie")} />
        <MiniField label="Состояние подъезда" value={extra.podjezdSostoyanie || ""} onChange={setEx("podjezdSostoyanie")} />
        <MiniField label="Состояние двора" value={extra.dvorSostoyanie || ""} onChange={setEx("dvorSostoyanie")} />
        <MiniChips label="Двор" options={["Закрытый", "Охраняемый", "Открытый"]} value={extra.dvor || ""} onChange={setEx("dvor")} />
        <MiniChips label="Детская площадка" options={["Есть", "Нет"]} value={extra.detskaya || ""} onChange={setEx("detskaya")} />
        <MiniMultiChips label="Инфраструктура рядом" options={["Магазины", "Школы", "Детские сады", "Остановки", "Торговый центр", "Рынок/базар"]} value={extra.infra} onChange={setEx("infra")} />
        <MiniField label="Другая инфраструктура" value={extra.infraDrugoe || ""} onChange={setEx("infraDrugoe")} />
      </Accordion>

      <Accordion title="КВАРТИРА" defaultOpen={true}>
        <div className="field-row">
          <MiniField label="Жилая площадь, м²" value={extra.zhilayaPloshad || ""} onChange={setEx("zhilayaPloshad")} />
          <MiniField label="Площадь кухни, м²" value={extra.kuhnyaPloshad || ""} onChange={setEx("kuhnyaPloshad")} />
        </div>
        <MiniChips label="Ремонт" options={["Евро", "Дизайнерский", "Предчистовая", "ПСО", "Без ремонта", "Другое"]} value={extra.remont || ""} onChange={setEx("remont")} />
        <MiniField label="Год ремонта" value={extra.remontGod || ""} onChange={setEx("remontGod")} />

        <MiniYesNo label="Мебель остаётся" value={extra.mebelDaNet || ""} onChange={setEx("mebelDaNet")} />
        {extra.mebelDaNet === "Да" && (
          <>
            <MiniChips label="Мебель — объём" options={["Частично", "Полностью"]} value={extra.mebelObyem || ""} onChange={setEx("mebelObyem")} />
            <MiniField label="Что из мебели остаётся" value={extra.mebelChto || ""} onChange={setEx("mebelChto")} />
          </>
        )}

        <MiniYesNo label="Техника остаётся" value={extra.tehnikaDaNet || ""} onChange={setEx("tehnikaDaNet")} />
        {extra.tehnikaDaNet === "Да" && (
          <>
            <MiniChips label="Техника — объём" options={["Частично", "Полностью"]} value={extra.tehnikaObyem || ""} onChange={setEx("tehnikaObyem")} />
            <MiniField label="Что из техники остаётся" value={extra.tehnikaChto || ""} onChange={setEx("tehnikaChto")} />
          </>
        )}

        <MiniField label="Вид из окон" value={extra.vidOkna || ""} onChange={setEx("vidOkna")} />
        <MiniField label="Состояние окон" value={extra.sostOkna || ""} onChange={setEx("sostOkna")} />
        <MiniChips label="Количество квартир на этаже" options={FLOOR_COUNT_OPTS} value={extra.kvNaEtazhe || ""} onChange={setEx("kvNaEtazhe")} />
      </Accordion>

      <Accordion title="ДОКУМЕНТЫ — ПОДРОБНО">
        <MiniYesNo label="Есть ли арест" value={extra.arest || ""} onChange={setEx("arest")} />
        <MiniYesNo label="Есть ли залог в банке" value={extra.zalog || ""} onChange={setEx("zalog")} />
        <MiniField label="Другие обременения" value={extra.obremeneniyaDrugie || ""} onChange={setEx("obremeneniyaDrugie")} />

        <div>
          <div className="mini-field-label">Проверка Госрегистра</div>
          <div className="chip-group">
            <div className={`chip required-chip ${extra.gosregistr === "Проверено" ? "selected" : ""}`} onClick={() => setEx("gosregistr")("Проверено")}>Проверено</div>
            <div className={`chip required-chip ${extra.gosregistr === "Не проверено" ? "selected" : ""}`} onClick={() => setEx("gosregistr")("Не проверено")}>Не проверено</div>
          </div>
        </div>
        {extra.gosregistr === "Проверено" && (
          <div>
            <div className="mini-field-label">Фото выписки из Тундук</div>
            <label className="doc-upload-btn" style={{ display: "inline-flex" }}>
              🖼 Вставить фото выписки
              <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={handleDocFiles} />
            </label>
          </div>
        )}

        <MiniYesNo label="Совпадает ли фактическая площадь с документами" value={extra.ploshadSootv || ""} onChange={setEx("ploshadSootv")} />
        <MiniYesNo label="Есть ли перепланировка" value={extra.pereplanirovka || ""} onChange={setEx("pereplanirovka")} />
        {extra.pereplanirovka === "Да" && (
          <MiniChips label="Перепланировка" options={["Узаконена", "Не узаконена"]} value={extra.pereplanirovkaStatus || ""} onChange={setEx("pereplanirovkaStatus")} />
        )}
      </Accordion>

      <Accordion title="ПОКАЗ">
        <MiniField label="Время / кто показывает / телефон" value={extra.pokaz || ""} onChange={setEx("pokaz")} />
      </Accordion>

      <div className="field-group">
        <div className="field-label">Описание для клиента <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <textarea className="field-textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="ai-btn" type="button" disabled>✨ Сформировать описание с ИИ (следующий этап)</button>
      </div>

      <div className="photo-drop">📷 Загрузка фото/видео — следующий этап</div>

      <div className="section-divider private">
        <div className="section-divider-title big">Информация для агента</div>
        <span className="lock-badge">🔒 ТОЛЬКО ДЛЯ ВАС</span>
      </div>
      <div className="field-group">
        <div className="field-label">ФИО собственника</div>
        <input className="field-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
      </div>
      <div className="field-group">
        <div className="field-label">Телефон собственника <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className="field-input" value={ownerPhone} onChange={(e) => setOwnerPhone(e.target.value)} placeholder="+996..." />
      </div>
      <div className="field-group">
        <div className="field-label">Точный адрес</div>
        <input className="field-input" value={exactAddress} onChange={(e) => setExactAddress(e.target.value)} />
      </div>

      <div className="field-group">
        <div className="field-label">Фото / скан документов (не обязательно)</div>
        <div className="doc-upload-row">
          <label className="doc-upload-btn">
            📷 Снять камерой
            <input type="file" accept="image/*" capture="environment" multiple style={{ display: "none" }} onChange={handleDocFiles} />
          </label>
          <label className="doc-upload-btn">
            🖼 Из галереи / файла
            <input type="file" accept="image/*,.pdf" multiple style={{ display: "none" }} onChange={handleDocFiles} />
          </label>
        </div>
        {docUploading && <div className="doc-upload-status">Загрузка...</div>}
        {docPreviews.length > 0 && (
          <div className="doc-thumbs">
            {docPreviews.map((url, i) => (
              <div key={i} className="doc-thumb">
                <img src={url} alt="" />
                <div className="doc-thumb-remove" onClick={() => { setDocPreviews((p) => p.filter((_, idx) => idx !== i)); setDocPhotos((p) => p.filter((_, idx) => idx !== i)); }}>×</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="section-divider" style={{ borderTopColor: "rgba(100,180,220,0.3)" }}>
        <div className="section-divider-title big" style={{ color: "#7EC8E3" }}>Финансовая информация</div>
        <span className="lock-badge" style={{ color: "#7EC8E3", background: "rgba(100,180,220,0.12)", borderColor: "rgba(100,180,220,0.3)" }}>👥 ВИДЯТ ВСЕ АГЕНТЫ, РОП, АДМИН</span>
      </div>
      <div className="field-group">
        <div className="field-label">Цена в руки <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className="field-input" type="number" value={vRuki} onChange={(e) => setVRuki(e.target.value)} />
        <div className="currency-toggle">
          {["USD", "KGS"].map((c) => (
            <div key={c} className={`currency-btn ${vRukiCurrency === c ? "selected" : ""}`} onClick={() => setVRukiCurrency(c)}>{c === "USD" ? "$ USD" : "KGS сом"}</div>
          ))}
        </div>
      </div>
      <div className="field-group">
        <div className="field-row">
          <div><div className="field-label">Комиссия, % / сумма <span className="star">*</span><span className="required-note">(обязательно)</span></div>
            <input className="field-input" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} placeholder="3% или $500" /></div>
          <div><div className="field-label">Условия комиссии <span className="star">*</span><span className="required-note">(обязательно)</span></div>
            <input className="field-input" value={commissionTerms} onChange={(e) => setCommissionTerms(e.target.value)} placeholder="50/50, 100% и т.д." /></div>
        </div>
      </div>
      <div className="field-group">
        <div className="field-label">Комментарий агента</div>
        <textarea className="field-textarea" value={agentComment} onChange={(e) => setAgentComment(e.target.value)} placeholder="Видят все агенты, РОП, Админ — не видит клиент" />
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
        {contractStatus === "с договором" && (
          <div style={{ marginTop: 14 }}>
            <div className="mini-field-label">Фото договора</div>
            <div className="doc-upload-row">
              <label className="doc-upload-btn">
                📷 Снять камерой
                <input type="file" accept="image/*" capture="environment" multiple style={{ display: "none" }} onChange={handleContractFiles} />
              </label>
              <label className="doc-upload-btn">
                🖼 Из галереи / файла
                <input type="file" accept="image/*,.pdf" multiple style={{ display: "none" }} onChange={handleContractFiles} />
              </label>
            </div>
            {contractPreviews.length > 0 && (
              <div className="doc-thumbs">
                {contractPreviews.map((url, i) => (
                  <div key={i} className="doc-thumb">
                    <img src={url} alt="" />
                    <div className="doc-thumb-remove" onClick={() => { setContractPreviews((p) => p.filter((_, idx) => idx !== i)); setContractPhotos((p) => p.filter((_, idx) => idx !== i)); }}>×</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

            <div className="section-divider">
        <div className="section-divider-title">Контакт агента</div>
        <span className="lock-badge" style={{ color: "#baf5d0", background: "rgba(20,120,80,0.15)", borderColor: "rgba(100,220,150,0.3)" }}>👁 ВИДЕН ВСЕМ</span>
      </div>
      <div className="field-group">
        <div className="field-row">
          <div><div className="field-label">Имя агента <span className="star">*</span><span className="required-note">(обязательно)</span></div>
            <input className="field-input" value={agentName} onChange={(e) => setAgentName(e.target.value)} /></div>
          <div><div className="field-label">Телефон агента <span className="star">*</span><span className="required-note">(обязательно)</span></div>
            <input className="field-input" value={agentPhone} onChange={(e) => setAgentPhone(e.target.value)} placeholder="+996..." /></div>
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
