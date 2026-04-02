/**
 * Persiste el borrador de sesión en localStorage.
 * Se guarda: al cambiar datos, al ir al fondo (visibilitychange),
 * y antes de cerrar la pestaña (beforeunload).
 * Se limpia al guardar la sesión exitosamente.
 */

const KEY = "gymtracker_draft_v2";

export function saveDraft(uid, { activeDay, sessionDate, sessionData, completedSets, sessionNote }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      uid, activeDay, sessionDate, sessionData, completedSets, sessionNote,
      savedAt: Date.now(),
    }));
  } catch (err) {
    console.warn("saveDraft error:", err?.message || err);
  }
}

export function loadDraft(uid) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (draft.uid !== uid) return null;
    // Descartar borradores de más de 48 horas
    if (Date.now() - draft.savedAt > 172800000) { clearDraft(); return null; }
    return draft;
  } catch { return null; }
}

export function clearDraft() {
  localStorage.removeItem(KEY);
}

/**
 * Registra listeners para guardar el draft automáticamente cuando:
 * - El usuario minimiza la app / cambia de pestaña (visibilitychange)
 * - El navegador está a punto de cerrar (beforeunload / pagehide)
 * Retorna una función para desregistrar los listeners.
 */
export function registerDraftGuard(getDraftData) {
  function handleVisibility() {
    if (document.visibilityState === "hidden") {
      const data = getDraftData();
      if (data) saveDraft(data.uid, data);
    }
  }

  function handleUnload() {
    const data = getDraftData();
    if (data) saveDraft(data.uid, data);
  }

  document.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", handleUnload);
  window.addEventListener("beforeunload", handleUnload);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", handleUnload);
    window.removeEventListener("beforeunload", handleUnload);
  };
}
