/**
 * Capa de persistencia en localStorage.
 */

const STORAGE_KEY = "gym_logs_v2";

export function loadLogs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

/**
 * Genera la key única de una sesión.
 * Formato: "Upper A__2026-03-17"
 */
export function getSessionKey(day, date) {
  return `${day}__${date}`;
}

/**
 * Fecha de hoy en formato ISO (YYYY-MM-DD).
 */
export function todayStr() {
  return new Date().toISOString().split("T")[0];
}
