/**
 * sleep.js — Registro de sueño
 * Guarda en Firestore: users/{uid}/sleep_logs/{date}
 * Formato: { date, hours, quality, note, savedAt }
 * quality: 1-5
 */

import { collection, doc, getDocs, setDoc, deleteDoc, orderBy, query, limit } from "firebase/firestore";
import { db } from "./firebase";

const col = (uid) => collection(db, "users", uid, "sleep_logs");
const KEY  = (uid) => `gymtracker_sleep_${uid}`;

// ── Firestore ────────────────────────────────────────────────────────────────

export async function saveSleepLog(uid, { date, hours, quality, note }) {
  const entry = { date, hours, quality, note: note || "", savedAt: Date.now() };
  await setDoc(doc(col(uid), date), entry);
  // Cache local
  try {
    const cache = JSON.parse(localStorage.getItem(KEY(uid)) || "{}");
    cache[date] = entry;
    localStorage.setItem(KEY(uid), JSON.stringify(cache));
  } catch {}
  return entry;
}

export async function loadSleepLogs(uid) {
  // Intenta cache primero
  try {
    const cached = localStorage.getItem(KEY(uid));
    if (cached) return JSON.parse(cached);
  } catch {}
  // Firestore fallback
  const snap = await getDocs(query(col(uid), orderBy("date", "desc"), limit(90)));
  const logs = {};
  snap.forEach(d => { logs[d.id] = d.data(); });
  try { localStorage.setItem(KEY(uid), JSON.stringify(logs)); } catch {}
  return logs;
}

export async function deleteSleepLog(uid, date) {
  await deleteDoc(doc(col(uid), date));
  try {
    const cache = JSON.parse(localStorage.getItem(KEY(uid)) || "{}");
    delete cache[date];
    localStorage.setItem(KEY(uid), JSON.stringify(cache));
  } catch {}
}

// ── Utils ────────────────────────────────────────────────────────────────────

export function sleepStats(logs) {
  const entries = Object.values(logs).sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) return null;

  const last30 = entries.slice(0, 30);
  const avgHours   = last30.reduce((s, e) => s + e.hours, 0) / last30.length;
  const avgQuality = last30.reduce((s, e) => s + e.quality, 0) / last30.length;

  const streak = (() => {
    let s = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      if (logs[key]) s++;
      else break;
    }
    return s;
  })();

  return {
    avgHours:   Math.round(avgHours * 10) / 10,
    avgQuality: Math.round(avgQuality * 10) / 10,
    streak,
    total: entries.length,
    last: entries[0],
  };
}

export const QUALITY_LABELS = {
  1: { label: "Pésimo",   emoji: "😫", color: "#f87171" },
  2: { label: "Malo",     emoji: "😔", color: "#fb923c" },
  3: { label: "Regular",  emoji: "😐", color: "#fbbf24" },
  4: { label: "Bien",     emoji: "😊", color: "#86efac" },
  5: { label: "Excelente",emoji: "😴", color: "#4ade80" },
};
