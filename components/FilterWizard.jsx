"use client";
import { useEffect, useMemo, useState } from "react";
import {
  FILTER_CATEGORIES, stepsFor, districtsFor, CITIES, EMPTY, matchListing, hasValue, valueLabel,
} from "../lib/filterConfig";

// Фильтр в стиле Lalafo.
// Главный экран — список полей + зелёная кнопка "Показать (N)" (число считается сразу).
// "Категория" → окно с картинками → "Далее" → дальше каждое поле ОТДЕЛЬНЫМ окном
// в том же порядке, что при добавлении объекта. Обязательные — только "Далее";
// необязательные — "Пропустить", а как только что-то выбрано — "Далее".
export default function FilterWizard({ open, onClose, listings, value, onApply }) {
  const [draft, setDraft] = useState(value || EMPTY);
  const [screen, setScreen] = useState("summary"); // summary | cats | step
  const [idx, setIdx] = useState(0);
  const [sequential, setSequential] = useState(true);

  useEffect(() => {
    if (!open) return;
    const start = value || EMPTY;
    setDraft(start);
    if (!start.cat) { setScreen("cats"); setSequential(true); } else setScreen("summary");
  }, [open]); // eslint-disable-line

  const steps = draft.cat ? stepsFor(draft.cat) : [];
  const step = screen === "step" ? steps[idx] : null;
  const v = draft.v || {};

  const count = useMemo(() => (listings || []).filter((l) => matchListing(l, draft)).length, [listings, draft]);
  const cityMissing = draft.cat && !(v.city && v.city.length);

  if (!open) return null;

  function setVal(id, val) { setDraft((d) => ({ ...d, v: { ...(d.v || {}), [id]: val } })); }
  function toggleIn(id, opt) {
    const cur = v[id] || [];
    setVal(id, cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt]);
  }
  function apply() { onApply(draft); onClose(); }
  function clearAll() { setDraft(EMPTY); setScreen("cats"); setSequential(true); }

  function next() {
    if (screen === "cats") { setIdx(0); setScreen("step"); return; }
    if (!sequential) { setScreen("summary"); return; }
    if (idx < steps.length - 1) setIdx(idx + 1); else setScreen("summary");
  }
  function back() {
    if (screen === "summary") { onClose(); return; }
    if (screen === "cats") { if (draft.cat) setScreen("summary"); else onClose(); return; }
    if (!sequential || idx === 0) { setScreen(sequential && idx === 0 ? "cats" : "summary"); return; }
    setIdx(idx - 1);
  }

  const title = screen === "summary" ? "Фильтр" : screen === "cats" ? "Категории" : step.title;
  const progress = screen === "step" && sequential ? ((idx + 1) / steps.length) * 100 : screen === "cats" ? 3 : null;

  return (
    <div className="fl-screen">
      <div className="fl-head">
        <button className="fl-head-btn" onClick={back} aria-label="Назад">{screen === "summary" ? "✕" : "‹"}</button>
        <div className="fl-head-title">{title}</div>
        <button className="fl-head-clear" onClick={clearAll}>Очистить</button>
      </div>
      {progress != null && <div className="fl-progress"><div style={{ width: `${progress}%` }} /></div>}

      <div className="fl-body">
        {screen === "summary" && (
          <Summary draft={draft} steps={steps}
            openCats={() => { setSequential(true); setScreen("cats"); }}
            openStep={(i) => { setSequential(false); setIdx(i); setScreen("step"); }} />
        )}
        {screen === "cats" && (
          <Cats listings={listings} value={draft.cat}
            onPick={(key) => setDraft((d) => (d.cat === key ? d : { cat: key, v: {} }))} />
        )}
        {screen === "step" && step && (
          <StepBody step={step} v={v} draft={draft} listings={listings}
            setVal={setVal} toggleIn={toggleIn} stepNo={sequential ? `Шаг ${idx + 1} из ${steps.length}` : null} />
        )}
      </div>

      <div className="fl-foot">
        {screen === "cats" && (
          <button className="fl-next" disabled={!draft.cat} onClick={next}>Далее</button>
        )}
        {screen === "step" && step && step.kind !== "sort" && (
          step.required
            ? <button className="fl-next" disabled={!hasValue(step, v[step.id])} onClick={next}>Далее</button>
            : hasValue(step, v[step.id])
              ? <button className="fl-next" onClick={next}>Далее</button>
              : <button className="fl-skip" onClick={next}>Пропустить</button>
        )}
        {screen === "step" && step && step.kind === "sort" && !hasValue(step, v.sort) && (
          <button className="fl-skip" onClick={apply}>Пропустить</button>
        )}
        <button className="fl-show" disabled={!!cityMissing && screen !== "summary"} onClick={apply}>
          Показать ({count.toLocaleString("ru-RU")})
        </button>
        {cityMissing && screen === "summary" && <div className="fl-count">Город не выбран — показываем все города</div>}
      </div>
    </div>
  );
}

function Summary({ draft, steps, openCats, openStep }) {
  const cat = FILTER_CATEGORIES.find((c) => c.key === draft.cat);
  const v = draft.v || {};
  return (
    <>
      <div className="fl-label" style={{ marginTop: 0 }}>Категория</div>
      <button className={`fl-field ${cat ? "filled" : ""}`} onClick={openCats}>
        {cat ? <span className="val">{cat.label}</span> : <span className="ph">Выбрать</span>}
        <span className="arrow">›</span>
      </button>
      {steps.map((s, i) => (
        <div key={s.id}>
          <div className="fl-label">{s.title}{s.required && <span style={{ color: "#E8877A" }}> *</span>}</div>
          <button className={`fl-field ${hasValue(s, v[s.id]) ? "filled" : ""}`} onClick={() => openStep(i)}>
            {hasValue(s, v[s.id]) ? <span className="val">{valueLabel(s, v[s.id])}</span> : <span className="ph">{s.kind === "sort" ? "Сначала новые" : "Выбрать"}</span>}
            <span className="arrow">›</span>
          </button>
        </div>
      ))}
      {!cat && <div className="fl-count" style={{ marginTop: 20 }}>Выберите категорию — появятся её параметры</div>}
    </>
  );
}

function Cats({ listings, value, onPick }) {
  return (
    <>
      <div className="fl-step-sub">Выберите категорию и нажмите «Далее»</div>
      {FILTER_CATEGORIES.map((c) => {
        const n = (listings || []).filter(c.match).length;
        return (
          <button key={c.key} className={`fl-cat-row ${value === c.key ? "on" : ""}`} onClick={() => onPick(c.key)}>
            {c.img ? <img src={c.img} alt="" className="fl-cat-img" /> : (
              <span className="fl-cat-img">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1C4638" strokeWidth="1.6"><path d={c.icon} /></svg>
              </span>
            )}
            <span className="fl-cat-name">{c.label}</span>
            <span className="fl-cat-count">{n}</span>
            {value === c.key ? <span className="radio on" /> : <span className="radio" />}
          </button>
        );
      })}
    </>
  );
}

function StepBody({ step, v, draft, listings, setVal, toggleIn, stepNo }) {
  const [q, setQ] = useState("");
  useEffect(() => { setQ(""); }, [step.id]);
  const val = v[step.id];

  // Сколько объектов подходит под каждый вариант (с учётом остальных выбранных условий)
  const base = useMemo(() => {
    const without = { ...draft, v: { ...(draft.v || {}), [step.id]: undefined } };
    return (listings || []).filter((l) => matchListing(l, without));
  }, [listings, draft, step.id]);

  const head = (
    <>
      {stepNo && <div className="fl-step-sub" style={{ marginBottom: 2 }}>{stepNo}</div>}
      <div className="fl-step-title">{step.title}</div>
      <div className="fl-step-sub">
        {step.sub || (step.required ? "Обязательно — можно выбрать несколько" : step.kind === "multi" || step.kind === "tiles" || step.kind === "cities" || step.kind === "districts" ? "Можно выбрать несколько. Не обязательно" : "Не обязательно")}
      </div>
    </>
  );

  if (step.kind === "cities" || step.kind === "districts" || step.kind === "multi") {
    let options = step.kind === "cities" ? CITIES : step.kind === "districts" ? districtsFor(v.city) : step.options;
    if (step.kind === "districts" && options.length === 0) {
      return <>{head}<div className="fl-count" style={{ textAlign: "left" }}>Для выбранных городов районы пока не заведены (сейчас районы есть только у Бишкека). Нажмите «Пропустить».</div></>;
    }
    const cnt = (opt) => base.filter((l) => {
      if (step.kind === "cities") return (l.city || "Бишкек") === opt;
      if (step.kind === "districts") return l.district === opt;
      const raw = step.get(l);
      return Array.isArray(raw) ? raw.map(String).includes(opt) : String(raw || "") === opt;
    }).length;
    const withSearch = options.length > 12;
    if (q.trim()) options = options.filter((o) => o.toLowerCase().includes(q.trim().toLowerCase()));
    const sel = val || [];
    return (
      <>
        {head}
        {withSearch && <input className="fl-search" placeholder="Поиск…" value={q} onChange={(e) => setQ(e.target.value)} />}
        {sel.length > 0 && (
          <div className="fl-chipset">
            {sel.map((s) => <button key={s} className="fl-selchip" onClick={() => toggleIn(step.id, s)}>{s} ✕</button>)}
          </div>
        )}
        {options.map((o) => (
          <button key={o} className="fl-opt" onClick={() => toggleIn(step.id, o)}>
            <span>{o}</span>
            <span className="fl-opt-count">{cnt(o)}</span>
            <span className={`check ${sel.includes(o) ? "on" : ""}`}>{sel.includes(o) ? "✓" : ""}</span>
          </button>
        ))}
      </>
    );
  }

  if (step.kind === "tiles") {
    const sel = val || [];
    return (
      <>
        {head}
        <div className="fl-grid">
          {step.options.map((o) => (
            <button key={o} className={`fl-tile ${sel.includes(o) ? "on" : ""} ${isNaN(Number(o)) ? "fl-wide" : ""}`}
              onClick={() => toggleIn(step.id, o)}>{o}</button>
          ))}
        </div>
      </>
    );
  }

  if (step.kind === "range") {
    const r = val || {};
    return (
      <>
        {head}
        <div className="fl-pair">
          <input className="fl-input" inputMode="decimal" placeholder="От" value={r.min || ""}
            onChange={(e) => setVal(step.id, { ...r, min: e.target.value.replace(/[^\d.]/g, "") })} />
          <input className="fl-input" inputMode="decimal" placeholder="До" value={r.max || ""}
            onChange={(e) => setVal(step.id, { ...r, max: e.target.value.replace(/[^\d.]/g, "") })} />
        </div>
      </>
    );
  }

  if (step.kind === "selectRange") return <>{head}<SelectRange step={step} val={val} setVal={setVal} /></>;

  if (step.kind === "price") {
    const r = val || { cur: "USD" };
    const cur = r.cur || "USD";
    return (
      <>
        <div className="fl-cur-row">
          <div>
            {stepNo && <div className="fl-step-sub" style={{ marginBottom: 2 }}>{stepNo}</div>}
            <div className="fl-step-title" style={{ marginBottom: 0 }}>Цена</div>
          </div>
          <div className="fl-cur">
            {["KGS", "USD"].map((c) => (
              <button key={c} className={cur === c ? "on" : ""} onClick={() => setVal(step.id, { ...r, cur: c })}>{c}</button>
            ))}
          </div>
        </div>
        <div className="fl-step-sub">Сначала выберите валюту, потом впишите от и до. Не обязательно</div>
        <div className="fl-pair">
          <input className="fl-input" inputMode="numeric" placeholder="От 0" value={r.min || ""}
            onChange={(e) => setVal(step.id, { ...r, cur, min: e.target.value.replace(/\D/g, "") })} />
          <input className="fl-input" inputMode="numeric" placeholder="До" value={r.max || ""}
            onChange={(e) => setVal(step.id, { ...r, cur, max: e.target.value.replace(/\D/g, "") })} />
        </div>
      </>
    );
  }

  if (step.kind === "contract") {
    return (
      <>
        {head}
        <div className="fl-contract">
          {[["с договором", "С договором"], ["без договора", "Без договора"], ["все", "Все"]].map(([k, label]) => (
            <button key={k} className={val === k ? "on" : ""} onClick={() => setVal(step.id, val === k ? undefined : k)}>{label}</button>
          ))}
        </div>
      </>
    );
  }

  if (step.kind === "sort") {
    return (
      <>
        {head}
        {[["new", "Сначала новые"], ["cheap", "Сначала дешевле"], ["expensive", "Сначала дороже"]].map(([k, label]) => (
          <button key={k} className="fl-opt" onClick={() => setVal("sort", val === k ? undefined : k)}>
            <span>{label}</span><span className={`radio ${val === k ? "on" : ""}`} />
          </button>
        ))}
      </>
    );
  }
  return head;
}

// "Этажей в доме": два поля "От" и "До", по нажатию — список 1–40 (как в Lalafo)
function SelectRange({ step, val, setVal }) {
  const [which, setWhich] = useState(null);
  const r = val || {};
  return (
    <>
      <div className="fl-pair">
        {["min", "max"].map((k) => (
          <button key={k} className={`fl-field ${r[k] ? "filled" : ""}`} onClick={() => setWhich(k)}>
            {r[k] ? <span className="val">{k === "min" ? "От " : "До "}{r[k]}</span> : <span className="ph">{k === "min" ? "От" : "До"}</span>}
            <span className="arrow">⌄</span>
          </button>
        ))}
      </div>
      {which && (
        <div className="fl-select-sheet" onClick={() => setWhich(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <div className="fl-step-title" style={{ fontSize: 18, margin: "8px 0" }}>{which === "min" ? "От" : "До"}</div>
            {step.options.map((o) => (
              <button key={o} className="fl-opt" onClick={() => { setVal(step.id, { ...r, [which]: r[which] === o ? "" : o }); setWhich(null); }}>
                <span>{o}</span><span className={`radio ${r[which] === o ? "on" : ""}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
