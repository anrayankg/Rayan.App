"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { getCurrentAgent, isAdmin } from "../../lib/agent";
import BottomNav from "../../components/BottomNav";

// Статистика: директор → РОП → агент → категория → список объектов.
// Все цифры считает база (функция staff_stats) и сама проверяет, кому что можно видеть.
// Агент видит себя, РОП — себя и свою команду, директор — всех.
const last9 = (s) => String(s || "").replace(/\D/g, "").slice(-9);
const CAT = {
  "вторичка": { label: "Квартиры (вторичка)", key: "vtorichka" },
  "первичка": { label: "Новостройки (первичка)", key: "pervichka" },
  "дом": { label: "Дома", key: "dom" },
  "участок": { label: "Участки", key: "uchastok" },
  "коммерция": { label: "Коммерческая", key: "kommerciya" },
  "иссык-куль": { label: "Иссык-Куль", key: "issykkul" },
  "аренда": { label: "Аренда", key: "arenda" },
  "инвестиции": { label: "Инвестиции", key: "investicii" },
};
const ZERO = { work: 0, active: 0, drafts: 0, new24: 0, c_yes: 0, c_no: 0, c_empty: 0, deact: 0, needs_ad: 0 };
const sum = (rows) => rows.reduce((a, r) => { const o = { ...a }; Object.keys(ZERO).forEach((k) => { o[k] = (a[k] || 0) + Number(r[k] || 0); }); return o; }, { ...ZERO });
const share = (t) => {
  const d = t.c_yes + t.c_no;
  return d === 0 ? null : Math.round((t.c_yes / d) * 100);
};
const fmtDate = (iso) => { if (!iso) return ""; const d = new Date(iso); return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`; };

function periodRange(p) {
  const now = new Date();
  if (p === "today") { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString(); }
  const days = p === "7" ? 7 : 30;
  return new Date(now.getTime() - days * 864e5).toISOString();
}

function Metric({ label, value, href, tone, router }) {
  const inner = (<><div className={`st-num ${tone || ""}`}>{value}</div><div className="st-lbl">{label}</div></>);
  return href
    ? <button type="button" className="st-metric tap" onClick={() => router.push(href)}>{inner}<span className="st-go">Посмотреть ›</span></button>
    : <div className="st-metric">{inner}</div>;
}

function ShareLine({ t }) {
  const p = share(t);
  return (
    <div className="st-share">
      <div className="st-share-big">{p === null ? "—" : `${p}%`}</div>
      <div className="st-share-txt">
        доля объектов с договором<br />
        <b>{t.c_yes}</b> с договором · <b>{t.c_no}</b> без договора · <b>{t.c_empty}</b> не заполнено
        {t.drafts > 0 && <><br />черновики отдельно: <b>{t.drafts}</b></>}
      </div>
    </div>
  );
}

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [me, setMe] = useState(undefined);
  const [period, setPeriod] = useState("30");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { setMe(getCurrentAgent()); }, []);
  useEffect(() => {
    if (!me) return;
    setData(null); setError("");
    supabase.rpc("staff_stats", { p_phone: me.phone, p_pin: me.pin || "", p_from: periodRange(period), p_to: null })
      .then(({ data: d, error: e }) => {
        if (e) {
          setError(/staff_stats/.test(e.message) ? "В базе ещё не включена статистика. Выполните файл RAYAN_statistika.sql в Supabase." : /Нет доступа/.test(e.message) ? "Нет доступа. Выйдите из Профиля и войдите заново по номеру и ПИН-коду." : "Не удалось загрузить: " + e.message);
          return;
        }
        setData(d);
      });
  }, [me, period]);

  const agents = (data && data.agents) || [];
  const rows = (data && data.rows) || [];
  const per = (data && data.period) || [];
  const role = (data && data.role) || (me && me.role) || "agent";
  const byP9 = (p9) => rows.filter((r) => r.p9 === p9);
  const perOf = (p9) => per.find((x) => x.p9 === p9) || { added: 0, contracts: 0, published: 0 };
  const agentP9s = new Set(agents.map((a) => last9(a.phone)));

  const ropParam = sp.get("rop");
  const agentParam = sp.get("agent");
  const go = (q) => router.push("/stats" + (q ? "?" + q : ""));

  if (me === undefined) return <div className="st-page"><div className="st-muted">Загрузка…</div></div>;
  if (!me) return (
    <div className="st-page"><div className="st-title">Статистика</div>
      <div className="st-muted">Войдите в Профиль по номеру и ПИН-коду.</div><BottomNav active="Профиль" /></div>
  );

  // ===== какой экран показывать =====
  let level = "agent", p9 = last9(me.phone);
  if (agentParam) { level = "agent"; p9 = agentParam; }
  else if (role === "admin") level = ropParam ? "team" : "company";
  else if (role === "rop") level = "team";

  const nameOfP9 = (x) => (agents.find((a) => last9(a.phone) === x) || {}).name || (x ? `+996${x}` : "Без агента");
  const ownerIds = new Set(agents.map((a) => a.id));

  function groupTotals(list) { return sum(list.flatMap((a) => byP9(last9(a.phone)))); }
  function agentLine(a, small) {
    const t = sum(byP9(last9(a.phone)));
    const p = share(t);
    return (
      <div key={a.id} className={`st-agent ${small ? "small" : ""}`}>
        <div className="st-agent-head">
          <span className="st-ava">{(a.name || "?")[0]}</span>
          <div className="st-agent-name"><b>{a.name}</b>
            <small>{a.role === "rop" ? "РОП" : a.manager_name ? `РОП: ${a.manager_name}` : a.role === "admin" ? "Директор" : "Агент · без РОП"}</small></div>
        </div>
        <div className="st-row3">
          <div><b>{t.work}</b><small>рабочих</small></div>
          <div><b>{t.c_yes}</b><small>с договором</small></div>
          <div><b>{p === null ? "—" : p + "%"}</b><small>доля</small></div>
          <div><b>{t.new24}</b><small>новых 24ч</small></div>
        </div>
        <button className="st-view" onClick={() => go("agent=" + last9(a.phone))}>Посмотреть</button>
      </div>
    );
  }

  const head = (title, sub, back) => (
    <>
      <button className="st-back" onClick={() => (back ? router.back() : router.push("/profile"))}>‹</button>
      <div className="st-title">{title}</div>
      {sub && <div className="st-muted">{sub}</div>}
    </>
  );

  const periodBar = (
    <div className="st-periods">
      {[["today", "Сегодня"], ["7", "7 дней"], ["30", "30 дней"]].map(([k, t]) => (
        <button key={k} className={period === k ? "on" : ""} onClick={() => setPeriod(k)}>{t}</button>
      ))}
    </div>
  );

  let content = null;

  if (error) content = <div className="st-error">{error}</div>;
  else if (!data) content = <div className="st-muted" style={{ marginTop: 16 }}>Считаем…</div>;
  else if (level === "company") {
    const all = sum(rows);
    const rops = agents.filter((a) => a.role === "rop");
    const direct = agents.filter((a) => a.role === "agent" && !a.manager_id);
    const director = agents.filter((a) => a.role === "admin");
    const orphans = rows.filter((r) => !agentP9s.has(r.p9));
    const orphanGroups = [...new Set(orphans.map((r) => r.p9))]
      .map((x) => ({ p9: x, t: sum(orphans.filter((r) => r.p9 === x)) }))
      .filter((g) => g.t.work + g.t.deact > 0);
    content = (
      <>
        {head("Статистика компании", "Рабочая база: активные объекты и черновики. Деактивированные и архивные сюда не входят.")}
        <div className="st-card"><ShareLine t={all} />
          <div className="st-grid">
            <Metric label="рабочих" value={all.work} />
            <Metric label="активных" value={all.active} />
            <Metric label="новых за 24ч" value={all.new24} />
            <Metric label="черновиков" value={all.drafts} />
          </div>
        </div>
        {rops.map((r) => {
          const team = agents.filter((a) => a.manager_id === r.id);
          const t = groupTotals([r, ...team]);
          const p = share(t);
          return (
            <div key={r.id} className="st-agent">
              <div className="st-agent-head"><span className="st-ava">{(r.name || "?")[0]}</span>
                <div className="st-agent-name"><b>{r.name}</b><small>РОП · агентов в команде: {team.length}</small></div></div>
              <div className="st-row3">
                <div><b>{t.work}</b><small>рабочих</small></div><div><b>{t.c_yes}</b><small>с договором</small></div>
                <div><b>{p === null ? "—" : p + "%"}</b><small>доля</small></div><div><b>{t.new24}</b><small>новых 24ч</small></div>
              </div>
              <button className="st-view" onClick={() => go("rop=" + r.id)}>Посмотреть команду</button>
            </div>
          );
        })}
        {(direct.length > 0 || director.length > 0) && <div className="st-section">Без РОП (напрямую у директора)</div>}
        {[...director, ...direct].map((a) => agentLine(a))}
        {orphanGroups.length > 0 && (
          <>
            <div className="st-section">Без закреплённого агента</div>
            <div className="st-muted">В этих объектах номер агента не совпадает ни с одним агентом (остался от переноса базы). Нажмите «Посмотреть и передать», затем «Передать объекты другому агенту».</div>
            {orphanGroups.map((g) => (
              <div key={g.p9 || "none"} className="st-agent warn">
                <div className="st-agent-name"><b>{g.p9 ? `+996${g.p9}` : "Номер агента не указан"}</b></div>
                <div className="st-row3">
                  <div><b>{g.t.work}</b><small>рабочих</small></div><div><b>{g.t.c_yes}</b><small>с договором</small></div>
                  <div><b>{share(g.t) === null ? "—" : share(g.t) + "%"}</b><small>доля</small></div><div><b>{g.t.new24}</b><small>новых 24ч</small></div>
                </div>
                <button className="st-view" onClick={() => router.push(`/profile?scope=${g.p9 || "none"}&tab=${g.t.active > 0 ? "активно" : "черновики"}`)}>Посмотреть и передать</button>
              </div>
            ))}
          </>
        )}
      </>
    );
  } else if (level === "team") {
    const ropId = role === "admin" ? ropParam : me.id;
    const rop = agents.find((a) => a.id === ropId) || { name: me.name, id: me.id };
    const team = agents.filter((a) => a.manager_id === ropId);
    const everyone = [rop, ...team].filter((a) => a && a.phone);
    const t = groupTotals(everyone);
    content = (
      <>
        {head(role === "admin" ? `Команда: ${rop.name}` : "Моя команда", "Нажмите «Посмотреть», чтобы увидеть категории агента.", role === "admin")}
        <div className="st-card"><ShareLine t={t} />
          <div className="st-grid"><Metric label="рабочих" value={t.work} /><Metric label="активных" value={t.active} /><Metric label="новых за 24ч" value={t.new24} /><Metric label="черновиков" value={t.drafts} /></div>
        </div>
        <div className="st-section">Агенты</div>
        {everyone.map((a) => agentLine(a, a.id !== ropId))}
        {team.length === 0 && <div className="st-muted">В команде пока нет агентов.</div>}
      </>
    );
  } else {
    const list = byP9(p9);
    const total = sum(list);
    const pr = perOf(p9);
    const who = nameOfP9(p9);
    const lnk = (cat, extra) => `/profile?scope=${p9 === last9(me.phone) && role !== "admin" ? "mine" : p9}${cat ? "&cat=" + cat : ""}${extra || ""}`;
    const cats = list.filter((r) => Number(r.work) + Number(r.deact) > 0);
    const backable = !!agentParam || role !== "agent";
    content = (
      <>
        {head(`Статистика: ${who}`, null, backable)}
        <div className="st-card">
          <div className="st-card-title">Все категории</div>
          <ShareLine t={total} />
          <div className="st-grid">
            <Metric label="рабочих всего" value={total.work} />
            <Metric label="активных" value={total.active} href={lnk("", "&tab=активно")} router={router} />
            <Metric label="новых за 24ч" value={total.new24} href={lnk("", "&tab=активно&new=1")} router={router} />
            <Metric label="черновиков" value={total.drafts} href={lnk("", "&tab=черновики")} router={router} />
          </div>
          <div className="st-grid">
            <Metric label="с договором" value={total.c_yes} tone="good" href={lnk("", "&tab=активно&contract=yes")} router={router} />
            <Metric label="без договора" value={total.c_no} href={lnk("", "&tab=активно&contract=no")} router={router} />
            <Metric label="не заполнено" value={total.c_empty} tone="warn" href={lnk("", "&tab=активно&contract=empty")} router={router} />
            <Metric label="требуют рекламы" value={total.needs_ad} />
          </div>
          {total.deact > 0 && <div className="st-muted">Деактивированные и архивные: {total.deact} (в рабочую базу не входят)</div>}
        </div>

        <div className="st-card">
          <div className="st-card-title">За выбранный период</div>
          {periodBar}
          <div className="st-grid3">
            <Metric label="добавлено объектов" value={pr.added} />
            <Metric label="заключено договоров" value={pr.contracts} tone="good" />
            <Metric label="опубликовано" value={pr.published} />
          </div>
          <div className="st-muted">История действий ведётся с {fmtDate(data.events_since) || "момента включения"}. Что было раньше, восстановить нельзя — мы не додумываем.</div>
        </div>

        {cats.map((r) => {
          const c = CAT[r.type] || { label: r.type, key: "" };
          const t = sum([r]);
          return (
            <div key={r.type} className="st-card">
              <div className="st-card-title">{c.label}</div>
              <ShareLine t={t} />
              <div className="st-grid">
                <Metric label="активных" value={t.active} href={lnk(c.key, "&tab=активно")} router={router} />
                <Metric label="новых за 24ч" value={t.new24} href={lnk(c.key, "&tab=активно&new=1")} router={router} />
                <Metric label="черновиков" value={t.drafts} href={lnk(c.key, "&tab=черновики")} router={router} />
                <Metric label="требуют рекламы" value={t.needs_ad} />
              </div>
              <div className="st-grid3">
                <Metric label="с договором" value={t.c_yes} tone="good" href={lnk(c.key, "&tab=активно&contract=yes")} router={router} />
                <Metric label="без договора" value={t.c_no} href={lnk(c.key, "&tab=активно&contract=no")} router={router} />
                <Metric label="не заполнено" value={t.c_empty} tone="warn" href={lnk(c.key, "&tab=активно&contract=empty")} router={router} />
              </div>
            </div>
          );
        })}
        {cats.length === 0 && <div className="st-muted" style={{ marginTop: 14 }}>У этого агента пока нет объектов.</div>}
      </>
    );
  }

  return (
    <div className="st-page">
      {content}
      <BottomNav active="Профиль" />
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="st-page"><div className="st-muted">Загрузка…</div></div>}>
      <Inner />
    </Suspense>
  );
}
