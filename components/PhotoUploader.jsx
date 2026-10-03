"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const BUCKET = "listing-photos";

export function photoPublicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
}

async function uploadFiles(files) {
  const added = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
    const path = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) throw error;
    added.push(path);
  }
  return added;
}

export function PencilIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinejoin="round" style={{ stroke: "var(--text2)" }}>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function GalleryIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinejoin="round" style={{ stroke: "var(--text2)" }}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" /><circle cx="9" cy="10" r="1.8" /><path d="M4 18l5-5 4 4 3-3 4 4" />
    </svg>
  );
}

// Окно редактирования фото (как в Lalafo): сверху выбранные фото — первое главное,
// удерживайте фото пальцем и перетащите, чтобы поменять порядок; ✕ — удалить.
// Ниже — "Камера" и "Галерея". Сохранить — вверху справа и большой кнопкой внизу.
export function PhotoEditor({ open, photos, onSave, onClose }) {
  const [draft, setDraft] = useState(photos || []);
  const [uploading, setUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const gridRef = useRef(null);
  const d = useRef({ idx: null, timer: null, x: 0, y: 0, active: false, over: null });

  useEffect(() => { if (open) setDraft(photos || []); }, [open]); // eslint-disable-line

  // Нативный touchmove (passive:false), чтобы во время перетаскивания страница не прокручивалась
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    function onMove(e) {
      const t = e.touches[0];
      if (!d.current.active) {
        if (Math.hypot(t.clientX - d.current.x, t.clientY - d.current.y) > 8) clearTimeout(d.current.timer);
        return;
      }
      e.preventDefault();
      const target = document.elementFromPoint(t.clientX, t.clientY)?.closest("[data-pi]");
      if (target) { d.current.over = Number(target.dataset.pi); setOverIdx(d.current.over); }
    }
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, [open, draft.length]);

  if (!open) return null;

  function start(i, x, y, immediate) {
    d.current = { idx: i, x, y, active: false, over: i, timer: null };
    const go = () => { d.current.active = true; setDragIdx(i); setOverIdx(i); try { navigator.vibrate && navigator.vibrate(15); } catch {} };
    if (immediate) go(); else d.current.timer = setTimeout(go, 260);
  }
  function finish() {
    clearTimeout(d.current.timer);
    const { active, idx, over } = d.current;
    if (active && over != null && over !== idx) {
      setDraft((arr) => { const a = [...arr]; const [m] = a.splice(idx, 1); a.splice(over, 0, m); return a; });
    }
    d.current = { idx: null, active: false, over: null };
    setDragIdx(null); setOverIdx(null);
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try { const added = await uploadFiles(files); setDraft((a) => [...a, ...added]); }
    catch (err) { alert("Не удалось загрузить фото: " + err.message); }
    finally { setUploading(false); e.target.value = ""; }
  }

  return (
    <div className="pe-screen">
      <div className="pe-head">
        <button className="fl-head-btn" onClick={onClose} aria-label="Закрыть">✕</button>
        <button className="pe-save-top" onClick={() => onSave(draft)} disabled={uploading}>Сохранить</button>
      </div>
      <div className="pe-body">
        <div className="pe-title">Фото объявления</div>
        <div className="pe-hint">Первое фото — главное. Удерживайте фото пальцем и перетащите, чтобы поменять порядок.</div>
        <div className="pe-grid" ref={gridRef}
          onMouseMove={(e) => {
            if (!d.current.active) return;
            const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-pi]");
            if (target) { d.current.over = Number(target.dataset.pi); setOverIdx(d.current.over); }
          }}
          onMouseUp={finish} onMouseLeave={() => d.current.active && finish()}>
          {draft.map((p, i) => (
            <div key={p} data-pi={i}
              className={`pe-item ${i === 0 ? "pe-main" : ""} ${dragIdx === i ? "pe-dragging" : ""} ${overIdx === i && dragIdx !== null && dragIdx !== i ? "pe-over" : ""}`}
              onTouchStart={(e) => start(i, e.touches[0].clientX, e.touches[0].clientY, false)}
              onTouchEnd={finish} onTouchCancel={finish}
              onMouseDown={(e) => { if (e.button === 0 && !e.target.closest("button")) start(i, e.clientX, e.clientY, true); }}
              onContextMenu={(e) => e.preventDefault()}>
              <img src={photoPublicUrl(p)} alt="" draggable={false} />
              {i === 0 && <span className="pe-badge">Главное</span>}
              <button type="button" className="pe-del" aria-label="Удалить фото"
                onTouchStart={(e) => e.stopPropagation()}
                onClick={() => setDraft((a) => a.filter((_, k) => k !== i))}>✕</button>
            </div>
          ))}
        </div>
        {draft.length === 0 && <div className="pe-empty">Фото пока нет — добавьте с камеры или из галереи</div>}

        <div className="pe-add-title">Добавить фото</div>
        <div className="pe-add">
          <label className="pe-tile">
            <CameraIcon /><span>Камера</span>
            <input type="file" accept="image/*" capture="environment" multiple hidden onChange={handleFiles} disabled={uploading} />
          </label>
          <label className="pe-tile">
            <GalleryIcon /><span>Галерея</span>
            <input type="file" accept="image/*" multiple hidden onChange={handleFiles} disabled={uploading} />
          </label>
        </div>
        {uploading && <div className="pe-hint" style={{ marginTop: 10 }}>Загрузка фото…</div>}
      </div>
      <div className="fl-foot">
        <button className="fl-show" onClick={() => onSave(draft)} disabled={uploading}>Сохранить ({draft.length})</button>
      </div>
    </div>
  );
}

// Для форм добавления/редактирования: главное фото + маленькие, карандаш справа вверху.
export default function PhotoUploader({ photos, onChange }) {
  const [open, setOpen] = useState(false);
  const list = photos || [];
  return (
    <div>
      {list.length === 0 ? (
        <button type="button" className="pe-empty-btn" onClick={() => setOpen(true)}>
          <CameraIcon /><span>Добавить фото</span>
        </button>
      ) : (
        <div className="pu-preview" onClick={() => setOpen(true)}>
          <img src={photoPublicUrl(list[0])} alt="" className="pu-main" />
          <button type="button" className="round-glass-btn pu-pencil" aria-label="Редактировать фото"><PencilIcon /></button>
          <span className="pu-count">{list.length} фото</span>
          {list.length > 1 && (
            <div className="pu-strip">
              {list.slice(1, 6).map((p) => <img key={p} src={photoPublicUrl(p)} alt="" />)}
              {list.length > 6 && <span className="pu-more">+{list.length - 6}</span>}
            </div>
          )}
        </div>
      )}
      <PhotoEditor open={open} photos={list} onClose={() => setOpen(false)} onSave={(arr) => { onChange(arr); setOpen(false); }} />
    </div>
  );
}
