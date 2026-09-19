// Проверка и нормализация ссылок на видеообзор объекта.
// Правила — см. ТЗ "ВИДЕО ОБЗОР ОБЪЕКТА" (раздел 3-4).

export const PLATFORM_LABELS = { youtube: "YouTube", telegram: "Telegram", instagram: "Instagram" };
export const PLATFORM_ICON = { youtube: "▶", telegram: "✈", instagram: "◎" };
export const PLATFORM_PLACEHOLDER = {
  youtube: "https://www.youtube.com/watch?v=...",
  telegram: "https://t.me/...",
  instagram: "https://www.instagram.com/...",
};

const PLATFORM_DOMAINS = {
  youtube: ["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"],
  telegram: ["t.me", "telegram.me"],
  instagram: ["instagram.com", "www.instagram.com"],
};

// Похоже ли это вообще на ссылку/домен — грубая, но надёжная проверка формы,
// до попытки собрать настоящий URL. Отсекает "youtube 12345" и голый текст.
const LOOKS_LIKE_URL = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i;

export function validateVideoLink(rawInput, platform) {
  const input = (rawInput || "").trim();
  if (!input) return { ok: false, message: "" };

  if (!LOOKS_LIKE_URL.test(input)) {
    return { ok: false, message: "❌ Это не похоже на ссылку. Вставьте ссылку на видео." };
  }

  const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let url;
  try {
    url = new URL(normalized);
  } catch {
    return { ok: false, message: "❌ Ссылка указана неправильно. Проверьте ссылку и попробуйте снова." };
  }

  const host = url.hostname.toLowerCase();
  const matchesChosen = PLATFORM_DOMAINS[platform].some((d) => host === d);
  if (matchesChosen) {
    return { ok: true, message: "✅ Ссылка добавлена", normalizedUrl: normalized };
  }

  const actualPlatform = Object.keys(PLATFORM_DOMAINS).find((p) =>
    PLATFORM_DOMAINS[p].some((d) => host === d)
  );
  if (actualPlatform) {
    return {
      ok: false,
      message: `❌ Неверная ссылка. Вы выбрали ${PLATFORM_LABELS[platform]} — вставьте ссылку на видео ${PLATFORM_LABELS[platform]}.`,
    };
  }
  return { ok: false, message: "❌ Ссылка указана неправильно. Проверьте ссылку и попробуйте снова." };
}
