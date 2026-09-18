// Общий словарь для extra_details (JSON-поле на listings) — используется и внутренней
// страницей объекта (агент/договорник, видит всё), и публичной клиентской страницей
// (видит только PUBLIC_EXTRA_KEYS). Собран по факту полей в app/add/vtorichka и
// app/add/pervichka — если в форму добавят новое extra-поле, впишите его сюда, иначе
// оно просто не будет подписано человеческим названием (но не сломает страницу).

export const EXTRA_LABELS = {
  jilyeClass: "Класс жилья",
  godPostroiki: "Год постройки",
  planirovka: "Планировка",
  balkon: "Балкон/лоджия",
  lift: "Лифт",
  liftProizvoditel: "Производитель лифта",
  liftRabotaet: "Лифт работает",
  liftKolvo: "Количество лифтов",
  tehEtazh: "Технический этаж",
  potolki: "Высота потолков",
  okna: "Расположение окон",
  stenyKonstrukciya: "Конструкция стен",
  fasadMaterial: "Материал фасада",
  fasadSostoyanie: "Состояние фасада",
  podjezdSostoyanie: "Состояние подъезда",
  dvorSostoyanie: "Состояние двора",
  dvor: "Двор",
  detskaya: "Детская площадка",
  infra: "Инфраструктура рядом",
  infraDrugoe: "Другая инфраструктура",
  parkovka: "Парковка",
  kommercheskie: "Коммерческие помещения в доме",
  zhilayaPloshad: "Жилая площадь",
  kuhnyaPloshad: "Площадь кухни",
  remont: "Ремонт / отделка",
  remontGod: "Год ремонта",
  uteplenie: "Утепление",
  mebelDaNet: "Мебель остаётся",
  mebelObyem: "Мебель — объём",
  mebelChto: "Что из мебели остаётся",
  tehnikaDaNet: "Техника остаётся",
  tehnikaObyem: "Техника — объём",
  tehnikaChto: "Что из техники остаётся",
  vidOkna: "Вид из окон",
  sostOkna: "Состояние окон",
  kvNaEtazhe: "Квартир на этаже",
  polnCenPloshad: "Тип планировки",
  territoriya: "Территория проекта",
  blokov: "Количество блоков в ЖК",
  podjezdov: "Количество подъездов",
  domEtazhnost: "Этажность дома (всего)",
  krasnayaKniga: "Красная книга застройщика",
  razreshenie: "Разрешение на строительство",
};

// Ключи, которые НИКОГДА не показываем клиенту — юридические риски, суммы сделки,
// контакты для показа. Все остальные ключи из EXTRA_LABELS считаются публичными.
export const PRIVATE_EXTRA_KEYS = [
  "arest", "zalog", "obremeneniyaDrugie",
  "summaDkp", "summaDdu", "summaFakt",
  "ipoteka", "rassrochkaZastroy", "rassrochkaUsloviya",
  "komUslugi", "pokaz", "gosregistr",
  "ploshadSootv", "pereplanirovka", "pereplanirovkaStatus",
];

export function extraLabel(key) {
  return EXTRA_LABELS[key] || key;
}

export function extraDisplayValue(v) {
  if (v === true) return "да";
  if (v === false) return "нет";
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

// Публичные extra-поля объекта, в порядке показа клиенту, со значением.
export function publicExtraEntries(extraDetails) {
  let extra = {};
  try { extra = extraDetails ? (typeof extraDetails === "string" ? JSON.parse(extraDetails) : extraDetails) : {}; } catch {}
  return Object.keys(EXTRA_LABELS)
    .filter((k) => !PRIVATE_EXTRA_KEYS.includes(k))
    .map((k) => [k, extra[k]])
    .filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0));
}
