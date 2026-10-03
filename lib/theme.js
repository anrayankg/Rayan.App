"use client";
// Тема приложения: "dark" | "light" | "system" (как в телефоне). Хранится на этом устройстве.
export function getThemeChoice() {
  try { return localStorage.getItem("rayan_theme") || "system"; } catch { return "system"; }
}
export function applyTheme(choice) {
  try { localStorage.setItem("rayan_theme", choice); } catch {}
  const resolved = choice === "system"
    ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : choice;
  document.documentElement.setAttribute("data-theme", resolved);
}
