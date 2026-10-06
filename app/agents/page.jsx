"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentAgent, isAdmin } from "../../lib/agent";
import BottomNav from "../../components/BottomNav";
import ConfirmDialog from "../../components/ConfirmDialog";

// Раздел руководителя: список агентов, добавление, ПИН-коды, отключение.
// Все действия проверяются в базе по номеру и ПИН-коду руководителя.
function randomPin() { return String(Math.floor(1000 + Math.random() * 9000)); }
const digits = (s) => String(s || "").replace(/\D/g, "");

export default function AgentsPage() {
  const router = useRouter();
  const [me, setMe] = useState(undefined);
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(null); // { id?, name, phone, pin, active }
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(null);

  useEffect(() => { setMe(getCurrentAgent()); }, []);

  async function load(a) {
    setError("");
    const { data, error: e } = await supabase.rpc("admin_list_agents", { p_admin_phone: a.phone, p_admin_pin: a.pin || "" });
    if (e) { setError("Не удалось загрузить агентов: " + e.message); setList([]); return; }
    setList(data || []);
  }
  useEffect(() => { if (me && isAdmin(me)) load(me); }, [me]); // eslint-disable-line

  async function save(item) {
    if (!item.name.trim()) { setError("Впишите имя агента"); return; }
    if (digits(item.phone).length < 9) { setError("Впишите номер телефона полностью"); return; }
    if (!/^\d{4}$/.test(item.pin)) { setError("ПИН-код — ровно 4 цифры"); return; }
    setBusy(true); setError("");
    const phone = "+996" + digits(item.phone).slice(-9);
    const { error: e } = await supabase.rpc("admin_save_agent", {
      p_admin_phone: me.phone, p_admin_pin: me.pin || "", p_id: item.id || "",
      p_name: item.name.trim(), p_phone: phone, p_pin: item.pin, p_active: item.active !== false,
    });
    setBusy(false);
    if (e) { setError("Не сохранилось: " + e.message); return; }
    setEdit(null);
    load(me);
  }

  if (me === undefined) return <div className="ag-page"><div className="ag-muted">Загрузка…</div></div>;
  if (!me || !isAdmin(me)) {
    return (
      <div className="ag-page">
        <div className="ag-title">Агенты</div>
        <div className="ag-muted">Этот раздел только для руководителя. Войдите в Профиль под своим номером и ПИН-кодом.</div>
        <BottomNav active="Профиль" />
      </div>
    );
  }

  return (
    <div className="ag-page">
      <button className="ag-back" onClick={() => router.push("/profile")}>‹</button>
      <div className="ag-title">Агенты и ПИН-коды</div>
      <div className="ag-muted">Агент входит в приложение по своему номеру и ПИН-коду. Сообщите ему ПИН лично. Ушёл агент — нажмите «Отключить», и он больше не войдёт.</div>

      <button className="fl-next" style={{ margin: "14px 0" }}
        onClick={() => setEdit({ name: "", phone: "", pin: randomPin(), active: true })}>+ Добавить агента</button>

      {error && <div className="ag-error">{error}</div>}
      {list === null && <div className="ag-muted">Загрузка…</div>}

      {(list || []).map((a) => (
        <div key={a.id} className={`ag-card ${a.active === false ? "off" : ""}`}>
          <div className="ag-row">
            <div>
              <div className="ag-name">{a.name || "Без имени"}{a.role === "admin" && <span className="ag-role"> руководитель</span>}</div>
              <div className="ag-phone">{a.phone}</div>
            </div>
            <div className="ag-pin">{a.pin ? `ПИН ${a.pin}` : "нет ПИН"}</div>
          </div>
          {a.active === false && <div className="ag-off">Отключён — войти не может</div>}
          <div className="ag-actions">
            <button onClick={() => setEdit({ id: a.id, name: a.name || "", phone: a.phone || "", pin: a.pin || randomPin(), active: a.active !== false })}>Изменить</button>
            {a.role !== "admin" && (
              a.active === false
                ? <button onClick={() => save({ id: a.id, name: a.name || "", phone: a.phone, pin: a.pin || randomPin(), active: true })}>Включить</button>
                : <button className="danger" onClick={() => setAsk(a)}>Отключить</button>
            )}
          </div>
        </div>
      ))}

      {edit && (
        <div className="cd-overlay" onClick={() => setEdit(null)}>
          <div className="cd-box" onClick={(e) => e.stopPropagation()}>
            <div className="cd-title">{edit.id ? "Изменить агента" : "Новый агент"}</div>
            <div className="ag-label">Имя</div>
            <input className="fl-input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Например: Насредин" />
            <div className="ag-label">Номер телефона</div>
            <input className="fl-input" type="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="+996 700 000 000" />
            <div className="ag-label">ПИН-код (4 цифры)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="fl-input" inputMode="numeric" maxLength={4} value={edit.pin}
                onChange={(e) => setEdit({ ...edit, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} style={{ letterSpacing: "0.3em", textAlign: "center" }} />
              <button className="fl-skip" style={{ width: 130 }} onClick={() => setEdit({ ...edit, pin: randomPin() })}>Новый</button>
            </div>
            {error && <div className="ag-error">{error}</div>}
            <div className="cd-actions">
              <button className="cd-cancel" onClick={() => setEdit(null)}>Отмена</button>
              <button className="cd-ok" disabled={busy} onClick={() => save(edit)}>{busy ? "Сохраняю…" : "Сохранить"}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!ask} danger title="Отключить агента?"
        text={ask ? `${ask.name} больше не сможет войти в приложение. Его объекты останутся в базе.` : ""}
        confirmText="Отключить" cancelText="Отклонить"
        onConfirm={() => { const a = ask; setAsk(null); save({ id: a.id, name: a.name || "", phone: a.phone, pin: a.pin || randomPin(), active: false }); }}
        onCancel={() => setAsk(null)} />

      <BottomNav active="Профиль" />
    </div>
  );
}
