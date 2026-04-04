import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { calc1RM, bestSet } from "./fitness";

// ─── Rangos ───────────────────────────────────────────────────────────────────
export const RANKS = [
  { name: "Piedra",   emoji: "🪨", minXP: 0,     color: "#78716c", dim: "#1c1917" },
  { name: "Bronce",   emoji: "🥉", minXP: 800,   color: "#cd7f32", dim: "#1c0f00" },
  { name: "Plata",    emoji: "🥈", minXP: 2500,  color: "#94a3b8", dim: "#0f172a" },
  { name: "Oro",      emoji: "🥇", minXP: 6000,  color: "#fbbf24", dim: "#1c1100" },
  { name: "Diamante", emoji: "💎", minXP: 13000, color: "#38bdf8", dim: "#0c1a2e" },
  { name: "Leyenda",  emoji: "👑", minXP: 28000, color: "#a78bfa", dim: "#1e1b4b" },
];

export function getRank(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.minXP) rank = r;
    else break;
  }
  return rank;
}

export function getNextRank(xp) {
  for (let i = 0; i < RANKS.length; i++) {
    if (xp < RANKS[i].minXP) return RANKS[i];
  }
  return null; // ya es leyenda
}

export function xpToNextRank(xp) {
  const next = getNextRank(xp);
  if (!next) return 0;
  const current = getRank(xp);
  const total = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return { needed: next.minXP - xp, total, progress, pct: Math.round((progress / total) * 100) };
}

// ─── XP por acción ────────────────────────────────────────────────────────────
export const XP_VALUES = {
  SESSION:  60,   // base más baja — el XP real viene de PRs y racha
  PR:        80,  // PRs valen más — recompensa el progreso real
  STREAK_3:  20,
  STREAK_7:  60,
  STREAK_14: 130,
  STREAK_30: 280,
};

// ─── Firestore ────────────────────────────────────────────────────────────────

function xpDoc(uid) { return doc(db, "user_xp", uid); }

/**
 * Carga el XP de un usuario.
 */
export async function loadUserXP(uid) {
  try {
    const snap = await getDoc(xpDoc(uid));
    if (!snap.exists()) return { xp: 0, history: [] };
    return snap.data();
  } catch (err) {
    console.warn("loadUserXP error:", err.message);
    return { xp: 0, history: [] };
  }
}

/**
 * Agrega XP a un usuario y retorna { newXP, oldXP, rankUp }.
 */
export async function addXP(uid, displayName, amount, reason) {
  try {
    const current = await loadUserXP(uid);
    const oldXP   = current.xp || 0;
    const newXP   = oldXP + amount;
    const oldRank = getRank(oldXP);
    const newRank = getRank(newXP);
    const rankUp  = newRank.name !== oldRank.name;

    await setDoc(xpDoc(uid), {
      uid,
      displayName,
      xp: newXP,
      history: [...(current.history || []).slice(-49), { amount, reason, date: new Date().toISOString().split("T")[0] }],
    });

    return { newXP, oldXP, rankUp, oldRank, newRank };
  } catch (err) {
    console.warn("addXP error:", err.message);
    return { newXP: 0, oldXP: 0, rankUp: false };
  }
}

/**
 * Calcula XP a dar por una sesión nueva.
 * Compara con sesiones anteriores para detectar PRs.
 */
export function calcSessionXP(newSession, allLogs, routine, streak) {
  let xp      = XP_VALUES.SESSION;
  let reasons = [`+${XP_VALUES.SESSION} XP por sesión completada`];
  let prs     = [];

  const day      = newSession.day;
  const exercises = routine?.[day]?.exercises || [];

  // Detectar PRs comparando con historial
  exercises.forEach((ex, ei) => {
    const newSets = newSession.sets?.[ei];
    if (!newSets?.length) return;
    const newBest = bestSet(newSets);
    if (!newBest) return;
    const newRM   = calc1RM(newBest.weight, newBest.reps);

    // Buscar mejor 1RM previo para este ejercicio
    let prevBest = 0;
    Object.values(allLogs).forEach(s => {
      if (s.day !== day) return;
      const sets = s.sets?.[ei];
      if (!sets?.length) return;
      const b  = bestSet(sets);
      if (!b) return;
      const rm = calc1RM(b.weight, b.reps);
      if (rm > prevBest) prevBest = rm;
    });

    if (newRM > prevBest && prevBest > 0) {
      xp += XP_VALUES.PR;
      prs.push(ex.name);
      reasons.push(`+${XP_VALUES.PR} XP PR en ${ex.name} (${newRM}kg)`);
    }
  });

  // Bonus por racha
  if (streak >= 30) {
    xp += XP_VALUES.STREAK_30;
    reasons.push(`+${XP_VALUES.STREAK_30} XP racha de 30 días`);
  } else if (streak >= 14) {
    xp += XP_VALUES.STREAK_14;
    reasons.push(`+${XP_VALUES.STREAK_14} XP racha de 14 días`);
  } else if (streak >= 7) {
    xp += XP_VALUES.STREAK_7;
    reasons.push(`+${XP_VALUES.STREAK_7} XP racha de 7 días`);
  } else if (streak >= 3) {
    xp += XP_VALUES.STREAK_3;
    reasons.push(`+${XP_VALUES.STREAK_3} XP racha de 3 días`);
  }

  return { xp, reasons, prs };
}

/**
 * Carga el leaderboard global con TODOS los usuarios registrados.
 * Combina user_public (todos) con user_xp (los que tienen XP).
 * Los que no tienen XP aparecen con 0.
 */
export async function loadLeaderboard() {
  try {
    const [publicSnap, xpSnap] = await Promise.all([
      getDocs(collection(db, "user_public")),
      getDocs(collection(db, "user_xp")),
    ]);

    // Mapa de XP por uid
    const xpMap = {};
    xpSnap.forEach(d => { xpMap[d.id] = d.data().xp || 0; });

    // Combinar con todos los usuarios públicos
    const all = [];
    publicSnap.forEach(d => {
      const data = d.data();
      all.push({
        uid:         data.uid,
        displayName: data.displayName || data.email?.split("@")[0] || "Usuario",
        photoURL:    data.photoURL || null,
        xp:          xpMap[data.uid] || 0,
      });
    });

    // Ordenar por XP descendente
    all.sort((a, b) => b.xp - a.xp);
    return all.map((entry, i) => ({ rank: i + 1, ...entry }));
  } catch (err) {
    console.warn("loadLeaderboard error:", err.message);
    return [];
  }
}
