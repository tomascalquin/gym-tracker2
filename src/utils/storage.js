import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import { DAY_ORDER } from "../data/routine";
import { enqueue, isOnline } from "./offlineQueue";

export function getSessionKey(day, date) { return `${day}__${date}`; }
export function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset(); // minutos
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().split("T")[0];
}

function logsCol(uid)         { return collection(db, "users", uid, "gym_logs"); }
function logDoc(uid, key)     { return doc(db, "users", uid, "gym_logs", key); }
function sanitizeDayId(day) {
  // Reemplaza "/" y "." que rompen las rutas de Firestore
  return day.replace(/\//g, "-").replace(/\./g, "_").trim();
}
function routineDoc(uid, day) { return doc(db, "users", uid, "gym_routine", sanitizeDayId(day)); }
function localLogsKey(uid)    { return `gym_logs_${uid}`; }
function localRoutineKey(uid) { return `gym_routine_${uid}`; }

// ─── LOGS ─────────────────────────────────────────────────────────────────────
export async function loadLogs(uid) {
  try {
    const snapshot = await getDocs(logsCol(uid));
    const logs = {};
    snapshot.forEach((d) => { logs[d.id] = d.data(); });
    localStorage.setItem(localLogsKey(uid), JSON.stringify(logs));
    return logs;
  } catch (err) {
    console.warn("Firestore offline:", err.message);
    return loadLogsLocal(uid);
  }
}

export async function saveLog(uid, key, session) {
  // Siempre guardar local primero — respuesta instantánea
  const local = loadLogsLocal(uid);
  localStorage.setItem(localLogsKey(uid), JSON.stringify({ ...local, [key]: session }));

  if (!isOnline()) {
    enqueue({ type: "saveLog", payload: { key, session } });
    return;
  }
  try { await setDoc(logDoc(uid, key), session); }
  catch (err) {
    console.warn("saveLog error:", err.message);
    enqueue({ type: "saveLog", payload: { key, session } });
  }
}

export async function deleteLog(uid, key) {
  // Siempre borrar local primero
  const local = loadLogsLocal(uid);
  delete local[key];
  localStorage.setItem(localLogsKey(uid), JSON.stringify(local));

  if (!isOnline()) {
    enqueue({ type: "deleteLog", payload: { key } });
    return;
  }
  try { await deleteDoc(logDoc(uid, key)); }
  catch (err) {
    console.warn("deleteLog error:", err.message);
    enqueue({ type: "deleteLog", payload: { key } });
  }
}

function loadLogsLocal(uid) {
  try { return JSON.parse(localStorage.getItem(localLogsKey(uid)) || "{}"); }
  catch { return {}; }
}

// ─── RUTINA ───────────────────────────────────────────────────────────────────

/**
 * Carga la rutina del usuario.
 * Primero intenta el cache local (instantáneo), luego sincroniza con Firestore.
 * Retorna null si el usuario no tiene rutina.
 */
export async function loadRoutine(uid) {
  try {
    // Cache local primero — respuesta instantánea
    const cached = loadRoutineLocal(uid);

    const snap = await getDocs(collection(db, "users", uid, "gym_routine"));
    if (snap.empty) return cached || null;

    const result = {};
    snap.forEach(d => { result[d.id] = d.data(); });
    localStorage.setItem(localRoutineKey(uid), JSON.stringify(result));
    return result;
  } catch (err) {
    console.warn("loadRoutine error:", err.message);
    return loadRoutineLocal(uid);
  }
}

/**
 * Guarda la rutina completa de un usuario (onboarding).
 * routine = { "Upper A": { exercises: [...] }, ... }
 */
export async function saveFullRoutine(uid, routine) {
  // Sanitizar keys con "/" antes de guardar
  const sanitized = {};
  Object.entries(routine).forEach(([day, data]) => {
    sanitized[sanitizeDayId(day)] = data;
  });
  await Promise.all(
    Object.entries(sanitized).map(([day, data]) => setDoc(routineDoc(uid, day), data))
  );
  localStorage.setItem(localRoutineKey(uid), JSON.stringify(sanitized));
}

export async function addExerciseToRoutine(uid, day, exercise) {
  try { await updateDoc(routineDoc(uid, day), { exercises: arrayUnion(exercise) }); }
  catch (err) { console.warn("addExercise error:", err.message); }
  const local = loadRoutineLocal(uid) || {};
  const dayData = local[day] || { exercises: [] };
  localStorage.setItem(localRoutineKey(uid), JSON.stringify({
    ...local, [day]: { exercises: [...dayData.exercises, exercise] },
  }));
}

export async function removeExerciseFromRoutine(uid, day, exercise) {
  try { await updateDoc(routineDoc(uid, day), { exercises: arrayRemove(exercise) }); }
  catch (err) { console.warn("removeExercise error:", err.message); }
  const local = loadRoutineLocal(uid) || {};
  if (local[day]) {
    localStorage.setItem(localRoutineKey(uid), JSON.stringify({
      ...local, [day]: { exercises: local[day].exercises.filter(e => e.name !== exercise.name) },
    }));
  }
}

function loadRoutineLocal(uid) {
  try {
    const cached = JSON.parse(localStorage.getItem(localRoutineKey(uid)) || "{}");
    return Object.keys(cached).length ? cached : null;
  } catch { return null; }
}
