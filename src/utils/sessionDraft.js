/**
 * Persiste el borrador de una sesión activa en localStorage.
 * Se limpia automáticamente al guardar la sesión.
 */

const KEY = "gymtracker_draft";

export function saveDraft(uid, { activeDay, sessionDate, sessionData, completedSets, sessionNote }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({
      uid, activeDay, sessionDate, sessionData, completedSets, sessionNote,
      savedAt: Date.now(),
    }));
  } catch {}
}

export function loadDraft(uid) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (draft.uid !== uid) return null;
    // Descartar borradores de más de 24 horas
    if (Date.now() - draft.savedAt > 86400000) { clearDraft(); return null; }
    return draft;
  } catch { return null; }
}

export function clearDraft() {
  localStorage.removeItem(KEY);
}
