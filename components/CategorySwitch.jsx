"use client";
import { useRouter } from "next/navigation";
import { Picker } from "./Picker";

// Первая строка любой формы — категория объекта.
// Если объект занесли не в тот раздел (например, дом во «Вторичку») — выберите правильную
// категорию: откроется нужная форма с этим же объектом, а при сохранении он перейдёт в новый раздел.
export const FORM_CATEGORIES = [
  { key: "vtorichka", label: "Квартиры (вторичка)" },
  { key: "pervichka", label: "Новостройки (первичка)" },
  { key: "dom", label: "Дома" },
  { key: "uchastok", label: "Участки" },
];

export default function CategorySwitch({ current, editId }) {
  const router = useRouter();
  const cur = FORM_CATEGORIES.find((c) => c.key === current);
  return (
    <div className="field-group">
      <Picker
        label="Категория"
        required
        options={FORM_CATEGORIES.map((c) => c.label)}
        value={cur ? cur.label : ""}
        onChange={(label) => {
          const next = FORM_CATEGORIES.find((c) => c.label === label);
          if (!next || next.key === current) return;
          router.replace(`/add/${next.key}${editId ? `?edit=${editId}` : ""}`);
        }}
      />
      {editId && <div className="field-hint">Сменили категорию — объект откроется в форме нового раздела. Проверьте поля и нажмите «Сохранить».</div>}
    </div>
  );
}
