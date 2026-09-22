"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

// "Подборки" без личного кабинета (его пока нет): агент создаёт подборку — получает
// уникальную ссылку /c/<id>, добавляет туда объекты. Ссылки на недавние свои подборки
// запоминаются в localStorage ЭТОГО устройства — как только появится личный кабинет,
// этот же список станет разделом "Мои подборки" там.

function getRecentCollections() {
  try { return JSON.parse(localStorage.getItem("rayan_collections") || "[]"); } catch { return []; }
}
function saveRecentCollection(col) {
  try {
    const list = getRecentCollections().filter((c) => c.id !== col.id);
    list.unshift(col);
    localStorage.setItem("rayan_collections", JSON.stringify(list.slice(0, 15)));
  } catch {}
}

export default function AddToCollectionButton({ listingId, compact }) {
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState([]);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (open) { const r = getRecentCollections(); setRecent(r); setCreatingNew(r.length === 0); }
  }, [open]);

  async function createAndAdd() {
    if (!newName.trim()) return;
    setBusy(true);
    let agentId = null;
    try { agentId = JSON.parse(localStorage.getItem("rayan_agent") || "null")?.id || null; } catch {}
    const { data, error } = await supabase.from("collections").insert({ name: newName.trim(), listing_ids: [listingId], agent_id: agentId }).select().single();
    setBusy(false);
    if (error) { alert("Не удалось создать подборку: " + error.message); return; }
    saveRecentCollection({ id: data.id, name: data.name });
    setDone(data.name);
    setNewName("");
  }

  async function addToExisting(col) {
    setBusy(true);
    const { data } = await supabase.from("collections").select("listing_ids").eq("id", col.id).single();
    const existing = data?.listing_ids || [];
    const ids = existing.map((x) => (typeof x === "string" ? x : x.id));
    if (!ids.includes(listingId)) {
      await supabase.from("collections").update({ listing_ids: [...existing, listingId] }).eq("id", col.id);
    }
    setBusy(false);
    saveRecentCollection(col);
    setDone(col.name);
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setDone(null); }} className={`action-btn${compact ? " action-btn-compact" : ""}`}>
        + Подборка
      </button>
      {open && (
        <div className="collection-modal-overlay" onClick={() => setOpen(false)}>
          <div className="collection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="collection-modal-handle" />
            {done ? (
              <>
                <div className="collection-modal-title">Добавлено ✓</div>
                <div className="collection-modal-sub-text">В подборку «{done}»</div>
                <button className="collection-modal-close" onClick={() => setOpen(false)}>Закрыть</button>
              </>
            ) : (
              <>
                <div className="collection-modal-title">Мои подборки</div>

                {!creatingNew && recent.length > 0 && (
                  <>
                    <div className="collection-modal-sub-text">Выберите подборку, куда добавить объект</div>
                    <div className="collection-list">
                      {recent.map((c) => (
                        <button key={c.id} disabled={busy} onClick={() => addToExisting(c)} className="collection-existing-row">
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <button className="collection-new-link" onClick={() => setCreatingNew(true)}>+ Создать новую подборку</button>
                  </>
                )}

                {creatingNew && (
                  <>
                    <div className="collection-modal-sub-text">Название новой подборки</div>
                    <input
                      type="text"
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Например: Для Айгерим"
                      className="collection-input"
                    />
                    <button disabled={busy || !newName.trim()} onClick={createAndAdd} className="collection-create-btn">
                      Создать и добавить
                    </button>
                    {recent.length > 0 && (
                      <button className="collection-new-link" onClick={() => setCreatingNew(false)}>‹ К списку подборок</button>
                    )}
                  </>
                )}

                <button className="collection-modal-close" onClick={() => setOpen(false)}>Отмена</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
