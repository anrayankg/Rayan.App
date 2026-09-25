// Фильтр: шаги ИДУТ В ТОМ ЖЕ ПОРЯДКЕ, что и поля при добавлении объекта этой категории.
// Внутренняя информация для агента, описание и финансы в фильтр НЕ входят — только "Договор".
// Варианты выбора скопированы из форм app/add/vtorichka и app/add/pervichka —
// если там поменяете варианты, поменяйте и здесь.
import { CAT_KVARTIRY, CAT_NOVOSTROYKI, CAT_DOMA, CAT_UCHASTOK, CAT_KOMMERCIYA, CAT_ARENDA } from "./categoryIcons";
import { CITIES, CITY_DISTRICTS } from "./locations";
import { FLOOR_CHOICES, FLOORS_TOTAL_CHOICES, floorValue } from "./floors";
import { priceBlock } from "./listingFormat";

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
const WINDOW_DIRS = ["Север", "Юг", "Запад", "Восток", "Северо-восток", "Северо-запад", "Юго-восток", "Юго-запад"];
const JILYE_CLASS_OPTS = ["Эконом", "Комфорт", "Бизнес", "Комфорт+", "Премиум", "Клубный дом", "Другое"];
const WALL_CONSTRUCTION_OPTS = [
  "Монолитно-кирпичная", "Газобетон", "Газоблок", "Железобетонная", "Кирпич", "Монолитная",
  "Монолитно-газобетонная", "Монолитно-каркасная", "Панельная", "Пеноблок", "Саман", "Другая конструкция",
];
const DEAL_V = ["Наличные", "Ипотека", "Рассрочка через Госрегистр", "Обмен"];
const HEATING_OPTS_PERVICHKA = [
  "Центральное", "Индивидуальный газовый котёл", "Своя газовая котельная",
  "Электро-котельная", "Другое",
];
const CONSTRUCTION_STATUS_OPTS = [
  "В проекте", "Подготовительные работы", "Строится", "Построен, но не сдан под ПСО", "Сдан ПСО (ключи)",
];
const INFRA_CATEGORIES = [
  { title: "Территория и дворы", options: ["Закрытая территория", "Охрана 24/7", "Видеонаблюдение", "КПП / контроль доступа", "Двор без машин", "Ландшафтное озеленение", "Парк / сквер", "Прогулочные зоны", "Зоны отдыха", "Фонтаны", "BBQ-зона"] },
  { title: "Для детей", options: ["Детский сад", "Школа", "Детские площадки", "Развивающий центр", "Детский клуб", "Игровая комната", "Детские спортивные площадки"] },
  { title: "Спорт и здоровье", options: ["Фитнес-клуб", "Тренажёрный зал", "Бассейн", "Детский бассейн", "Спортивный зал", "Футбольное поле", "Баскетбольная площадка", "Теннисный корт", "Падел-корт", "Беговая дорожка", "Велодорожка", "Медицинский центр", "Аптека"] },
  { title: "Коммерция", options: ["Супермаркет", "Магазины", "Торговая галерея", "Кафе", "Рестораны", "Кофейни", "Пекарня", "Салон красоты", "Барбершоп", "Банк / банкомат", "Бытовые услуги"] },
  { title: "Паркинг и транспорт", options: ["Подземный паркинг", "Наземный паркинг", "Многоуровневый паркинг", "Гостевой паркинг", "Зарядки для электромобилей", "Автомойка", "Шиномонтаж", "Велопарковка"] },
  { title: "Современные пространства", options: ["Коворкинг", "Бизнес-лаунж", "Lounge-зона", "Rooftop / терраса на крыше", "Смотровая площадка", "Амфитеатр", "Центральная площадь", "Общественное пространство", "Сад на крыше"] },
  { title: "Сервисы для жителей", options: ["Консьерж", "Просторное лобби", "Постамат", "Комната для хранения посылок", "Пункт выдачи заказов", "Приложение ЖК", "Умный дом", "Умный домофон", "Цифровой доступ", "Face ID"] },
  { title: "Экологические решения", options: ["Солнечные панели", "Энергоэффективные технологии", "Раздельный сбор мусора", "Система сбора дождевой воды", "Озеленённая крыша", "Вертикальное озеленение"] },
];
const ARCHITECTURE_OPTS = [
  "Стилобат", "Двор на стилобате", "Подземный паркинг", "Двор без машин", "Коммерция на первых этажах",
  "Первые этажи с панорамным остеклением", "Эксплуатируемая кровля", "Rooftop", "Сад на крыше",
  "Панорамные виды", "Архитектурное освещение", "Авторская архитектура", "Концепция «город в городе»",
];
const DEAL_P = ["Наличные", "Ипотека", "Рассрочка через Госрегистр", "Рассрочка от строительной компании", "Обмен"];

const CUR_YEAR = new Date().getFullYear();
const YEARS_BUILT = Array.from({ length: CUR_YEAR - 1940 + 1 }, (_, i) => String(CUR_YEAR - i));
const DELIVERY_YEARS = Array.from({ length: 26 }, (_, i) => String(CUR_YEAR - 15 + i));
const QUARTERS = ["1 квартал", "2 квартал", "3 квартал", "4 квартал"];
const YES_NO = ["Да", "Нет"];
const COMMS = ["Газ", "Вода", "Электричество", "Канализация", "Горячая вода"];
const COUNT_1_40 = Array.from({ length: 40 }, (_, i) => String(i + 1));
const INFRA_ZHK = INFRA_CATEGORIES.flatMap((c) => c.options);

export const FILTER_CATEGORIES = [
  { key: "vtorichka", label: "Квартиры (вторичка)", img: CAT_KVARTIRY, match: (l) => l.type === "вторичка" },
  { key: "pervichka", label: "Новостройки (первичка)", img: CAT_NOVOSTROYKI, match: (l) => l.type === "первичка" },
  { key: "dom", label: "Дома", img: CAT_DOMA, match: (l) => l.type === "дом" },
  { key: "uchastok", label: "Участки", img: CAT_UCHASTOK, match: (l) => l.type === "участок" },
  { key: "kommerciya", label: "Коммерческая", img: CAT_KOMMERCIYA, match: (l) => l.type === "коммерция" },
  { key: "arenda", label: "Аренда", img: CAT_ARENDA, match: (l) => l.type === "аренда" },
  { key: "issykkul", label: "Иссык-Куль", icon: "M3 18l5-8 4 5 3-4 6 7H3z",
    match: (l) => /иссык|чолпон|бостери|каракол|тамчы|чок-тал/i.test([l.city, l.district, l.zhk, l.description].filter(Boolean).join(" ")) },
  { key: "investicii", label: "Инвестиции", icon: "M3 17l6-6 4 4 8-8M21 3h-6M21 3v6",
    match: (l) => /инвест/i.test([l.type, l.description].filter(Boolean).join(" ")) },
];

function parseExtra(x) {
  try { return x ? (typeof x === "string" ? JSON.parse(x) : x) : {}; } catch { return {}; }
}
const ex = (key) => (l) => parseExtra(l.extra_details)[key];
const yesNo = (v) => (v === true ? "Да" : v === false ? "Нет" : "");
const splitList = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);

// Шаги. kind: cities | districts | multi | tiles | range | selectRange | price | contract | sort
const S = {
  city: { id: "city", kind: "cities", title: "Город", required: true },
  district: { id: "district", kind: "districts", title: "Район" },
  rooms: { id: "rooms", kind: "multi", title: "Комнатность", options: ROOM_TYPES, get: (l) => l.room_type || l.rooms },
  series: { id: "series", kind: "multi", title: "Серия", options: SERIES_OPTIONS, get: (l) => l.series },
  area: { id: "area", kind: "range", title: "Площадь, м²", get: (l) => Number(l.area_m2) || null },
  floor: { id: "floor", kind: "tiles", title: "Этаж", options: FLOOR_CHOICES, get: floorValue },
  floorsTotal: { id: "floorsTotal", kind: "selectRange", title: "Этажей в доме", options: FLOORS_TOTAL_CHOICES, get: (l) => Number(l.floors_total) || null },
  docs: { id: "docs", kind: "multi", title: "Документы", options: DOC_OPTIONS, get: (l) => l.documents },
  heatingV: { id: "heating", kind: "multi", title: "Отопление", options: HEATING_OPTS, get: (l) => l.heating },
  heatingP: { id: "heating", kind: "multi", title: "Отопление", options: HEATING_OPTS_PERVICHKA, get: (l) => l.heating },
  comms: { id: "comms", kind: "multi", title: "Коммуникации", sub: "Покажем объекты, где есть ВСЁ выбранное", options: COMMS, matchAll: true,
    get: (l) => [l.gas && "Газ", l.water && "Вода", l.electricity && "Электричество", l.sewerage && "Канализация", l.hot_water && "Горячая вода"].filter(Boolean) },
  price: { id: "price", kind: "price", title: "Цена" },
  dealV: { id: "deal", kind: "multi", title: "Условия сделки", options: DEAL_V, get: (l) => splitList(l.deal_terms) },
  dealP: { id: "deal", kind: "multi", title: "Условия сделки", options: DEAL_P, get: (l) => splitList(l.deal_terms) },
  gosregistr: { id: "gosregistr", kind: "multi", title: "Проходит через Госрегистр и нотариуса", options: YES_NO, get: (l) => yesNo(l.gosregistr) },
  constr: { id: "constr", kind: "multi", title: "Статус строительства", options: CONSTRUCTION_STATUS_OPTS, get: (l) => l.construction_status },
  delivYear: { id: "delivYear", kind: "multi", title: "Год сдачи", options: DELIVERY_YEARS, get: (l) => (l.delivery_year ? String(l.delivery_year) : "") },
  delivQ: { id: "delivQ", kind: "multi", title: "Квартал сдачи", options: QUARTERS, get: (l) => (l.delivery_quarter ? `${l.delivery_quarter} квартал` : "") },
  contract: { id: "contract", kind: "contract", title: "Договор" },
  sort: { id: "sort", kind: "sort", title: "Сортировать" },
};
const X = (id, title, options) => ({ id: "x_" + id, kind: "multi", title, options, get: ex(id), extra: true });

const VTORICHKA = [S.city, S.district, S.rooms, S.series, S.area, S.floor, S.floorsTotal, S.docs, S.heatingV, S.comms, S.price, S.dealV,
  X("jilyeClass", "Класс жилья", JILYE_CLASS_OPTS), X("godPostroiki", "Год постройки", YEARS_BUILT),
  X("planirovka", "Планировка", ["Сквозная", "В линейку"]), X("lift", "Лифт", ["Да, работает", "Да, не работает", "Нет"]),
  X("tehEtazh", "Технический этаж", ["Тех этаж есть", "Тех этаж нет"]), X("okna", "Расположение окон", WINDOW_DIRS),
  X("stenyKonstrukciya", "Конструкция стен", WALL_CONSTRUCTION_OPTS), X("dvor", "Двор", ["Закрытый", "Охраняемый", "Открытый"]),
  X("detskaya", "Детская площадка", ["Есть", "Нет"]), X("infra", "Инфраструктура рядом", ["Магазины", "Школы", "Детские сады", "Остановки", "Торговый центр", "Рынок/базар"]),
  X("remont", "Ремонт", ["Евро", "Дизайнерский", "Предчистовая", "ПСО", "Без ремонта", "Другое"]),
  X("mebelDaNet", "Мебель остаётся", YES_NO), X("mebelObyem", "Мебель — объём", ["Частично", "Полностью"]),
  X("tehnikaDaNet", "Техника остаётся", YES_NO), X("tehnikaObyem", "Техника — объём", ["Частично", "Полностью"]),
  X("kvNaEtazhe", "Квартир на этаже", COUNT_1_40), X("arest", "Есть ли арест", YES_NO), X("zalog", "Есть ли залог в банке", YES_NO),
  X("ploshadSootv", "Площадь совпадает с документами", YES_NO), X("pereplanirovka", "Есть ли перепланировка", YES_NO),
  X("pereplanirovkaStatus", "Перепланировка", ["Узаконена", "Не узаконена"]),
  S.contract, S.sort];

const PERVICHKA = [S.city, S.district, S.rooms, S.area, S.floor, S.floorsTotal, S.docs, S.gosregistr, S.constr, S.delivYear, S.delivQ,
  S.heatingP, S.comms, S.price, S.dealP,
  X("jilyeClass", "Класс жилья", JILYE_CLASS_OPTS), X("krasnayaKniga", "Красная книга застройщика", YES_NO),
  X("razreshenie", "Разрешение на строительство", YES_NO), X("kvNaEtazhe", "Квартир на этаже", COUNT_1_40),
  X("liftRabotaet", "Лифт уже работает", YES_NO), X("detskaya", "Детские площадки", YES_NO),
  X("parkovka", "Парковка", ["Подземная", "Наземная", "Подземная и наземная", "Нет"]),
  X("kommercheskie", "Коммерческие помещения в доме", YES_NO), X("infraZhk", "Инфраструктура ЖК", INFRA_ZHK),
  X("arhitektura", "Архитектура и концепция", ARCHITECTURE_OPTS), X("polnCenPloshad", "Полноценная или студия", ["Полноценная", "Студия"]),
  X("okna", "Расположение окон", WINDOW_DIRS), X("stenyKonstrukciya", "Конструкция стен", WALL_CONSTRUCTION_OPTS),
  X("remont", "Ремонт / отделка", ["ПСО", "Предчистовая", "Черновая", "Евро", "Дизайнерский", "Без отделки", "Другое"]),
  X("mebelDaNet", "Мебель", YES_NO), X("tehnikaDaNet", "Техника", YES_NO), X("arest", "Есть ли арест", YES_NO),
  X("zalog", "Есть ли залог в банке", YES_NO), X("ploshadSootv", "Площадь совпадает с документами", YES_NO),
  X("ipoteka", "Ипотека через банк", YES_NO), X("rassrochkaZastroy", "Рассрочка от застройщика", YES_NO),
  S.contract, S.sort];

// Для категорий, у которых ещё нет своей формы добавления — пока общий набор.
const GENERIC = [S.city, S.district, S.area, S.price, S.contract, S.sort];

export function stepsFor(catKey) {
  if (catKey === "vtorichka") return VTORICHKA;
  if (catKey === "pervichka") return PERVICHKA;
  return GENERIC;
}

export function districtsFor(cities) {
  const out = [];
  (cities || []).forEach((c) => (CITY_DISTRICTS[c] || []).forEach((d) => { if (!out.includes(d)) out.push(d); }));
  return out;
}
export { CITIES };

export const EMPTY = { cat: null, v: {} };

// Проверяет один объект по всем выбранным условиям фильтра.
export function matchListing(l, f) {
  if (!f || !f.cat) return true;
  const cat = FILTER_CATEGORIES.find((c) => c.key === f.cat);
  if (cat && !cat.match(l)) return false;
  const v = f.v || {};
  for (const step of stepsFor(f.cat)) {
    const val = v[step.id];
    if (val == null) continue;
    if (step.kind === "cities") {
      if (val.length && !val.includes(l.city || "Бишкек")) return false;
    } else if (step.kind === "districts") {
      if (val.length && !val.includes(l.district)) return false;
    } else if (step.kind === "multi" || step.kind === "tiles") {
      if (!val.length) continue;
      const raw = step.get(l);
      const have = Array.isArray(raw) ? raw.map(String) : raw ? [String(raw)] : [];
      if (step.matchAll ? !val.every((x) => have.includes(x)) : !val.some((x) => have.includes(x))) return false;
    } else if (step.kind === "range" || step.kind === "selectRange") {
      const n = step.get(l);
      if (val.min && (n == null || n < Number(val.min))) return false;
      if (val.max && (n == null || n > Number(val.max))) return false;
    } else if (step.kind === "price") {
      const p = priceBlock(l);
      const n = val.cur === "KGS" ? p.kgs : p.usd;
      if (val.min && n < Number(val.min)) return false;
      if (val.max && n > Number(val.max)) return false;
    } else if (step.kind === "contract") {
      if (val !== "все" && (l.contract_status || "без договора") !== val) return false;
    }
  }
  return true;
}

export function sortListings(list, sort) {
  if (sort === "cheap") return [...list].sort((a, b) => priceBlock(a).usd - priceBlock(b).usd);
  if (sort === "expensive") return [...list].sort((a, b) => priceBlock(b).usd - priceBlock(a).usd);
  return [...list].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

// Выбрано ли что-то на шаге (тогда вместо "Пропустить" — "Далее")
export function hasValue(step, val) {
  if (val == null) return false;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "object") return !!(val.min || val.max);
  return val !== "";
}

// Короткая подпись выбранного значения для главного экрана фильтра
export function valueLabel(step, val) {
  if (!hasValue(step, val)) return "";
  if (Array.isArray(val)) return val.length <= 2 ? val.join(", ") : `${val.slice(0, 2).join(", ")} +${val.length - 2}`;
  if (step.kind === "price") return `${val.min || 0} – ${val.max || "∞"} ${val.cur === "KGS" ? "сом" : "$"}`;
  if (typeof val === "object") return `${val.min || "…"} – ${val.max || "…"}`;
  if (step.kind === "sort") return { new: "Сначала новые", cheap: "Сначала дешевле", expensive: "Сначала дороже" }[val] || "";
  if (step.kind === "contract") return { "с договором": "С договором", "без договора": "Без договора", "все": "Все" }[val] || val;
  return String(val);
}

export function activeCount(f) {
  if (!f || !f.cat) return 0;
  return 1 + stepsFor(f.cat).filter((s) => s.kind !== "sort" && hasValue(s, (f.v || {})[s.id]) && !(s.kind === "contract" && f.v[s.id] === "все")).length;
}
