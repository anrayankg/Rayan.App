"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// Окно "Отправить в подборку" для НЕСКОЛЬКИХ выбранных объектов сразу
// (одно и то же на главной и в личном кабинете). Подборки берём из базы по агенту,
// плюс недавние с этого устройства.
export default function CollectionPickerSheet({ open, onClose, listingIds, agent, onDone }) {
  const [collections, setCollections] = useState([]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!open) return;
    setDone(null); setNewName("");
    async function load() {
      let list = [];
      if (agent && agent.id) {
        const { data } = await supabase.from("collections").select("id, name, listing_ids").eq("agent_id", agent.id).order("created_at", { ascending: false });
        list = data || [];
      }
      try {
        const recent = JSON.parse(localStorage.getItem("rayan_collections") || "[]");
        recent.forEach((r) => { if (!list.find((c) => c.id === r.id)) list.push(r); });
      } catch {}
      setCollections(list);
    }
    load();
  }, [open, agent]);

  if (!open) return null;

  function remember(col) {
    try {
      const list = JSON.parse(localStorage.getItem("rayan_collections") || "[]").filter((c) => c.id !== col.id);
      list.unshift({ id: col.id, name: col.name });
      localStorage.setItem("rayan_collections", JSON.stringify(list.slice(0, 15)));
    } catch {}
  }

  async function createNew() {
    if (!newName.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("collections")
      .insert({ name: newName.trim(), listing_ids: listingIds, agent_id: agent?.id || null }).select().single();
    setBusy(false);
    if (error) { alert("Не удалось создать подборку: " + error.message); return; }
    remember(data);
    setDone(data.name);
    if (onDone) onDone();
  }

  async function addTo(col) {
    setBusy(true);
    const { data } = await supabase.from("collections").select("listing_ids").eq("id", col.id).single();
    const existing = (data?.listing_ids || []).map((x) => (typeof x === "string" ? x : x.id));
    const merged = Array.from(new Set([...existing, ...listingIds]));
    const { error } = await supabase.from("collections").update({ listing_ids: merged }).eq("id", col.id);
    setBusy(false);
    if (error) { alert("Не удалось добавить: " + error.message); return; }
    remember(col);
    setDone(col.name);
    if (onDone) onDone();
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {done ? (
          <>
            <div className="sheet-title">Добавлено ✓</div>
            <div className="sheet-note">В подборку «{done}»</div>
            <button className="btn-primary btn-block" onClick={onClose}>Готово</button>
          </>
        ) : (
          <>
            <div className="sheet-title">Отправить в подборку ({listingIds.length})</div>
            <div className="sheet-label">Новая подборка</div>
            <input className="sheet-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Например: Для Айгерим" />
            <button className="btn-primary btn-block" disabled={busy || !newName.trim()} onClick={createNew}>Создать и добавить</button>
            <div className="sheet-label" style={{ marginTop: 18 }}>Мои подборки</div>
            {collections.length === 0 ? (
              <div className="sheet-note">Пока нет ни одной подборки.</div>
            ) : (
              collections.map((c) => (
                <button key={c.id} className="sheet-row" disabled={busy} onClick={() => addTo(c)}>
                  <span>{c.name}</span>
                  {Array.isArray(c.listing_ids) && <span className="sheet-row-count">{c.listing_ids.length}</span>}
                </button>
              ))
            )}
            <button className="sheet-cancel" onClick={onClose}>Отмена</button>
          </>
        )}
      </div>
    </div>
  );
}
