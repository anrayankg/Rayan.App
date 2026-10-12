"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentAgent, isAdmin, isManager } from "../../lib/agent";
import BottomNav from "../../components/BottomNav";
import ConfirmDialog from "../../components/ConfirmDialog";
import { Picker } from "../../components/Picker";

// Директор → руководители отделов (РОП) → агенты.
//  • Директор видит и меняет всех: РОПов, агентов, номера и ПИН-коды.
//  • РОП видит и меняет только агентов СВОЕЙ команды. Чужих РОПов и их агентов он не видит.
// Все действия проверяются в базе по номеру и ПИН-коду того, кто вошёл.
function randomPin() { return String(Math.floor(1000 + Math.random() * 9000)); }
const digits = (s) => String(s || "").replace(/\D/g, "");
const NO_ROP = "— без РОП (напрямую у директора)";

export default function AgentsPage() {
  const router = useRouter();
  const [me, setMe] = useState(undefined);
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(null);

  useEffect(() => { setMe(getCurrentAgent()); }, []);

  async function load(a) {
    setError("");
    const { data, error: e } = await supabase.rpc("staff_list_agents", { p_phone: a.phone, p_pin: a.pin || "" });
    if (e) {
      setError(/staff_list_agents/.test(e.message) ? "В базе ещё не включены роли. Выполните файл RAYAN_roli.sql в Supabase." : "Не удалось загрузить: " + e.message);
      setList([]); return;
    }
    setList(data || []);
  }
  useEffect(() => { if (me && isManager(me)) load(me); }, [me]); // eslint-disable-line

  const admin = me ? isAdmin(me) : false;
  const rops = (list || []).filter((a) => a.role === "rop");

  async function save(item) {
    if (!item.name.trim()) { setError("Впишите имя"); return; }
    if (digits(item.phone).length < 9) { setError("Впишите номер телефона полностью"); return; }
    if (!/^\d{4}$/.test(item.pin)) { setError("ПИН-код — ровно 4 цифры"); return; }
    setBusy(true); setError("");
    const { error: e } = await supabase.rpc("staff_save_agent", {
      p_phone: me.phone, p_pin: me.pin || "", p_id: item.id || "",
      p_name: item.name.trim(), p_agent_phone: "+996" + digits(item.phone).slice(-9), p_agent_pin: item.pin,
      p_active: item.active !== false, p_role: item.role || "agent", p_manager_id: item.manager_id || "",
    });
    setBusy(false);
    if (e) { setError("Не сохранилось: " + e.message); return; }
    setEdit(null);
    load(me);
  }

  if (me === undefined) return <div className="ag-page"><div className="ag-muted">Загрузка…</div></div>;
  if (!me || !isManager(me)) {
    return (
      <div className="ag-page">
        <div className="ag-title">Агенты</div>
        <div className="ag-muted">Этот раздел только для директора и руководителей отделов. Войдите в Профиль по номеру и ПИН-коду.</div>
        <BottomNav active="Профиль" />
      </div>
    );
  }

  const blank = (role, manager_id) => ({ name: "", phone: "", pin: randomPin(), active: true, role, manager_id: manager_id || "" });
  const startEdit = (a) => setEdit({ id: a.id, name: a.name || "", phone: a.phone || "", pin: a.pin || randomPin(), active: a.active !== false, role: a.role || "agent", manager_id: a.manager_id || "" });

  function Card({ a, small }) {
    const self = a.id === me.id;
    return (
      <div className={`ag-card ${small ? "small" : ""} ${a.active === false ? "off" : ""}`}>
        <div className="ag-row">
          <div>
            <div className="ag-name">{a.name || "Без имени"}{a.role === "admin" && <span className="ag-role"> директор</span>}{a.role === "rop" && <span className="ag-role"> РОП</span>}</div>
            <div className="ag-phone">{a.phone}</div>
          </div>
          <div className="ag-pin">{a.pin ? `ПИН ${a.pin}` : "нет ПИН"}</div>
        </div>
        {a.active === false && <div className="ag-off">Отключён — войти не может</div>}
        <div className="ag-actions">
          <button onClick={() => startEdit(a)}>Изменить</button>
          {a.role !== "admin" && !self && (
            a.active === false
              ? <button onClick={() => save({ id: a.id, name: a.name || "", phone: a.phone, pin: a.pin || randomPin(), active: true, role: a.role, manager_id: a.manager_id })}>Включить</button>
              : <button className="danger" onClick={() => setAsk(a)}>Отключить</button>
          )}
        </div>
      </div>
    );
  }

  const directAgents = (list || []).filter((a) => a.role === "agent" && !a.manager_id);
  const director = (list || []).find((a) => a.role === "admin");

  return (
    <div className="ag-page">
      <button className="ag-back" onClick={() => router.push("/profile")}>‹</button>
      <div className="ag-title">{admin ? "Руководители, агенты и ПИН-коды" : "Мои агенты и ПИН-коды"}</div>
      <div className="ag-muted">
        {admin
          ? "Вы видите всех. РОП видит и меняет только своих агентов, другие РОПы друг друга не видят. Сообщайте ПИН лично."
          : "Здесь только агенты вашей команды. Вы можете менять их номера и ПИН-коды, отключать и добавлять новых."}
      </div>

      <div className="ag-add">
        {admin && <button className="fl-next" onClick={() => setEdit(blank("rop"))}>+ Добавить РОП</button>}
        <button className="fl-next" onClick={() => setEdit(blank("agent", admin ? "" : me.id))}>+ Добавить агента</button>
      </div>

      {error && <div className="ag-error">{error}</div>}
      {list === null && <div className="ag-muted">Загрузка…</div>}

      {admin && director && (<><div className="ag-section">Директор</div><Card a={director} /></>)}

      {admin ? (
        <>
          {rops.map((r) => (
            <div key={r.id}>
              <div className="ag-section">Отдел: {r.name}</div>
              <Card a={r} />
              <div className="ag-team">
                {(list || []).filter((a) => a.role === "agent" && a.manager_id === r.id).map((a) => <Card key={a.id} a={a} small />)}
                <button className="ag-add-small" onClick={() => setEdit(blank("agent", r.id))}>+ Агент в отдел «{r.name}»</button>
              </div>
            </div>
          ))}
          <div className="ag-section">Агенты без РОП (напрямую у директора)</div>
          <div className="ag-team">{directAgents.map((a) => <Card key={a.id} a={a} small />)}{directAgents.length === 0 && <div className="ag-muted">Пока нет.</div>}</div>
        </>
      ) : (
        (list || []).map((a) => <Card key={a.id} a={a} />)
      )}

      {edit && (
        <div className="cd-overlay" onClick={() => setEdit(null)}>
          <div className="cd-box" onClick={(e) => e.stopPropagation()}>
            <div className="cd-title">{edit.id ? "Изменить" : edit.role === "rop" ? "Новый РОП" : "Новый агент"}</div>
            <div className="ag-label">Имя</div>
            <input className="fl-input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Например: Насредин" />
            <div className="ag-label">Номер телефона (он закрепится за агентом во всех его объектах)</div>
            <input className="fl-input" type="tel" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="+996 700 000 000" />
            <div className="ag-label">ПИН-код (4 цифры)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="fl-input" inputMode="numeric" maxLength={4} value={edit.pin}
                onChange={(e) => setEdit({ ...edit, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} style={{ letterSpacing: "0.3em", textAlign: "center" }} />
              <button className="fl-skip" style={{ width: 130 }} onClick={() => setEdit({ ...edit, pin: randomPin() })}>Новый</button>
            </div>
            {admin && edit.role !== "admin" && (
              <>
                <div className="ag-label">Должность</div>
                <div className="fl-contract" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <button className={edit.role === "agent" ? "on" : ""} onClick={() => setEdit({ ...edit, role: "agent" })}>Агент</button>
                  <button className={edit.role === "rop" ? "on" : ""} onClick={() => setEdit({ ...edit, role: "rop", manager_id: "" })}>РОП</button>
                </div>
                {edit.role === "agent" && (
                  <div style={{ marginTop: 10 }}>
                    <Picker label="Руководитель отдела" options={[NO_ROP, ...rops.map((r) => r.name)]}
                      value={edit.manager_id ? (rops.find((r) => r.id === edit.manager_id) || {}).name || "" : NO_ROP}
                      onChange={(n) => setEdit({ ...edit, manager_id: n === NO_ROP ? "" : (rops.find((r) => r.name === n) || {}).id || "" })} />
                  </div>
                )}
              </>
            )}
            {error && <div className="ag-error">{error}</div>}
            <div className="cd-actions">
              <button className="cd-cancel" onClick={() => setEdit(null)}>Отмена</button>
              <button className="cd-ok" disabled={busy} onClick={() => save(edit)}>{busy ? "Сохраняю…" : "Сохранить"}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!ask} danger title="Отключить?"
        text={ask ? `${ask.name} больше не сможет войти в приложение. Объекты останутся в базе.` : ""}
        confirmText="Отключить" cancelText="Отклонить"
        onConfirm={() => { const a = ask; setAsk(null); save({ id: a.id, name: a.name || "", phone: a.phone, pin: a.pin || randomPin(), active: false, role: a.role, manager_id: a.manager_id }); }}
        onCancel={() => setAsk(null)} />

      <BottomNav active="Профиль" />
    </div>
  );
}
