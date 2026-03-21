/**
 * Persiste el estado del timer en localStorage.
 * Así el timer sobrevive aunque cierres la app.
 */

const KEY = "gymtracker_timer";

export function saveTimer(endTime) {
  if (!endTime) { clearTimer(); return; }
  localStorage.setItem(KEY, String(endTime));
}

export function loadTimer() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const endTime = parseInt(raw);
    // Si ya pasó el tiempo, limpiar
    if (Date.now() > endTime) { clearTimer(); return null; }
    return endTime;
  } catch { return null; }
}

export function clearTimer() {
  localStorage.removeItem(KEY);
}
