import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where,
  arrayUnion, arrayRemove, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { getPublicProfile } from "./friends";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateGroupCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── GRUPOS ───────────────────────────────────────────────────────────────────

/**
 * Crea un grupo nuevo.
 */
export async function createGroup(uid, name) {
  const code    = generateGroupCode();
  const groupId = `${uid}_${Date.now()}`;
  const group   = {
    id: groupId,
    name: name.trim(),
    code,
    createdBy: uid,
    members: [uid],
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "groups", groupId), group);
  return group;
}

/**
 * Carga todos los grupos de un usuario.
 */
export async function loadUserGroups(uid) {
  try {
    const q    = query(collection(db, "groups"), where("members", "array-contains", uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (err) {
    console.warn("loadUserGroups error:", err.message);
    return [];
  }
}

/**
 * Busca un grupo por código.
 */
export async function findGroupByCode(code) {
  try {
    const q    = query(collection(db, "groups"), where("code", "==", code.toUpperCase()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { ...snap.docs[0].data(), id: snap.docs[0].id };
  } catch (err) {
    console.warn("findGroupByCode error:", err.message);
    return null;
  }
}

/**
 * Une a un usuario a un grupo.
 */
export async function joinGroup(uid, groupId) {
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayUnion(uid),
  });
}

/**
 * Sale de un grupo.
 */
export async function leaveGroup(uid, groupId) {
  await updateDoc(doc(db, "groups", groupId), {
    members: arrayRemove(uid),
  });
}

/**
 * Elimina un grupo (solo el creador).
 */
export async function deleteGroup(uid, groupId) {
  const snap = await getDoc(doc(db, "groups", groupId));
  if (!snap.exists() || snap.data().createdBy !== uid) return;
  await deleteDoc(doc(db, "groups", groupId));
}

/**
 * Carga perfiles públicos de todos los miembros de un grupo.
 */
export async function loadGroupMembers(memberUids) {
  const profiles = await Promise.all(
    memberUids.map(uid => getPublicProfile(uid).catch(() => null))
  );
  return profiles.filter(Boolean);
}

/**
 * Carga logs de la semana actual de un usuario.
 */
export async function loadMemberWeeklyLogs(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "gym_logs"));
    const logs = {};
    snap.forEach(d => { logs[d.id] = d.data(); });

    const now    = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const weekly = {};
    Object.entries(logs).forEach(([key, s]) => {
      if (new Date(s.date) >= monday) weekly[key] = s;
    });
    return weekly;
  } catch (err) {
    console.warn("loadMemberWeeklyLogs error:", err.message);
    return {};
  }
}

/**
 * Carga todos los logs de un usuario (para 1RM y frecuencia).
 */
export async function loadMemberAllLogs(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "gym_logs"));
    const logs = {};
    snap.forEach(d => { logs[d.id] = d.data(); });
    return logs;
  } catch (err) {
    console.warn("loadMemberAllLogs error:", err.message);
    return {};
  }
}

/**
 * Carga rutina de un miembro.
 */
export async function loadMemberRoutine(uid) {
  try {
    const snap = await getDocs(collection(db, "users", uid, "gym_routine"));
    const routine = {};
    snap.forEach(d => { routine[d.id] = d.data(); });
    return routine;
  } catch (err) {
    console.warn("loadMemberRoutine error:", err.message);
    return {};
  }
}
