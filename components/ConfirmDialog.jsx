"use client";
// Окно "Подтвердить / Отклонить" — перед сохранением изменений и перед удалением.
export default function ConfirmDialog({ open, title, text, confirmText = "Подтвердить", cancelText = "Отклонить", danger, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="cd-overlay" onClick={onCancel}>
      <div className="cd-box" onClick={(e) => e.stopPropagation()}>
        <div className="cd-title">{title}</div>
        {text && <div className="cd-text">{text}</div>}
        <div className="cd-actions">
          <button className="cd-cancel" onClick={onCancel}>{cancelText}</button>
          <button className={`cd-ok ${danger ? "danger" : ""}`} onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
