"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Search, Bell, Plus, Building2 } from "lucide-react";

const TYPES = ["Первичка", "Вторичка", "Дом", "Участок", "Коммерция", "Все"];

export default function HomePage() {
  const [counts, setCounts] = useState({ активен: 0, "на проверке": 0, архив: 0, всего: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCounts() {
      try {
        const { count: total, error: e1 } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true });
        const { count: active, error: e2 } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("status", "активен");
        const { count: review, error: e3 } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("status", "на проверке");
        const { count: archived, error: e4 } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("status", "архив");

        if (e1 || e2 || e3 || e4) throw e1 || e2 || e3 || e4;

        setCounts({
          всего: total || 0,
          активен: active || 0,
          "на проверке": review || 0,
          архив: archived || 0,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadCounts();
  }, []);

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-serif-logo text-gold-light text-2xl tracking-wide">RAYAN</div>
          <div className="text-muted text-[9px] tracking-[0.2em]">ЦЕНТР НЕДВИЖИМОСТИ</div>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5">
          <Bell size={16} className="text-cream" />
        </div>
      </div>

      {/* Search */}
      <div className="rounded-2xl px-4 py-3 flex items-center gap-2 mb-6 bg-white/5 border border-gold/25">
        <Search size={16} className="text-muted" />
        <span className="text-muted text-sm">Поиск объектов…</span>
      </div>

      {/* Types */}
      <div className="text-muted text-[10px] tracking-[0.15em] mb-2">ТИП НЕДВИЖИМОСТИ</div>
      <div className="grid grid-cols-3 gap-2 mb-6">
        {TYPES.map((t, i) => (
          <div
            key={i}
            className={`rounded-xl py-3 flex flex-col items-center gap-1.5 border ${
              i === 5 ? "bg-gold/10 border-gold/40" : "bg-white/5 border-white/10"
            }`}
          >
            <Building2 size={18} className={i === 5 ? "text-gold-light" : "text-muted"} />
            <span className={`text-[11px] ${i === 5 ? "text-gold-light" : "text-cream"}`}>{t}</span>
          </div>
        ))}
      </div>

      {/* Add button */}
      <button className="w-full rounded-xl py-3 mb-8 flex items-center justify-center gap-2 bg-gradient-to-br from-gold-light to-gold shadow-lg shadow-gold/30">
        <Plus size={16} className="text-green-deep" strokeWidth={2.5} />
        <span className="text-green-deep font-bold text-sm">ДОБАВИТЬ ОБЪЕКТ</span>
      </button>

      {/* Stats from Supabase */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-serif-logo text-cream text-lg">Мои объекты</span>
      </div>

      {error && (
        <div className="rounded-xl p-3 bg-red-900/30 border border-red-500/30 text-red-200 text-xs mb-4">
          Не удалось загрузить данные: {error}
        </div>
      )}

      {loading ? (
        <div className="text-muted text-sm">Загрузка…</div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[
            ["активен", "Активные"],
            ["на проверке", "На проверке"],
            ["архив", "Архив"],
          ].map(([key, label]) => (
            <div key={key} className="rounded-xl py-3 text-center bg-white/5">
              <div className="font-serif-logo text-gold-light text-xl">{counts[key]}</div>
              <div className="text-muted text-[9px]">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-center text-muted text-[11px]">
        Всего объектов в базе: {counts["всего"]}
      </div>
    </div>
  );
}
