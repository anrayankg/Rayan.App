"use client";
import { getCurrentAgent } from "./agent";

// Кто сделал изменение — подставляем в каждое сохранение объекта.
// База сама записывает это в историю действий (создание, договор, смена агента, статус, цена).
export function auditFields() {
  const me = getCurrentAgent();
  return { last_editor_phone: me && me.phone ? me.phone : null };
}
