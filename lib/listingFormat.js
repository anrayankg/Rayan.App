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

export function fullCharLine(l) {
  const t = l.type || "";
  const rooms = roomsShort(l) || "—";
  const floors = l.floor && l.floors_total ? `${l.floor}/${l.floors_total} эт.`
    : (l.floors_total ? `${l.floors_total} эт.` : "—");
  const area = l.area_m2 ? `${l.area_m2} м²` : "—";

  if (t === "первичка") {
    let status = "—";
    if (l.construction_status === "Сдан ПСО (ключи)") status = "ПСО сдан";
    else if (l.delivery_year && l.delivery_quarter) status = `сдача ${l.delivery_year}г ${l.delivery_quarter} квартал`;
    return [rooms, status, floors, area].join(" · ");
  }
  if (t === "вторичка") {
    const series = l.series ? `${l.series} серии` : "—";
    return [rooms, series, floors, area].join(" · ");
  }

  const parts = [];
  if (l.plot_sotka) parts.push(`${l.plot_sotka} сот.`);
  if (l.area_m2) parts.push(`${l.area_m2} м²`);
  if (l.floor && l.floors_total) parts.push(`${l.floor}/${l.floors_total} эт.`);
  return parts.length ? parts.join(" · ") : "—";
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
