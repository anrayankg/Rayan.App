"use client";
import { useState, useEffect } from "react";

export const PHONE_COUNTRIES = [
  { dial: "996", name: "Кыргызстан", flag: "🇰🇬", digits: 9 },
  { dial: "7", name: "Россия / Казахстан", flag: "🇷🇺", digits: 10 },
  { dial: "998", name: "Узбекистан", flag: "🇺🇿", digits: 9 },
  { dial: "992", name: "Таджикистан", flag: "🇹🇯", digits: 9 },
  { dial: "993", name: "Туркменистан", flag: "🇹🇲", digits: 8 },
  { dial: "90", name: "Турция", flag: "🇹🇷", digits: 10 },
  { dial: "1", name: "США / Канада", flag: "🇺🇸", digits: 10 },
];

function findCountry(dial) {
  return PHONE_COUNTRIES.find((c) => c.dial === dial) || PHONE_COUNTRIES[0];
}

function parseValue(value) {
  if (!value) return { dial: "996", digits: "" };
  const m = String(value).match(/^\+?(\d+)\s*(.*)$/);
  if (!m) return { dial: "996", digits: "" };
  for (const c of PHONE_COUNTRIES) {
    if (m[1].startsWith(c.dial) && m[1].length === c.dial.length) {
      return { dial: c.dial, digits: m[2].replace(/\D/g, "") };
    }
  }
  return { dial: "996", digits: (m[1] + m[2]).replace(/\D/g, "") };
}

// Используется формой, чтобы не пропускать неполные номера
export function isPhoneComplete(value) {
  if (!value) return false;
  const { dial, digits } = parseValue(value);
  return digits.length === findCountry(dial).digits;
}

export default function PhoneInput({ label, required, value, onChange, whiteBg }) {
  const initial = parseValue(value);
  const [dial, setDial] = useState(initial.dial);
  const [digits, setDigits] = useState(initial.digits);
  const country = findCountry(dial);
  const complete = digits.length === country.digits;

  useEffect(() => {
    onChange(digits ? `+${dial}${digits}` : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dial, digits]);

  return (
    <div>
      {label && (
        <div className="field-label">
          {label} {required && <span className="star">*</span>}
        </div>
      )}
      <div className="phone-row">
        <select className={`phone-country ${whiteBg ? "required-input" : ""}`} value={dial} onChange={(e) => setDial(e.target.value)}>
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.dial} value={c.dial}>{c.flag} +{c.dial}</option>
          ))}
        </select>
        <input
          className={`field-input phone-digits ${whiteBg ? "required-input" : ""} ${digits && !complete ? "phone-error-border" : ""}`}
          value={digits}
          onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, country.digits))}
          inputMode="numeric"
          placeholder={`${country.digits} цифр`}
        />
      </div>
      {digits.length > 0 && !complete && (
        <div className="phone-error-text">Введено {digits.length} из {country.digits} цифр — номер неполный</div>
      )}
    </div>
  );
}
