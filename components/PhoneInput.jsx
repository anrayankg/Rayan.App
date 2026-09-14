"use client";
import { useState, useEffect, useRef } from "react";

// Полный список стран: код, название, флаг, ожидаемое кол-во цифр номера (без кода страны)
export const PHONE_COUNTRIES = [
  { dial: "996", name: "Кыргызстан", flag: "🇰🇬", digits: 9 },
  { dial: "7", name: "Россия", flag: "🇷🇺", digits: 10 },
  { dial: "7", name: "Казахстан", flag: "🇰🇿", digits: 10 },
  { dial: "998", name: "Узбекистан", flag: "🇺🇿", digits: 9 },
  { dial: "992", name: "Таджикистан", flag: "🇹🇯", digits: 9 },
  { dial: "993", name: "Туркменистан", flag: "🇹🇲", digits: 8 },
  { dial: "994", name: "Азербайджан", flag: "🇦🇿", digits: 9 },
  { dial: "995", name: "Грузия", flag: "🇬🇪", digits: 9 },
  { dial: "374", name: "Армения", flag: "🇦🇲", digits: 8 },
  { dial: "375", name: "Беларусь", flag: "🇧🇾", digits: 9 },
  { dial: "380", name: "Украина", flag: "🇺🇦", digits: 9 },
  { dial: "373", name: "Молдова", flag: "🇲🇩", digits: 8 },
  { dial: "90", name: "Турция", flag: "🇹🇷", digits: 10 },
  { dial: "971", name: "ОАЭ", flag: "🇦🇪", digits: 9 },
  { dial: "966", name: "Саудовская Аравия", flag: "🇸🇦", digits: 9 },
  { dial: "974", name: "Катар", flag: "🇶🇦", digits: 8 },
  { dial: "965", name: "Кувейт", flag: "🇰🇼", digits: 8 },
  { dial: "973", name: "Бахрейн", flag: "🇧🇭", digits: 8 },
  { dial: "968", name: "Оман", flag: "🇴🇲", digits: 8 },
  { dial: "962", name: "Иордания", flag: "🇯🇴", digits: 9 },
  { dial: "972", name: "Израиль", flag: "🇮🇱", digits: 9 },
  { dial: "98", name: "Иран", flag: "🇮🇷", digits: 10 },
  { dial: "93", name: "Афганистан", flag: "🇦🇫", digits: 9 },
  { dial: "92", name: "Пакистан", flag: "🇵🇰", digits: 10 },
  { dial: "91", name: "Индия", flag: "🇮🇳", digits: 10 },
  { dial: "880", name: "Бангладеш", flag: "🇧🇩", digits: 10 },
  { dial: "94", name: "Шри-Ланка", flag: "🇱🇰", digits: 9 },
  { dial: "976", name: "Монголия", flag: "🇲🇳", digits: 8 },
  { dial: "86", name: "Китай", flag: "🇨🇳", digits: 11 },
  { dial: "852", name: "Гонконг", flag: "🇭🇰", digits: 8 },
  { dial: "886", name: "Тайвань", flag: "🇹🇼", digits: 9 },
  { dial: "82", name: "Южная Корея", flag: "🇰🇷", digits: 10 },
  { dial: "81", name: "Япония", flag: "🇯🇵", digits: 10 },
  { dial: "84", name: "Вьетнам", flag: "🇻🇳", digits: 9 },
  { dial: "66", name: "Таиланд", flag: "🇹🇭", digits: 9 },
  { dial: "60", name: "Малайзия", flag: "🇲🇾", digits: 9 },
  { dial: "65", name: "Сингапур", flag: "🇸🇬", digits: 8 },
  { dial: "62", name: "Индонезия", flag: "🇮🇩", digits: 10 },
  { dial: "63", name: "Филиппины", flag: "🇵🇭", digits: 10 },
  { dial: "1", name: "США / Канада", flag: "🇺🇸", digits: 10 },
  { dial: "52", name: "Мексика", flag: "🇲🇽", digits: 10 },
  { dial: "55", name: "Бразилия", flag: "🇧🇷", digits: 11 },
  { dial: "54", name: "Аргентина", flag: "🇦🇷", digits: 10 },
  { dial: "56", name: "Чили", flag: "🇨🇱", digits: 9 },
  { dial: "57", name: "Колумбия", flag: "🇨🇴", digits: 10 },
  { dial: "51", name: "Перу", flag: "🇵🇪", digits: 9 },
  { dial: "44", name: "Великобритания", flag: "🇬🇧", digits: 10 },
  { dial: "49", name: "Германия", flag: "🇩🇪", digits: 10 },
  { dial: "33", name: "Франция", flag: "🇫🇷", digits: 9 },
  { dial: "39", name: "Италия", flag: "🇮🇹", digits: 10 },
  { dial: "34", name: "Испания", flag: "🇪🇸", digits: 9 },
  { dial: "351", name: "Португалия", flag: "🇵🇹", digits: 9 },
  { dial: "31", name: "Нидерланды", flag: "🇳🇱", digits: 9 },
  { dial: "32", name: "Бельгия", flag: "🇧🇪", digits: 9 },
  { dial: "41", name: "Швейцария", flag: "🇨🇭", digits: 9 },
  { dial: "43", name: "Австрия", flag: "🇦🇹", digits: 10 },
  { dial: "48", name: "Польша", flag: "🇵🇱", digits: 9 },
  { dial: "420", name: "Чехия", flag: "🇨🇿", digits: 9 },
  { dial: "421", name: "Словакия", flag: "🇸🇰", digits: 9 },
  { dial: "36", name: "Венгрия", flag: "🇭🇺", digits: 9 },
  { dial: "40", name: "Румыния", flag: "🇷🇴", digits: 9 },
  { dial: "359", name: "Болгария", flag: "🇧🇬", digits: 9 },
  { dial: "385", name: "Хорватия", flag: "🇭🇷", digits: 9 },
  { dial: "381", name: "Сербия", flag: "🇷🇸", digits: 9 },
  { dial: "30", name: "Греция", flag: "🇬🇷", digits: 10 },
  { dial: "353", name: "Ирландия", flag: "🇮🇪", digits: 9 },
  { dial: "45", name: "Дания", flag: "🇩🇰", digits: 8 },
  { dial: "46", name: "Швеция", flag: "🇸🇪", digits: 9 },
  { dial: "47", name: "Норвегия", flag: "🇳🇴", digits: 8 },
  { dial: "358", name: "Финляндия", flag: "🇫🇮", digits: 9 },
  { dial: "372", name: "Эстония", flag: "🇪🇪", digits: 8 },
  { dial: "371", name: "Латвия", flag: "🇱🇻", digits: 8 },
  { dial: "370", name: "Литва", flag: "🇱🇹", digits: 8 },
  { dial: "20", name: "Египет", flag: "🇪🇬", digits: 10 },
  { dial: "212", name: "Марокко", flag: "🇲🇦", digits: 9 },
  { dial: "216", name: "Тунис", flag: "🇹🇳", digits: 8 },
  { dial: "234", name: "Нигерия", flag: "🇳🇬", digits: 10 },
  { dial: "254", name: "Кения", flag: "🇰🇪", digits: 9 },
  { dial: "27", name: "ЮАР", flag: "🇿🇦", digits: 9 },
  { dial: "61", name: "Австралия", flag: "🇦🇺", digits: 9 },
  { dial: "64", name: "Новая Зеландия", flag: "🇳🇿", digits: 9 },
];

function findCountryIdx(dial) {
  const i = PHONE_COUNTRIES.findIndex((c) => c.dial === dial);
  return i >= 0 ? i : 0;
}

// Разбираем сохранённое значение вида "+996553625010" обратно на код страны и цифры.
// Коды стран ищем по самому длинному совпадающему префиксу (а не жадным regex —
// это и было причиной, что правильно введённый номер считался неполным).
function parseValue(value) {
  if (!value) return { countryIdx: 0, digits: "" };
  const v = String(value).replace(/^\+/, "").replace(/\D/g, (c) => c);
  const digitsOnly = String(value).replace(/^\+/, "");
  let bestIdx = -1, bestLen = -1;
  PHONE_COUNTRIES.forEach((c, i) => {
    if (digitsOnly.startsWith(c.dial) && c.dial.length > bestLen) {
      bestIdx = i;
      bestLen = c.dial.length;
    }
  });
  if (bestIdx === -1) return { countryIdx: 0, digits: digitsOnly.replace(/\D/g, "") };
  return { countryIdx: bestIdx, digits: digitsOnly.slice(bestLen).replace(/\D/g, "") };
}

// Используется формой, чтобы не пропускать неполные номера
export function isPhoneComplete(value) {
  if (!value) return false;
  const { countryIdx, digits } = parseValue(value);
  return digits.length === PHONE_COUNTRIES[countryIdx].digits;
}

export default function PhoneInput({ label, required, value, onChange, whiteBg, error }) {
  const init = parseValue(value);
  const [countryIdx, setCountryIdx] = useState(init.countryIdx);
  const [digits, setDigits] = useState(init.digits);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const country = PHONE_COUNTRIES[countryIdx];
  const complete = digits.length === country.digits;

  useEffect(() => {
    onChange(digits ? `+${country.dial}${digits}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryIdx, digits]);

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? PHONE_COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.includes(q))
    : PHONE_COUNTRIES;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {label && (
        <div className="field-label">
          {label} {required && <span className="star">*</span>}
        </div>
      )}
      <div className="phone-unified-row">
        <div className="phone-country-btn" onClick={() => setOpen(!open)}>
          <span className="phone-flag">{country.flag}</span>
          <span>+{country.dial}</span>
          <span className="phone-caret">{open ? "▴" : "▾"}</span>
        </div>
        <input
          className={`phone-unified-input ${(error || (digits && !complete)) ? "phone-error-border" : ""}`}
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, country.digits))}
          inputMode="numeric"
          placeholder={`${country.digits} цифр`}
        />
      </div>

      {open && (
        <div className="phone-dropdown">
          <input
            className="phone-search"
            placeholder="🔍 Поиск страны"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className="phone-country-list">
            {filtered.map((c) => {
              const idx = PHONE_COUNTRIES.indexOf(c);
              return (
                <div
                  key={idx}
                  className={`phone-country-row ${countryIdx === idx ? "selected" : ""}`}
                  onClick={() => { setCountryIdx(idx); setDigits(""); setOpen(false); setSearch(""); }}
                >
                  <span className="phone-flag">{c.flag}</span>
                  <span className="phone-country-name">{c.name}</span>
                  <span className="phone-country-code">+{c.dial}</span>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="phone-country-empty">Ничего не найдено</div>}
          </div>
        </div>
      )}

      {(error || (digits.length > 0 && !complete)) && (
        <div className="phone-error-text">Введите корректный номер телефона</div>
      )}
    </div>
  );
}
