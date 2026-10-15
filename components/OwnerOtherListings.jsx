"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { getCurrentAgent, isOwnListing } from "../lib/agent";
import { priceBlock, fullCharLine, listingCategory } from "../lib/listingFormat";

// «Другие объекты [Имя]» — под блоком связи с собственником.
// Человек = тот же номер телефона в карточках собственников (отдельных карточек людей не создаём).
// Нет других объектов — панель полностью скрыта. Текущий объект не считается.
const d9 = (s) => String(s || "").replace(/\D/g, "").slice(-9);

function genitive(name) {
  const n = String(name || "").trim().split(/\s+/)[0];
  if (!n) return "";
  const last = n.slice(-1).toLowerCase();
  if ("бвгджзклмнпрстфхцчшщ".includes(last)) return n + "а";
  if (last === "а") return "гкхжчшщ".includes(n.slice(-2, -1).toLowerCase()) ? n.slice(0, -1) + "и" : n.slice(0, -1) + "ы";
  if (last === "я") return n.slice(0, -1) + "и";
  if (last === "й") return n.slice(0, -1) + "я";
  return n;
}
function plural(n) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return "объект";
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return "объекта";
  return "объектов";
}
const ROLE = { "собственник": "Собственник", "агент": "Агент", "договорник": "Договорник", "застройщик": "Застройщик", "партнёр": "Партнёр", "другое": "Контакт" };

export default function OwnerOtherListings({ listing, contact }) {
  const router = useRouter();
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const me = typeof window !== "undefined" ? getCurrentAgent() : null;
  const phone = d9(contact && (contact.owner_phone || contact.owner_whatsapp));

  useEffect(() => {
    if (!listing || phone.length < 9) { setItems([]); return; }
    let on = true;
    const p = phone.split("");
    const pats = [
      `%${phone}%`,
      `%${p.slice(0, 3).join("")}%${p.slice(3, 5).join("")}%${p.slice(5, 7).join("")}%${p.slice(7).join("")}%`,
      `%${p.slice(0, 3).join("")}%${p.slice(3, 6).join("")}%${p.slice(6).join("")}%`,
    ];
    const orExpr = pats.flatMap((x) => [`owner_phone.ilike.${x}`, `owner_whatsapp.ilike.${x}`]).join(",");
    (async () => {
      const { data: cs } = await supabase.from("listing_contacts").select("listing_id, owner_phone, owner_whatsapp").or(orExpr).limit(300);
      const ids = (cs || [])
        .filter((c) => d9(c.owner_phone) === phone || d9(c.owner_whatsapp) === phone)
        .map((c) => c.listing_id)
        .filter((id) => id && id !== listing.id);
      if (!ids.length) { if (on) setItems([]); return; }
      const { data: ls } = await supabase.from("listings").select("*").in("id", ids.slice(0, 200)).eq("status", "активен");
      if (on) setItems(ls || []);
    })().catch(() => on && setItems([]));
    return () => { on = false; };
  }, [listing && listing.id, phone]);

  if (!items || items.length === 0) return null;
  const name = (contact && contact.owner_name) || "";
  const role = ROLE[(contact && contact.source_type) || ""] || "Контакт";
  const title = name ? `Другие объекты ${genitive(name)}` : "Другие объекты этого контакта";

  return (
    <div className="oo-panel">
      <button type="button" className="oo-head" onClick={() => setOpen((v) => !v)}>
        <span className="oo-ava">{(name || "?").trim()[0] || "?"}</span>
        <span className="oo-text">
          <b>{name || "Без имени"}</b>
          <small>{role} · {items.length} {plural(items.length)}</small>
        </span>
        <span className="oo-arrow">{open ? "⌃" : "›"}</span>
      </button>
      <button type="button" className="oo-title" onClick={() => setOpen((v) => !v)}>{title}</button>
      {open && (
        <div className="oo-list">
          {items.map((l) => {
            const { usd } = priceBlock(l);
            const href = me && isOwnListing(l, me) ? `/listing/${l.id}` : `/a/${l.id}`;
            return (
              <a key={l.id} href={href} className="oo-item" onClick={(e) => { e.preventDefault(); router.push(href); }}>
                <div className="oo-price">${usd.toLocaleString("ru-RU")}</div>
                <div className="oo-chars">{fullCharLine(l)}</div>
                <div className="oo-cat">{listingCategory(l)}{l.display_id ? ` · ID ${l.display_id}` : ""}</div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
