"use client";
import { useEffect } from "react";
import { getCurrentAgent, isAdmin, isRop, digitsOnly } from "../lib/agent";
import { useAgentsDir } from "../lib/agentsDir";
import { Picker } from "./Picker";

// «Контакт агента» в форме объекта.
//  • Агент: имя и номер ставятся САМИ — те, что за ним закрепил руководитель. Менять их нельзя.
//  • РОП: может выбрать агента из своей команды (или себя).
//  • Директор: может выбрать любого агента.
// Если номер потерялся или поменялся — его меняет руководитель в разделе «Агенты и ПИН-коды».
export default function AgentAssign({ name, phone, onChange, attempted }) {
  const me = typeof window !== "undefined" ? getCurrentAgent() : null;
  const dir = useAgentsDir();

  useEffect(() => {
    if (me && !phone) onChange(me.name || "", me.phone || "");
  }, []); // eslint-disable-line

  if (!me) {
    return (
      <div className="agent-lock warn">
        Чтобы добавить объект, войдите в <a href="/profile">Профиль</a> по номеру и ПИН-коду. Номер агента подставится автоматически.
      </div>
    );
  }

  const all = Object.values(dir || {});
  let candidates = [];
  if (isAdmin(me)) candidates = all;
  else if (isRop(me)) {
    const ok = new Set([...(me.team || []), me.phone].map((x) => digitsOnly(x).slice(-9)));
    candidates = all.filter((a) => ok.has(digitsOnly(a.phone).slice(-9)));
  }
  const labelOf = (a) => `${a.name} · ${a.phone}`;

  if (candidates.length > 1) {
    const cur = candidates.find((a) => digitsOnly(a.phone).slice(-9) === digitsOnly(phone).slice(-9));
    return (
      <div className="field-group">
        <Picker label="Агент объекта" required options={candidates.map(labelOf)} value={cur ? labelOf(cur) : (phone ? `${name || ""} · ${phone}` : "")}
          onChange={(l) => { const a = candidates.find((x) => labelOf(x) === l); if (a) onChange(a.name, a.phone); }}
          error={attempted && !phone} />
        <div className="field-hint">Объект будет закреплён за выбранным агентом — его номер увидят клиенты.</div>
      </div>
    );
  }

  return (
    <div className="agent-lock">
      <div className="agent-lock-name">{name || me.name}</div>
      <div className="agent-lock-phone">{phone || me.phone}</div>
      <div className="agent-lock-note">🔒 Номер закреплён за вами руководителем. Подставляется автоматически, изменить его в объекте нельзя. Если номер потерялся или поменялся — обратитесь к руководителю.</div>
    </div>
  );
}
