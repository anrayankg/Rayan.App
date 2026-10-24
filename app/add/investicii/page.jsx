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


// ===== ИНВЕСТИЦИИ: варианты выбора (бриф «Инвестиции») =====
const INV_PUB = ["Предложение для инвесторов", "Поиск инвестора"];
const INV_NAPR = ["Покупка недвижимости для последующей сдачи в аренду", "Покупка недвижимости для перепродажи", "Инвестиции в новостройку", "Инвестиции в строительство жилого дома", "Инвестиции в многоквартирный жилой комплекс", "Инвестиции в таунхаусы / дуплексы", "Инвестиции в коммерческую недвижимость", "Инвестиции в гостиницу / пансионат / базу отдыха", "Инвестиции в земельный участок", "Реконструкция или завершение строительства", "Инвестиции в действующий бизнес с недвижимостью", "Долевое участие в проекте", "Другое"];
const INV_GEO = ["Бишкек", "Чуйская область", "Иссык-Кульская область", "Ош и Ошская область", "Другие регионы Кыргызстана", "За пределами Кыргызстана"];
const INV_DOCS = ["Правоустанавливающие документы", "Кадастровые документы", "Разрешение на строительство", "Проектная документация", "Технический паспорт", "Другие документы проекта"];
const INV_NEED = ["Приобретение земли", "Покупка недвижимости", "Проектирование", "Разрешительные документы", "Строительные работы", "Строительные материалы", "Подключение коммуникаций", "Отделка", "Благоустройство", "Покупка оборудования", "Запуск бизнеса", "Расширение действующего проекта", "Другое"];

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

function InvesticiiForm() {
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

  const [city, setCity] = useState(""); // у инвестиционного проекта место не обязательно
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

  const ikGeo = !!region || extra.geografiya === "Иссык-Кульская область";
  const districtRequired = city === "Бишкек" || ikGeo;
  const commsSel = extra.kommunikacii || [];
  const inside = false, detached = false, withLand = true, underBuild = false;
  const isOtherInv = extra.napravlenie === "Другое";
  const isOffer = extra.tipPublikacii === "Предложение для инвесторов";
  const isSeek = extra.tipPublikacii === "Поиск инвестора";
  const missingFields = [
    !extra.tipPublikacii && "Что размещаете: предложение или поиск инвестора", !extra.napravlenie && "Направление проекта", isOtherInv && !extra.napravlenieInoe && "Уточните направление",
    !extra.nazvanieProekta && "Название проекта", !extra.kratkoeOpisanie && "Краткое описание проекта",
    !price && "Сколько денег требуется привлечь", !extra.riski && "Основные риски проекта",
    !contractStatus && "Договор RAYAN с источником (есть / нет)",
    !isPhoneComplete(ownerPhone) && "Телефон источника",
    !isPhoneComplete(ownerWhatsapp) && "WhatsApp источника",
    !isPhoneComplete(agentPhone) && "Телефон агента",
    !commissionPercent && "Комиссия", !commissionTerms && "Условия комиссии", !description && "Описание для публикации",
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
        type: "инвестиции",
        price: numOrNull(price),
        currency_new: currency,
        district, city: city || "Не указан",
        area_m2: numOrNull(area), plot_sotka: numOrNull(String(plot).replace(",", ".")),
        floor: null, floors_total: null,
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
        type: "инвестиции",
        price: Number(price),
        currency_new: currency,
        district,
        city: city || "Не указан",
        area_m2: numOrNull(area),
        plot_sotka: numOrNull(String(plot).replace(",", ".")),
        floor: null,
        floors_total: null,
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
        <div className="page-title">{editId ? "Редактирование — Инвестиции" : "Инвестиции"}</div>
      </div>


      <div className="section-divider"><div className="section-divider-title big">ОБЯЗАТЕЛЬНЫЕ ПОЛЯ</div></div>

      <CategorySwitch current="investicii" editId={editId} region={region} />

      <div className="field-group">
        <Picker label="Что вы размещаете" required options={INV_PUB} value={extra.tipPublikacii || ""} onChange={setEx("tipPublikacii")} error={attemptedSubmit && !extra.tipPublikacii} />
        <div className="field-hint">«Предложение для инвесторов» — есть объект или проект, куда предлагается вложить деньги. «Поиск инвестора» — нужно финансирование для проекта. Полями формы это не смешивается.</div>
      </div>
      <div className="field-group">
        <Picker label="Направление проекта" required options={INV_NAPR} value={extra.napravlenie || ""} onChange={setEx("napravlenie")} error={attemptedSubmit && !extra.napravlenie} />
      </div>
      {isOtherInv && (
        <div className="field-group">
          <div className="field-label">Уточните направление <span className="star">*</span></div>
          <input className={`field-input required-input ${attemptedSubmit && !extra.napravlenieInoe ? "field-error" : ""}`} value={extra.napravlenieInoe || ""} onChange={(e) => setEx("napravlenieInoe")(e.target.value)} />
        </div>
      )}
      <div className="field-group">
        <div className="field-label">Название проекта <span className="star">*</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !extra.nazvanieProekta ? "field-error" : ""}`} value={extra.nazvanieProekta || ""} onChange={(e) => setEx("nazvanieProekta")(e.target.value)} />
      </div>
      <div className="field-group">
        <div className="field-label">Краткое описание проекта <span className="star">*</span></div>
        <AutoTextarea className={`field-textarea ${attemptedSubmit && !extra.kratkoeOpisanie ? "field-error" : ""}`} value={extra.kratkoeOpisanie || ""} onChange={(e) => setEx("kratkoeOpisanie")(e.target.value)} placeholder="Суть проекта в нескольких предложениях" />
      </div>
      {!isSeek && (
        <>
      <div className="field-group">
        <Picker label="География проекта (если проект привязан к месту)" options={INV_GEO} value={extra.geografiya || ""}
          onChange={(v) => { setEx("geografiya")(v); if (v === "За пределами Кыргызстана") { setCity("За пределами Кыргызстана"); setDistrict(""); } }} />
        <div className="field-hint">Место указывать не обязательно. Если проект привязан к месту — выберите город; для Иссык-Куля появятся «Район или город» и «Населённый пункт».</div>
      </div>

      <div className="field-group">
        {ikGeo ? (
          <>
            {region && <div className="ik-banner">🏖 Раздел «Иссык-Куль»</div>}
            <IssykKulGeo district={district} city={city} errorDistrict={false} errorCity={false}
              onChange={(d, c, aimak, kind, la, lo, code) => { setDistrict(d); setCity(c); setEx("aiylAimak")(aimak || ""); setEx("tipNP")(kind || ""); setEx("soateCode")(code || ""); if (la && lo) { setMapLat(la); setMapLng(lo); } }} />
            <div className="field-group">
              <div className="field-label">Микрорайон, улица, адрес или описание местоположения</div>
              <input className="field-input" value={extra.adresOpisanie || ""} onChange={(e) => setEx("adresOpisanie")(e.target.value)} placeholder="Улица, ориентир, курорт или комплекс" />
            </div>
          </>
        ) : (
          <LocationPicker
            label="Город (необязательно)"
            options={CITIES}
            value={city}
            onChange={(v) => { setCity(v); setDistrict(""); }}
          />
        )}
      </div>

      <div className="field-group">
        {CITY_DISTRICTS[city]?.length > 0 ? (
          <LocationPicker
            label="Район (необязательно)"
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
          label="Точка на карте (если проект привязан к конкретному месту)"
          lat={mapLat}
          lng={mapLng}
          flyToQuery={district}
          flyToCity={city}
          onChange={(lat, lng) => { setMapLat(lat); setMapLng(lng); }}
        />
      </div>

      {!ikGeo && (
        <div className="field-group">
          <div className="field-label">Точный адрес или описание местоположения</div>
          <input className="field-input" value={extra.adresOpisanie || ""} onChange={(e) => setEx("adresOpisanie")(e.target.value)} placeholder="Адрес, район, описание участка" />
        </div>
      )}
        </>
      )}

      <div className="field-group">
        <div className="field-label">Сколько денег требуется привлечь <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !price ? "field-error" : ""}`} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Сумма" />
        <div className="currency-toggle">
          {["USD", "KGS"].map((c) => (
            <div key={c} className={`currency-btn required-chip ${currency === c ? "selected" : ""}`} onClick={() => setCurrency(c)}>{c === "USD" ? "$ USD" : "KGS сом"}</div>
          ))}
        </div>
        <div className="field-hint">Валюта относится ко всем суммам проекта.</div>
      </div>
      <div className="field-group">
        <div className="field-label">Основные риски проекта <span className="star">*</span></div>
        <AutoTextarea className={`field-textarea ${attemptedSubmit && !extra.riski ? "field-error" : ""}`} value={extra.riski || ""} onChange={(e) => setEx("riski")(e.target.value)} placeholder="Опишите риски честно. Доходность, срок окупаемости и возврат вложений не гарантируются." />
      </div>

      <div className="section-divider">
        <div className="section-divider-title big">ДОПОЛНИТЕЛЬНО <span style={{ fontSize: "0.4em", fontWeight: 500, textTransform: "none", letterSpacing: "0.02em" }}>(не обязательно)</span></div>
      </div>
      <Accordion title="О ПРОЕКТЕ" defaultOpen={true}>
        <MiniChips label="Кто реализует проект" options={["Собственник", "Застройщик", "Предприниматель", "Управляющая компания", "Представитель проекта", "Партнёр", "Другое"]} value={extra.kemRealizuetsya || ""} onChange={setEx("kemRealizuetsya")} />
        <MiniField label="Название компании или организации" value={extra.kompaniya || ""} onChange={setEx("kompaniya")} />
        <MiniChips label="Тип недвижимости" options={["Квартира", "Жилой дом", "Многоквартирный комплекс", "Таунхаус / дуплекс", "Коммерческое помещение", "Офис", "Магазин", "Склад", "Гостиница / пансионат", "Земельный участок", "Другой объект"]} value={extra.tipNedvizhimosti || ""} onChange={setEx("tipNedvizhimosti")} />
        <MiniChips label="Стадия проекта" options={["Идея", "Подготовка", "Участок приобретён", "Проектирование", "Оформление разрешений", "Строительство начато", "Строительство продолжается", "Объект готов", "Объект уже работает", "Проект расширяется"]} value={extra.stadiyaProekta || ""} onChange={setEx("stadiyaProekta")} />
        <div className="mini-field-label">Общая площадь проекта, м²</div>
        <input className="field-input" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} />
        <div className="mini-field-label" style={{ marginTop: 10 }}>Площадь участка, соток (если применимо)</div>
        <input className="field-input" inputMode="decimal" value={plot} onChange={(e) => setPlot(e.target.value.replace(/[^\d.,]/g, ""))} />
        <MiniField label="Количество объектов / помещений" value={extra.kolvoObektov || ""} onChange={setEx("kolvoObektov")} />
        <MiniField label="Планируемый срок начала проекта" value={extra.srokNachala || ""} onChange={setEx("srokNachala")} />
        <MiniField label="Планируемый срок завершения" value={extra.srokZaversheniya || ""} onChange={setEx("srokZaversheniya")} />
        <MiniField label="Что уже сделано в проекте" value={extra.chtoSdelano || ""} onChange={setEx("chtoSdelano")} long />
        <MiniField label="Что ещё необходимо сделать" value={extra.chtoOstalos || ""} onChange={setEx("chtoOstalos")} long />
      </Accordion>

      <Accordion title="ФИНАНСОВЫЕ ПАРАМЕТРЫ">
        <MiniField label="Общая стоимость проекта" value={extra.stoimostProekta || ""} onChange={setEx("stoimostProekta")} />
        <MiniField label="Сколько собственных средств уже вложено" value={extra.sobstvennyeVlozheniya || ""} onChange={setEx("sobstvennyeVlozheniya")} />
        <MiniField label="Минимальная сумма участия инвестора" value={extra.minUchastie || ""} onChange={setEx("minUchastie")} />
        <MiniField label="Максимальная сумма участия (если ограничена)" value={extra.maxUchastie || ""} onChange={setEx("maxUchastie")} />
        <MiniField label="Какую часть проекта планируется профинансировать инвестициями" value={extra.chastFinansirovaniya || ""} onChange={setEx("chastFinansirovaniya")} long />
        <MiniMultiChips label="На что требуются деньги" options={["Приобретение земли", "Покупка недвижимости", "Проектирование", "Разрешительные документы", "Строительные работы", "Строительные материалы", "Подключение коммуникаций", "Отделка", "Благоустройство", "Покупка оборудования", "Запуск бизнеса", "Расширение действующего проекта", "Другое"]} value={extra.naChtoDengi} onChange={setEx("naChtoDengi")} />
        <MiniField label="Планируемая продолжительность инвестиционного цикла" value={extra.tsiklInvest || ""} onChange={setEx("tsiklInvest")} />
        <MiniField label="Источник остальных средств" value={extra.istochnikOstalnyh || ""} onChange={setEx("istochnikOstalnyh")} long />
      </Accordion>

      <Accordion title="УСЛОВИЯ ДЛЯ ИНВЕСТОРА">
        <MiniChips label="Формат участия" options={["Доля в проекте", "Доля в собственности", "Совместное строительство", "Предоставление займа", "Инвестиции с возвратом капитала и согласованным доходом", "Инвестиции в действующий бизнес", "Другое"]} value={extra.formatUchastiya || ""} onChange={setEx("formatUchastiya")} />
        <div className="field-hint">Формы участия описывают фактическую договорённость сторон. Они не взаимозаменяемы юридически.</div>
        <MiniChips label="Как инвестор получает доход" options={["Доля от прибыли", "Доход от аренды", "Доход от продажи готовых объектов", "Фиксированная выплата по договору", "Возврат капитала и согласованный доход", "Другой способ"]} value={extra.kakDohod || ""} onChange={setEx("kakDohod")} />
        <MiniField label="Планируемая доля инвестора, %" value={extra.dolyaInvestora || ""} onChange={setEx("dolyaInvestora")} />
        <MiniField label="Планируемая доля инициатора проекта, %" value={extra.dolyaInitsiatora || ""} onChange={setEx("dolyaInitsiatora")} />
        <MiniField label="Предполагаемый доход инвестора (сумма или %, если есть обоснованный расчёт)" value={extra.predpolagaemyiDohod || ""} onChange={setEx("predpolagaemyiDohod")} />
        <MiniChips label="Период, за который указан доход" options={["Месяц", "Год", "Весь инвестиционный цикл", "Другой период"]} value={extra.periodDohoda || ""} onChange={setEx("periodDohoda")} />
        <MiniField label="Планируемый срок возврата капитала" value={extra.srokVozvrata || ""} onChange={setEx("srokVozvrata")} />
        <MiniChips label="Участие инвестора в управлении" options={["Да", "Нет", "По договорённости"]} value={extra.uchastieUpravlenie || ""} onChange={setEx("uchastieUpravlenie")} />
        <MiniField label="Как предоставляется отчётность инвестору" value={extra.otchetnost || ""} onChange={setEx("otchetnost")} long />
        <MiniField label="Кто отвечает за управление и реализацию проекта" value={extra.otvetstvennyi || ""} onChange={setEx("otvetstvennyi")} long />
        <MiniField label="Как принимаются ключевые решения" value={extra.resheniya || ""} onChange={setEx("resheniya")} long />
        <MiniField label="Условия выхода инвестора из проекта" value={extra.usloviyaVyhoda || ""} onChange={setEx("usloviyaVyhoda")} long />
        <MiniField label="Условия распределения прибыли и убытков" value={extra.pribylUbytki || ""} onChange={setEx("pribylUbytki")} long />
        <MiniField label="Гарантии или способы обеспечения по договору (если применимо)" value={extra.garantii || ""} onChange={setEx("garantii")} long />
        <MiniField label="Дополнительные условия участия" value={extra.dopUsloviyaInvest || ""} onChange={setEx("dopUsloviyaInvest")} long />
        <div className="field-hint">Прогнозный доход, срок окупаемости и возврат капитала не гарантированы, если это не подтверждено договорными условиями. Даже договор не устраняет инвестиционные риски.</div>
      </Accordion>

      <Accordion title="ОБЪЕКТ И ДОКУМЕНТЫ">
        <MiniChips label="Есть ли земельный участок" options={["В собственности", "На другом законном основании", "В процессе приобретения", "Ещё не приобретён", "Не применимо"]} value={extra.zemlyaEst || ""} onChange={setEx("zemlyaEst")} />
        <MiniField label="Правовой статус участка / недвижимости" value={extra.pravovoyStatus || ""} onChange={setEx("pravovoyStatus")} />
        <MiniChips label="Назначение земли (если применимо)" options={["ПМЖ", "ИЖС", "Коммерческое", "Дачный участок", "Садоводство", "Сельхозназначение", "Под ЖК", "Другое"]} value={extra.naznachenieZemliInv || ""} onChange={setEx("naznachenieZemliInv")} />
        <MiniMultiChips label="Документы проекта" options={INV_DOCS} value={docs} onChange={setDocs} />
        <MiniField label="Стадия получения разрешений" value={extra.stadiyaRazresheniy || ""} onChange={setEx("stadiyaRazresheniy")} long />
        <MiniChips label="Обременения, аресты или залоги" options={["Есть", "Нет", "Неизвестно"]} value={extra.obremeneniya || ""} onChange={setEx("obremeneniya")} />
        <MiniField label="Какие именно (если есть)" value={extra.obremeneniyaOpisanie || ""} onChange={setEx("obremeneniyaOpisanie")} long />
        <MiniField label="Другие документы проекта" value={extra.drugieDokumenty || ""} onChange={setEx("drugieDokumenty")} long />
        <div className="field-hint">Указывайте фактический статус документов. Анкета не подтверждает, что проект законен или разрешён к строительству. Фото и сканы документов добавляются ниже в закрытой части «Информация для агента».</div>
      </Accordion>

      <Accordion title="ОБЪЕКТ УЖЕ ПРИНОСИТ ДОХОД">
        <MiniYesNo label="Объект сдан в аренду" value={extra.sdanVArendu || ""} onChange={setEx("sdanVArendu")} />
        {extra.sdanVArendu === "Да" && (
          <>
            <MiniField label="Кто арендатор (если раскрытие допустимо)" value={extra.arendatorKto || ""} onChange={setEx("arendatorKto")} />
            <MiniField label="Размер арендной платы" value={extra.arendaSumma || ""} onChange={setEx("arendaSumma")} />
            <MiniField label="Период поступления дохода" value={extra.arendaPeriod || ""} onChange={setEx("arendaPeriod")} />
            <MiniField label="Коммунальные расходы" value={extra.kommunalnyeRashody || ""} onChange={setEx("kommunalnyeRashody")} />
            <MiniField label="Другие расходы на содержание" value={extra.drugieRashody || ""} onChange={setEx("drugieRashody")} />
            <MiniField label="Доход до расходов" value={extra.dohodDoRashodov || ""} onChange={setEx("dohodDoRashodov")} />
            <MiniField label="Чистый доход после расходов (если данные предоставлены)" value={extra.chistyiDohod || ""} onChange={setEx("chistyiDohod")} />
            <MiniField label="Действующий срок аренды" value={extra.srokArendy || ""} onChange={setEx("srokArendy")} />
            <MiniField label="Депозит и условия договора аренды" value={extra.depozitUsloviya || ""} onChange={setEx("depozitUsloviya")} />
            <MiniYesNo label="Возможность повышения арендной платы" value={extra.povyshenieArendy || ""} onChange={setEx("povyshenieArendy")} />
            <MiniField label="Исторический доход (если есть данные)" value={extra.istoricheskiiDohod || ""} onChange={setEx("istoricheskiiDohod")} />
            <MiniField label="Ожидаемая окупаемость (расчётная оценка, не гарантия)" value={extra.okupaemost || ""} onChange={setEx("okupaemost")} />
          </>
        )}
      </Accordion>

      <Accordion title="РИСКИ И МАТЕРИАЛЫ">
        <MiniField label="Возможные задержки и факторы, влияющие на сроки" value={extra.zaderzhki || ""} onChange={setEx("zaderzhki")} long />
        <MiniField label="Зависимость от разрешений, финансирования, строительства или продаж" value={extra.zavisimost || ""} onChange={setEx("zavisimost")} long />
        <div className="field-hint">Основные фото добавляются ниже в «Фото объекта». Документы-файлы пока не загружаются: вставьте ссылку (Google Диск, Яндекс Диск и т.п.).</div>
        <MiniField label="Ссылка на фото текущей стадии строительства" value={extra.ssylkaFotoStadii || ""} onChange={setEx("ssylkaFotoStadii")} />
        <MiniField label="Ссылка на визуализации / 3D" value={extra.ssylkaVizualizacii || ""} onChange={setEx("ssylkaVizualizacii")} />
        <MiniField label="Ссылка на генплан или схему участка" value={extra.ssylkaGenplan || ""} onChange={setEx("ssylkaGenplan")} />
        <MiniField label="Ссылка на презентацию проекта" value={extra.ssylkaPrezentaciya || ""} onChange={setEx("ssylkaPrezentaciya")} />
        <MiniField label="Ссылка на финансовую модель / смету" value={extra.ssylkaSmeta || ""} onChange={setEx("ssylkaSmeta")} />
        <MiniField label="Дополнительные материалы" value={extra.dopMaterialy || ""} onChange={setEx("dopMaterialy")} long />
      </Accordion>

      {isOffer && (
      <Accordion title="ДЛЯ ПРЕДЛОЖЕНИЯ ИНВЕСТОРАМ" defaultOpen={true}>
        <MiniField label="Что именно получает инвестор в обмен на вложения" value={extra.chtoPoluchaetInvestor || ""} onChange={setEx("chtoPoluchaetInvestor")} long />
        <MiniField label="Доступная доля или объём участия" value={extra.dostupnayaDolya || ""} onChange={setEx("dostupnayaDolya")} long />
        <MiniField label="Сколько уже привлечено" value={extra.uzhePrivlecheno || ""} onChange={setEx("uzhePrivlecheno")} />
        <MiniField label="Сколько ещё требуется привлечь" value={extra.eshcheTrebuetsya || ""} onChange={setEx("eshcheTrebuetsya")} />
        <MiniField label="Контакт для обсуждения условий" value={extra.kontaktObsuzhdeniya || ""} onChange={setEx("kontaktObsuzhdeniya")} />
        <MiniChips label="Можно ли предоставить финансовые документы инвестору" options={["Да, после первичного обращения", "Нет", "Уточняется"]} value={extra.finDokumenty || ""} onChange={setEx("finDokumenty")} />
      </Accordion>

      )}

      {isSeek && (
      <Accordion title="ДЛЯ ПОИСКА ИНВЕСТОРА" defaultOpen={true}>
        <MiniField label="К какому сроку требуется финансирование" value={extra.kSroku || ""} onChange={setEx("kSroku")} />
        <MiniField label="Почему финансирование нужно именно сейчас" value={extra.pochemuSeychas || ""} onChange={setEx("pochemuSeychas")} long />
        <MiniField label="Что будет достигнуто после получения инвестиций" value={extra.chtoBudetDostignuto || ""} onChange={setEx("chtoBudetDostignuto")} long />
        <MiniField label="Какой вклад, кроме денег, вносит инициатор проекта" value={extra.vkladKromeDeneg || ""} onChange={setEx("vkladKromeDeneg")} long />
      </Accordion>

      )}

      <div className="field-group">
        <div className="field-label">Описание для публикации <span className="star">*</span><span className="required-note">(обязательно)</span></div>
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
        <div className="field-label">Внутренний комментарий RAYAN</div>
        <input className="field-input" value={extra.vnutrKommentarRayan || ""} onChange={(e) => setEx("vnutrKommentarRayan")(e.target.value)} placeholder="Видят только агенты" />
      </div>
      <div className="field-group">
        <div className="field-label">Соглашение между инициатором проекта и инвестором</div>
        <div className="chip-group">
          {["Есть", "В процессе", "Нет"].map((v) => (
            <div key={v} className={`chip ${extra.soglashenieStoron === v ? "selected" : ""}`} onClick={() => setEx("soglashenieStoron")(v)}>{v}</div>
          ))}
        </div>
        <div className="field-hint">Это не то же самое, что договор RAYAN с источником (он ниже). Это отдельные документы.</div>
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

      <div className="section-divider private"><div className="section-divider-title">Договор RAYAN с источником предложения <span className="star">*</span></div></div>
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

export default function InvesticiiPage() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ paddingBottom: 40 }} />}>
      <InvesticiiForm />
    </Suspense>
  );
}
