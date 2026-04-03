import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

const col = (uid) => collection(db, "users", uid, "sleep_logs");
const KEY  = (uid) => `gymtracker_sleep_${uid}`;

// ── Firestore ────────────────────────────────────────────────────────────────

export async function saveSleepLog(uid, { date, hours, quality, note }) {
  const entry = { date, hours, quality, note: note || "", savedAt: Date.now() };
  await setDoc(doc(col(uid), date), entry);
  _updateCache(uid, logs => { logs[date] = entry; return logs; });
  return entry;
}

export async function loadSleepLogs(uid) {
  // Cache primero
  const cached = _readCache(uid);
  if (Object.keys(cached).length > 0) return cached;
  // Firestore — sin orderBy para evitar índice compuesto
  try {
    const snap = await getDocs(col(uid));
    const logs = {};
    snap.forEach(d => { logs[d.id] = d.data(); });
    _writeCache(uid, logs);
    return logs;
  } catch (e) {
    console.error("loadSleepLogs:", e);
    return {};
  }
}

export async function deleteSleepLog(uid, date) {
  try { await deleteDoc(doc(col(uid), date)); } catch {}
  _updateCache(uid, logs => { delete logs[date]; return logs; });
}

// ── Cache helpers ────────────────────────────────────────────────────────────

function _readCache(uid) {
  try { return JSON.parse(localStorage.getItem(KEY(uid)) || "{}"); } catch { return {}; }
}

function _writeCache(uid, logs) {
  try { localStorage.setItem(KEY(uid), JSON.stringify(logs)); } catch {}
}

function _updateCache(uid, fn) {
  _writeCache(uid, fn(_readCache(uid)));
}

// ── Stats ────────────────────────────────────────────────────────────────────

export function sleepStats(logs) {
  const entries = Object.values(logs).sort((a, b) => b.date.localeCompare(a.date));
  if (!entries.length) return null;

  const last30     = entries.slice(0, 30);
  const avgHours   = last30.reduce((s, e) => s + (e.hours || 0), 0) / last30.length;
  const avgQuality = last30.reduce((s, e) => s + (e.quality || 3), 0) / last30.length;

  const streak = (() => {
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const offset = d.getTimezoneOffset();
      const local  = new Date(d.getTime() - offset * 60000);
      const key    = local.toISOString().split("T")[0];
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
    last:  entries[0],
  };
}

export const QUALITY_LABELS = {
  1: { label: "Pésimo",    emoji: "😫", color: "#f87171" },
  2: { label: "Malo",      emoji: "😔", color: "#fb923c" },
  3: { label: "Regular",   emoji: "😐", color: "#fbbf24" },
  4: { label: "Bien",      emoji: "😊", color: "#86efac" },
  5: { label: "Excelente", emoji: "😴", color: "#4ade80" },
};
