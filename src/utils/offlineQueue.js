/**
 * offlineQueue.js
 * Queue de operaciones pendientes cuando no hay internet.
 * Se persiste en localStorage y se procesa cuando vuelve la conexión.
 */

const QUEUE_KEY = "gym_offline_queue";

function loadQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch { return []; }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Agrega una operación a la queue.
 * @param {Object} op - { type: "saveLog"|"deleteLog"|"saveRoutine", payload: {...} }
 */
export function enqueue(op) {
  const queue = loadQueue();
  queue.push({ ...op, timestamp: Date.now() });
  saveQueue(queue);
}

/**
 * Retorna cuántas operaciones hay pendientes.
 */
export function getPendingCount() {
  return loadQueue().length;
}

/**
 * Procesa todas las operaciones pendientes.
 * Llama a las funciones reales de Firebase.
 */
export async function flushQueue(uid) {
  const queue = loadQueue();
  if (!queue.length) return 0;

  // Importar dinámico para evitar circular deps
  const { saveLog, deleteLog, saveFullRoutine } = await import("./storage");

  let processed = 0;
  const failed = [];

  for (const op of queue) {
    try {
      if (op.type === "saveLog") {
        await saveLog(uid, op.payload.key, op.payload.session);
        processed++;
      } else if (op.type === "deleteLog") {
        await deleteLog(uid, op.payload.key);
        processed++;
      } else if (op.type === "saveRoutine") {
        await saveFullRoutine(uid, op.payload.routine);
        processed++;
      }
    } catch (err) {
      console.warn("offlineQueue flush error:", err.message);
      failed.push(op);
    }
  }

  saveQueue(failed);
  return processed;
}

/**
 * Limpia la queue completa (usar con cuidado).
 */
export function clearQueue() {
  saveQueue([]);
}

/**
 * Detecta si hay conexión a internet.
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Registra listeners para cuando vuelve la conexión y hace flush automático.
 * Llama esto una vez al arrancar la app.
 */
export function registerOnlineListener(uid, onFlushed) {
  const handler = async () => {
    const count = await flushQueue(uid);
    if (count > 0 && onFlushed) onFlushed(count);
  };
  window.addEventListener("online", handler);
  return () => window.removeEventListener("online", handler);
}
