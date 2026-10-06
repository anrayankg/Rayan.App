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
import CategorySwitch from "../../../components/CategorySwitch";
import PhotoUploader from "../../../components/PhotoUploader";
import VideoReviewBlock from "../../../components/VideoReviewBlock";


// ===== УЧАСТОК: варианты выбора (по брифу №4) =====
const DOC_OPTIONS = [
  "Акт ввода в эксплуатацию", "Генеральная доверенность", "Договор дарения", "Договор долевого участия",
  "Договор купли-продажи", "Договор мены", "Зеленая книга", "Красная книга",
  "Свидетельство о праве на наследство", "Тех паспорт",
];
const FORMA_UCHASTKA = ["Прямоугольная", "Квадратная", "Треугольная", "Флажок", "Г-образная", "Другая"];
const KNIGA_OPTS = ["Красная книга", "Зелёная книга", "Нет книги"];
const NAZNACHENIE_ZEMLI = ["ПМЖ", "ИЖС", "Дачный участок", "Садоводство", "Сельхозназначение", "Коммерческое", "Под ЖК", "Другое"];
const COMMS_UCH = ["Электричество", "Газ", "Вода", "Канализация", "Септик", "Нет коммуникаций"];
const OBMEN_OPTS = ["Квартира", "Машина", "Дом", "Иссык-Куль", "Другое"];
const DEAL_TERMS_OPTS = ["Наличные", "Ипотека", "Рассрочка через Госрегистр", "Рассрочка от собственника", "Обмен"];
const POSTROIKI = ["Времянка", "Дом", "Навес", "Гараж", "Сарай", "Беседка", "Баня", "Бассейн", "Очок кана"];

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

function UchastokForm() {
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
  const [district, setDistrict] = useState("");
  const [roomType, setRoomType] = useState("");
  const [area, setArea] = useState("");
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
  const commsSel = extra.kommunikacii || [];
  const missingFields = [
    !city && "Город", city && districtRequired && !district && "Район", !(mapLat && mapLng) && "Точка на карте",
    !plot && "Площадь участка", !extra.razmerUchastka && "Размер участка", !extra.formaUchastka && "Форма участка",
    !extra.pervayaLiniya && "Первая линия", !extra.uglovoy && "Угловой участок",
    !extra.naznachenie_zemli && "Назначение земли", !extra.knigaUchastka && "Книга на участок",
    docs.length === 0 && "Документы", commsSel.length === 0 && "Коммуникации",
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
        setContractStatus(l.contract_status || "без договора");
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
        type: "участок",
        price: numOrNull(price),
        currency_new: currency,
        district, city,
        plot_sotka: numOrNull(String(plot).replace(",", ".")),
        zhk, sk,
        documents: docs,
        gas: commsSel.includes("Газ"), water: commsSel.includes("Вода"), electricity: commsSel.includes("Электричество"), sewerage: commsSel.includes("Канализация"),
        map_lat: mapLat, map_lng: mapLng,
        deal_terms: dealTerms.join(", "),
        obmen_na: dealTerms.includes("Обмен") ? [...obmenNa, obmenDrugoe].filter(Boolean).join(", ") : null,
        torg, description, photos, video_links: videos,
        contract_status: contractStatus,
        extra_details: extra,
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
        type: "участок",
        price: Number(price),
        currency_new: currency,
        district,
        city,
        plot_sotka: Number(String(plot).replace(",", ".")),
        zhk, sk,
        documents: docs,
        gas: commsSel.includes("Газ"), water: commsSel.includes("Вода"), electricity: commsSel.includes("Электричество"), sewerage: commsSel.includes("Канализация"),
        map_lat: mapLat,
        map_lng: mapLng,
        deal_terms: dealTerms.join(", "),
        obmen_na: dealTerms.includes("Обмен") ? [...obmenNa, obmenDrugoe].filter(Boolean).join(", ") : null,
        torg,
        description,
        photos,
        video_links: videos,
        contract_status: contractStatus,
        extra_details: extra,
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

      localStorage.setItem("rayan_agent_name", agentName);
      localStorage.setItem("rayan_agent_phone", agentPhone);

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
        <div className="page-title">{editId ? "Редактирование — Участок" : "Участок"}</div>
      </div>


      <div className="section-divider"><div className="section-divider-title big">ОБЯЗАТЕЛЬНЫЕ ПОЛЯ</div></div>

      <CategorySwitch current="uchastok" editId={editId} />

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
        <div className="field-label">Площадь участка, соток <span className="star">*</span></div>
        <div className="mini-field-label" style={{ marginTop: 2 }}>По документам</div>
        <input className={`field-input required-input ${attemptedSubmit && !plot ? "field-error" : ""}`} inputMode="decimal" value={plot} onChange={(e) => setPlot(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="Например 8,1" />
        <div className="mini-field-label" style={{ marginTop: 10 }}>Фактически (если отличается)</div>
        <input className="field-input" inputMode="decimal" value={extra.ploshadFakt || ""} onChange={(e) => setEx("ploshadFakt")(e.target.value)} placeholder="Например 8,5" />
      </div>

      <div className="field-group">
        <div className="field-label">Размер участка (длина × ширина) <span className="star">*</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !extra.razmerUchastka ? "field-error" : ""}`} value={extra.razmerUchastka || ""} onChange={(e) => setEx("razmerUchastka")(e.target.value)} placeholder="Например 30 × 27 м" />
      </div>

      <div className="field-group">
        <Picker label="Форма участка" required options={FORMA_UCHASTKA} value={extra.formaUchastka || ""} onChange={setEx("formaUchastka")} error={attemptedSubmit && !extra.formaUchastka} />
      </div>

      <div className="field-group">
        <Picker label="Первая линия от дороги" required options={["Да", "Нет"]} value={extra.pervayaLiniya || ""} onChange={setEx("pervayaLiniya")} error={attemptedSubmit && !extra.pervayaLiniya} />
        {extra.pervayaLiniya === "Нет" && (
          <input className="field-input" style={{ marginTop: 8 }} value={extra.zaezd || ""} onChange={(e) => setEx("zaezd")(e.target.value)} placeholder="Какой заезд? Например: 2-я линия, проезд 6 м" />
        )}
      </div>

      <div className="field-group">
        <Picker label="Угловой участок" required options={["Да", "Нет"]} value={extra.uglovoy || ""} onChange={setEx("uglovoy")} error={attemptedSubmit && !extra.uglovoy} />
      </div>

      <div className="field-group">
        <Picker label="Назначение земли (как в книге / кадастре)" required options={NAZNACHENIE_ZEMLI} value={extra.naznachenie_zemli || ""} onChange={setEx("naznachenie_zemli")} error={attemptedSubmit && !extra.naznachenie_zemli} />
      </div>

      <div className="field-group">
        <Picker label="Книга на участок" required options={KNIGA_OPTS} value={extra.knigaUchastka || ""} onChange={setEx("knigaUchastka")} error={attemptedSubmit && !extra.knigaUchastka} />
      </div>

      <div className="field-group">
        <MultiPicker label="Правоустанавливающие документы" required options={DOC_OPTIONS} value={docs} onChange={setDocs} error={attemptedSubmit && docs.length === 0} />
      </div>

      <div className="field-group">
        <MultiPicker label="Коммуникации" required options={COMMS_UCH} value={commsSel}
          onChange={(sel) => setEx("kommunikacii")(sel.includes("Нет коммуникаций") && !commsSel.includes("Нет коммуникаций") ? ["Нет коммуникаций"] : sel.filter((x) => x !== "Нет коммуникаций" || sel.length === 1))}
          error={attemptedSubmit && commsSel.length === 0} />
      </div>

      <div className="field-group">
        <div className="field-label">Цена <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !price ? "field-error" : ""}`} type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Общая стоимость участка" />
        {price && plot && Number(String(plot).replace(",", ".")) > 0 && (
          <div className="field-hint">≈ {Math.round(Number(price) / Number(String(plot).replace(",", "."))).toLocaleString("ru-RU")} {currency === "USD" ? "$" : "сом"} за сотку</div>
        )}
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
      <Accordion title="ДОРОГА И ПОДЪЕЗД" defaultOpen={true}>
        <MiniField label="Ширина дороги" value={extra.shirinaDorogi || ""} onChange={setEx("shirinaDorogi")} />
        <MiniChips label="Покрытие дороги" options={["Асфальт", "Бетон", "Щебень / гравий", "Грунт"]} value={extra.pokrytieDorogi || ""} onChange={setEx("pokrytieDorogi")} />
        <MiniYesNo label="Подъезд автомобиля" value={extra.podjezdAvto || ""} onChange={setEx("podjezdAvto")} />
        <MiniYesNo label="Подъезд зимой" value={extra.podjezdZimoy || ""} onChange={setEx("podjezdZimoy")} />
      </Accordion>

      <Accordion title="РЕЛЬЕФ И ОГРАЖДЕНИЕ">
        <MiniChips label="Рельеф" options={["Ровный", "Небольшой уклон", "Сильный уклон", "Холмистый"]} value={extra.relef || ""} onChange={setEx("relef")} />
        <MiniField label="Уклон (куда, насколько)" value={extra.uklon || ""} onChange={setEx("uklon")} />
        <MiniChips label="Ограждение" options={["Кирпичный забор", "Профнастил", "Бетонный забор", "Сетка", "Нет ограждения", "Другое"]} value={extra.zabor || ""} onChange={setEx("zabor")} />
        <MiniChips label="Ворота" options={["Обычные", "Автоматические", "Нет"]} value={extra.vorota || ""} onChange={setEx("vorota")} />
      </Accordion>

      <Accordion title="КОММУНИКАЦИИ ПОДРОБНО">
        <MiniField label="Сколько кВт электричества" value={extra.kvt || ""} onChange={setEx("kvt")} />
        <MiniField label="Расстояние до ближайших коммуникаций (если не заведены)" value={extra.rasstoyanieKomm || ""} onChange={setEx("rasstoyanieKomm")} />
        <MiniYesNo label="Возможность подключения" value={extra.vozmozhnostPodkl || ""} onChange={setEx("vozmozhnostPodkl")} />
      </Accordion>

      <Accordion title="ПОСТРОЙКИ НА УЧАСТКЕ">
        <MiniMultiChips label="Что есть на участке" options={POSTROIKI} value={extra.postroiki} onChange={setEx("postroiki")} />
        <MiniField label="Площадь построек" value={extra.postroikiPloshad || ""} onChange={setEx("postroikiPloshad")} />
        <MiniYesNo label="Техпаспорт на времянку / старый дом" value={extra.vremyankaTehpasport || ""} onChange={setEx("vremyankaTehpasport")} />
        <MiniField label="Другие строения" value={extra.postroikiDrugie || ""} onChange={setEx("postroikiDrugie")} />
      </Accordion>

      <Accordion title="ИНФРАСТРУКТУРА">
        <MiniYesNo label="Маршрутный транспорт рядом" value={extra.marshrutki || ""} onChange={setEx("marshrutki")} />
        <MiniField label="Какие маршруты" value={extra.marshrutyKakie || ""} onChange={setEx("marshrutyKakie")} />
        <MiniMultiChips label="Рядом есть" options={["Школа", "Детский сад", "Магазины", "Больница", "Остановка", "Рынок/базар"]} value={extra.infra} onChange={setEx("infra")} />
        <MiniField label="Другие важные объекты и расстояние до них" value={extra.infraDrugoe || ""} onChange={setEx("infraDrugoe")} />
      </Accordion>

      <Accordion title="ПОД ЖК / БИЗНЕС / ИНВЕСТ-ПРОЕКТ">
        <MiniChips label="Назначение проекта" options={["ЖК", "Бизнес-центр", "Торговый объект", "Гостиница", "Другое"]} value={extra.proektNaznachenie || ""} onChange={setEx("proektNaznachenie")} />
        <MiniField label="Что предусмотрено генпланом" value={extra.genplan || ""} onChange={setEx("genplan")} />
        <MiniField label="Цвет зоны на генплане" value={extra.genplanCvet || ""} onChange={setEx("genplanCvet")} />
        <MiniField label="Что обозначает эта зона" value={extra.genplanZona || ""} onChange={setEx("genplanZona")} />
        <MiniYesNo label="Можно строить объект такого назначения" value={extra.mozhnoStroit || ""} onChange={setEx("mozhnoStroit")} />
        <MiniField label="Ограничения по этажности" value={extra.ogrEtazhnost || ""} onChange={setEx("ogrEtazhnost")} />
        <MiniField label="Плотность / другие ограничения" value={extra.ogrPlotnost || ""} onChange={setEx("ogrPlotnost")} />
        <MiniYesNo label="Можно изменить назначение земли" value={extra.smenaNaznacheniya || ""} onChange={setEx("smenaNaznacheniya")} />
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
        <MiniYesNo label="Сервитут" value={extra.servitut || ""} onChange={setEx("servitut")} />
        <MiniYesNo label="Красные линии" value={extra.krasnyeLinii || ""} onChange={setEx("krasnyeLinii")} />
        <MiniYesNo label="Охранные зоны" value={extra.ohrannyeZony || ""} onChange={setEx("ohrannyeZony")} />
        <MiniField label="Другие ограничения строительства" value={extra.ogrDrugie || ""} onChange={setEx("ogrDrugie")} />
      </Accordion>

      <Accordion title="СДЕЛКА">
        <MiniYesNo label="Цена окончательная" value={extra.cenaOkonchatelnaya || ""} onChange={setEx("cenaOkonchatelnaya")} />
      </Accordion>

      <Accordion title="ПОКАЗ">
        <MiniField label="Время показа" value={extra.pokazVremya || ""} onChange={setEx("pokazVremya")} />
        <MiniField label="Кто показывает" value={extra.pokazKto || ""} onChange={setEx("pokazKto")} />
        <MiniField label="Телефон показывающего" value={extra.pokaz || ""} onChange={setEx("pokaz")} />
      </Accordion>

      <div className="field-group">
        <div className="field-label">Описание для клиента <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <textarea className={`field-textarea required-input ${attemptedSubmit && !description ? "field-error" : ""}`} value={description} onChange={(e) => setDescription(e.target.value)} />
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
        <span className="lock-badge" style={{ color: "var(--accent-text)", background: "var(--fill)", borderColor: "var(--line)" }}>👁 ВИДЕН ВСЕМ</span>
      </div>
      <div className="field-group">
        <div className="field-label">Имя агента <span className="star">*</span><span className="required-note">(обязательно)</span></div>
        <input className={`field-input required-input ${attemptedSubmit && !agentName ? "field-error" : ""}`} value={agentName} onChange={(e) => setAgentName(e.target.value)} />
      </div>
      <div className="field-group">
        <PhoneInput label="Телефон агента" required value={agentPhone} onChange={setAgentPhone} whiteBg error={attemptedSubmit && !isPhoneComplete(agentPhone)} />
      </div>

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
        style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "var(--muted)", fontSize: 13, fontWeight: 700, padding: "10px 0" }}
      >
        Сохранить черновик и продолжить позже
      </button>}
      <div className="progress-note">Поля со звёздочкой * обязательны</div>
    </div>
  );
}

export default function UchastokPage() {
  return (
    <Suspense fallback={<div className="app-shell" style={{ paddingBottom: 40 }} />}>
      <UchastokForm />
    </Suspense>
  );
}
