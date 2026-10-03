"use client";
import { supabase } from "./supabase";
import { clientListingLink, collectionLink } from "./agent";
import { shortDate } from "./listingFormat";

// Что отправлять при "Поделиться":
//  • один объект — короткая ссылка на него (WhatsApp покажет карточку: фото, цена, параметры, логотип);
//  • несколько — система сама создаёт подборку и отправляет ОДНУ короткую ссылку на неё
//    (тоже с карточкой), вместо длинного списка ссылок.
// В ссылке всегда номер агента, который отправляет.
export async function buildShareUrl(listings, agent) {
  const list = (listings || []).filter(Boolean);
  if (list.length === 0) return "";
  if (list.length === 1) return clientListingLink(list[0], agent);
  const name = `Подборка${agent && agent.name ? " от " + agent.name : ""} ${shortDate(new Date().toISOString())}`;
  const { data, error } = await supabase.from("collections")
    .insert({ name, listing_ids: list.map((l) => l.id), agent_id: (agent && agent.id) || null })
    .select().single();
  if (error || !data) {
    // Запасной вариант, если подборку создать не удалось — короткие ссылки списком
    return list.map((l, i) => `${i + 1}) ${clientListingLink(l, agent)}`).join("\n");
  }
  return collectionLink(data.id, agent);
}
