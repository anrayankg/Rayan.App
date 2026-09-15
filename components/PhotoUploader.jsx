"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const BUCKET = "listing-photos";

function publicUrl(path) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
}

export default function PhotoUploader({ photos, onChange }) {
  const [uploading, setUploading] = useState(false);
  const list = photos || [];

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const added = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-zA-Z0-9]/g, "").slice(0, 5) || "jpg";
        const path = `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file);
        if (error) throw error;
        added.push(path);
      }
      onChange([...list, ...added]);
    } catch (err) {
      alert("Не удалось загрузить фото: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function moveLeft(i) {
    if (i === 0) return;
    const arr = [...list];
    [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    onChange(arr);
  }
  function moveRight(i) {
    if (i === list.length - 1) return;
    const arr = [...list];
    [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
    onChange(arr);
  }
  function remove(i) {
    onChange(list.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <label className="doc-upload-btn">
          📷 Снять камерой
          <input type="file" accept="image/*" capture="environment" multiple style={{ display: "none" }} onChange={handleFiles} disabled={uploading} />
        </label>
        <label className="doc-upload-btn">
          🖼 Из галереи / файла
          <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
      {uploading && <div style={{ color: "#7FA396", fontSize: 12.5, marginTop: 8 }}>Загрузка…</div>}

      {list.length > 0 && (
        <>
          <div style={{ color: "#7FA396", fontSize: 10.5, margin: "10px 0 6px" }}>
            Первое фото — главное. Стрелками можно менять порядок.
          </div>
          <div className="photo-grid">
            {list.map((p, i) => (
              <div key={p} className="photo-thumb-wrap">
                <img src={publicUrl(p)} className="photo-thumb" alt="" />
                {i === 0 && <span className="photo-main-badge">Главное</span>}
                <div className="photo-thumb-controls">
                  <button type="button" onClick={() => moveLeft(i)} disabled={i === 0}>◀</button>
                  <button type="button" onClick={() => remove(i)}>✕</button>
                  <button type="button" onClick={() => moveRight(i)} disabled={i === list.length - 1}>▶</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
