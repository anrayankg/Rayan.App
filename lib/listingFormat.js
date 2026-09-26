// Единая логика "4 параметра объекта" — используется ВЕЗДЕ (главная, клиент, агент,
// подборка, личный кабинет), чтобы вид не расходился от страницы к странице.
// Взято как есть с главной страницы (самая первая и проверенная версия), просто
// вынесено в общий файл, чтобы не копировать в каждую страницу заново.

export function parseExtra(extraDetails) {
  try {
    return extraDetails ? (typeof extraDetails === "string" ? JSON.parse(extraDetails) : extraDetails) : {};
  } catch {
    return {};
  }
}

export function roomsShort(l) {
  const rt = l.room_type || l.rooms || "";
  if (!rt) return null;
  if (/гостинка/i.test(rt)) return "Гостинка";
  if (rt.startsWith("6+")) return "6+ комн.";
  const m = rt.match(/^(\d+)/);
  return m ? `${m[1]} комн.` : rt;
}

// Серия грамотно: "105" / "105 серия" → "105 серии"; "Индивидуалка", "Элитка",
// "Сталинка" и т.п. — как есть, без слова "серии".
export function seriesLabel(series) {
  const s = String(series || "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{3})(\s*сери[яи])?$/i);
  if (m) return `${m[1]} серии`;
  return s;
}

// Этаж/этажность: "4/5 эт.", "Пентхаус/12 эт.", "Цокольный/9 эт."
export function floorsText(l) {
  const fl = parseExtra(l.extra_details).floorLabel || (l.floor === 0 ? "Цокольный" : l.floor);
  if (fl && l.floors_total) return `${fl}/${l.floors_total} эт.`;
  if (fl) return `${fl} эт.`;
  if (l.floors_total) return `${l.floors_total} эт.`;
  return null;
}

export function fullCharLine(l) {
  const t = l.type || "";
  const rooms = roomsShort(l);
  const floors = floorsText(l);
  const area = l.area_m2 ? `${l.area_m2} м²` : null;

  if (t === "первичка") {
    let status = null;
    if (l.construction_status === "Сдан ПСО (ключи)") status = "ПСО сдан";
    else if (l.delivery_year && l.delivery_quarter) status = `сдача ${l.delivery_year}г ${l.delivery_quarter} квартал`;
    else if (l.delivery_year) status = `сдача ${l.delivery_year}г`;
    return [rooms, status, floors, area].filter(Boolean).join(" · ") || "—";
  }
  if (t === "вторичка") {
    return [rooms, seriesLabel(l.series), floors, area].filter(Boolean).join(" · ") || "—";
  }

  const parts = [];
  if (l.plot_sotka) parts.push(`${l.plot_sotka} сот.`);
  if (l.area_m2) parts.push(`${l.area_m2} м²`);
  if (floors) parts.push(floors);
  return parts.length ? parts.join(" · ") : "—";
}

// Дата коротко: 22.04.26г
export function shortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}г`;
}

// Основные параметры объекта для блока "Детали объекта" (все страницы одинаково)
export function mainDetailRows(l) {
  const comms = [l.gas && "газ", l.water && "вода", l.electricity && "свет", l.sewerage && "канализация", l.hot_water && "горячая вода"].filter(Boolean);
  const rows = [
    ["Комнатность", l.room_type || l.rooms],
    ["Серия", seriesLabel(l.series)],
    ["Этаж / этажность", floorsText(l)],
    ["Площадь", l.area_m2 ? `${l.area_m2} м²` : null],
    ["Город", l.city],
    ["Район", l.district],
    ["ЖК", l.zhk],
    ["Статус строительства", l.construction_status],
    ["Срок сдачи", l.delivery_year ? `${l.delivery_quarter ? l.delivery_quarter + " кв. " : ""}${l.delivery_year}` : null],
    ["Отопление", l.heating],
    ["Коммуникации", comms.length ? comms.join(", ") : null],
    ["Условия сделки", l.deal_terms],
  ];
  return rows.filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "" && String(v).trim() !== "—");
}

export const USD_KGS_RATE = 87.45; // курс НБКР, обновлять вручную пока не подключён автокурс

export function priceBlock(listing) {
  const price = Number(listing.price) || 0;
  const rawCurrency = listing.currency_new || listing.currency || "USD";
  const isUSD = String(rawCurrency).toUpperCase() === "USD" || rawCurrency === "$";
  const usd = isUSD ? price : Math.round(price / USD_KGS_RATE);
  const kgs = isUSD ? Math.round(price * USD_KGS_RATE) : price;
  return { usd, kgs };
}

export function categoryLabel(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("новострой") || t.includes("первичк")) return "Продажа квартир в новостройке";
  if (t.includes("квартир") || t.includes("вторичк")) return "Продажа квартир";
  if (t.includes("дом")) return "Продажа домов";
  if (t.includes("участ")) return "Продажа земельных участков";
  if (t.includes("коммерц")) return "Коммерческая недвижимость";
  if (t.includes("аренд")) return "Аренда";
  if (t.includes("иссык")) return "Иссык-Куль";
  if (t.includes("инвест")) return "Инвестиции";
  return type || "Недвижимость";
}
