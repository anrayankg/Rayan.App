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

function KommerciyaForm() {
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
  const inside = extra.formaObekta === "Помещение внутри здания";
  const detached = extra.formaObekta === "Отдельно стоящее здание";
  const withLand = extra.zemlya === "Да";
  const underBuild = !!extra.stadiya && extra.stadiya !== "Вторичка (готовый объект)";
  const missingFields = [
    !extra.tipObekta && "Тип объекта", !extra.tochnoeNaznachenie && "Точное назначение",
    !city && "Город", city && districtRequired && !district && "Район", !(mapLat && mapLng) && "Точка на карте",
    !extra.pervayaLiniya && "Первая линия", !extra.formaObekta && "Здание или помещение", !extra.stadiya && "Стадия объекта",
    underBuild && !extra.statusStroit && "Статус строительства", underBuild && !extra.srokGod && "Год сдачи",
    !area && "Общая площадь",
    inside && !floor && "Этаж", (inside || detached) && !floorsTotal && "Этажей в здании",
    !extra.zemlya && "Земля идёт с объектом",
    withLand && !plot && "Площадь участка", withLand && !extra.knigaUchastka && "Книга на участок",
    withLand && !extra.naznachenie_zemli && "Назначение земли", withLand && !extra.pravoZemli && "Право на землю",
    !extra.remont && "Состояние / ремонт", commsSel.length === 0 && "Коммуникации", !heating && "Отопление",
    docs.length === 0 && "Документы", !underBuild && !extra.tehpasportDom && "Техпаспорт", !extra.domSdan && "Сдан в эксплуатацию",
    !(extra.stenyKonstrukciya && extra.stenyKonstrukciya.length) && "Материал стен", !underBuild && !extra.godPostroiki && "Год постройки",
    !contractStatus && "Договор с собственником (есть / нет)",
    !price && "Цена",
    !isPhoneComplete(ownerPhone) && "Телефон собственника",
    !isPhoneComplete(ownerWhatsapp) && "WhatsApp собственника",
    !isPhoneComplete(agentPhone) && "Телефон агента",
    !commissionPercent && "Комиссия", !commissionTerms && "Условия комиссии",
    !vRuki && "Цена в руки", dealTerms.length === 0 && "Условия сделки", !description && "Описание",
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
        type: "коммерция",
        price: numOrNull(price),
        currency_new: currency,
        district, city,
        area_m2: numOrNull(area), plot_sotka: withLand ? numOrNull(String(plot).replace(",", ".")) : null,
        floor: floorToNumber(floor, floorsTotal), floors_total: numOrNull(floorsTotal),
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
        type: "коммерция",
        price: Number(price),
        currency_new: currency,
        district,
        city,
        area_m2: Number(area),
        plot_sotka: withLand ? Number(String(plot).replace(",", ".")) : null,
        floor: floorToNumber(floor, floorsTotal),
        floors_total: numOrNull(floorsTotal),
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
        <div className="page-title">{editId ? "Редактирование — Коммерция" : "Коммерция"}</div>
      </div>


      <div className="section-divider"><div className="section-divider-title big">ОБЯЗАТЕЛЬНЫЕ ПОЛЯ</div></div>

      <CategorySwitch current="kommerciya" editId={editId} region={region} />

      <div className="field-group">
        <Picker label="Тип коммерческого объекта" required options={TIP_OBEKTA} value={extra.tipObekta || ""} onChange={setEx("tipObekta")} error={attemptedSubmit && !extra.tipObekta} />
      </div>

      <div className="field-group">
        <div className="field-label">Точное назначение — что сейчас работает в объекте <span className="star">*</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !extra.tochnoeNaznachenie ? "field-error" : ""}`} value={extra.tochnoeNaznachenie || ""} onChange={(e) => setEx("tochnoeNaznachenie")(e.target.value)} placeholder="Например: продуктовый магазин, аптека, склад" />
      </div>

      <div className="field-group">
        <div className="field-label">Для чего можно использовать (если известно)</div>
        <input className="field-input" value={extra.dlyaChego || ""} onChange={(e) => setEx("dlyaChego")(e.target.value)} placeholder="Фактическое и разрешённое назначение" />
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
        <Picker label="Первая линия" required options={["Да", "Нет"]} value={extra.pervayaLiniya || ""} onChange={setEx("pervayaLiniya")} error={attemptedSubmit && !extra.pervayaLiniya} />
      </div>

      <div className="field-group">
        <Picker label="Отдельно стоящее здание или помещение внутри здания" required options={["Отдельно стоящее здание", "Помещение внутри здания"]} value={extra.formaObekta || ""} onChange={setEx("formaObekta")} error={attemptedSubmit && !extra.formaObekta} />
      </div>

      <div className="field-group">
        <Picker label="Стадия объекта" required options={STADIYA_OPTS} value={extra.stadiya || ""} onChange={setEx("stadiya")} error={attemptedSubmit && !extra.stadiya} />
      </div>

      {underBuild && (
        <>
          <div className="field-group">
            <Picker label="Статус строительства" required options={CONSTRUCTION_STATUS_OPTS} value={extra.statusStroit || ""} onChange={setEx("statusStroit")} error={attemptedSubmit && !extra.statusStroit} />
          </div>
          <div className="field-group">
            <Picker label="Год сдачи" required options={DELIVERY_YEARS} value={extra.srokGod || ""} onChange={setEx("srokGod")} error={attemptedSubmit && !extra.srokGod} />
          </div>
          <div className="field-group">
            <Picker label="Квартал сдачи" options={["1 квартал", "2 квартал", "3 квартал", "4 квартал"]} value={extra.srokKvartal || ""} onChange={setEx("srokKvartal")} />
          </div>
        </>
      )}

      <div className="field-group">
        <div className="field-label">Общая площадь, м² <span className="star">*</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !area ? "field-error" : ""}`} type="number" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Например 120" />
      </div>

      {inside && (
        <div className="field-group">
          <Picker label="Этаж" required options={FLOOR_CHOICES} value={floor} onChange={setFloor} error={attemptedSubmit && !floor} />
        </div>
      )}

      {(inside || detached) && (
        <div className="field-group">
          <Picker label={inside ? "Этажей в здании" : "Количество этажей здания"} required options={FLOORS_TOTAL_CHOICES} value={floorsTotal} onChange={setFloorsTotal} error={attemptedSubmit && !floorsTotal} />
        </div>
      )}

      <div className="field-group">
        <Picker label="Земельный участок идёт с объектом" required options={["Да", "Нет"]} value={extra.zemlya || ""} onChange={setEx("zemlya")} error={attemptedSubmit && !extra.zemlya} />
      </div>

      {withLand && (
        <>
          <div className="field-group">
            <div className="field-label">Площадь участка, соток <span className="star">*</span></div>
            <div className="mini-field-label" style={{ marginTop: 2 }}>По документам</div>
            <input className={`field-input required-input ${attemptedSubmit && !plot ? "field-error" : ""}`} inputMode="decimal" value={plot} onChange={(e) => setPlot(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="Например 5" />
            <div className="mini-field-label" style={{ marginTop: 10 }}>Фактически (если отличается)</div>
            <input className="field-input" inputMode="decimal" value={extra.ploshadFakt || ""} onChange={(e) => setEx("ploshadFakt")(e.target.value)} placeholder="Например 5,5" />
          </div>
          <div className="field-group">
            <div className="field-label">Размер участка (длина × ширина)</div>
            <input className="field-input" value={extra.razmerUchastka || ""} onChange={(e) => setEx("razmerUchastka")(e.target.value)} placeholder="Например 20 × 30 м" />
          </div>
          <div className="field-group">
            <Picker label="Форма участка" options={FORMA_UCHASTKA} value={extra.formaUchastka || ""} onChange={setEx("formaUchastka")} />
          </div>
          <div className="field-group">
            <Picker label="Книга на участок" required options={KNIGA_OPTS} value={extra.knigaUchastka || ""} onChange={setEx("knigaUchastka")} error={attemptedSubmit && !extra.knigaUchastka} />
          </div>
          <div className="field-group">
            <Picker label="Назначение земли (как в документах)" required options={NAZNACHENIE_ZEMLI} value={extra.naznachenie_zemli || ""} onChange={setEx("naznachenie_zemli")} error={attemptedSubmit && !extra.naznachenie_zemli} />
          </div>
          <div className="field-group">
            <Picker label="Право на землю" required options={PRAVO_ZEMLI} value={extra.pravoZemli || ""} onChange={setEx("pravoZemli")} error={attemptedSubmit && !extra.pravoZemli} />
          </div>
        </>
      )}

      <div className="field-group">
        <Picker label="Состояние / ремонт" required options={REMONT_OPTS} value={extra.remont || ""} onChange={setEx("remont")} error={attemptedSubmit && !extra.remont} />
      </div>

      <div className="field-group">
        <MultiPicker label="Коммуникации" required options={["Электричество", "Газ", "Вода", "Канализация", "Септик", "Горячая вода"]} value={commsSel}
          onChange={(sel) => { setEx("kommunikacii")(sel); setCommsTouched(true); }} error={attemptedSubmit && commsSel.length === 0} />
      </div>

      <div className="field-group">
        <Picker label="Отопление" required options={HEATING_OPTS} value={heating} onChange={setHeating} error={attemptedSubmit && !heating} />
      </div>

      <div className="field-group">
        <MultiPicker label="Правоустанавливающие документы" required options={DOC_OPTIONS} value={docs} onChange={setDocs} error={attemptedSubmit && docs.length === 0} />
      </div>

      <div className="field-group">
        <Picker label="Техпаспорт" required={!underBuild} options={["Есть", "Нет"]} value={extra.tehpasportDom || ""} onChange={setEx("tehpasportDom")} error={attemptedSubmit && !underBuild && !extra.tehpasportDom} />
      </div>

      <div className="field-group">
        <Picker label="Сдан в эксплуатацию" required options={["Да", "Нет"]} value={extra.domSdan || ""} onChange={setEx("domSdan")} error={attemptedSubmit && !extra.domSdan} />
      </div>

      <div className="field-group">
        <MultiPicker label="Из чего построено (материал стен)" required options={WALL_CONSTRUCTION_OPTS} value={extra.stenyKonstrukciya || []} onChange={setEx("stenyKonstrukciya")} error={attemptedSubmit && !(extra.stenyKonstrukciya && extra.stenyKonstrukciya.length)} />
      </div>

      {!underBuild ? (
        <div className="field-group">
          <Picker label="Год постройки" required options={YEAR_BUILT} value={extra.godPostroiki || ""} onChange={setEx("godPostroiki")} error={attemptedSubmit && !extra.godPostroiki} />
        </div>
      ) : (
        <div className="field-hint" style={{ margin: "4px 0 14px" }}>Год постройки не нужен: у строящегося объекта выше указан «Год сдачи».</div>
      )}

      <div className="field-group">
        <div className="field-label">Цена <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !price ? "field-error" : ""}`} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Общая стоимость, не за м²" />
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
        <MultiPicker label="Условия сделки" required options={DEAL_TERMS_OPTS} value={dealTerms} onChange={setDealTerms} error={attemptedSubmit && dealTerms.length === 0} />
        {dealTerms.includes("Обмен") && (
          <div style={{ marginTop: 12 }}>
            <MultiPicker label="На что рассматривается обмен" options={OBMEN_OPTS} value={obmenNa} onChange={setObmenNa} />
            <input className="field-input" style={{ marginTop: 8 }} value={obmenDrugoe} onChange={(e) => setObmenDrugoe(e.target.value)} placeholder="Уточнить, если «Другое»" />
          </div>
        )}
      </div>

      <div className="section-divider">
        <div className="section-divider-title big">ДОПОЛНИТЕЛЬНО <span style={{ fontSize: "0.4em", fontWeight: 500, textTransform: "none", letterSpacing: "0.02em" }}>(не обязательно)</span></div>
      </div>
      <Accordion title="ЛОКАЦИЯ И ТРАФИК" defaultOpen={true}>
        <MiniChips label="Какая дорога рядом" options={["Центральная", "Магистраль", "Второстепенная", "Внутриквартальная"]} value={extra.dorogaRyadom || ""} onChange={setEx("dorogaRyadom")} />
        <MiniChips label="Пешеходный трафик" options={["Высокий", "Средний", "Низкий"]} value={extra.peshehTrafik || ""} onChange={setEx("peshehTrafik")} />
        <MiniChips label="Автомобильный трафик" options={["Высокий", "Средний", "Низкий"]} value={extra.avtoTrafik || ""} onChange={setEx("avtoTrafik")} />
        {extra.pervayaLiniya === "Нет" && (
          <>
            <MiniField label="Расстояние от первой линии" value={extra.rasstoyanieOtLinii || ""} onChange={setEx("rasstoyanieOtLinii")} />
            <MiniYesNo label="Есть видимость с дороги" value={extra.vidimostDorogi || ""} onChange={setEx("vidimostDorogi")} />
            <MiniYesNo label="Есть указатель / вывеска" value={extra.ukazatel || ""} onChange={setEx("ukazatel")} />
            <MiniChips label="Удобство заезда" options={["Удобный", "Нормальный", "Неудобный"]} value={extra.zaezd || ""} onChange={setEx("zaezd")} />
          </>
        )}
      </Accordion>

      <Accordion title="ЗДАНИЕ И ПОМЕЩЕНИЕ">
        <MiniField label="Название ЖК / БЦ / ТЦ" value={extra.zhkBc || ""} onChange={setEx("zhkBc")} />
        <MiniField label="СК / застройщик" value={extra.skZastroyschik || ""} onChange={setEx("skZastroyschik")} />
        <MiniField label="Коммерция на каком этаже" value={extra.etazhKommerciya || ""} onChange={setEx("etazhKommerciya")} />
        <MiniYesNo label="Есть отдельный вход" value={extra.otdelnyVhodZdanie || ""} onChange={setEx("otdelnyVhodZdanie")} />
        <MiniField label="Площадь каждого этажа" value={extra.ploshadEtazhey || ""} onChange={setEx("ploshadEtazhey")} />
        <MiniField label="Полезная площадь, если отличается от общей" value={extra.poleznayaPloshad || ""} onChange={setEx("poleznayaPloshad")} />
        <MiniField label="Высота потолков" value={extra.vysotaPotolkov || ""} onChange={setEx("vysotaPotolkov")} />
        <MiniChips label="Количество отдельных помещений / кабинетов" options={["1", "2", "3", "4", "5", "6 и более"]} value={extra.kabinetov || ""} onChange={setEx("kabinetov")} />
        <MiniChips label="Количество санузлов" options={["Нет", "1", "2", "3", "4 и более"]} value={extra.sanuzly || ""} onChange={setEx("sanuzly")} />
        <MiniMultiChips label="Наличие" options={["Кухня", "Подсобные помещения", "Склад", "Серверная", "Гардероб", "Ресепшн", "Технические помещения"]} value={extra.nalichie} onChange={setEx("nalichie")} />
        <MiniMultiChips label="Есть" options={["Подвал", "Цоколь", "Мансарда", "Технический этаж"]} value={extra.urovni} onChange={setEx("urovni")} />
        <MiniYesNo label="Возможна перепланировка" value={extra.pereplanirovkaVozm || ""} onChange={setEx("pereplanirovkaVozm")} />
      </Accordion>

      <Accordion title="ВХОД И ФАСАД">
        <MiniChips label="Количество входов" options={["1", "2", "3 и более"]} value={extra.vhodovKol || ""} onChange={setEx("vhodovKol")} />
        <MiniChips label="Вход" options={["Отдельный", "Общий с жильцами / арендаторами"]} value={extra.vhodTip || ""} onChange={setEx("vhodTip")} />
        <MiniYesNo label="Есть вход с первой линии" value={extra.vhodPervayaLiniya || ""} onChange={setEx("vhodPervayaLiniya")} />
        <MiniYesNo label="Есть запасной / служебный вход" value={extra.sluzhebnyVhod || ""} onChange={setEx("sluzhebnyVhod")} />
        <MiniChips label="Режим входа" options={["Круглосуточный", "Ограничен по времени"]} value={extra.vhodRezhim || ""} onChange={setEx("vhodRezhim")} />
        <MiniYesNo label="Есть пандус" value={extra.pandus || ""} onChange={setEx("pandus")} />
        <MiniYesNo label="Доступ для людей с ограниченными возможностями" value={extra.dostupInvalidy || ""} onChange={setEx("dostupInvalidy")} />
        <MiniField label="Материал фасада" value={extra.fasadMaterial || ""} onChange={setEx("fasadMaterial")} />
        <MiniChips label="Состояние фасада" options={["Хорошее", "Нормальное", "Требует ремонта"]} value={extra.fasadSostoyanie || ""} onChange={setEx("fasadSostoyanie")} />
        <MiniYesNo label="Можно разместить вывеску" value={extra.vyveskaMozhno || ""} onChange={setEx("vyveskaMozhno")} />
        <MiniYesNo label="Можно разместить наружную рекламу" value={extra.naruzhnayaReklama || ""} onChange={setEx("naruzhnayaReklama")} />
        <MiniYesNo label="Витринные окна" value={extra.vitriny || ""} onChange={setEx("vitriny")} />
        <MiniField label="Размер витрин" value={extra.vitrinyRazmer || ""} onChange={setEx("vitrinyRazmer")} />
        <MiniMultiChips label="Расположение окон" options={["Север", "Юг", "Запад", "Восток", "Северо-восток", "Северо-запад", "Юго-восток", "Юго-запад"]} value={extra.okna} onChange={setEx("okna")} />
      </Accordion>

      <Accordion title="КОММУНИКАЦИИ ПОДРОБНО">
        <MiniField label="Электричество — сколько кВт" value={extra.elektrKvt || ""} onChange={setEx("elektrKvt")} />
        <MiniChips label="Напряжение" options={["220 В", "380 В"]} value={extra.elektrVolt || ""} onChange={setEx("elektrVolt")} />
        <MiniChips label="Счётчик" options={["Отдельный", "Общий"]} value={extra.schetchik || ""} onChange={setEx("schetchik")} />
        <MiniChips label="Газ" options={["Нет", "Центральный", "Индивидуальный котёл", "Газовая котельная"]} value={extra.gazTip || ""} onChange={setEx("gazTip")} />
        <MiniChips label="Вода" options={["Центральная", "Скважина", "Другое"]} value={extra.vodaTip || ""} onChange={setEx("vodaTip")} />
        <MiniChips label="Канализация" options={["Центральная", "Септик", "Другое"]} value={extra.kanalTip || ""} onChange={setEx("kanalTip")} />
        <MiniChips label="Вентиляция" options={["Естественная", "Приточно-вытяжная", "Промышленная", "Отдельная система"]} value={extra.ventilyaciya || ""} onChange={setEx("ventilyaciya")} />
        <MiniYesNo label="Кондиционирование" value={extra.kondicionirovanie || ""} onChange={setEx("kondicionirovanie")} />
        <MiniYesNo label="Можно установить доп. оборудование" value={extra.dopOborudovanie || ""} onChange={setEx("dopOborudovanie")} />
        <MiniYesNo label="Интернет / оптоволокно" value={extra.internet || ""} onChange={setEx("internet")} />
        <MiniYesNo label="Телефония" value={extra.telefoniya || ""} onChange={setEx("telefoniya")} />
      </Accordion>

      {withLand && (
        <Accordion title="ЗЕМЛЯ — ПОДРОБНО">
          <MiniField label="Срок аренды земли (если в аренде)" value={extra.srokArendyZemli || ""} onChange={setEx("srokArendyZemli")} />
          <MiniYesNo label="Есть обременения / арест / залог на землю" value={extra.zemlyaObremeneniya || ""} onChange={setEx("zemlyaObremeneniya")} />
          <MiniYesNo label="Можно строить / расширяться" value={extra.vozmozhnoStroit || ""} onChange={setEx("vozmozhnoStroit")} />
          <MiniYesNo label="Можно реконструировать здание" value={extra.vozmozhnaReconstr || ""} onChange={setEx("vozmozhnaReconstr")} />
        </Accordion>
      )}

      <Accordion title="ДОКУМЕНТЫ — ПОДРОБНО">
        <MiniYesNo label="Есть ли арест" value={extra.arest || ""} onChange={setEx("arest")} />
        <MiniYesNo label="Есть ли залог в банке" value={extra.zalog || ""} onChange={setEx("zalog")} />
        <MiniField label="Другие обременения" value={extra.obremeneniyaDrugie || ""} onChange={setEx("obremeneniyaDrugie")} />
        <MiniYesNo label="Есть отдельный кадастровый номер" value={extra.otdelnyKadastr || ""} onChange={setEx("otdelnyKadastr")} />
        <MiniYesNo label="Площадь совпадает с документами" value={extra.ploshadSootv || ""} onChange={setEx("ploshadSootv")} />
        <MiniYesNo label="Есть незаконная перепланировка / пристройка" value={extra.nezakonPerepl || ""} onChange={setEx("nezakonPerepl")} />
        <div>
          <div className="mini-field-label">Проверка Госрегистра</div>
          <div className="chip-group">
            <div className={`chip required-chip ${extra.gosregistr === "Проверено" ? "selected" : ""}`} onClick={() => setEx("gosregistr")("Проверено")}>Проверено</div>
            <div className={`chip required-chip ${extra.gosregistr === "Не проверено" ? "selected" : ""}`} onClick={() => setEx("gosregistr")("Не проверено")}>Не проверено</div>
          </div>
        </div>
      </Accordion>

      <Accordion title="СОСТОЯНИЕ ОБЪЕКТА">
        <MiniField label="Год последнего ремонта" value={extra.godRemonta || ""} onChange={setEx("godRemonta")} />
        <MiniField label="Материал перекрытий" value={extra.perekrytiya || ""} onChange={setEx("perekrytiya")} />
        <MiniChips label="Состояние кровли (если отдельное здание)" options={["Хорошее", "Нормальное", "Требует ремонта"]} value={extra.krovlya || ""} onChange={setEx("krovlya")} />
        <MiniChips label="Состояние инженерных сетей" options={["Хорошее", "Нормальное", "Требуют замены"]} value={extra.inzhSeti || ""} onChange={setEx("inzhSeti")} />
        <MiniYesNo label="Охранная сигнализация" value={extra.ohrannayaSignal || ""} onChange={setEx("ohrannayaSignal")} />
        <MiniYesNo label="Видеонаблюдение" value={extra.videonablyudenie || ""} onChange={setEx("videonablyudenie")} />
        <MiniYesNo label="Охрана" value={extra.ohrana || ""} onChange={setEx("ohrana")} />
        <MiniYesNo label="Пожарная сигнализация" value={extra.pozharnayaSignal || ""} onChange={setEx("pozharnayaSignal")} />
        <MiniField label="Пожарная безопасность — какие системы" value={extra.pozharnayaBezop || ""} onChange={setEx("pozharnayaBezop")} />
      </Accordion>

      <Accordion title="ПАРКОВКА И ПОДЪЕЗД">
        <MiniYesNo label="Есть парковка" value={extra.parkovka || ""} onChange={setEx("parkovka")} />
        <MiniField label="Количество парковочных мест" value={extra.parkovkaMest || ""} onChange={setEx("parkovkaMest")} />
        <MiniMultiChips label="Парковка" options={["Собственная", "Общая", "Муниципальная", "Стихийная"]} value={extra.parkovkaTip} onChange={setEx("parkovkaTip")} />
        <MiniYesNo label="Можно парковаться перед объектом" value={extra.parkovkaPeredObektom || ""} onChange={setEx("parkovkaPeredObektom")} />
        <MiniYesNo label="Удобен подъезд для автомобилей" value={extra.udobnyPodjezd || ""} onChange={setEx("udobnyPodjezd")} />
        <MiniYesNo label="Можно подъехать грузовому транспорту" value={extra.gruzovoy || ""} onChange={setEx("gruzovoy")} />
        <MiniYesNo label="Есть зона погрузки / разгрузки" value={extra.pogruzka || ""} onChange={setEx("pogruzka")} />
        <MiniYesNo label="Возможен заезд фуры (склад / производство)" value={extra.furaZaezd || ""} onChange={setEx("furaZaezd")} />
      </Accordion>

      <Accordion title="АРЕНДА И ДОХОДНОСТЬ (если продаётся как инвестиционный)">
        <MiniYesNo label="Сдаётся сейчас" value={extra.sdayotsya || ""} onChange={setEx("sdayotsya")} />
        {extra.sdayotsya === "Да" && (
          <>
            <MiniField label="Кто арендатор" value={extra.arendator || ""} onChange={setEx("arendator")} />
            <MiniField label="Вид деятельности арендатора" value={extra.vidDeyatelnosti || ""} onChange={setEx("vidDeyatelnosti")} />
            <MiniField label="Арендная плата в месяц" value={extra.arendaMesyac || ""} onChange={setEx("arendaMesyac")} />
            <MiniChips label="Коммунальные платежи оплачивает" options={["Арендатор", "Собственник"]} value={extra.komPlatezhiKto || ""} onChange={setEx("komPlatezhiKto")} />
            <MiniField label="Срок действующего договора аренды" value={extra.srokDogovoraArendy || ""} onChange={setEx("srokDogovoraArendy")} />
            <MiniYesNo label="Есть депозит" value={extra.depozit || ""} onChange={setEx("depozit")} />
            <MiniYesNo label="Возможно повышение аренды" value={extra.povyshenieArendy || ""} onChange={setEx("povyshenieArendy")} />
          </>
        )}
        <MiniYesNo label="Свободен от арендатора при продаже" value={extra.svobodenPriProdazhe || ""} onChange={setEx("svobodenPriProdazhe")} />
        <MiniField label="Когда можно освободить" value={extra.kogdaOsvobodit || ""} onChange={setEx("kogdaOsvobodit")} />
        <MiniField label="Средний доход за месяц" value={extra.sredniyDohod || ""} onChange={setEx("sredniyDohod")} />
        <MiniField label="Окупаемость" value={extra.okupaemost || ""} onChange={setEx("okupaemost")} />
      </Accordion>

      <Accordion title="СДЕЛКА">
        <MiniYesNo label="Возможна ипотека через банк" value={extra.ipoteka || ""} onChange={setEx("ipoteka")} />
        <MiniYesNo label="Возможна рассрочка через Госрегистр" value={extra.rassrochkaGos || ""} onChange={setEx("rassrochkaGos")} />
        <MiniField label="Рассрочка от собственника — условия" value={extra.rassrochkaUsloviya || ""} onChange={setEx("rassrochkaUsloviya")} />
        <MiniYesNo label="Возможна аренда с последующим выкупом" value={extra.arendaSVykupom || ""} onChange={setEx("arendaSVykupom")} />
        <MiniMultiChips label="Возможен обмен на" options={["Квартира", "Машина", "Дом", "Иссык-Куль", "Другое"]} value={extra.obmenNa} onChange={setEx("obmenNa")} />
        <MiniYesNo label="Цена окончательная" value={extra.cenaOkonchatelnaya || ""} onChange={setEx("cenaOkonchatelnaya")} />
      </Accordion>

      <Accordion title="ПОКАЗ">
        <MiniField label="В какие дни можно показывать" value={extra.pokazDni || ""} onChange={setEx("pokazDni")} />
        <MiniField label="В какое время" value={extra.pokazVremya || ""} onChange={setEx("pokazVremya")} />
        <MiniField label="Кто показывает объект" value={extra.pokazKto || ""} onChange={setEx("pokazKto")} />
        <MiniField label="Телефон показывающего" value={extra.pokaz || ""} onChange={setEx("pokaz")} />
        <MiniField label="Ограничения по показу" value={extra.pokazOgranicheniya || ""} onChange={setEx("pokazOgranicheniya")} />
      </Accordion>

      <Accordion title="ДЛЯ РЕКЛАМЫ">
        <MiniField label="Главное преимущество объекта" value={extra.glavnoePreimuschestvo || ""} onChange={setEx("glavnoePreimuschestvo")} />
        <MiniField label="Для какого бизнеса подходит" value={extra.dlyaBiznesa || ""} onChange={setEx("dlyaBiznesa")} />
        <MiniField label="Что находится рядом" value={extra.chtoRyadom || ""} onChange={setEx("chtoRyadom")} />
        <MiniField label="Расстояние до главных объектов инфраструктуры" value={extra.rasstoyaniyaInfra || ""} onChange={setEx("rasstoyaniyaInfra")} />
        <MiniField label="Что видно с дороги" value={extra.chtoVidnoSDorogi || ""} onChange={setEx("chtoVidnoSDorogi")} />
        <MiniField label="Почему интересен инвестору" value={extra.pochemuInvestoru || ""} onChange={setEx("pochemuInvestoru")} />
      </Accordion>

      {region && (
        <Accordion title="ОЗЕРО И КУРОРТ (Иссык-Куль)" defaultOpen={true}>
          <MiniChips label="Доступ к пляжу" options={["Собственный", "Общий пляж комплекса", "Общественный", "По пропуску", "Отсутствует", "Другое"]} value={extra.dostupPlyazh || ""} onChange={setEx("dostupPlyazh")} />
          <MiniField label="Название ЖК / пансионата / комплекса" value={extra.kurortZhk || ""} onChange={setEx("kurortZhk")} />
          <MiniYesNo label="Курортная или туристическая зона" value={extra.kurortZona || ""} onChange={setEx("kurortZona")} />
          <MiniChips label="Сезонный пешеходный трафик" options={["Высокий", "Средний", "Низкий"]} value={extra.trafikPeshehSezon || ""} onChange={setEx("trafikPeshehSezon")} />
          <MiniChips label="Сезонный автомобильный трафик" options={["Высокий", "Средний", "Низкий"]} value={extra.trafikAvtoSezon || ""} onChange={setEx("trafikAvtoSezon")} />
          <MiniYesNo label="Использование в туристическом бизнесе" value={extra.turBiznes || ""} onChange={setEx("turBiznes")} />
          <MiniYesNo label="Есть действующий бизнес" value={extra.deystvBiznes || ""} onChange={setEx("deystvBiznes")} />
          <MiniYesNo label="Возможна круглогодичная работа" value={extra.kruglogodichno || ""} onChange={setEx("kruglogodichno")} />
          <MiniField label="Сезонность доходов" value={extra.dohodSezonnost || ""} onChange={setEx("dohodSezonnost")} long />
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
        <div className="field-label">Основные недостатки / ограничения, которые агент обязан знать</div>
        <input className="field-input" value={extra.nedostatki || ""} onChange={(e) => setEx("nedostatki")(e.target.value)} placeholder="Видят только агенты" />
      </div>
      <div className="field-group">
        <div className="field-label">Минимальная цена собственника (если раскрыл)</div>
        <input className="field-input" value={extra.minCena || ""} onChange={(e) => setEx("minCena")(e.target.value)} placeholder="Видят только агенты" />
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
        <div className="field-label">Цена в руки <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !vRuki ? "field-error" : ""}`} type="number" value={vRuki} onChange={(e) => setVRuki(e.target.value)} />
        <div className="currency-toggle">
          {["USD", "KGS"].map((c) => (
            <div key={c} className={`currency-btn required-chip ${vRukiCurrency === c ? "selected" : ""}`} onClick={() => setVRukiCurrency(c)}>{c === "USD" ? "$ USD" : "KGS сом"}</div>
          ))}
        </div>
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

export default function KommerciyaPage() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ paddingBottom: 40 }} />}>
      <KommerciyaForm />
    </Suspense>
  );
}
