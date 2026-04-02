import {
  collection, doc, addDoc, getDocs, updateDoc,
  query, where, or, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getPublicProfile } from "./friends";
import { calc1RM, bestSet } from "./fitness";

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Crea un reto 1v1 de peso objetivo.
 * @param {Object} params
 */
export async function createChallenge({ fromUid, fromName, toUid, toName, exercise, targetWeight, deadlineDays, groupId }) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays);

  const challenge = {
    fromUid, fromName,
    toUid,   toName,
    exercise,
    targetWeight: parseFloat(targetWeight),
    deadline: deadline.toISOString().split("T")[0],
    deadlineDays,
    groupId: groupId || null,
    status: "active",    // active | completed | expired
    winner: null,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "challenges"), challenge);
  return { id: ref.id, ...challenge };
}

/**
 * Carga todos los retos de un usuario (enviados y recibidos).
 */
export async function loadUserChallenges(uid) {
  try {
    const q1 = query(collection(db, "challenges"), where("fromUid", "==", uid));
    const q2 = query(collection(db, "challenges"), where("toUid",   "==", uid));
    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const challenges = {};
    [...s1.docs, ...s2.docs].forEach(d => { challenges[d.id] = { id: d.id, ...d.data() }; });
    return Object.values(challenges);
  } catch (err) {
    console.warn("loadUserChallenges error:", err.message);
    return [];
  }
}

/**
 * Carga retos de un grupo.
 */
export async function loadGroupChallenges(groupId) {
  try {
    const q    = query(collection(db, "challenges"), where("groupId", "==", groupId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("loadGroupChallenges error:", err.message);
    return [];
  }
}

/**
 * Verifica si alguno de los participantes ya alcanzó el objetivo.
 * Actualiza el status si hay ganador.
 */
export async function checkChallengeProgress(challenge, fromLogs, toLogs, fromRoutine, toRoutine) {
  if (challenge.status !== "active") return challenge;

  const today = new Date().toISOString().split("T")[0];

  // Verificar expiración
  if (challenge.deadline < today) {
    await updateDoc(doc(db, "challenges", challenge.id), { status: "expired" });
    return { ...challenge, status: "expired" };
  }

  // Calcular mejor 1RM de cada participante para el ejercicio
  function getBest(logs, routine) {
    let best = 0;
    Object.values(logs || {}).forEach(s => {
      const dayRoutine = routine?.[s.day]?.exercises || [];
      const ei = dayRoutine.findIndex(e => e.name === challenge.exercise);
      if (ei === -1) return;
      const sets = s.sets?.[ei];
      if (!sets?.length) return;
      const b  = bestSet(sets);
      const rm = calc1RM(b.weight, b.reps);
      if (rm > best) best = rm;
    });
    return best;
  }

  const fromBest = getBest(fromLogs, fromRoutine);
  const toBest   = getBest(toLogs, toRoutine);

  const fromWon = fromBest >= challenge.targetWeight;
  const toWon   = toBest   >= challenge.targetWeight;

  if (fromWon || toWon) {
    const winner = fromWon && toWon
      ? (fromBest >= toBest ? challenge.fromUid : challenge.toUid)
      : fromWon ? challenge.fromUid : challenge.toUid;

    await updateDoc(doc(db, "challenges", challenge.id), { status: "completed", winner });
    return { ...challenge, status: "completed", winner };
  }

  return challenge;
}

/**
 * Calcula el progreso actual de un participante en un reto.
 * Retorna { current1RM, pct }
 */
export function calcChallengeProgress(logs, routine, exercise, targetWeight) {
  let best = 0;
  Object.values(logs || {}).forEach(s => {
    const dayRoutine = routine?.[s.day]?.exercises || [];
    const ei = dayRoutine.findIndex(e => e.name === exercise);
    if (ei === -1) return;
    const sets = s.sets?.[ei];
    if (!sets?.length) return;
    const b  = bestSet(sets);
    const rm = calc1RM(b.weight, b.reps);
    if (rm > best) best = rm;
  });
  return {
    current: best,
    pct: targetWeight > 0 ? Math.min(100, Math.round((best / targetWeight) * 100)) : 0,
  };
}
