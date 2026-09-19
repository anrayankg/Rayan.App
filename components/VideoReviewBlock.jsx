"use client";
import { useState, useEffect } from "react";
import { validateVideoLink, PLATFORM_LABELS, PLATFORM_ICON, PLATFORM_PLACEHOLDER } from "../lib/videoLinks";

const ALL_PLATFORMS = ["youtube", "telegram", "instagram"];

// videos: [{platform, url}], onChange(videos), onPendingErrorChange(bool) —
// сообщает форме, есть ли сейчас незавершённая (ошибочная) ссылка, чтобы
// заблокировать "Продолжить"/"Сохранить" до её исправления.
export default function VideoReviewBlock({ videos, onChange, onPendingErrorChange }) {
  const [activePlatform, setActivePlatform] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [showPicker, setShowPicker] = useState(videos.length === 0);

  const addedPlatforms = videos.map((v) => v.platform);
  const remainingPlatforms = ALL_PLATFORMS.filter((p) => !addedPlatforms.includes(p));
  const hasPendingError = Boolean(activePlatform && feedback && !feedback.ok && inputValue.trim() !== "");

  useEffect(() => {
    if (onPendingErrorChange) onPendingErrorChange(hasPendingError);
  }, [hasPendingError]);

  function pickPlatform(p) {
    setActivePlatform(p);
    setInputValue("");
    setFeedback(null);
  }

  function cancelInput() {
    setActivePlatform(null);
    setInputValue("");
    setFeedback(null);
    setShowPicker(videos.length === 0);
  }

  function handleInput(v) {
    setInputValue(v);
    if (!v.trim()) { setFeedback(null); return; }
    const res = validateVideoLink(v, activePlatform);
    setFeedback(res);
    if (res.ok) {
      onChange([...videos, { platform: activePlatform, url: res.normalizedUrl }]);
      setActivePlatform(null);
      setInputValue("");
      setFeedback(null);
      setShowPicker(false);
    }
  }

  function removeVideo(platform) {
    onChange(videos.filter((v) => v.platform !== platform));
  }

  return (
    <div className="field-group">
      <div className="field-label">Видеообзор объекта</div>

      {videos.length > 0 && (
        <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }}>
          {videos.map((v) => (
            <div key={v.platform} className="video-added-row">
              <span>{PLATFORM_ICON[v.platform]} {PLATFORM_LABELS[v.platform]} — добавлено</span>
              <button type="button" onClick={() => removeVideo(v.platform)} className="video-remove-btn">Удалить</button>
            </div>
          ))}
        </div>
      )}

      {activePlatform ? (
        <div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={PLATFORM_PLACEHOLDER[activePlatform]}
            className="field-input"
            autoFocus
          />
          {feedback && feedback.message && (
            <div className={feedback.ok ? "video-feedback-ok" : "video-feedback-err"}>{feedback.message}</div>
          )}
          <button type="button" onClick={cancelInput} className="video-cancel-btn">Отмена</button>
        </div>
      ) : showPicker && remainingPlatforms.length > 0 ? (
        <div className="video-platform-row">
          {remainingPlatforms.map((p) => (
            <button key={p} type="button" onClick={() => pickPlatform(p)} className="video-platform-btn">
              {PLATFORM_ICON[p]} {PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
      ) : remainingPlatforms.length > 0 ? (
        <button type="button" onClick={() => setShowPicker(true)} className="video-add-more-btn">+ Добавить ещё видео</button>
      ) : null}
    </div>
  );
}
