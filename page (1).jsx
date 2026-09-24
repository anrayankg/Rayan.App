"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import PhotoUploader from "../../../components/PhotoUploader";
import VideoReviewBlock from "../../../components/VideoReviewBlock";
import BottomNav from "../../../components/BottomNav";
import AgentContactBlock from "../../../components/AgentContactBlock";
import ShareSheet from "../../../components/ShareSheet";
import { SocialButton, waLink, tgLink } from "../../../components/SocialIcons";
import { PLATFORM_LABELS, PLATFORM_ICON } from "../../../lib/videoLinks";
import { fullCharLine, priceBlock, categoryLabel } from "../../../lib/listingFormat";
import { clientListingLink, colleagueListingLink, getCurrentAgent } from "../../../lib/agent";

// Страница СВОЕГО объекта (владелец / договорник) — в новом виде, как страницы клиента
// и агента: фото сверху, цена, параметры. Плюс всё управление: редактировать, удалить,
// одобрить, фото, видео, ссылки "Поделиться" клиенту и коллеге, закрытая информация.

const STATUS_LABELS = {
  "активен": "Активен", "на проверке": "На проверке", "черновик": "Черновик",
  "забронирован": "Забронирован", "сделка в процессе": "Сделка в процессе",
  "продан": "Продан", "снят с продажи": "Снят с продажи", "архив": "Архив",
};

function photoUrl(path) {
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data?.publicUrl || "";
}

function EditableRow({ label, rawValue, displayValue, field, listingId, onSaved, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(rawValue ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const toSave = type === "number" ? (val === "" ? null : Number(val)) : val;
      const { error } = await supabase.from("listings").update({ [field]: toSave }).eq("id", listingId);
      if (error) throw error;
      onSaved(toSave);
      setEditing(false);
    } catch (err) {
      alert("Не удалось сохранить: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div style={sx.row}>
        <div style={sx.rowLabel}>{label}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input style={sx.inlineInput} type={type} value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
          <button style={sx.inlineBtn} disabled={saving} onClick={save}>{saving ? "…" : "✓"}</button>
          <button style={sx.inlineBtn} onClick={() => { setVal(rawValue ?? ""); setEditing(false); }}>✕</button>
        </div>
      </div>
    );
  }
  return (
    <div style={sx.row}>
      <div style={sx.rowLabel}>{label}</div>
      <div style={{ ...sx.rowValue, display: "flex", alignItems: "center", gap: 10 }}>
        <span>{displayValue || "—"}</span>
        <button onClick={() => setEditing(true)} style={sx.editIcon} aria-label="Изменить">✏️</button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={sx.row}>
      <div style={sx.rowLabel}>{label}</div>
      <div style={sx.rowValue}>{Array.isArray(value) ? value.join(", ") : String(value)}</div>
    </div>
  );
}

function PhoneRow({ label, value }) {
  if (!value) return null;
  const clean = String(value).replace(/[^\d+]/g, "");
  return (
    <div style={{ ...sx.row, alignItems: "center" }}>
      <div>
        <div style={sx.rowLabel}>{label}</div>
        <a href={`tel:${clean}`} style={{ color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>{value}</a>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <SocialButton kind="whatsapp" size={44} href={waLink(value)} label="WhatsApp" />
        <SocialButton kind="telegram" size={44} href={tgLink(value)} label="Telegram" />
      </div>
    </div>
  );
}

function yesNo(v) {
  if (v === true) return "да";
  if (v === false) return "нет";
  return null;
}

const EXTRA_LABELS = {
  planirovka: "Планировка", balkon: "Балкон/лоджия", lift: "Лифт", liftProizvoditel: "Производитель лифта",
  liftRabotaet: "Лифт работает", liftKolvo: "Количество лифтов", tehEtazh: "Технический этаж",
  potolki: "Высота потолков", okna: "Расположение окон", fasadMaterial: "Материал фасада",
  fasadSostoyanie: "Состояние фасада", podjezdSostoyanie: "Состояние подъезда", dvorSostoyanie: "Состояние двора",
  dvor: "Двор", detskaya: "Детские площадки", infra: "Инфраструктура рядом", infraDrugoe: "Другая инфраструктура",
  zhilayaPloshad: "Жилая площадь, м²", kuhnyaPloshad: "Площадь кухни, м²", remont: "Ремонт/отделка",
  remontGod: "Год ремонта", mebelDaNet: "Мебель", mebelObyem: "Мебель — объём", mebelChto: "Что из мебели остаётся",
  tehnikaDaNet: "Техника", tehnikaObyem: "Техника — объём", tehnikaChto: "Что из техники остаётся",
  vidOkna: "Вид из окон", sostOkna: "Состояние окон", kvNaEtazhe: "Количество квартир на этаже",
  arest: "Есть ли арест", zalog: "Есть ли залог в банке", obremeneniyaDrugie: "Другие обременения",
  gosregistr: "Проверка Госрегистра", gosregistrProverka: "Проверка Госрегистра",
  ploshadSootv: "Площадь совпадает с документами", pereplanirovka: "Есть ли перепланировка",
  pereplanirovkaStatus: "Перепланировка", jilyeClass: "Класс жилья", stenyKonstrukciya: "Конструкция стен",
  stenyMaterial: "Материал стен", godPostroiki: "Год постройки", krasnayaKniga: "Красная книга застройщика",
  razreshenie: "Разрешение на строительство", stadiya: "Стадия строительства", territoriyaValue: "Площадь территории",
  territoriyaUnit: "Единица измерения территории", blokov: "Количество блоков в ЖК", podjezdov: "Количество подъездов",
  domEtazhnost: "Этажность дома", parkovka: "Парковка", kommercheskie: "Коммерческие помещения в доме",
  infraZhk: "Инфраструктура ЖК", arhitektura: "Архитектура и концепция", polnCenPloshad: "Полноценная или студия",
  uteplenie: "Утепление", planirovkaOpisanie: "Планировка (описание)", planirovkaGde: "Где взять планировку",
  summaDkp: "Сумма в договоре купли-продажи", summaDdu: "Сумма в ДДУ", summaFakt: "Фактическая сумма сделки",
  ipoteka: "Ипотека через банк", rassrochkaZastroy: "Рассрочка от застройщика", rassrochkaUsloviya: "Условия рассрочки",
  cenaM2: "Цена за м²", komUslugi: "Коммунальные платежи перед сделкой",
};

function extraLabel(key) {
  return EXTRA_LABELS[key] || key;
}

function extraDisplayValue(v) {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object" && v !== null) return JSON.stringify(v);
  return v;
}

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [listing, setListing] = useState(null);
  const [contact, setContact] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [me, setMe] = useState(null);
  const [share, setShare] = useState(null); // { url, title, note }
  const [copied, setCopied] = useState(null);
  const touchX = useRef(null);

  useEffect(() => { setMe(getCurrentAgent()); }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data: l, error: e1 } = await supabase.from("listings").select("*").eq("id", id).single();
        if (e1) throw e1;
        setListing(l);
        const { data: c } = await supabase.from("listing_contacts").select("*").eq("listing_id", id).maybeSingle();
        setContact(c || null);
        const { data: f } = await supabase.from("listing_financial").select("*").eq("listing_id", id).maybeSingle();
        setFinancial(f || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  async function approve() {
    setApproving(true);
    try {
      const { error: e } = await supabase.from("listings").update({ status: "активен" }).eq("id", id);
      if (e) throw e;
      setListing((l) => ({ ...l, status: "активен" }));
    } catch (err) {
      alert("Не удалось одобрить: " + err.message);
    } finally {
      setApproving(false);
    }
  }

  async function remove() {
    if (!confirm("Удалить этот объект насовсем? Это нельзя отменить.")) return;
    setDeleting(true);
    try {
      const { error: e } = await supabase.from("listings").delete().eq("id", id);
      if (e) throw e;
      router.push("/profile");
    } catch (err) {
      alert("Не удалось удалить: " + err.message);
      setDeleting(false);
    }
  }

  function copy(text, key) {
    try { navigator.clipboard.writeText(text); } catch {}
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }

  if (loading) return <div style={sx.page}><div style={sx.centerMsg}>Загрузка…</div></div>;
  if (error) return <div style={sx.page}><div style={sx.centerMsg}>Не удалось загрузить: {error}</div></div>;
  if (!listing) return <div style={sx.page}><div style={sx.centerMsg}>Объект не найден</div></div>;

  const l = listing;
  const { usd, kgs } = priceBlock(l);
  const photos = l.photos || [];
  const canEditForm = l.type === "вторичка" || l.type === "первичка";
  const clientUrl = clientListingLink(l.id, me);
  const colleagueUrl = colleagueListingLink(l.id);
  let extra = {};
  try { extra = l.extra_details ? (typeof l.extra_details === "string" ? JSON.parse(l.extra_details) : l.extra_details) : {}; } catch {}

  return (
    <div style={sx.page}>
      {/* Фото */}
      <div
        style={sx.photoWrap}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null || photos.length < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) {
            if (dx < 0) setActivePhoto((p) => (p + 1) % photos.length);
            else setActivePhoto((p) => (p - 1 + photos.length) % photos.length);
          }
          touchX.current = null;
        }}
      >
        {photos.length > 0
          ? <img src={photoUrl(photos[Math.min(activePhoto, photos.length - 1)])} alt="" style={sx.photo} draggable={false} />
          : <div style={sx.photoPlaceholder}>Нет фото</div>}
        <button style={sx.backBtn} onClick={() => router.back()}>‹</button>
        <div style={sx.statusBadge}>{STATUS_LABELS[l.status] || l.status}</div>
        {photos.length > 1 && <div style={sx.photoCounter}>{Math.min(activePhoto, photos.length - 1) + 1} / {photos.length}</div>}
      </div>
      {photos.length > 1 && (
        <div style={sx.thumbRow}>
          {photos.map((p, i) => (
            <img key={p} src={photoUrl(p)} alt="" onClick={() => setActivePhoto(i)}
              style={{ ...sx.thumb, border: i === activePhoto ? "2px solid #1FA35C" : "2px solid transparent" }} />
          ))}
        </div>
      )}

      <div style={sx.body}>
        <div style={sx.priceUsd}>${usd.toLocaleString("ru-RU")}</div>
        <div style={sx.priceKgs}>{kgs.toLocaleString("ru-RU")} сом</div>
        <div style={sx.charLine}>{fullCharLine(l)}</div>
        <div style={sx.category}>{categoryLabel(l.type)}</div>
        <div style={sx.location}>{[l.zhk, l.district].filter(Boolean).join(", ") || l.city || "Бишкек"}</div>
        {l.display_id && (
          <button style={sx.idBtn} onClick={() => copy(String(l.display_id), "id")}>
            ID {l.display_id} {copied === "id" ? "✓ скопирован" : "⧉"}
          </button>
        )}

        {/* Управление */}
        <div style={sx.actionsRow}>
          {canEditForm && (
            <button className="btn-secondary" style={{ flex: 1 }}
              onClick={() => router.push(`/add/${l.type === "вторичка" ? "vtorichka" : "pervichka"}?edit=${id}`)}>
              ✎ Редактировать
            </button>
          )}
          <button className="btn-danger" style={{ flex: 1 }} disabled={approving || deleting} onClick={remove}>
            {deleting ? "Удаляю…" : "Удалить"}
          </button>
        </div>
        {l.status === "на проверке" && (
          <button className="btn-primary btn-block" style={{ marginTop: 8 }} disabled={approving || deleting} onClick={approve}>
            {approving ? "Одобряю…" : "✓ Одобрить и опубликовать"}
          </button>
        )}
        {!canEditForm && (
          <div style={sx.note}>Для типа «{l.type}» полная форма редактирования пока не готова — цену и фото можно менять прямо здесь.</div>
        )}

        {/* Поделиться */}
        <div style={sx.card}>
          <div style={sx.cardTitle}>Клиенту</div>
          <div style={sx.cardSub}>
            {l.status === "активен"
              ? (me ? `Ссылка с вашим номером (${me.phone || ""}) — без комиссии и контактов собственника` : "Ссылка без комиссии и контактов собственника")
              : "Клиентская ссылка заработает, когда объект станет «Активен»"}
          </div>
          {l.status === "активен" && (
            <div style={sx.shareRow}>
              <SocialButton kind="whatsapp" size={52} href={`https://wa.me/?text=${encodeURIComponent(clientUrl)}`} label="Клиенту в WhatsApp" />
              <SocialButton kind="telegram" size={52} href={`https://t.me/share/url?url=${encodeURIComponent(clientUrl)}`} label="Клиенту в Telegram" />
              <SocialButton kind="share" size={52} onClick={() => setShare({ url: clientUrl, title: "Поделиться с клиентом" })} label="Другие" />
              <button style={sx.copyBtn} onClick={() => copy(clientUrl, "client")}>{copied === "client" ? "✓" : "Копировать"}</button>
            </div>
          )}
        </div>

        <div style={sx.card}>
          <div style={sx.cardTitle}>Коллеге-агенту</div>
          <div style={sx.cardSub}>С комиссией и «в руки», но без контактов собственника</div>
          <div style={sx.shareRow}>
            <SocialButton kind="whatsapp" size={52} href={`https://wa.me/?text=${encodeURIComponent(colleagueUrl)}`} label="Коллеге в WhatsApp" />
            <SocialButton kind="telegram" size={52} href={`https://t.me/share/url?url=${encodeURIComponent(colleagueUrl)}`} label="Коллеге в Telegram" />
            <SocialButton kind="share" size={52} onClick={() => setShare({ url: colleagueUrl, title: "Поделиться с коллегой" })} label="Другие" />
            <button style={sx.copyBtn} onClick={() => copy(colleagueUrl, "colleague")}>{copied === "colleague" ? "✓" : "Копировать"}</button>
          </div>
        </div>

        <div style={{ ...sx.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={sx.cardTitle}>Реклама</div>
            <div style={sx.cardSub}>{l.ad_status || "Пока не настроена"}</div>
          </div>
          <button className="btn-secondary" style={{ padding: "12px 16px" }} onClick={() => router.push("/ads")}>Реклама →</button>
        </div>

        {/* Фото и видео */}
        <div style={sx.section}>
          <div style={sx.sectionTitle}>Фото ({photos.length})</div>
          <PhotoUploader
            photos={photos}
            onChange={async (newPhotos) => {
              setListing((x) => ({ ...x, photos: newPhotos }));
              setActivePhoto(0);
              const { error: e } = await supabase.from("listings").update({ photos: newPhotos }).eq("id", id);
              if (e) alert("Не удалось сохранить фото: " + e.message);
            }}
          />
        </div>

        <div style={sx.section}>
          <div style={sx.sectionTitle}>Видеообзор</div>
          {(l.video_links || []).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
              {l.video_links.map((v) => (
                <a key={v.platform} href={v.url} target="_blank" rel="noopener noreferrer" style={sx.videoBtn}>
                  {PLATFORM_ICON[v.platform]} Видеообзор — {PLATFORM_LABELS[v.platform]}
                </a>
              ))}
            </div>
          )}
          <VideoReviewBlock
            videos={l.video_links || []}
            onChange={async (newVideos) => {
              setListing((x) => ({ ...x, video_links: newVideos }));
              const { error: e } = await supabase.from("listings").update({ video_links: newVideos }).eq("id", id);
              if (e) alert("Не удалось сохранить видео: " + e.message);
            }}
          />
        </div>

        {l.description && (
          <div style={sx.section}>
            <div style={sx.sectionTitle}>Описание</div>
            <div style={sx.description}>{l.description}</div>
          </div>
        )}

        <div style={sx.section}>
          <div style={sx.sectionTitle}>Основное</div>
          <Row label="Статус" value={STATUS_LABELS[l.status] || l.status} />
          <Row label="Тип" value={l.type} />
          <Row label="Комнатность" value={l.room_type || l.rooms} />
          <EditableRow label="Цена" field="price" type="number" listingId={id}
            rawValue={l.price}
            displayValue={l.price ? `${Number(l.price).toLocaleString("ru-RU")} ${l.currency_new || l.currency || ""}` : null}
            onSaved={(newPrice) => setListing((x) => ({ ...x, price: newPrice }))} />
          <Row label="Площадь" value={l.area_m2 ? `${l.area_m2} м²` : null} />
          <Row label="Этаж / этажность" value={l.floor && l.floors_total ? `${l.floor}/${l.floors_total}` : null} />
          <Row label="Серия" value={l.series} />
          <Row label="Город" value={l.city} />
          <Row label="Район" value={l.district} />
          <Row label="ЖК" value={l.zhk} />
          <Row label="СК / Застройщик" value={l.sk} />
          <Row label="Точка на карте" value={l.map_lat && l.map_lng ? "указана" : "не указана"} />
          <Row label="Госрегистр и нотариус" value={yesNo(l.gosregistr)} />
          <Row label="Статус строительства" value={l.construction_status} />
          <Row label="Срок сдачи" value={l.delivery_year ? `${l.delivery_quarter ? l.delivery_quarter + " кв. " : ""}${l.delivery_year}` : null} />
          <Row label="Документы" value={l.documents} />
          <Row label="Отопление" value={l.heating} />
          <Row label="Газ" value={yesNo(l.gas)} />
          <Row label="Вода" value={yesNo(l.water)} />
          <Row label="Электричество" value={yesNo(l.electricity)} />
          <Row label="Канализация" value={yesNo(l.sewerage)} />
          <Row label="Горячая вода" value={yesNo(l.hot_water)} />
          <Row label="Условия сделки" value={l.deal_terms} />
          <Row label="Обмен на" value={l.obmen_na} />
          <Row label="Торг" value={yesNo(l.torg)} />
          {l.map_lat && l.map_lng && (
            <a href={`https://maps.google.com/?q=${l.map_lat},${l.map_lng}`} target="_blank" rel="noopener noreferrer" style={sx.mapLink}>📍 Открыть на карте</a>
          )}
        </div>

        {/* Закрытая информация — видна только владельцу */}
        <div style={{ ...sx.section, ...sx.privateSection }}>
          <div style={{ ...sx.sectionTitle, color: "#E8877A" }}>🔒 Договор</div>
          <Row label="Статус договора" value={l.contract_status || "не указан"} />
        </div>

        {contact && (
          <div style={{ ...sx.section, ...sx.privateSection }}>
            <div style={{ ...sx.sectionTitle, color: "#E8877A" }}>🔒 Собственник</div>
            <Row label="Источник" value={contact.source_type} />
            <Row label="ФИО" value={contact.owner_name} />
            <PhoneRow label="Телефон собственника" value={contact.owner_phone} />
            <PhoneRow label="WhatsApp собственника" value={contact.owner_whatsapp} />
            <Row label="Точный адрес" value={contact.exact_address} />
          </div>
        )}

        {financial && (
          <div style={{ ...sx.section, ...sx.privateSection }}>
            <div style={{ ...sx.sectionTitle, color: "#E8877A" }}>🔒 Финансы</div>
            <Row label="Цена в руки" value={financial.v_ruki ? `${financial.v_ruki} ${financial.v_ruki_currency || ""}` : null} />
            <Row label="Комиссия" value={financial.commission_percent} />
            <Row label="Условия комиссии" value={financial.commission_terms} />
            <Row label="Заметка агента" value={financial.agent_notes} />
          </div>
        )}

        {Object.keys(extra).length > 0 && (
          <div style={sx.section}>
            <div style={sx.sectionTitle}>Дополнительно</div>
            {Object.entries(extra).map(([k, v]) => (
              <Row key={k} label={extraLabel(k)} value={extraDisplayValue(v)} />
            ))}
          </div>
        )}

        <AgentContactBlock name={l.agent_name} phone={l.agent_phone} />

        <div style={sx.metaRow}>
          {l.created_at && <span>Создано: {new Date(l.created_at).toLocaleDateString("ru-RU")}</span>}
          {l.display_id && <span> &nbsp;|&nbsp; ID {l.display_id}</span>}
        </div>
      </div>

      <ShareSheet open={!!share} onClose={() => setShare(null)} url={share?.url} title={share?.title} />
      <BottomNav active="Профиль" />
    </div>
  );
}

const sx = {
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#fff", paddingBottom: 110 },
  centerMsg: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#8B8B90", padding: 20, textAlign: "center" },
  photoWrap: { position: "relative", width: "100%", aspectRatio: "1/1", background: "#FFFFFF" },
  photo: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  photoPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#8B8B90", background: "#FFFFFF" },
  backBtn: { position: "absolute", top: 14, left: 14, width: 40, height: 40, borderRadius: "50%",
    background: "rgba(0,0,0,0.5)", color: "#fff", border: "none", fontSize: 24, lineHeight: "40px" },
  statusBadge: { position: "absolute", bottom: 14, left: 14, background: "rgba(31,163,92,0.9)", color: "#fff",
    fontSize: 12, fontWeight: 700, padding: "6px 11px", borderRadius: "var(--r)" },
  photoCounter: { position: "absolute", bottom: 14, right: 14, background: "rgba(0,0,0,0.55)", color: "#fff",
    fontSize: 12, padding: "4px 10px", borderRadius: "var(--r)" },
  thumbRow: { display: "flex", gap: 6, padding: "8px 16px", overflowX: "auto" },
  thumb: { width: 56, height: 56, borderRadius: "var(--r)", objectFit: "cover", flexShrink: 0 },
  body: { padding: "18px 20px 0" },
  priceUsd: { fontSize: 26, fontWeight: 800 },
  priceKgs: { fontSize: 13, color: "#8B8B90", marginTop: 2 },
  charLine: { fontSize: 14.5, fontWeight: 700, marginTop: 12 },
  category: { fontSize: 12.5, color: "#8B8B90", marginTop: 3 },
  location: { fontSize: 12.5, color: "#8B8B90" },
  idBtn: { marginTop: 8, background: "none", border: "none", color: "#B8B8BE", fontSize: 13, fontWeight: 700, padding: "6px 0" },
  actionsRow: { display: "flex", gap: 8, marginTop: 16 },
  note: { color: "#7FA396", fontSize: 12, marginTop: 10, lineHeight: 1.5 },
  card: { marginTop: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--r)", padding: 14 },
  cardTitle: { fontSize: 15, fontWeight: 800 },
  cardSub: { fontSize: 12.5, color: "#8B8B90", marginTop: 3, lineHeight: 1.45 },
  shareRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12 },
  copyBtn: { minHeight: 52, padding: "0 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)",
    color: "#fff", borderRadius: "var(--r)", fontSize: 14, fontWeight: 700 },
  section: { marginTop: 22, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" },
  privateSection: { background: "rgba(232,135,122,0.05)", border: "1px solid rgba(232,135,122,0.25)", borderRadius: "var(--r)", padding: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: "#7FA396", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  description: { fontSize: 14, lineHeight: 1.6, color: "#EDEDEF", whiteSpace: "pre-wrap" },
  row: { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  rowLabel: { fontSize: 13, color: "#8B8B90", flexShrink: 0 },
  rowValue: { fontSize: 13.5, color: "#EDEDEF", textAlign: "right", wordBreak: "break-word" },
  editIcon: { background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "var(--r)", width: 36, height: 36, fontSize: 15 },
  inlineInput: { width: 120, background: "#fff", color: "#075741", border: "none", borderRadius: "var(--r)", padding: "8px 10px", fontSize: 15, fontWeight: 700 },
  inlineBtn: { width: 38, height: 38, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "var(--r)", fontSize: 16 },
  videoBtn: { display: "flex", alignItems: "center", gap: 6, background: "rgba(212,164,55,0.14)",
    border: "1px solid rgba(212,164,55,0.4)", color: "#F3D477", textDecoration: "none",
    padding: "10px 14px", borderRadius: "var(--r)", fontSize: 13, fontWeight: 700 },
  mapLink: { display: "inline-block", marginTop: 10, color: "#5BD98A", fontSize: 14, fontWeight: 700, textDecoration: "none" },
  metaRow: { fontSize: 11.5, color: "#7FA396", marginTop: 14, paddingBottom: 10 },
};
