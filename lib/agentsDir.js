"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// Справочник агентов: по номеру телефона находим имя (и фото, если есть).
// Если в объекте стоит номер Насредина — показываем имя "Насредин", а не "Агент RAYAN".
let cache = null;
let loading = null;

function key(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : "";
}

function load() {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = supabase.from("agents").select("*").then(({ data }) => {
      cache = {};
      (data || []).forEach((a) => { const k = key(a.phone); if (k) cache[k] = a; });
      return cache;
    }).catch(() => (cache = {}));
  }
  return loading;
}

export function useAgentsDir() {
  const [dir, setDir] = useState(cache || {});
  useEffect(() => { let on = true; load().then((d) => on && setDir({ ...d })); return () => { on = false; }; }, []);
  return dir;
}

export function agentByPhone(dir, phone) {
  return (dir && dir[key(phone)]) || null;
}

export function agentPhoto(a) {
  return (a && (a.avatar_url || a.photo_url || a.avatar || a.photo)) || null;
}

// Имя агента для показа: сначала по телефону из справочника, потом имя из объекта.
export function agentDisplayName(dir, phone, name) {
  const a = agentByPhone(dir, phone);
  if (a && a.name) return a.name;
  if (name && !/^агент rayan$/i.test(String(name).trim())) return name;
  return "Агент RAYAN";
}
