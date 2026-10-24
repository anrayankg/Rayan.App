// Фильтр: шаги ИДУТ В ТОМ ЖЕ ПОРЯДКЕ, что и поля при добавлении объекта этой категории.
// Внутренняя информация для агента, описание и финансы в фильтр НЕ входят — только "Договор".
// Варианты выбора скопированы из форм app/add/vtorichka и app/add/pervichka —
// если там поменяете варианты, поменяйте и здесь.
import { IK_DISTRICTS, IK_ALL_NAMES } from "./issykkul";
import { CAT_KVARTIRY, CAT_NOVOSTROYKI, CAT_DOMA, CAT_UCHASTOK, CAT_KOMMERCIYA, CAT_ARENDA, CAT_ISSYKKUL, CAT_INVESTICII } from "./categoryIcons";
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
  "Элитка", "Индивидуалка",
  "104 серия", "105 серия", "106 серия", "106 серии улучшенной", "107 серия", "108 серия",
  "Гостиничного типа", "Малосемейка", "Общежитие", "Хрущёвка", "Сталинка", "Другое",
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
  { key: "vtorichka", label: "Квартиры (вторичка)", img: CAT_KVARTIRY, match: (l) => !l.region && (l.type === "вторичка") },
  { key: "pervichka", label: "Новостройки (первичка)", img: CAT_NOVOSTROYKI, match: (l) => !l.region && (l.type === "первичка") },
  { key: "dom", label: "Дома", img: CAT_DOMA, match: (l) => !l.region && (l.type === "дом") },
  { key: "uchastok", label: "Участки", img: CAT_UCHASTOK, match: (l) => !l.region && (l.type === "участок") },
  { key: "kommerciya", label: "Коммерческая", img: CAT_KOMMERCIYA, match: (l) => !l.region && (l.type === "коммерция") },
  { key: "arenda", label: "Аренда", img: CAT_ARENDA, match: (l) => !l.region && l.type === "аренда" },
  { key: "issykkul", label: "Иссык-Куль", img: CAT_ISSYKKUL, icon: "M3 18l5-8 4 5 3-4 6 7H3z",
    // Только объекты, которые занесены именно в раздел «Иссык-Куль» (не по словам в описании)
    match: (l) => l.region === "иссык-куль" },
  { key: "investicii", label: "Инвестиции", img: CAT_INVESTICII, icon: "M3 17l6-6 4 4 8-8M21 3h-6M21 3v6",
    // Только объекты из раздела «Инвестиции». Раньше сюда попадали квартиры со словом «инвестиция» в описании.
    match: (l) => !l.region && l.type === "инвестиции" },
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

const VTORICHKA = [S.city, S.district, S.rooms, S.series, S.price, S.area, S.floor, S.floorsTotal, S.docs, S.heatingV, S.comms, S.dealV,
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

const PERVICHKA = [S.city, S.district, S.rooms, S.price, S.area, S.floor, S.floorsTotal, S.docs, S.gosregistr, S.constr, S.delivYear, S.delivQ,
  S.heatingP, S.comms, S.dealP,
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

// ===== ДОМ — в том же порядке, что форма app/add/dom =====
const DOM_PODTIP = ["Продажа коттеджей и домов", "Продажа дачи", "Продажа модульных домов", "Продажа времянки",
  "Продажа полдома", "Продажа барачных домов", "Продажа таунхаусов"];
const ROOMS_DOM = ["1 комната", "2 комнаты", "3 комнаты", "4 комнаты", "5 комнат", "6 комнат", "6 комнат и более"];
const REMONT_DOM = ["Евроремонт", "Свежий ремонт", "Дизайнерский ремонт", "Старый ремонт", "Косметический ремонт", "ПСО (под самоотделку)", "Требуется ремонт"];
const DOC_DOM = ["Акт ввода в эксплуатацию", "Генеральная доверенность", "Договор дарения", "Договор долевого участия",
  "Договор купли-продажи", "Договор мены", "Зеленая книга", "Красная книга", "Свидетельство о праве на наследство", "Тех паспорт"];
const HEATING_DOM = ["Автономное отопление", "Без отопления", "Газовое отопление", "Комбинированное отопление",
  "Угольное / твердотопливное", "Центральное отопление", "Электрическое отопление"];
const WALLS_DOM = ["Газобетон", "Газоблок", "Железобетонная", "Кирпич", "Монолитная", "Монолитно-газобетонная",
  "Монолитно-каркасная", "Монолитно-кирпичная", "Панельная", "Пеноблок", "Саман", "Другая конструкция"];
const COMMS_DOM = ["Газ", "Вода", "Электричество", "Канализация", "Септик"];

const DOM = [
  { id: "x_podtip", kind: "multi", title: "Вид дома", options: DOM_PODTIP, allLabel: "Всё в Дома",
    // старые дома без отметки вида считаем «Продажа коттеджей и домов»
    get: (l) => parseExtra(l.extra_details).podtip || "Продажа коттеджей и домов" },
  S.city, S.district,
  S.price,
  { id: "area", kind: "range", title: "Площадь дома, м²", get: (l) => Number(l.area_m2) || null },
  { id: "plot", kind: "range", title: "Площадь участка, соток", get: (l) => Number(l.plot_sotka) || null },
  X("formaUchastka", "Форма участка", ["Прямоугольная", "Квадратная", "Г-образная", "Трапеция", "Неправильная форма"]),
  X("pervayaLiniya", "Первая линия", YES_NO),
  X("uglovoy", "Угловой участок", YES_NO),
  { id: "rooms", kind: "multi", title: "Количество комнат", options: ROOMS_DOM, get: (l) => l.room_type || l.rooms },
  { id: "etazhi", kind: "multi", title: "Этажность дома", options: ["1", "2", "3", "4", "5"], get: (l) => (l.floors_total ? String(l.floors_total) : "") },
  X("godPostroiki", "Год постройки", YEARS_BUILT),
  X("stenyKonstrukciya", "Из чего построен дом", WALLS_DOM),
  X("remont", "Ремонт", REMONT_DOM),
  { id: "comms", kind: "multi", title: "Коммуникации", sub: "Покажем дома, где есть ВСЁ выбранное", options: COMMS_DOM, matchAll: true,
    get: (l) => [l.gas && "Газ", l.water && "Вода", l.electricity && "Электричество", l.sewerage && "Канализация",
      parseExtra(l.extra_details).septik === "Да" && "Септик"].filter(Boolean) },
  { id: "heating", kind: "multi", title: "Отопление", options: HEATING_DOM, get: (l) => l.heating },
  { id: "docs", kind: "multi", title: "Правоустанавливающие документы", options: DOC_DOM, get: (l) => l.documents },
  X("knigaUchastka", "Книга на участок", ["Красная книга", "Зелёная книга", "Нет книги"]),
  X("tehpasportDom", "Техпаспорт на дом", ["Есть", "Нет"]),
  X("domSdan", "Сдан в эксплуатацию", YES_NO),
  X("naznachenie_zemli", "Назначение земли", ["ПМЖ", "Дачный участок", "Садоводство", "Сельхозназначение", "Коммерческое", "Другое"]),
  { id: "deal", kind: "multi", title: "Условия сделки", options: ["Наличные", "Ипотека", "Рассрочка через Госрегистр", "Рассрочка от собственника", "Обмен"], get: (l) => splitList(l.deal_terms) },
  // дополнительные поля (все, где есть выбор)
  X("zabor", "Забор", ["Кирпичный", "Профнастил", "Бетонный", "Сетка", "Нет забора", "Другое"]),
  X("vorota", "Ворота", ["Обычные", "Автоматические", "Нет"]),
  X("parkovkaMest", "Парковочные места", ["1", "2", "3", "4", "5 и более"]),
  X("dvorPokrytie", "Двор", ["Брусчатка", "Асфальт", "Бетон", "Газон", "Сад / деревья"]),
  X("infra", "Инфраструктура рядом", ["Школа", "Детский сад", "Магазины", "Остановка", "Больница", "Рынок/базар"]),
  X("sanuzly", "Количество санузлов", ["1", "2", "3", "4", "5 и более"]),
  X("podval", "Подвал", YES_NO), X("cokol", "Цоколь", YES_NO), X("mansarda", "Мансарда", YES_NO),
  X("krovlyaMaterial", "Материал кровли", ["Металлочерепица", "Профнастил", "Шифер", "Мягкая кровля", "Другое"]),
  X("krovlyaSostoyanie", "Состояние крыши", ["Хорошее", "Нормальное", "Требует ремонта"]),
  X("sostOkna", "Состояние окон", ["Пластиковые новые", "Пластиковые", "Алюминиевые", "Деревянные", "Требуют замены"]),
  X("okna", "Расположение окон", WINDOW_DIRS),
  X("mebelDaNet", "Мебель остаётся", YES_NO), X("tehnikaDaNet", "Техника остаётся", YES_NO),
  X("moshnostElektr", "Мощность электричества", ["1 фаза (220 В)", "3 фазы (380 В)"]),
  X("teplyePoly", "Тёплые полы", ["Да, паровые тёплые полы", "Да, электро тёплые полы", "Нет"]),
  X("postroiki", "Что есть на участке", ["Времянка", "Гараж", "Навес", "Сарай", "Беседка", "Баня", "Бассейн", "Очок кана"]),
  X("postroikiDokumenty", "Документы на доп. постройки", YES_NO),
  X("arest", "Есть ли арест", YES_NO), X("zalog", "Есть ли залог в банке", YES_NO),
  S.contract, S.sort];

// ===== УЧАСТОК — в том же порядке, что форма app/add/uchastok =====
const UCHASTOK = [
  S.city, S.district,
  S.price,
  { id: "plot", kind: "range", title: "Площадь участка, соток", get: (l) => Number(l.plot_sotka) || null },
  X("formaUchastka", "Форма участка", ["Прямоугольная", "Квадратная", "Треугольная", "Флажок", "Г-образная", "Другая"]),
  X("pervayaLiniya", "Первая линия от дороги", YES_NO),
  X("uglovoy", "Угловой участок", YES_NO),
  X("naznachenie_zemli", "Назначение земли", ["ПМЖ", "ИЖС", "Дачный участок", "Садоводство", "Сельхозназначение", "Коммерческое", "Под ЖК", "Другое"]),
  X("knigaUchastka", "Книга на участок", ["Красная книга", "Зелёная книга", "Нет книги"]),
  { id: "docs", kind: "multi", title: "Правоустанавливающие документы", options: DOC_DOM, get: (l) => l.documents },
  { id: "x_kommunikacii", kind: "multi", title: "Коммуникации", sub: "Покажем участки, где есть ВСЁ выбранное", matchAll: true,
    options: ["Электричество", "Газ", "Вода", "Канализация", "Септик"], get: ex("kommunikacii") },
  { id: "deal", kind: "multi", title: "Условия сделки", options: ["Наличные", "Ипотека", "Рассрочка через Госрегистр", "Рассрочка от собственника", "Обмен"], get: (l) => splitList(l.deal_terms) },
  X("pokrytieDorogi", "Покрытие дороги", ["Асфальт", "Бетон", "Щебень / гравий", "Грунт"]),
  X("podjezdAvto", "Подъезд автомобиля", YES_NO),
  X("podjezdZimoy", "Подъезд зимой", YES_NO),
  X("relef", "Рельеф", ["Ровный", "Небольшой уклон", "Сильный уклон", "Холмистый"]),
  X("zabor", "Ограждение", ["Кирпичный забор", "Профнастил", "Бетонный забор", "Сетка", "Нет ограждения", "Другое"]),
  X("vorota", "Ворота", ["Обычные", "Автоматические", "Нет"]),
  X("vozmozhnostPodkl", "Можно подключить коммуникации", YES_NO),
  X("postroiki", "Что есть на участке", ["Времянка", "Дом", "Навес", "Гараж", "Сарай", "Беседка", "Баня", "Бассейн", "Очок кана"]),
  X("marshrutki", "Маршрутный транспорт рядом", YES_NO),
  X("infra", "Рядом есть", ["Школа", "Детский сад", "Магазины", "Больница", "Остановка", "Рынок/базар"]),
  X("proektNaznachenie", "Под проект", ["ЖК", "Бизнес-центр", "Торговый объект", "Гостиница", "Другое"]),
  X("mozhnoStroit", "Можно строить объект", YES_NO),
  X("smenaNaznacheniya", "Можно сменить назначение", YES_NO),
  X("servitut", "Сервитут", YES_NO), X("krasnyeLinii", "Красные линии", YES_NO), X("ohrannyeZony", "Охранные зоны", YES_NO),
  X("arest", "Есть ли арест", YES_NO), X("zalog", "Есть ли залог в банке", YES_NO),
  S.contract, S.sort];

// ===== КОММЕРЦИЯ — в том же порядке, что форма app/add/kommerciya =====
const TIP_COMM = ["Отдельно стоящее здание", "Помещение в многоэтажном доме", "Помещение в бизнес-центре", "Помещение в торговом центре", "Павильон",
  "Склад", "Производственное помещение", "Офис", "Магазин", "Кафе / ресторан", "Салон красоты", "Медицинское помещение", "Гостиница / хостел", "Другое"];
const KOMMERCIYA = [
  X("tipObekta", "Тип объекта", TIP_COMM),
  S.city, S.district,
  S.price,
  { id: "area", kind: "range", title: "Общая площадь, м²", get: (l) => Number(l.area_m2) || null },
  X("pervayaLiniya", "Первая линия", YES_NO),
  X("formaObekta", "Здание или помещение", ["Отдельно стоящее здание", "Помещение внутри здания"]),
  X("stadiya", "Стадия объекта", ["Вторичка (готовый объект)", "Первичка — новостройка", "Строится / не достроен"]),
  S.floor,
  S.floorsTotal,
  X("zemlya", "Земля идёт с объектом", YES_NO),
  { id: "plot", kind: "range", title: "Площадь участка, соток", get: (l) => Number(l.plot_sotka) || null },
  X("knigaUchastka", "Книга на участок", ["Красная книга", "Зелёная книга", "Нет книги"]),
  X("naznachenie_zemli", "Назначение земли", ["ПМЖ", "ИЖС", "Коммерческое", "Дачный участок", "Садоводство", "Сельхозназначение", "Под ЖК", "Другое"]),
  X("remont", "Состояние / ремонт", ["Евроремонт", "Свежий ремонт", "Дизайнерский ремонт", "Косметический ремонт", "Старый ремонт", "ПСО (под самоотделку)", "Предчистовая отделка", "Без ремонта", "Требуется ремонт"]),
  { id: "x_kommunikacii", kind: "multi", title: "Коммуникации", sub: "Покажем объекты, где есть ВСЁ выбранное", matchAll: true,
    options: ["Электричество", "Газ", "Вода", "Канализация", "Септик", "Горячая вода"], get: ex("kommunikacii") },
  { id: "heating", kind: "multi", title: "Отопление", options: HEATING_DOM, get: (l) => l.heating },
  { id: "docs", kind: "multi", title: "Правоустанавливающие документы", options: [...DOC_DOM, "Разрешение на строительство"], get: (l) => l.documents },
  X("tehpasportDom", "Техпаспорт", ["Есть", "Нет"]),
  X("domSdan", "Сдан в эксплуатацию", YES_NO),
  X("stenyKonstrukciya", "Материал стен", WALLS_DOM),
  X("godPostroiki", "Год постройки", YEARS_BUILT),
  { id: "deal", kind: "multi", title: "Условия сделки", options: ["Наличные", "Ипотека", "Рассрочка через Госрегистр", "Рассрочка от собственника", "Обмен"], get: (l) => splitList(l.deal_terms) },
  X("dorogaRyadom", "Какая дорога рядом", ["Центральная", "Магистраль", "Второстепенная", "Внутриквартальная"]),
  X("peshehTrafik", "Пешеходный трафик", ["Высокий", "Средний", "Низкий"]),
  X("avtoTrafik", "Автомобильный трафик", ["Высокий", "Средний", "Низкий"]),
  X("otdelnyVhodZdanie", "Отдельный вход", YES_NO),
  X("vitriny", "Витринные окна", YES_NO),
  X("sanuzly", "Количество санузлов", ["Нет", "1", "2", "3", "4 и более"]),
  X("nalichie", "Наличие", ["Кухня", "Подсобные помещения", "Склад", "Серверная", "Гардероб", "Ресепшн", "Технические помещения"]),
  X("urovni", "Подвал / цоколь / мансарда", ["Подвал", "Цоколь", "Мансарда", "Технический этаж"]),
  X("elektrVolt", "Напряжение", ["220 В", "380 В"]),
  X("gazTip", "Газ", ["Нет", "Центральный", "Индивидуальный котёл", "Газовая котельная"]),
  X("ventilyaciya", "Вентиляция", ["Естественная", "Приточно-вытяжная", "Промышленная", "Отдельная система"]),
  X("kondicionirovanie", "Кондиционирование", YES_NO),
  X("parkovka", "Есть парковка", YES_NO),
  X("gruzovoy", "Подъезд грузового транспорта", YES_NO),
  X("pogruzka", "Зона погрузки / разгрузки", YES_NO),
  X("furaZaezd", "Заезд фуры", YES_NO),
  X("sdayotsya", "Сдаётся сейчас (инвестиция)", YES_NO),
  X("ohrana", "Охрана", YES_NO),
  X("videonablyudenie", "Видеонаблюдение", YES_NO),
  X("arest", "Есть ли арест", YES_NO), X("zalog", "Есть ли залог в банке", YES_NO),
  S.contract, S.sort];

// ===== АРЕНДА — в том же порядке, что форма app/add/arenda =====
const ARENDA = [
  X("chtoSdaetsya", "Что сдаётся", ["Квартира", "Комната", "Гостинка", "Студия", "Дом", "Часть дома", "Таунхаус", "Коттедж", "Коммерческое помещение", "Офис", "Магазин", "Склад", "Производственное помещение", "Здание целиком", "Земельный участок", "Другое"]),
  X("vidArendy", "Вид аренды", ["Долгосрочная", "Посуточная", "Почасовая", "На несколько месяцев", "Сезонная", "Долгосрочная коммерческая аренда", "Краткосрочная коммерческая аренда", "Аренда с возможностью последующего выкупа"]),
  S.city, S.district,
  S.price,
  X("periodOplaty", "Период оплаты", ["За час", "За ночь", "За сутки", "За неделю", "За месяц", "За сезон", "За номер", "За весь объект", "Другое"]),
  X("komnatnost", "Комнатность", ["Комната", "Гостинка", "Студия", "1-комнатная", "2-комнатная", "3-комнатная", "4-комнатная", "5-комнатная", "6 и более комнат"]),
  { id: "area", kind: "range", title: "Площадь, м²", get: (l) => Number(l.area_m2) || null },
  S.floor, S.floorsTotal,
  X("remont", "Состояние", ["Черновая", "Под самоотделку", "Косметический ремонт", "Хороший ремонт", "Евроремонт", "Дизайнерский ремонт", "Требует ремонта"]),
  X("mebelArenda", "Мебель", ["Полностью меблирована", "Частично меблирована", "Без мебели"]),
  X("tehnikaArenda", "Бытовая техника", ["Полностью оборудована", "Частично оборудована", "Без бытовой техники"]),
  X("pravilaProzhivaniya", "Правила проживания", ["Можно с детьми", "Можно с животными", "Без животных", "Для одного человека", "Для семьи", "Для сотрудников компании", "Другое"]),
  X("udobstva", "Дополнительные удобства", ["Балкон", "Лоджия", "Лифт", "Парковка", "Закрытая территория", "Охрана", "Двор", "Детская площадка"]),
  X("zalog", "Залог", ["Не требуется", "Требуется"]),
  X("kommunalnye", "Коммунальные услуги", ["Включены в стоимость", "Оплачиваются отдельно", "Частично включены"]),
  S.contract, S.sort];

// ===== ИНВЕСТИЦИИ — в том же порядке, что форма app/add/investicii =====
const INVEST = [
  X("tipPublikacii", "Что размещено", ["Предложение для инвесторов", "Поиск инвестора"]),
  X("napravlenie", "Тип проекта", ["Покупка недвижимости для последующей сдачи в аренду", "Покупка недвижимости для перепродажи", "Инвестиции в новостройку", "Инвестиции в строительство жилого дома", "Инвестиции в многоквартирный жилой комплекс", "Инвестиции в таунхаусы / дуплексы", "Инвестиции в коммерческую недвижимость", "Инвестиции в гостиницу / пансионат / базу отдыха", "Инвестиции в земельный участок", "Реконструкция или завершение строительства", "Инвестиции в действующий бизнес с недвижимостью", "Долевое участие в проекте", "Другое"]),
  X("geografiya", "Регион", ["Бишкек", "Чуйская область", "Иссык-Кульская область", "Ош и Ошская область", "Другие регионы Кыргызстана", "За пределами Кыргызстана"]),
  S.city,
  { ...S.price, title: "Сумма требуемых инвестиций" },
  { id: "minUch", kind: "range", title: "Минимальная сумма участия", get: (l) => { const v = parseFloat(String(parseExtra(l.extra_details).minUchastie || "").replace(/\s/g, "").replace(",", ".")); return Number.isFinite(v) ? v : null; } },
  X("stadiyaProekta", "Стадия проекта", ["Идея", "Подготовка", "Участок приобретён", "Проектирование", "Оформление разрешений", "Строительство начато", "Строительство продолжается", "Объект готов", "Объект уже работает", "Проект расширяется"]),
  X("formatUchastiya", "Формат участия", ["Доля в проекте", "Доля в собственности", "Совместное строительство", "Предоставление займа", "Инвестиции с возвратом капитала и согласованным доходом", "Инвестиции в действующий бизнес", "Другое"]),
  X("kakDohod", "Как инвестор получает доход", ["Доля от прибыли", "Доход от аренды", "Доход от продажи готовых объектов", "Фиксированная выплата по договору", "Возврат капитала и согласованный доход", "Другой способ"]),
  X("sdanVArendu", "Объект уже приносит доход", ["Да", "Нет"]),
  S.contract, S.sort];

// ===== ИССЫК-КУЛЬ: внутри раздела можно отметить несколько видов недвижимости =====
const IK_KIND_LABELS = ["Квартиры (вторичка)", "Новостройки (первичка)", "Дома", "Участки", "Коммерция", "Аренда", "Инвестиции"];
const IK_KIND_BY_TYPE = { "вторичка": IK_KIND_LABELS[0], "первичка": IK_KIND_LABELS[1], "дом": IK_KIND_LABELS[2], "участок": IK_KIND_LABELS[3], "коммерция": IK_KIND_LABELS[4], "аренда": IK_KIND_LABELS[5], "инвестиции": IK_KIND_LABELS[6] };
const ISSYKKUL = [
  { id: "ik_kind", kind: "multi", title: "Что ищете", sub: "Можно выбрать несколько видов: квартиры, дома, коммерция, аренда…", options: IK_KIND_LABELS, get: (l) => IK_KIND_BY_TYPE[l.type] },
  { id: "ik_district", kind: "multi", title: "Район или город", sub: "Можно выбрать несколько", options: IK_DISTRICTS, get: (l) => l.district },
  { id: "city", kind: "cities", title: "Населённый пункт", options: IK_ALL_NAMES, get: (l) => l.city },
  S.price,
  { id: "area", kind: "range", title: "Площадь, м²", get: (l) => Number(l.area_m2) || null },
  { id: "plot", kind: "range", title: "Площадь участка, соток", get: (l) => Number(l.plot_sotka) || null },
  { id: "ik_dist", kind: "range", title: "Расстояние до берега, м", get: (l) => { const raw = parseExtra(l.extra_details).rasstoyanieOzeroM; if (raw === "" || raw === undefined || raw === null) return null; const v = Number(raw); return Number.isFinite(v) ? v : null; } },
  X("vidIzOkna", "Вид на озеро", ["Прямой", "Частичный", "Отсутствует", "Не уточнён"]),
  X("dostupPlyazh", "Доступ к пляжу", ["Собственный", "Общий пляж комплекса", "Общественный", "По пропуску", "Отсутствует", "Другое"]),
  X("sezonnost", "Сезонность", ["Круглогодично", "Только летний сезон", "Только зимний сезон", "По договорённости"]),
  { id: "docs", kind: "multi", title: "Правоустанавливающие документы", options: DOC_DOM, get: (l) => l.documents },
  S.contract, S.sort];

// Для категорий, у которых ещё нет своей формы добавления — пока общий набор.
const GENERIC = [S.city, S.district, S.area, S.price, S.contract, S.sort];

export function stepsFor(catKey) {
  if (catKey === "vtorichka") return VTORICHKA;
  if (catKey === "pervichka") return PERVICHKA;
  if (catKey === "dom") return DOM;
  if (catKey === "uchastok") return UCHASTOK;
  if (catKey === "kommerciya") return KOMMERCIYA;
  if (catKey === "issykkul") return ISSYKKUL;
  if (catKey === "arenda") return ARENDA;
  if (catKey === "investicii") return INVEST;
  return GENERIC;
}

export function districtsFor(cities) {
  const out = [];
  (cities || []).forEach((c) => (CITY_DISTRICTS[c] || []).forEach((d) => { if (!out.includes(d)) out.push(d); }));
  return out;
}
export { CITIES };

export const EMPTY = { cat: null, v: {}, id: "" };

// Проверяет один объект по всем выбранным условиям фильтра.
export function matchListing(l, f) {
  if (!f) return true;
  // ID объекта — первый параметр во всех фильтрах. Можно вводить "362", "000362", "id: 000362".
  const idq = String(f.id || "").replace(/\D/g, "");
  if (idq && !String(l.display_id || "").replace(/\D/g, "").includes(idq)) return false;
  if (!f.cat) return true;
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
      if (val !== "все" && (l.contract_status || "не заполнено") !== val) return false;
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
  if (!f) return 0;
  const idOn = String(f.id || "").replace(/\D/g, "") ? 1 : 0;
  if (!f.cat) return idOn;
  return idOn + 1 + stepsFor(f.cat).filter((s) => s.kind !== "sort" && hasValue(s, (f.v || {})[s.id]) && !(s.kind === "contract" && f.v[s.id] === "все")).length;
}
