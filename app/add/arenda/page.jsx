"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { CITIES, CITY_DISTRICTS } from "../../../lib/locations";
import LocationPicker from "../../../components/LocationPicker";
import MapPicker from "../../../components/MapPicker";
import PhoneInput, { isPhoneComplete } from "../../../components/PhoneInput";
import { Picker, MultiPicker } from "../../../components/Picker";
import ConfirmDialog from "../../../components/ConfirmDialog";
import AgentAssign from "../../../components/AgentAssign";
import IssykKulGeo from "../../../components/IssykKulPicker";
import ShoreDistancePicker from "../../../components/ShoreDistancePicker";
import { auditFields } from "../../../lib/audit";
import AutoTextarea from "../../../components/AutoTextarea";
import CategorySwitch from "../../../components/CategorySwitch";
import PhotoUploader from "../../../components/PhotoUploader";
import { FLOOR_CHOICES, FLOORS_TOTAL_CHOICES, floorToNumber, withFloorLabel, floorValue } from "../../../lib/floors";
import VideoReviewBlock from "../../../components/VideoReviewBlock";


// ===== КОММЕРЦИЯ: варианты выбора (бриф №5) =====
const TIP_OBEKTA = ["Отдельно стоящее здание", "Помещение в многоэтажном доме", "Помещение в бизнес-центре", "Помещение в торговом центре", "Павильон", "Склад", "Производственное помещение", "Офис", "Магазин", "Кафе / ресторан", "Салон красоты", "Медицинское помещение", "Гостиница / хостел", "Другое"];
const REMONT_OPTS = ["Евроремонт", "Свежий ремонт", "Дизайнерский ремонт", "Косметический ремонт", "Старый ремонт", "ПСО (под самоотделку)", "Предчистовая отделка", "Без ремонта", "Требуется ремонт"];
const DOC_OPTIONS = ["Акт ввода в эксплуатацию", "Генеральная доверенность", "Договор дарения", "Договор долевого участия", "Договор купли-продажи", "Договор мены", "Зеленая книга", "Красная книга", "Разрешение на строительство", "Свидетельство о праве на наследство", "Тех паспорт"];
const HEATING_OPTS = ["Автономное отопление", "Без отопления", "Газовое отопление", "Комбинированное отопление", "Угольное / твердотопливное", "Центральное отопление", "Электрическое отопление"];
const WALL_CONSTRUCTION_OPTS = ["Газобетон", "Газоблок", "Железобетонная", "Кирпич", "Монолитная", "Монолитно-газобетонная", "Монолитно-каркасная", "Монолитно-кирпичная", "Панельная", "Пеноблок", "Саман", "Другая конструкция"];
const STADIYA_OPTS = ["Вторичка (готовый объект)", "Первичка — новостройка", "Строится / не достроен"];
const CONSTRUCTION_STATUS_OPTS = ["В проекте", "Подготовительные работы", "Строится", "Построен, но не сдан под ПСО", "Сдан ПСО (ключи)"];
const FORMA_UCHASTKA = ["Прямоугольная", "Квадратная", "Треугольная", "Флажок", "Г-образная", "Другая"];
const KNIGA_OPTS = ["Красная книга", "Зелёная книга", "Нет книги"];
const NAZNACHENIE_ZEMLI = ["ПМЖ", "ИЖС", "Коммерческое", "Дачный участок", "Садоводство", "Сельхозназначение", "Под ЖК", "Другое"];
const PRAVO_ZEMLI = ["Собственность", "Аренда", "Другое"];
const CURRENT_YEAR_V = new Date().getFullYear();
const YEAR_BUILT = Array.from({ length: CURRENT_YEAR_V - 1940 + 1 }, (_, i) => String(CURRENT_YEAR_V - i));
const DELIVERY_YEARS = Array.from({ length: 12 }, (_, i) => String(CURRENT_YEAR_V - 1 + i));
const DEAL_TERMS_OPTS = ["Наличные", "Ипотека", "Рассрочка через Госрегистр", "Рассрочка от собственника", "Обмен"];


// ===== АРЕНДА: варианты выбора (бриф «Аренда») =====
const RENT_WHAT = ["Квартира", "Комната", "Гостинка", "Студия", "Дом", "Часть дома", "Таунхаус", "Коттедж", "Коммерческое помещение", "Офис", "Магазин", "Склад", "Производственное помещение", "Здание целиком", "Земельный участок", "Другое"];
const RENT_VID = ["Долгосрочная", "Посуточная", "Почасовая", "На несколько месяцев", "Сезонная"];
const RENT_VID_COMM = ["Долгосрочная коммерческая аренда", "Краткосрочная коммерческая аренда", "Аренда с возможностью последующего выкупа"];
const RENT_BY = ["Собственником", "Представителем собственника", "Через агента", "Через управляющую компанию", "Через партнёра"];
const RENT_ROOMS = ["Комната", "Гостинка", "Студия", "1-комнатная", "2-комнатная", "3-комнатная", "4-комнатная", "5-комнатная", "6 и более комнат"];
const RENT_REMONT = ["Черновая", "Под самоотделку", "Косметический ремонт", "Хороший ремонт", "Евроремонт", "Дизайнерский ремонт", "Требует ремонта"];
const SERIES_OPTIONS = ["Элитка", "Индивидуалка", "104 серия", "105 серия", "106 серия", "106 серии улучшенной", "107 серия", "108 серия", "Гостиничного типа", "Малосемейка", "Общежитие", "Хрущёвка", "Сталинка", "Другое"];
const RENT_MEBEL = ["Полностью меблирована", "Частично меблирована", "Без мебели"];
const RENT_TEHNIKA = ["Полностью оборудована", "Частично оборудована", "Без бытовой техники"];
const RENT_POSTR = ["Гараж", "Летняя кухня", "Баня", "Сарай", "Беседка", "Другое", "Нет"];
const RENT_COMM_LOC = ["Первая линия", "Вторая линия", "Внутри жилого массива", "В бизнес-центре", "В торговом центре", "Отдельно стоящее здание", "Промышленная зона", "Другое"];
const RENT_COMM_VHOD = ["Отдельный с улицы", "Общий вход", "Через торговый центр или бизнес-центр", "Несколько отдельных входов"];
const RENT_COMM_USE = ["Офис", "Торговля", "Общественное питание", "Склад", "Производство", "Сфера услуг", "Медицинский кабинет", "Образовательная деятельность", "Другое"];
const RENT_LAND_N = ["Под индивидуальное жилищное строительство", "Дачный", "Сельскохозяйственный", "Коммерческий", "Промышленный", "Другое"];
const RENT_HEAT = ["Центральное", "Газовое", "Электрическое", "Твердотопливное", "Автономное", "Другое"];
const RENT_COMMS = ["Газ", "Вода", "Электричество", "Канализация", "Интернет"];
const RENT_SANUZEL = ["Совмещённый", "Раздельный", "Несколько санузлов", "Отсутствует"];
const RENT_UDOBSTVA = ["Балкон", "Лоджия", "Лифт", "Парковка", "Закрытая территория", "Охрана", "Двор", "Детская площадка"];
const RENT_PRAVILA = ["Можно с детьми", "Можно с животными", "Без животных", "Для одного человека", "Для семьи", "Для сотрудников компании", "Другое"];
const RENT_PERIOD = ["За час", "За сутки", "За месяц", "За сезон", "Другое"];
const RENT_PERIOD_IK = ["За час", "За ночь", "За сутки", "За неделю", "За месяц", "За сезон", "За номер", "За весь объект", "Другое"];
const RENT_KOMM = ["Включены в стоимость", "Оплачиваются отдельно", "Частично включены"];
// подпись периода в базе (price_period) — по ней карточки пишут «$500 / месяц»
const PERIOD_KEY = { "За час": "час", "За ночь": "ночь", "За сутки": "сутки", "За неделю": "неделя", "За месяц": "месяц", "За сезон": "сезон", "За номер": "номер", "За весь объект": "весь объект" };

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
function MiniField({ label, value, onChange, long }) {
  return (
    <div>
      <div className="mini-field-label">{label}</div>
      {long
        ? <AutoTextarea compact minRows={3} className="field-textarea" value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className="field-input" value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}
function MiniChips({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div className="mini-field-label">{label}</div>}
      <div className={`mini-picker-box ${value ? "filled" : ""}`} onClick={() => setOpen(!open)}>
        <span>{value || "Выберите значение"}</span>
        <span className="mini-picker-arrow">{value ? "✓" : "›"}</span>
      </div>
      {open && (
        <div className="mini-picker-list">
          {options.map((o) => (
            <div key={o} className={`mini-picker-item ${value === o ? "selected" : ""}`} onClick={() => { onChange(o); setOpen(false); }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}
function MiniMultiChips({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const arr = value || [];
  function toggle(o) {
    onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o]);
  }
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div className="mini-field-label">{label}</div>}
      <div className={`mini-picker-box ${arr.length ? "filled" : ""}`} onClick={() => setOpen(!open)}>
        <span className="mini-picker-box-text">{arr.length ? arr.join(", ") : "Выберите значения"}</span>
        <span className="mini-picker-arrow">{arr.length ? "✓" : "›"}</span>
      </div>
      {open && (
        <div className="mini-picker-list">
          {options.map((o) => (
            <div key={o} className={`mini-picker-item ${arr.includes(o) ? "selected" : ""}`} onClick={() => toggle(o)}>
              <span>{o}</span>{arr.includes(o) && <span>✓</span>}
            </div>
          ))}
          <div className="mini-picker-done" onClick={() => setOpen(false)}>Готово</div>
        </div>
      )}
    </div>
  );
}
function MiniYesNo({ label, value, onChange }) {
  return <MiniChips label={label} options={["Да", "Нет"]} value={value} onChange={onChange} />;
}

function ArendaForm() {
  const router = useRouter();
  const editId = useSearchParams().get("edit");
  const [loadingEdit, setLoadingEdit] = useState(!!editId);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [commsTouched, setCommsTouched] = useState(false);

  const [city, setCity] = useState("Бишкек");
  const [region, setRegion] = useState(""); // "иссык-куль" — объект внутри раздела «Иссык-Куль»
  const [district, setDistrict] = useState("");
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("region") === "issykkul") { setRegion("иссык-куль"); setCity(""); }
    } catch {}
  }, []);
  const [roomType, setRoomType] = useState("");
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [plot, setPlot] = useState(""); // площадь участка по документам, соток
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
  const [ownerWhatsapp, setOwnerWhatsapp] = useState("");
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
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoPendingError, setVideoPendingError] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");

  // имя и телефон агента подставляет компонент AgentAssign (из входа по ПИН)
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
  const [contractStatus, setContractStatus] = useState(""); // обязательно выбрать: с договором / без договора
  const [contractDate, setContractDate] = useState("");
  const [contractType, setContractType] = useState("");

  const [extra, setExtra] = useState({});
  const setEx = (key) => (val) => setExtra((p) => ({ ...p, [key]: val }));

  function toggle(setFn, arr, val) {
    setFn(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  }

  const districtRequired = city === "Бишкек" || !!region;
  const commsSel = extra.kommunikacii || [];
  const what = extra.chtoSdaetsya || "";
  const isFlat = ["Квартира", "Комната", "Гостинка", "Студия"].includes(what);
  const isHouse = ["Дом", "Часть дома", "Таунхаус", "Коттедж"].includes(what);
  const isCommerce = ["Коммерческое помещение", "Офис", "Магазин", "Склад", "Производственное помещение", "Здание целиком"].includes(what);
  const isLand = what === "Земельный участок";
  const isOther = what === "Другое";
  const residential = isFlat || isHouse;
  const withLand = isHouse || isLand; // участок учитывается в плотности «соток»
  const inside = false, detached = false, underBuild = false;
  const missingFields = [
    !what && "Что сдаётся", isOther && !extra.chtoSdaetsyaInoe && "Уточните, что сдаётся", !extra.vidArendy && "Вид аренды",
    !city && "Город", city && districtRequired && !district && "Район", !(mapLat && mapLng) && "Точка на карте", !exactAddress && "Адрес объекта",
    isFlat && !extra.komnatnost && "Количество комнат",
    (isFlat || isHouse || isCommerce) && !area && "Общая площадь",
    isFlat && !floor && "Этаж", isFlat && !floorsTotal && "Этажность здания",
    isLand && !plot && "Площадь участка",
    !contractStatus && "Договор с собственником (есть / нет)",
    !price && "Стоимость аренды", !extra.periodOplaty && "Период оплаты",
    !isPhoneComplete(ownerPhone) && "Телефон собственника",
    !isPhoneComplete(ownerWhatsapp) && "WhatsApp собственника",
    !isPhoneComplete(agentPhone) && "Телефон агента",
    !commissionPercent && "Комиссия", !commissionTerms && "Условия комиссии", !description && "Описание",
  ].filter(Boolean);
  const canSubmit = missingFields.length === 0 && !videoPendingError;

  // Режим редактирования (?edit=ID) — подтягиваем то, что уже есть в базе,
  // в те же самые поля формы, которыми обычно создают объект.
  useEffect(() => {
    if (!editId) return;
    async function loadExisting() {
     try {
      const { data: l, error: eL } = await supabase.from("listings").select("*").eq("id", editId).single();
      if (eL) throw eL;
      const { data: c } = await supabase.from("listing_contacts").select("*").eq("listing_id", editId).maybeSingle();
      const { data: f } = await supabase.from("listing_financial").select("*").eq("listing_id", editId).maybeSingle();
      if (l) {
        setCurrentStatus(l.status || null);
        setCity(l.city || "Бишкек");
        setDistrict(l.district || "");
        setRoomType(l.room_type || l.rooms || "");
        setArea(l.area_m2 != null ? String(l.area_m2) : "");
        setPlot(l.plot_sotka != null ? String(l.plot_sotka) : "");
        setFloor(floorValue(l));
        setFloorsTotal(l.floors_total != null ? String(l.floors_total) : "");
        setDocs(l.documents || []);
        setHeating(l.heating || "");
        setGas(l.gas ?? null); setWater(l.water ?? null); setElectricity(l.electricity ?? null);
        setSewerage(l.sewerage ?? null);
        if (l.heating || l.gas != null || l.water != null) setCommsTouched(true);
        setPrice(l.price != null ? String(l.price) : "");
        setTorg(!!l.torg);
        setCurrency(l.currency_new || l.currency || "USD");
        setDealTerms(l.deal_terms ? l.deal_terms.split(", ").filter(Boolean) : []);
        if (l.obmen_na) setObmenDrugoe(l.obmen_na);
        setMapLat(l.map_lat ?? null);
        setMapLng(l.map_lng ?? null);
        setZhk(l.zhk || "");
        setSk(l.sk || "");
        setDescription(l.description || "");
        setPhotos(l.photos || []);
        setVideos(l.video_links || []);
        setContractStatus(l.contract_status || "");
        setContractDate(l.contract_date || "");
        setContractType(l.contract_type || "");
        setRegion(l.region || "");
        setExtra(typeof l.extra_details === "string" ? JSON.parse(l.extra_details || "{}") : (l.extra_details || {}));
        setAgentName(l.agent_name || "");
        setAgentPhone(l.agent_phone || "");
      }
      if (c) {
        setOwnerName(c.owner_name || "");
        setOwnerPhone(c.owner_phone || "");
        setOwnerWhatsapp(c.owner_whatsapp || "");
        setExactAddress(c.exact_address || "");
        const docPaths = c.document_photos || [];
        const contractPaths = c.contract_photos || [];
        setDocPhotos(docPaths);
        setContractPhotos(contractPaths);
        setDocPreviews(docPaths.map((p) => supabase.storage.from("listing-documents").getPublicUrl(p).data?.publicUrl || ""));
        setContractPreviews(contractPaths.map((p) => supabase.storage.from("listing-documents").getPublicUrl(p).data?.publicUrl || ""));
      }
      if (f) {
        setCommissionPercent(f.commission_percent || "");
        setCommissionTerms(f.commission_terms || "");
        setVRuki(f.v_ruki != null ? String(f.v_ruki) : "");
        setVRukiCurrency(f.v_ruki_currency || "USD");
        setAgentComment(f.agent_notes || "");
      }
     } catch (err) {
       setError("Не удалось загрузить объект: " + err.message);
     } finally {
      setLoadingEdit(false);
     }
    }
    loadExisting();
  }, [editId]);

  function numOrNull(v) { return v === "" || v === null || v === undefined ? null : Number(v); }

  // Сохранить как есть, даже если обязательные поля ещё не заполнены — чтобы агент
  // не терял введённое, если его отвлекли и он не успел закончить объект целиком.
  async function handleSaveDraft() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        type: "аренда",
        price: numOrNull(price),
        currency_new: currency,
        district, city,
        area_m2: numOrNull(area), plot_sotka: numOrNull(String(plot).replace(",", ".")),
        floor: floorToNumber(floor, floorsTotal), floors_total: numOrNull(floorsTotal),
        room_type: extra.komnatnost || null, rooms: extra.komnatnost || null,
        price_period: PERIOD_KEY[extra.periodOplaty] || null, torg,
        zhk, sk,
        documents: docs, heating,
        gas: commsSel.includes("Газ"), water: commsSel.includes("Вода"), electricity: commsSel.includes("Электричество"), sewerage: commsSel.includes("Канализация"),
        map_lat: mapLat, map_lng: mapLng,
        deal_terms: dealTerms.join(", "),
        obmen_na: dealTerms.includes("Обмен") ? [...obmenNa, obmenDrugoe].filter(Boolean).join(", ") : null,
        torg, description, photos, video_links: videos,
        contract_status: contractStatus || null,
        region: region || null,
        contract_date: contractStatus === "с договором" && contractDate ? contractDate : null,
        contract_type: contractStatus === "с договором" && contractType ? contractType : null,
        ...auditFields(),
        extra_details: withFloorLabel(extra, floor),
        agent_phone: agentPhone, agent_name: agentName,
      };
      // Черновик не публикуется, пока сам агент не дозаполнит и не нажмёт финальную кнопку —
      // но если объект уже был опубликован (активен/архив и т.п.), статус не трогаем.
      if (!editId || !currentStatus) payload.status = "черновик";

      let listingId = editId;
      if (editId) {
        const { error: eUpd } = await supabase.from("listings").update(payload).eq("id", editId);
        if (eUpd) throw eUpd;
      } else {
        const { data: listing, error: e1 } = await supabase.from("listings").insert(payload).select().single();
        if (e1) throw e1;
        listingId = listing.id;
      }
      await supabase.from("listing_contacts").upsert({
        listing_id: listingId, source_type: "собственник",
        owner_name: ownerName, owner_phone: ownerPhone, owner_whatsapp: ownerWhatsapp,
        exact_address: exactAddress, document_photos: docPhotos, contract_photos: contractPhotos,
      }, { onConflict: "listing_id" });
      await supabase.from("listing_financial").upsert({
        listing_id: listingId, commission_percent: commissionPercent, commission_terms: commissionTerms,
        v_ruki: vRuki ? Number(vRuki) : null, v_ruki_currency: vRukiCurrency, agent_notes: agentComment,
      }, { onConflict: "listing_id" });

      router.push("/my");
    } catch (err) {
      setError("Не удалось сохранить черновик: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        type: "аренда",
        price: Number(price),
        currency_new: currency,
        district,
        city,
        area_m2: numOrNull(area),
        plot_sotka: numOrNull(String(plot).replace(",", ".")),
        floor: floorToNumber(floor, floorsTotal),
        floors_total: numOrNull(floorsTotal),
        room_type: extra.komnatnost || null,
        rooms: extra.komnatnost || null,
        price_period: PERIOD_KEY[extra.periodOplaty] || null,
        zhk, sk,
        documents: docs,
        heating,
        gas: commsSel.includes("Газ"), water: commsSel.includes("Вода"), electricity: commsSel.includes("Электричество"), sewerage: commsSel.includes("Канализация"),
        map_lat: mapLat,
        map_lng: mapLng,
        deal_terms: dealTerms.join(", "),
        obmen_na: dealTerms.includes("Обмен") ? [...obmenNa, obmenDrugoe].filter(Boolean).join(", ") : null,
        torg,
        description,
        photos,
        video_links: videos,
        contract_status: contractStatus || null,
        region: region || null,
        contract_date: contractStatus === "с договором" && contractDate ? contractDate : null,
        contract_type: contractStatus === "с договором" && contractType ? contractType : null,
        ...auditFields(),
        extra_details: withFloorLabel(extra, floor),
        agent_phone: agentPhone,
        agent_name: agentName,
      };
      if (!editId) {
        payload.status = "активен"; // заполнил обязательные поля и отправил — сразу публикуется, без отдельного одобрения
        payload.published_at = new Date().toISOString();
      } else if (!currentStatus || currentStatus === "черновик" || currentStatus === "на проверке") {
        payload.status = "активен"; // черновик дозаполнили до конца — тоже публикуется
        payload.published_at = new Date().toISOString(); // именно СЕГОДНЯ объект стал активным, даже если черновик лежал 3 дня
      } // если объект уже активен/в архиве/продан и т.п. — статус при обычном редактировании не трогаем

      let listingId = editId;
      if (editId) {
        const { error: eUpd } = await supabase.from("listings").update(payload).eq("id", editId);
        if (eUpd) throw eUpd;
      } else {
        const { data: listing, error: e1 } = await supabase.from("listings").insert(payload).select().single();
        if (e1) throw e1;
        listingId = listing.id;
      }

      const { error: e2 } = await supabase.from("listing_contacts").upsert({
        listing_id: listingId,
        source_type: "собственник",
        owner_name: ownerName,
        owner_phone: ownerPhone,
        owner_whatsapp: ownerWhatsapp,
        exact_address: exactAddress,
        document_photos: docPhotos,
        contract_photos: contractPhotos,
      }, { onConflict: "listing_id" });
      if (e2) throw e2;

      const { error: e3 } = await supabase.from("listing_financial").upsert({
        listing_id: listingId,
        commission_percent: commissionPercent,
        commission_terms: commissionTerms,
        v_ruki: vRuki ? Number(vRuki) : null,
        v_ruki_currency: vRukiCurrency,
        agent_notes: agentComment,
      }, { onConflict: "listing_id" });
      if (e3) throw e3;


      setSuccess(true);
      setTimeout(() => router.push(editId ? `/listing/${editId}` : "/"), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingEdit) {
    return (
      <div className="app-shell" style={{ paddingBottom: 40, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ color: "var(--muted)" }}>Загружаю объект…</div>
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2" style={{ stroke: "var(--text)" }}><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div className="page-title">{editId ? "Редактирование — Аренда" : "Аренда"}</div>
      </div>


      <div className="section-divider"><div className="section-divider-title big">ОБЯЗАТЕЛЬНЫЕ ПОЛЯ</div></div>

      <CategorySwitch current="arenda" editId={editId} region={region} />

      <div className="field-group">
        <Picker label="Что сдаётся" required options={RENT_WHAT} value={what} onChange={setEx("chtoSdaetsya")} error={attemptedSubmit && !what} />
      </div>
      {isOther && (
        <div className="field-group">
          <div className="field-label">Уточните, что сдаётся <span className="star">*</span></div>
          <input className={`field-input required-input ${attemptedSubmit && !extra.chtoSdaetsyaInoe ? "field-error" : ""}`} value={extra.chtoSdaetsyaInoe || ""} onChange={(e) => setEx("chtoSdaetsyaInoe")(e.target.value)} />
        </div>
      )}
      <div className="field-group">
        <Picker label="Вид аренды" required options={isCommerce ? [...RENT_VID, ...RENT_VID_COMM] : RENT_VID} value={extra.vidArendy || ""} onChange={setEx("vidArendy")} error={attemptedSubmit && !extra.vidArendy} />
      </div>
      <div className="field-group">
        <Picker label="Объект сдаётся" options={RENT_BY} value={extra.sdayotKto || ""} onChange={setEx("sdayotKto")} />
      </div>

      <div className="field-group">
        {region ? (
          <>
            <div className="ik-banner">🏖 Раздел «Иссык-Куль»</div>
            <IssykKulGeo district={district} city={city} errorDistrict={attemptedSubmit && !district} errorCity={attemptedSubmit && !city}
              onChange={(d, c, aimak, kind, la, lo, code) => { setDistrict(d); setCity(c); setEx("aiylAimak")(aimak || ""); setEx("tipNP")(kind || ""); setEx("soateCode")(code || ""); if (la && lo) { setMapLat(la); setMapLng(lo); } }} />
            <div className="field-group">
              <div className="field-label">Микрорайон, улица, адрес или описание местоположения</div>
              <input className="field-input" value={extra.adresOpisanie || ""} onChange={(e) => setEx("adresOpisanie")(e.target.value)} placeholder="Улица, ориентир, курорт или комплекс" />
            </div>
            <ShoreDistancePicker value={extra.rasstoyanieOzero || ""} onPick={(label, m) => { setEx("rasstoyanieOzero")(label); setEx("rasstoyanieOzeroM")(m === null || m === undefined ? "" : m); }} />
          </>
        ) : (
          <LocationPicker
            label="Город"
            required
            options={CITIES}
            value={city}
            onChange={(v) => { setCity(v); setDistrict(""); }}
          />
        )}
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
          <div style={{ color: "var(--muted)", fontSize: 12 }}>
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
          flyToQuery={district}
          flyToCity={city}
          onChange={(lat, lng) => { setMapLat(lat); setMapLng(lng); }}
        />
      </div>

      <div className="field-group">
        <div className="field-label">Ориентир</div>
        <input className="field-input" value={extra.orientir || ""} onChange={(e) => setEx("orientir")(e.target.value)} placeholder="Рядом с чем находится" />
      </div>

      {/* ===== квартира, комната, гостинка, студия ===== */}
      {isFlat && (
        <>
          <div className="field-group"><Picker label="Количество комнат" required options={RENT_ROOMS} value={extra.komnatnost || ""} onChange={setEx("komnatnost")} error={attemptedSubmit && !extra.komnatnost} /></div>
          <div className="field-group">
            <div className="field-label">Общая площадь, м² <span className="star">*</span></div>
            <input className={`field-input required-input ${attemptedSubmit && !area ? "field-error" : ""}`} type="number" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Например 45" />
          </div>
          <div className="field-group">
            <div className="field-label">Жилая площадь, м²</div>
            <input className="field-input" inputMode="decimal" value={extra.zhilayaPloshad || ""} onChange={(e) => setEx("zhilayaPloshad")(e.target.value)} />
          </div>
          <div className="field-group"><Picker label="Этаж" required options={FLOOR_CHOICES} value={floor} onChange={setFloor} error={attemptedSubmit && !floor} /></div>
          <div className="field-group"><Picker label="Этажность здания" required options={FLOORS_TOTAL_CHOICES} value={floorsTotal} onChange={setFloorsTotal} error={attemptedSubmit && !floorsTotal} /></div>
          <div className="field-group"><Picker label="Серия дома" options={SERIES_OPTIONS} value={extra.seriya || ""} onChange={setEx("seriya")} /></div>
        </>
      )}

      {/* ===== дом, часть дома, таунхаус, коттедж ===== */}
      {isHouse && (
        <>
          <div className="field-group">
            <div className="field-label">Площадь дома, м² <span className="star">*</span></div>
            <input className={`field-input required-input ${attemptedSubmit && !area ? "field-error" : ""}`} type="number" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Например 120" />
          </div>
          <div className="field-group"><Picker label="Количество этажей" options={FLOORS_TOTAL_CHOICES} value={floorsTotal} onChange={setFloorsTotal} /></div>
          <div className="field-group">
            <div className="field-label">Площадь участка, соток</div>
            <input className="field-input" inputMode="decimal" value={plot} onChange={(e) => setPlot(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="Например 6" />
          </div>
          <div className="field-group"><MultiPicker label="Дополнительные постройки" options={RENT_POSTR} value={extra.postroiki || []} onChange={setEx("postroiki")} /></div>
        </>
      )}

      {/* ===== квартиры и дома: общее состояние, мебель, техника ===== */}
      {residential && (
        <>
          <div className="field-group"><Picker label="Состояние" options={RENT_REMONT} value={extra.remont || ""} onChange={setEx("remont")} /></div>
          <div className="field-group"><Picker label="Мебель" options={RENT_MEBEL} value={extra.mebelArenda || ""} onChange={setEx("mebelArenda")} /></div>
          <div className="field-group"><Picker label="Бытовая техника" options={RENT_TEHNIKA} value={extra.tehnikaArenda || ""} onChange={setEx("tehnikaArenda")} /></div>
          {extra.tehnikaArenda === "Частично оборудована" && (
            <div className="field-group">
              <div className="field-label">Какая техника есть</div>
              <input className="field-input" value={extra.tehnikaKakaya || ""} onChange={(e) => setEx("tehnikaKakaya")(e.target.value)} placeholder="Например: холодильник, стиральная машина" />
            </div>
          )}
        </>
      )}

      {/* ===== коммерческое помещение, офис, магазин, склад, здание ===== */}
      {isCommerce && (
        <>
          <div className="field-group">
            <div className="field-label">Площадь, м² <span className="star">*</span></div>
            <input className={`field-input required-input ${attemptedSubmit && !area ? "field-error" : ""}`} type="number" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Например 80" />
          </div>
          <div className="field-group"><Picker label="Этаж" options={FLOOR_CHOICES} value={floor} onChange={setFloor} /></div>
          <div className="field-group"><Picker label="Этажность здания" options={FLOORS_TOTAL_CHOICES} value={floorsTotal} onChange={setFloorsTotal} /></div>
          <div className="field-group"><Picker label="Расположение" options={RENT_COMM_LOC} value={extra.raspolozhenie || ""} onChange={setEx("raspolozhenie")} /></div>
          <div className="field-group"><Picker label="Вход" options={RENT_COMM_VHOD} value={extra.vhodArenda || ""} onChange={setEx("vhodArenda")} /></div>
          <div className="field-group">
            <div className="field-label">Электрическая мощность, кВт</div>
            <input className="field-input" inputMode="decimal" value={extra.elektrKvt || ""} onChange={(e) => setEx("elektrKvt")(e.target.value)} />
          </div>
          <div className="field-group"><MultiPicker label="Возможное использование" options={RENT_COMM_USE} value={extra.vozmozhnoeIspolzovanie || []} onChange={setEx("vozmozhnoeIspolzovanie")} /></div>
        </>
      )}

      {/* ===== земельный участок ===== */}
      {isLand && (
        <>
          <div className="field-group">
            <div className="field-label">Площадь, соток <span className="star">*</span></div>
            <input className={`field-input required-input ${attemptedSubmit && !plot ? "field-error" : ""}`} inputMode="decimal" value={plot} onChange={(e) => setPlot(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="Например 10" />
          </div>
          <div className="field-group"><Picker label="Назначение участка" options={RENT_LAND_N} value={extra.naznachenieArenda || ""} onChange={setEx("naznachenieArenda")} /></div>
          <div className="field-group">
            <div className="field-label">Подъезд и доступ к участку</div>
            <input className="field-input" value={extra.podezdDostup || ""} onChange={(e) => setEx("podezdDostup")(e.target.value)} />
          </div>
        </>
      )}

      {/* ===== удобства (для жилых объектов) ===== */}
      {residential && (
        <>
          <div className="field-group"><Picker label="Отопление" options={RENT_HEAT} value={heating} onChange={setHeating} /></div>
          <div className="field-group"><MultiPicker label="Коммуникации" options={RENT_COMMS} value={commsSel} onChange={(sel) => { setEx("kommunikacii")(sel); setCommsTouched(true); }} /></div>
          <div className="field-group"><Picker label="Санузел" options={RENT_SANUZEL} value={extra.sanuzel || ""} onChange={setEx("sanuzel")} /></div>
          <div className="field-group"><MultiPicker label="Дополнительные удобства" options={RENT_UDOBSTVA} value={extra.udobstva || []} onChange={setEx("udobstva")} /></div>
          <div className="field-group"><MultiPicker label="Правила проживания" options={RENT_PRAVILA} value={extra.pravilaProzhivaniya || []} onChange={setEx("pravilaProzhivaniya")} /></div>
        </>
      )}

      <div className="field-group">
        <div className="field-label">Стоимость аренды <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !price ? "field-error" : ""}`} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Сумма за выбранный период" />
        <div className="currency-toggle">
          {["USD", "KGS"].map((c) => (
            <div key={c} className={`currency-btn required-chip ${currency === c ? "selected" : ""}`} onClick={() => setCurrency(c)}>{c === "USD" ? "$ USD" : "KGS сом"}</div>
          ))}
        </div>
      </div>
      <div className="field-group">
        <Picker label="Период оплаты" required options={region ? RENT_PERIOD_IK : RENT_PERIOD} value={extra.periodOplaty || ""} onChange={setEx("periodOplaty")} error={attemptedSubmit && !extra.periodOplaty} />
        {extra.periodOplaty === "Другое" && (
          <input className="field-input" style={{ marginTop: 8 }} value={extra.periodDrugoe || ""} onChange={(e) => setEx("periodDrugoe")(e.target.value)} placeholder="Уточните период" />
        )}
      </div>
      <div className="field-group">
        <Picker label="Возможность торга" options={["Да", "Нет", "Обсуждается"]} value={extra.torg3 || ""} onChange={(v) => { setEx("torg3")(v); setTorg(v === "Да"); }} />
      </div>

      <div className="section-divider">
        <div className="section-divider-title big">ДОПОЛНИТЕЛЬНО <span style={{ fontSize: "0.4em", fontWeight: 500, textTransform: "none", letterSpacing: "0.02em" }}>(не обязательно)</span></div>
      </div>
      <Accordion title="УСЛОВИЯ АРЕНДЫ" defaultOpen={true}>
        <MiniChips label="Залог / депозит" options={["Не требуется", "Требуется"]} value={extra.zalog || ""} onChange={setEx("zalog")} />
        {extra.zalog === "Требуется" && (
          <>
            <MiniField label="Сумма залога" value={extra.zalogSumma || ""} onChange={setEx("zalogSumma")} />
            <MiniChips label="Валюта залога" options={["USD", "KGS"]} value={extra.zalogValyuta || ""} onChange={setEx("zalogValyuta")} />
          </>
        )}
        <MiniChips label="Коммунальные услуги" options={["Включены в стоимость", "Оплачиваются отдельно", "Частично включены"]} value={extra.kommunalnye || ""} onChange={setEx("kommunalnye")} />
        <MiniField label="Минимальный срок аренды (число)" value={extra.minSrokChislo || ""} onChange={setEx("minSrokChislo")} />
        <MiniChips label="Единица срока" options={["часов", "суток", "недель", "месяцев"]} value={extra.minSrokEd || ""} onChange={setEx("minSrokEd")} />
        <div className="mini-field-label">Дата освобождения / доступности объекта</div>
        <input className="field-input" type="date" value={extra.dataDostupnosti || ""} onChange={(e) => setEx("dataDostupnosti")(e.target.value)} />
        <div className="mini-field-label">Дата начала аренды (если согласована)</div>
        <input className="field-input" type="date" value={extra.dataNachala || ""} onChange={(e) => setEx("dataNachala")(e.target.value)} />
        <MiniField label="Условия проживания или использования" value={extra.usloviyaProzhivaniya || ""} onChange={setEx("usloviyaProzhivaniya")} long />
        <MiniField label="Что входит в стоимость" value={extra.vhoditVStoimost || ""} onChange={setEx("vhoditVStoimost")} long />
      </Accordion>

      <Accordion title="ПОКАЗ">
        <MiniField label="В какие дни можно показывать" value={extra.pokazDni || ""} onChange={setEx("pokazDni")} />
        <MiniField label="В какое время" value={extra.pokazVremya || ""} onChange={setEx("pokazVremya")} />
        <MiniField label="Кто показывает объект" value={extra.pokazKto || ""} onChange={setEx("pokazKto")} />
        <MiniField label="Телефон показывающего" value={extra.pokaz || ""} onChange={setEx("pokaz")} />
      </Accordion>

      {region && (
        <Accordion title="ОЗЕРО И КУРОРТ (Иссык-Куль)" defaultOpen={true}>
          <MiniChips label="Доступ к пляжу" options={["Собственный", "Общий пляж комплекса", "Общественный", "По пропуску", "Отсутствует", "Другое"]} value={extra.dostupPlyazh || ""} onChange={setEx("dostupPlyazh")} />
          <MiniField label="Название ЖК / пансионата / комплекса" value={extra.kurortZhk || ""} onChange={setEx("kurortZhk")} />
          <MiniChips label="Вид на озеро" options={["Прямой", "Частичный", "Отсутствует", "Не уточнён"]} value={extra.vidIzOkna || ""} onChange={setEx("vidIzOkna")} />
          <MiniMultiChips label="Инфраструктура комплекса" options={["Бассейн", "Ресторан", "Кафе", "Детская площадка", "Спортивная площадка", "Парковка", "СПА / баня", "Пляж", "Конференц-зал", "Зона отдыха", "Другое"]} value={extra.infraKompleksa} onChange={setEx("infraKompleksa")} />
          <MiniChips label="Парковка" options={["Есть", "Нет"]} value={extra.parkovkaIK || ""} onChange={setEx("parkovkaIK")} />
          <MiniChips label="Сезонность использования" options={["Круглогодично", "Только летний сезон", "Только зимний сезон", "По договорённости"]} value={extra.sezonnost || ""} onChange={setEx("sezonnost")} />
          <MiniField label="Дополнительные условия, связанные с курортной недвижимостью" value={extra.dopUsloviyaKurort || ""} onChange={setEx("dopUsloviyaKurort")} long />
          <MiniField label="Количество гостей" value={extra.kolvoGostey || ""} onChange={setEx("kolvoGostey")} />
          <MiniField label="Количество спальных мест" value={extra.spalnyhMest || ""} onChange={setEx("spalnyhMest")} />
          <MiniField label="Свободные даты" value={extra.svobodnyeDaty || ""} onChange={setEx("svobodnyeDaty")} long />
          <MiniField label="Сезонные цены" value={extra.sezonnyeCeny || ""} onChange={setEx("sezonnyeCeny")} long />
          <MiniField label="Время заезда" value={extra.zaezdVremya || ""} onChange={setEx("zaezdVremya")} />
          <MiniField label="Время выезда" value={extra.viezdVremya || ""} onChange={setEx("viezdVremya")} />
          <MiniField label="Условия бронирования и отмены" value={extra.usloviyaBroni || ""} onChange={setEx("usloviyaBroni")} long />
          <MiniMultiChips label="Сезон доступности" options={["Весь год", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Зимний сезон", "По договорённости"]} value={extra.sezonDostupnosti} onChange={setEx("sezonDostupnosti")} />
        </Accordion>
      )}

      <div className="field-group">
        <div className="field-label">Описание для клиента <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <AutoTextarea className={`field-textarea required-input ${attemptedSubmit && !description ? "field-error" : ""}`} value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="ai-btn" type="button" disabled>✨ Сформировать описание с ИИ (следующий этап)</button>
      </div>

      <div className="field-group">
        <div className="field-label">Фото объекта</div>
        <PhotoUploader photos={photos} onChange={setPhotos} />
      </div>

      <VideoReviewBlock videos={videos} onChange={setVideos} onPendingErrorChange={setVideoPendingError} />

      <div className="section-divider private">
        <div className="section-divider-title big">Информация для агента</div>
        <span className="lock-badge lock-yellow">🔒 ВИДИТЕ ТОЛЬКО ВЫ И РУКОВОДИТЕЛЬ — клиенты и другие агенты НЕ видят</span>
      </div>
      <div className="field-group">
        <div className="field-label">ФИО собственника</div>
        <input className="field-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
      </div>
      <div className="field-group">
        <PhoneInput label="Телефон собственника" required value={ownerPhone} onChange={setOwnerPhone} whiteBg error={attemptedSubmit && !isPhoneComplete(ownerPhone)} />
      </div>

      <div className="field-group">
        <PhoneInput label="Номер WhatsApp собственника" required value={ownerWhatsapp} onChange={setOwnerWhatsapp} whiteBg error={attemptedSubmit && !isPhoneComplete(ownerWhatsapp)} />
      </div>
      <div className="field-group">
        <div className="field-label">Точный адрес</div>
        <input className="field-input" value={exactAddress} onChange={(e) => setExactAddress(e.target.value)} />
      </div>
      <div className="field-group">
        <div className="field-label">Кадастровый номер</div>
        <input className="field-input" value={extra.kadastrNomer || ""} onChange={(e) => setEx("kadastrNomer")(e.target.value)} placeholder="Видят только агенты" />
      </div>
      <div className="field-group">
        <div className="field-label">Дополнительные условия собственника (не для публикации)</div>
        <input className="field-input" value={extra.dopUsloviyaSobstvennika || ""} onChange={(e) => setEx("dopUsloviyaSobstvennika")(e.target.value)} placeholder="Видят только агенты" />
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

      <div className="section-divider" style={{ borderTopColor: "var(--line)" }}>
        <div className="section-divider-title big" style={{ color: "var(--text2)" }}>Финансовая информация</div>
        <span className="lock-badge lock-yellow">👥 ВИДЯТ ТОЛЬКО АГЕНТЫ, РОП И АДМИН — клиенты НЕ видят</span>
      </div>
      <div className="field-group">
        <div className="field-label">Комиссия, % / сумма <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !commissionPercent ? "field-error" : ""}`} value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} placeholder="3% или $500" />
      </div>
      <div className="field-group">
        <div className="field-label">Условия комиссии <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !commissionTerms ? "field-error" : ""}`} value={commissionTerms} onChange={(e) => setCommissionTerms(e.target.value)} placeholder="50/50, 100% и т.д." />
      </div>
      <div className="field-group">
        <div className="field-label">Комментарий агента</div>
        <AutoTextarea className="field-textarea" value={agentComment} onChange={(e) => setAgentComment(e.target.value)} placeholder="Видят все агенты, РОП, Админ — не видит клиент" />
      </div>

      <div className="section-divider private"><div className="section-divider-title">Договор с собственником <span className="star">*</span></div></div>
      <div className="field-group">
        <div className={`chip-group ${attemptedSubmit && !contractStatus ? "field-error" : ""}`}>
          {["без договора", "с договором"].map((s) => (
            <div key={s} className={`chip ${contractStatus === s ? "selected" : ""}`} onClick={() => setContractStatus(s)}>
              {s === "без договора" ? "Без договора" : "С договором"}
            </div>
          ))}
        </div>
        {attemptedSubmit && !contractStatus && <div className="ag-error">Выберите: договор с собственником есть или его нет</div>}
        {contractStatus === "с договором" && (
          <div style={{ marginTop: 14 }}>
            <div className="mini-field-label">Дата заключения договора</div>
            <input className="field-input" type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
            <div className="mini-field-label" style={{ marginTop: 10 }}>Тип договора (если нужно указать)</div>
            <input className="field-input" value={contractType} onChange={(e) => setContractType(e.target.value)} placeholder="Например: эксклюзивный" />
            <div className="mini-field-label" style={{ marginTop: 14 }}>Фото договора</div>
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
        <span className="lock-badge" style={{ color: "var(--accent-text)", background: "var(--fill)", borderColor: "var(--line)" }}>👁 ВИДЕН ВСЕМ</span>
      </div>
      <AgentAssign name={agentName} phone={agentPhone} attempted={attemptedSubmit} onChange={(n, ph) => { setAgentName(n); setAgentPhone(ph); }} />

      {error && <div className="status-msg error">Ошибка: {error}</div>}
      {success && <div className="status-msg success">{editId ? "Изменения сохранены! Возвращаемся к объекту..." : "Объект сохранён! Возвращаемся на главную..."}</div>}

      <button className="next-btn" disabled={saving} onClick={() => {
        if (!canSubmit) {
          setAttemptedSubmit(true);
          setTimeout(() => { const el = document.querySelector(".field-error"); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
        } else if (editId) setConfirmSave(true);
        else handleSubmit();
      }}>
        {saving ? "СОХРАНЕНИЕ..." : (editId ? "СОХРАНИТЬ ИЗМЕНЕНИЯ" : "ОПУБЛИКОВАТЬ")}
      </button>
      {attemptedSubmit && !canSubmit && (
        <div className="status-msg error">Не заполнено: {missingFields.join(", ")}</div>
      )}
      <ConfirmDialog open={confirmSave} title="Сохранить изменения?"
        text="Проверьте, что всё заполнено верно. Изменения сразу появятся в объекте."
        onConfirm={() => { setConfirmSave(false); handleSubmit(); }} onCancel={() => setConfirmSave(false)} />
      {/* Черновик — только для нового объекта или объекта, который ещё черновик.
          Опубликованный объект без обязательных полей сохранить нельзя. */}
      {(!editId || !currentStatus || currentStatus === "черновик") && <button
        disabled={saving || videoPendingError}
        onClick={handleSaveDraft}
        className="draft-btn"
      >
        💾 Сохранить черновик
        <small>можно продолжить позже, обязательные поля заполнять не нужно</small>
      </button>}
      <div className="progress-note">Поля со звёздочкой * обязательны</div>
    </div>
  );
}

export default function ArendaPage() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ paddingBottom: 40 }} />}>
      <ArendaForm />
    </Suspense>
  );
}
