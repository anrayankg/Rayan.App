"use client";
import { useState, useEffect, useRef } from "react";

export const PHONE_COUNTRIES = [
  { dial: "996", name: "Кыргызстан", flag: "🇰🇬", digits: 9 },
  { dial: "7", name: "Россия", flag: "🇷🇺", digits: 10 },
  { dial: "998", name: "Узбекистан", flag: "🇺🇿", digits: 9 },
  { dial: "992", name: "Таджикистан", flag: "🇹🇯", digits: 9 },
  { dial: "7", name: "Казахстан", flag: "🇰🇿", digits: 10 },
  { dial: "90", name: "Турция", flag: "🇹🇷", digits: 10 },
  { dial: "993", name: "Туркменистан", flag: "🇹🇲", digits: 8 },
  { dial: "1", name: "США", flag: "🇺🇸", digits: 10 },
];

function parseValue(value) {
  if (!value) return { countryIdx: 0, digits: "" };
  const m = String(value).match(/^\+?(\d+)\s*(.*)$/);
  if (!m) return { countryIdx: 0, digits: "" };
  const idx = PHONE_COUNTRIES.findIndex((c) => m[1].startsWith(c.dial));
  return { countryIdx: idx >= 0 ? idx : 0, digits: (m[2] || "").replace(/\D/g, "") };
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
        <div className={`phone-country-btn ${whiteBg ? "required-input" : ""}`} onClick={() => setOpen(!open)}>
          <span className="phone-flag">{country.flag}</span>
          <span>+{country.dial}</span>
          <span className="phone-caret">{open ? "▴" : "▾"}</span>
        </div>
        <input
          className={`field-input phone-unified-input ${whiteBg ? "required-input" : ""} ${(error || (digits && !complete)) ? "field-error" : ""}`}
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
