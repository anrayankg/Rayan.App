// Этаж: цокольный, 1–40, мансарда, пентхаус. В базе колонка floor — число, поэтому
// "Цокольный" хранится как 0, а "Мансарда"/"Пентхаус" — как последний этаж дома,
// и само слово сохраняется в extra_details.floorLabel (его и показываем).
export const FLOOR_CHOICES = ["Цокольный", ...Array.from({ length: 40 }, (_, i) => String(i + 1)), "Мансарда", "Пентхаус"];
export const FLOORS_TOTAL_CHOICES = Array.from({ length: 40 }, (_, i) => String(i + 1));

export function floorToNumber(floor, floorsTotal) {
  if (!floor) return null;
  if (floor === "Цокольный") return 0;
  if (floor === "Мансарда" || floor === "Пентхаус") return floorsTotal ? Number(floorsTotal) : null;
  const n = Number(floor);
  return Number.isFinite(n) ? n : null;
}

export function withFloorLabel(extra, floor) {
  const next = { ...(extra || {}) };
  if (floor && !/^\d+$/.test(String(floor))) next.floorLabel = floor; else delete next.floorLabel;
  return next;
}

function parseExtra(x) {
  try { return x ? (typeof x === "string" ? JSON.parse(x) : x) : {}; } catch { return {}; }
}

// Значение этажа для показа/фильтра: "Цокольный" | "Мансарда" | "Пентхаус" | "7"
export function floorValue(l) {
  const lbl = parseExtra(l.extra_details).floorLabel;
  if (lbl) return lbl;
  if (l.floor === 0) return "Цокольный";
  return l.floor != null ? String(l.floor) : "";
}
