"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { CAT_KVARTIRY, CAT_NOVOSTROYKI, CAT_DOMA, CAT_UCHASTOK, CAT_KOMMERCIYA, CAT_ARENDA } from "../../lib/categoryIcons";
import { fullCharLine, priceBlock, categoryLabel } from "../../lib/listingFormat";
import BottomNav from "../../components/BottomNav";
import AddToCollectionButton from "../../components/AddToCollectionButton";

// Личный кабинет агента. Входа с паролем пока нет (сознательно, по решению Айгуль) —
// агент вводит свой рабочий номер, если он найден в таблице agents, устройство
// запоминает, что это он (localStorage). Это НЕ настоящая защита — любой, кто знает
// номер, может представиться этим агентом с любого устройства. Для внутренней команды
// пока достаточно; когда понадобится реальная защита — это первое, что нужно будет заменить.
//
// Блок "Реклама" на карточках — пока каркас без реальных данных: статус всегда
// "Требует рекламы", счётчики звонков/сообщений/просмотров — прочерк. Показывать
// настоящие цифры можно будет только после Этапа 5 (интеграции с площадками).

const USD_KGS_RATE = 87.45;
const FILTER_CATS = [
  { label: "Квартиры", type: "вторичка", img: CAT_KVARTIRY },
  { label: "Новостройки", type: "первичка", img: CAT_NOVOSTROYKI },
  { label: "Дома", type: "дом", img: CAT_DOMA },
  { label: "Участки", type: "участок", img: CAT_UCHASTOK },
  { label: "Коммерческая", type: "коммерция", img: CAT_KOMMERCIYA },
  { label: "Аренда", type: "аренда", img: CAT_ARENDA },
];
const ACTIVE_STATUSES = ["активен"];
const DRAFT_STATUSES = ["черновик"];
// Всё остальное (на проверке, забронирован, сделка в процессе, продан, снят с продажи, архив) — "Деактивировано"

function digitsOnly(s) { return (s || "").replace(/\D/g, ""); }
function photoUrl(path) {
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data?.publicUrl || "";
}
function IconWhatsappSmall() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="#3ED07A">
      <path d="M16 3C9 3 3 9 3 16c0 2.4.7 4.7 1.9 6.6L3 29l6.6-1.9c1.8 1 3.9 1.6 6.4 1.6 7 0 13-6 13-13S23 3 16 3zm7.5 18.4c-.3.9-1.7 1.7-2.4 1.8-.6.1-1.4.1-2.2-.1-.5-.2-1.2-.4-2-.8-3.5-1.5-5.8-5-6-5.3-.2-.3-1.4-1.9-1.4-3.6 0-1.7.9-2.5 1.2-2.9.3-.3.7-.4.9-.4h.6c.2 0 .5 0 .7.6.3.7.9 2.3 1 2.5.1.2.2.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.5-.6.6-.2.2-.4.4-.2.8.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 1.9.4.2.6.1.8-.1.2-.3.9-1 1.1-1.4.2-.3.5-.3.8-.2.3.1 2 1 2.4 1.1.4.2.6.3.7.4.1.3.1.9-.2 1.7z"/>
    </svg>
  );
}
function IconTelegramSmall() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4BA3E3" strokeWidth="2"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></svg>;
}
function IconShareStandard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <path d="M16 6l-4-4-4 4" /><path d="M12 2v14" />
    </svg>
  );
}
function IconEyeOutline() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9A9AA0" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconRepliesBubble() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="11" fill="rgba(62,208,122,0.16)" />
      <path d="M7 9.5a4.5 4.5 0 0 1 4.5-4.5h1A4.5 4.5 0 0 1 17 9.5v1c0 .9-.3 1.7-.8 2.4l.3 2.1-2-.9a4.5 4.5 0 0 1-1 .1h-1A4.5 4.5 0 0 1 7 10.5v-1z"
        stroke="#3ED07A" strokeWidth="1.4" fill="none" />
      <circle cx="12" cy="9.5" r="1.3" fill="#3ED07A" />
    </svg>
  );
}
function IconCopySmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B8B8BE" strokeWidth="2">
      <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}
function IconCheckSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5BD98A" strokeWidth="2.5">
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

function ListingThumb({ l, style }) {
  const [failed, setFailed] = useState(false);
  const hasPhoto = (l.photos || [])[0] && !failed;
  return (
    <div style={style || sx.cardPhotoWrap}>
      {hasPhoto ? (
        <img src={photoUrl(l.photos[0])} alt="" style={sx.cardPhoto} onError={() => setFailed(true)} />
      ) : (
        <div style={sx.cardPhotoEmpty}>Нет фото</div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [agent, setAgent] = useState(undefined);
  const [phoneInput, setPhoneInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [myListings, setMyListings] = useState([]);
  const [myCollections, setMyCollections] = useState([]);

  const [statusTab, setStatusTab] = useState("активно");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [sortBy, setSortBy] = useState("new");
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  function copyId(displayId) {
    navigator.clipboard.writeText(String(displayId));
    setCopiedId(displayId);
    setTimeout(() => setCopiedId((cur) => (cur === displayId ? null : cur)), 1500);
  }
  const [showBulkCollection, setShowBulkCollection] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("rayan_agent");
      setAgent(saved ? JSON.parse(saved) : null);
    } catch { setAgent(null); }
  }, []);

  useEffect(() => {
    if (!agent) return;
    async function loadMine() {
      const myDigits = digitsOnly(agent.phone);
      const { data } = await supabase.from("listings")
        .select("id, display_id, type, status, price, currency, currency_new, district, zhk, room_type, rooms, area_m2, floor, floors_total, series, construction_status, delivery_year, delivery_quarter, extra_details, photos, agent_phone, created_at, description")
        .not("agent_phone", "is", null);
      setMyListings((data || []).filter((l) => digitsOnly(l.agent_phone) === myDigits));

      const { data: cols } = await supabase.from("collections").select("*").eq("agent_id", agent.id).order("created_at", { ascending: false });
      setMyCollections(cols || []);
    }
    loadMine();
  }, [agent]);

  const counts = useMemo(() => {
    const активно = myListings.filter((l) => ACTIVE_STATUSES.includes(l.status)).length;
    const черновики = myListings.filter((l) => DRAFT_STATUSES.includes(l.status)).length;
    const деактивировано = myListings.length - активно - черновики;
    return { активно, черновики, деактивировано };
  }, [myListings]);

  const categoryCounts = useMemo(() => {
    const map = {};
    FILTER_CATS.forEach((c) => { map[c.type] = myListings.filter((l) => l.type === c.type).length; });
    return map;
  }, [myListings]);

  const visibleListings = useMemo(() => {
    let list = myListings.filter((l) => {
      if (statusTab === "активно") return ACTIVE_STATUSES.includes(l.status);
      if (statusTab === "черновики") return DRAFT_STATUSES.includes(l.status);
      return !ACTIVE_STATUSES.includes(l.status) && !DRAFT_STATUSES.includes(l.status);
    });
    if (categoryFilter) list = list.filter((l) => l.type === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((l) => [l.district, l.zhk, l.description, l.display_id].filter(Boolean).join(" ").toLowerCase().includes(q));
    }
    if (sortBy === "new") list = [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    else if (sortBy === "cheap") list = [...list].sort((a, b) => priceUsd(a) - priceUsd(b));
    else if (sortBy === "expensive") list = [...list].sort((a, b) => priceUsd(b) - priceUsd(a));
    return list;
  }, [myListings, statusTab, categoryFilter, search, sortBy]);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAllVisible() {
    setSelected(new Set(visibleListings.map((l) => l.id)));
  }

  // Пока нет реальных интеграций с площадками — статус всегда "Требует рекламы" (жёлтый).
  // Функция уже готова показывать "Реклама активна" (зелёный) и "Просрочена" (красный),
  // как только появятся настоящие данные о рекламных активностях.
  function adStatusInfo(l) {
    if (l.ad_status === "активна") return { label: "Реклама активна", bg: "#1FA35C", icon: "✅" };
    if (l.ad_status === "просрочена") return { label: "Просрочена реклама", bg: "#D64545", icon: "⚠️" };
    return { label: "Требует рекламы", bg: "#D4A437", icon: "⚠️" };
  }

  async function bulkDeactivate() {
    if (!confirm(`Снять с продажи ${selected.size} объект(ов)?`)) return;
    setBulkBusy(true);
    await supabase.from("listings").update({ status: "снят с продажи" }).in("id", Array.from(selected));
    setMyListings((prev) => prev.map((l) => (selected.has(l.id) ? { ...l, status: "снят с продажи" } : l)));
    setSelected(new Set());
    setBulkBusy(false);
  }

  const [bulkDone, setBulkDone] = useState(null);
  async function bulkAddToCollection(collectionId, isNew, name) {
    setBulkBusy(true);
    const ids = Array.from(selected);
    let agentId = null;
    try { agentId = agent?.id || null; } catch {}
    if (isNew) {
      await supabase.from("collections").insert({ name, listing_ids: ids, agent_id: agentId });
    } else {
      const { data } = await supabase.from("collections").select("listing_ids").eq("id", collectionId).single();
      const existing = (data?.listing_ids || []).map((x) => (typeof x === "string" ? x : x.id));
      const merged = Array.from(new Set([...existing, ...ids]));
      await supabase.from("collections").update({ listing_ids: merged }).eq("id", collectionId);
    }
    setBulkBusy(false);
    setBulkDone(name || (myCollections.find((c) => c.id === collectionId)?.name) || "подборку");
    setSelected(new Set());
  }

  async function handleLogin() {
    setLoginError("");
    const digits = digitsOnly(phoneInput);
    if (digits.length < 9) { setLoginError("Введите номер телефона полностью"); return; }
    setBusy(true);
    const { data, error } = await supabase.from("agents").select("*");
    setBusy(false);
    if (error) { setLoginError("Ошибка: " + error.message); return; }
    const found = (data || []).find((a) => digitsOnly(a.phone) === digits);
    if (!found) { setLoginError("Номер не найден. Обратитесь к Айгуль, чтобы завести личный кабинет."); return; }
    localStorage.setItem("rayan_agent", JSON.stringify(found));
    setAgent(found);
  }

  function handleLogout() {
    localStorage.removeItem("rayan_agent");
    setAgent(null);
    setPhoneInput("");
  }

  if (agent === undefined) return <div style={sx.page}><div style={sx.center}>Загрузка…</div></div>;

  if (!agent) {
    return (
      <div style={sx.page}>
        <button onClick={() => router.push("/")} style={sx.backBtn}>‹</button>
        <div style={sx.loginBox}>
          <div style={sx.loginIcon}>👤</div>
          <div style={sx.loginTitle}>Вход в личный кабинет</div>
          <div style={sx.loginSub}>Введите ваш рабочий номер телефона</div>
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="+996 700 000 000"
            style={sx.input}
          />
          {loginError && <div style={sx.error}>{loginError}</div>}
          <button onClick={handleLogin} disabled={busy} style={sx.loginBtn}>{busy ? "Проверяю…" : "Войти"}</button>
        </div>
        <BottomNav active="Профиль" />
      </div>
    );
  }

  return (
    <div style={sx.page}>
      <button onClick={() => router.push("/")} style={sx.backBtn}>‹</button>

      {/* Профиль */}
      <div style={sx.profileHeader}>
        <div style={sx.avatarBig}>{(agent.name || "?")[0]}</div>
        <div style={sx.name}>{agent.name}</div>
        <div style={sx.phone}>{agent.phone}</div>
        <button style={{ ...sx.editProfileBtn, opacity: 0.6 }} disabled>
          ✏️ Редактировать профиль ⭐ <span style={{ fontSize: 10 }}>(скоро)</span>
        </button>
      </div>

      {/* Быстрые разделы — Мои подборки / Реклама / Клиенты */}
      <div style={sx.quickRow}>
        <a href="/collections" style={sx.quickTile}>
          <div style={sx.quickIcon}>📁</div>
          <div style={sx.quickLabel}>Мои подборки</div>
        </a>
        <a href="/ads" style={sx.quickTile}>
          <div style={sx.quickIcon}>📣</div>
          <div style={sx.quickLabel}>Реклама</div>
        </a>
        <a href="/ads" style={sx.quickTile}>
          <div style={sx.quickIcon}>👥</div>
          <div style={sx.quickLabel}>Клиенты</div>
        </a>
      </div>

      {/* Вкладки статусов */}
      <div style={sx.statusTabsRow}>
        {[
          ["активно", `Активно (${counts.активно})`],
          ["черновики", `Черновики (${counts.черновики})`],
          ["деактивировано", `Деактивировано (${counts.деактивировано})`],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setStatusTab(key)}
            style={{ ...sx.statusTab, ...(statusTab === key ? sx.statusTabActive : {}) }}>
            {label}
          </button>
        ))}
      </div>

      {/* Поиск + фильтры */}
      <div style={sx.searchRow}>
        <span style={{ opacity: 0.5 }}>🔍</span>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по моим объектам" style={sx.searchInput} />
        <button onClick={() => setShowCategoryPicker(true)} style={sx.searchFilterBtn} aria-label="Фильтр">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5BD98A" strokeWidth="2">
            <path d="M4 5h16M7 12h10M11 19h2" />
          </svg>
        </button>
      </div>
      <div style={sx.filterRow}>
        <button onClick={() => setShowCategoryPicker(true)} style={sx.filterBtn}>Категории{categoryFilter ? " ✓" : ""}</button>
        <button onClick={() => setShowSortPicker(true)} style={sx.filterBtn}>Сортировать</button>
        {(categoryFilter || sortBy !== "new" || search) && (
          <button onClick={() => { setCategoryFilter(null); setSortBy("new"); setSearch(""); }} style={sx.resetBtn}>Сбросить фильтр</button>
        )}
      </div>

      {/* Сетка объектов */}
      {visibleListings.length === 0 ? (
        <div style={sx.emptyMsg}>Ничего не найдено в этой вкладке.</div>
      ) : (
        <>
          <div style={sx.selectHeaderRow}>
            <span style={sx.selectHeaderText}>
              {selected.size > 0 ? `Выбрано ${selected.size}/${visibleListings.length}` : `Всего объявлений: ${visibleListings.length}`}
            </span>
            <button onClick={selectAllVisible} style={sx.selectAllBtn}>Выбрать все</button>
          </div>
          <div style={sx.grid2}>
            {visibleListings.map((l) => {
              const ad = adStatusInfo(l);
              const isSel = selected.has(l.id);
              return (
                <div key={l.id} style={sx.bigCard}>
                  <div style={sx.bigCardPhotoWrap}>
                    <a href={`/listing/${l.id}`}><ListingThumb l={l} style={{ width: "100%", height: "100%" }} /></a>
                    <button onClick={() => toggleSelect(l.id)} style={sx.checkCircle} aria-label="Выбрать">
                      {isSel ? <span style={sx.checkCircleFilled}>✓</span> : <span style={{ ...sx.checkCircleEmpty, borderColor: (l.photos || [])[0] ? "#fff" : "#111" }} />}
                    </button>
                    <div style={{ ...sx.adBar, background: ad.bg }}>{ad.icon} {ad.label}</div>
                  </div>
                  <a href={`/listing/${l.id}`} style={{ textDecoration: "none", color: "#fff" }}>
                    <div style={sx.bigCardPrice}>${priceBlock(l).usd.toLocaleString("ru-RU")}</div>
                    <div style={sx.bigCardPriceKgs}>{priceBlock(l).kgs.toLocaleString("ru-RU")} сом</div>
                    <div style={sx.bigCardMeta}>{fullCharLine(l)}</div>
                    <div style={sx.bigCardCategory}>{categoryLabel(l.type)}</div>
                    <div style={sx.bigCardLoc}>{[l.zhk, l.district].filter(Boolean).join(", ")}</div>
                    {l.description && <div style={sx.bigCardDesc}>{l.description}</div>}
                  </a>
                  <div style={sx.statsBox}>
                    <span style={sx.statsItem}><IconEyeOutline /> 0</span>
                    <span style={sx.statsItem}><IconRepliesBubble /> 0</span>
                    {l.display_id && (
                      <button onClick={() => copyId(l.display_id)} style={sx.idCopyBtn}>
                        ID {l.display_id}
                        {copiedId === l.display_id ? <IconCheckSmall /> : <IconCopySmall />}
                      </button>
                    )}
                  </div>
                  <div style={{ padding: "8px 10px 0", display: "flex" }}><AddToCollectionButton listingId={l.id} compact /></div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Мои подборки */}
      <button onClick={handleLogout} style={sx.logoutBtnBottom}>Выйти</button>

      {selected.size > 0 && (
        <div style={sx.bulkBar}>
          <button onClick={() => router.push("/ads")} style={sx.bulkBtn}>Запустить рекламу ({selected.size})</button>
          <button onClick={() => setShowBulkCollection(true)} style={sx.bulkBtn}>Отправить в подборку ({selected.size})</button>
          <button onClick={bulkDeactivate} disabled={bulkBusy} style={sx.bulkDeactivateBtn}>Деактивировать</button>
        </div>
      )}

      {showBulkCollection && (
        <BulkCollectionModal
          agent={agent}
          onClose={() => { setShowBulkCollection(false); setBulkDone(null); }}
          onPick={bulkAddToCollection}
          busy={bulkBusy}
          done={bulkDone}
        />
      )}

      {/* Модалка категорий */}
      {showCategoryPicker && (
        <div style={sx.modalOverlay} onClick={() => setShowCategoryPicker(false)}>
          <div style={sx.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={sx.modalHandle} />
            <div style={sx.modalTitle}>Категории</div>
            <button onClick={() => { setCategoryFilter(null); setShowCategoryPicker(false); }} style={sx.categoryRow}>
              <span>Все категории</span><span style={{ color: "#7FA396" }}>{myListings.length}</span>
            </button>
            {FILTER_CATS.map((c) => (
              <button key={c.type} onClick={() => { setCategoryFilter(c.type); setShowCategoryPicker(false); }} style={sx.categoryRow}>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <img src={c.img} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }} />
                  {c.label}
                </span>
                <span style={{ color: "#7FA396" }}>{categoryCounts[c.type] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Модалка сортировки */}
      {showSortPicker && (
        <div style={sx.modalOverlay} onClick={() => setShowSortPicker(false)}>
          <div style={sx.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={sx.modalHandle} />
            <div style={sx.modalTitle}>Сортировать</div>
            {[["new", "Сначала новые"], ["cheap", "Сначала дешевле"], ["expensive", "Сначала дороже"]].map(([key, label]) => (
              <button key={key} onClick={() => { setSortBy(key); setShowSortPicker(false); }} style={sx.categoryRow}>
                <span>{label}</span>{sortBy === key && <span style={{ color: "#5BD98A" }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <BottomNav active="Профиль" />
    </div>
  );
}

function BulkCollectionModal({ agent, onClose, onPick, busy, done }) {
  const [recent, setRecent] = useState([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem("rayan_collections") || "[]")); } catch {}
  }, []);

  if (done) {
    return (
      <div style={sx.modalOverlay} onClick={onClose}>
        <div style={sx.modalSheet} onClick={(e) => e.stopPropagation()}>
          <div style={sx.modalHandle} />
          <div style={sx.modalTitle}>Добавлено ✓</div>
          <div style={sx.selectHeaderText}>В подборку «{done}»</div>
          <button onClick={onClose} style={{ ...sx.loginBtn, marginTop: 16 }}>Готово</button>
        </div>
      </div>
    );
  }

  return (
    <div style={sx.modalOverlay} onClick={onClose}>
      <div style={sx.modalSheet} onClick={(e) => e.stopPropagation()}>
        <div style={sx.modalHandle} />
        <div style={sx.modalTitle}>Отправить в подборку</div>

        <div style={{ ...sx.selectHeaderText, marginBottom: 6 }}>Новая подборка</div>
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="Например: Для Айгерим" style={sx.input} />
        <button disabled={busy || !newName.trim()} onClick={() => onPick(null, true, newName.trim())}
          style={{ ...sx.loginBtn, marginTop: 10, marginBottom: 18 }}>
          Создать и добавить
        </button>

        <div style={{ ...sx.selectHeaderText, marginBottom: 6 }}>Мои подборки</div>
        {recent.length === 0 ? (
          <div style={sx.emptyMsg}>Пока нет ни одной подборки на этом устройстве.</div>
        ) : (
          recent.map((c) => (
            <button key={c.id} disabled={busy} onClick={() => onPick(c.id, false)} style={sx.categoryRow}>
              {c.name}
            </button>
          ))
        )}
        <button onClick={onClose} style={sx.logoutBtnBottom}>Отмена</button>
      </div>
    </div>
  );
}

const sx = {
  page: { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#0C0C0D",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", color: "#fff", padding: "16px 20px 90px" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh", color: "#8B8B90" },
  backBtn: { width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.08)", color: "#fff",
    border: "none", fontSize: 22, lineHeight: "36px", marginBottom: 14 },

  loginBox: { marginTop: 50, textAlign: "center" },
  loginIcon: { fontSize: 40, marginBottom: 10 },
  loginTitle: { fontSize: 21, fontWeight: 800, textAlign: "center" },
  loginSub: { fontSize: 13.5, color: "#8B8B90", textAlign: "center", marginTop: 6, marginBottom: 22 },
  input: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 12, padding: "15px 14px", color: "#fff", fontSize: 16, textAlign: "center" },
  error: { color: "#E8877A", fontSize: 12.5, textAlign: "center", marginTop: 10 },
  loginBtn: { width: "100%", background: "#1FA35C", border: "none", color: "#fff", fontWeight: 700,
    fontSize: 15.5, padding: "15px 0", borderRadius: 12, marginTop: 16 },

  profileHeader: { textAlign: "center", marginBottom: 20 },
  avatarBig: { width: 72, height: 72, borderRadius: "50%", background: "rgba(31,163,92,0.18)", color: "#5BD98A",
    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 28, margin: "0 auto 10px" },
  name: { fontSize: 19, fontWeight: 800 },
  phone: { fontSize: 12.5, color: "#8B8B90", marginTop: 2 },
  editProfileBtn: { marginTop: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)",
    color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "8px 16px", borderRadius: 20 },

  quickRow: { display: "flex", gap: 10, marginBottom: 20 },
  quickTile: { flex: 1, textDecoration: "none", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 14, padding: "14px 6px", textAlign: "center", color: "#fff" },
  quickIcon: { fontSize: 22, marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: 700 },

  statusTabsRow: { display: "flex", gap: 8, overflowX: "auto", marginBottom: 14, paddingBottom: 2 },
  statusTab: { flexShrink: 0, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
    color: "#8B8B90", fontSize: 12.5, fontWeight: 700, padding: "9px 15px", borderRadius: 18 },
  statusTabActive: { background: "rgba(31,163,92,0.18)", border: "1px solid rgba(31,163,92,0.5)", color: "#5BD98A" },

  searchRow: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "11px 14px", marginBottom: 10 },
  searchInput: { flex: 1, background: "none", border: "none", color: "#fff", fontSize: 14, outline: "none" },
  searchFilterBtn: { background: "none", border: "none", display: "flex", alignItems: "center", padding: 0 },
  filterRow: { display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" },
  filterBtn: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff",
    fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 16 },
  resetBtn: { background: "none", border: "none", color: "#5BD98A", fontSize: 12, fontWeight: 700, padding: "8px 4px" },

  emptyMsg: { color: "#8B8B90", fontSize: 13, lineHeight: 1.6, marginBottom: 20 },
  selectHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  selectHeaderText: { fontSize: 13, fontWeight: 700 },
  selectAllBtn: { background: "none", border: "none", color: "#5BD98A", fontSize: 13, fontWeight: 700 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 },
  bigCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "0 0 10px", overflow: "hidden" },
  bigCardPhotoWrap: { position: "relative", width: "100%", aspectRatio: "1/1", background: "#1A1A1C" },
  checkCircle: { position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: "50%",
    background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" },
  checkCircleEmpty: { width: 22, height: 22, borderRadius: "50%", border: "2px solid #fff", background: "transparent" },
  checkCircleFilled: { width: 22, height: 22, borderRadius: "50%", background: "#1FA35C", color: "#fff",
    fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" },
  adBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: "6px 8px", color: "#fff",
    fontSize: 10.5, fontWeight: 800, textAlign: "center" },
  statsBox: { display: "flex", alignItems: "center", gap: 12, margin: "6px 10px 0", fontSize: 11 },
  statsItem: { display: "flex", alignItems: "center", gap: 4, color: "#B8B8BE", fontWeight: 600 },
  cardPhotoWrap: { width: "100%", aspectRatio: "1/1", background: "#1A1A1C" },
  bigCardPrice: { fontSize: 15, fontWeight: 800, margin: "9px 10px 0" },
  bigCardPriceKgs: { fontSize: 11, color: "#8B8B90", margin: "1px 10px 0" },
  bigCardMeta: { fontSize: 11.5, color: "#EDEDEF", margin: "5px 10px 0" },
  bigCardCategory: { fontSize: 11, fontWeight: 600, color: "#fff", margin: "2px 10px 0" },
  bigCardLoc: { fontSize: 10.5, color: "#8B8B90", margin: "1px 10px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  bigCardDesc: { fontSize: 10.5, color: "#B8B8BE", margin: "4px 10px 0", lineHeight: 1.4,
    display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" },
  idCopyBtn: { display: "flex", alignItems: "center", gap: 4, background: "none", border: "none",
    color: "#B8B8BE", fontSize: 11, fontWeight: 600, padding: 0, marginLeft: "auto" },

  cardPhoto: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  cardPhotoEmpty: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
    color: "#8B8B90", fontSize: 9.5, background: "#FFFFFF" },

  sectionTitle: { fontSize: 12.5, fontWeight: 700, color: "#7FA396", textTransform: "uppercase",
    letterSpacing: 0.5, marginTop: 30, marginBottom: 12, paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.07)" },
  collectionRow: { display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 14px", marginBottom: 10 },
  collectionRowLink: { display: "flex", flexDirection: "column", gap: 3, textDecoration: "none", color: "#fff" },
  collectionRowName: { fontSize: 14, fontWeight: 700 },
  collectionRowCount: { color: "#7FA396", fontSize: 11.5 },
  shareIconBtn: { width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.08)",
    border: "none", display: "flex", alignItems: "center", justifyContent: "center" },

  logoutBtnBottom: { width: "100%", marginTop: 30, background: "none", border: "1px solid rgba(255,255,255,0.15)",
    color: "#8B8B90", fontSize: 13, padding: "12px 0", borderRadius: 10 },

  bulkBar: { position: "fixed", left: 0, right: 0, bottom: 0, maxWidth: 480, margin: "0 auto",
    background: "#18181A", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "12px 20px 20px",
    display: "flex", flexDirection: "column", gap: 8, zIndex: 60 },
  bulkBtn: { width: "100%", background: "#1FA35C", border: "none", color: "#fff", fontWeight: 700,
    fontSize: 14, padding: "13px 0", borderRadius: 12 },
  bulkDeactivateBtn: { width: "100%", background: "none", border: "none", color: "#E8877A", fontWeight: 700, fontSize: 13, padding: "4px 0" },

  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 80 },
  modalSheet: { width: "100%", maxWidth: 480, background: "#18181A", borderRadius: "18px 18px 0 0", padding: "10px 20px 28px", color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", maxHeight: "70vh", overflowY: "auto" },
  modalHandle: { width: 40, height: 4, background: "rgba(255,255,255,0.22)", borderRadius: 2, margin: "4px auto 16px" },
  modalTitle: { fontSize: 18, fontWeight: 800, marginBottom: 12 },
  categoryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
    background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "13px 14px", borderRadius: 12, marginBottom: 8, fontSize: 14, textAlign: "left" },
};
