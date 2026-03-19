import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, query, where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { DAY_ORDER } from "../data/routine";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function profileDoc(uid)        { return doc(db, "user_public", uid); }
function friendsDoc(uid)        { return doc(db, "friendships", uid); }

/**
 * Genera un código de invitación de 6 caracteres único.
 */
function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── PERFIL PÚBLICO ───────────────────────────────────────────────────────────

/**
 * Inicializa el perfil público de un usuario nuevo.
 * Se llama la primera vez que entra a la app.
 */
export async function initPublicProfile(uid, displayName, email) {
  const ref = profileDoc(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();

  const code = generateCode();
  const profile = {
    uid,
    displayName: displayName || email.split("@")[0],
    email,
    friendCode: code,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return profile;
}

/**
 * Obtiene el perfil público de un usuario por uid.
 */
export async function getPublicProfile(uid) {
  const snap = await getDoc(profileDoc(uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Busca un usuario por su código de amigo.
 */
export async function findUserByCode(code) {
  const q = query(collection(db, "user_public"), where("friendCode", "==", code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
}

/**
 * Busca un usuario por email.
 */
export async function findUserByEmail(email) {
  const q = query(collection(db, "user_public"), where("email", "==", email.toLowerCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data();
}

// ─── AMISTADES ────────────────────────────────────────────────────────────────

/**
 * Envía solicitud de amistad.
 */
export async function sendFriendRequest(fromUid, toUid) {
  // Agregar a pendientes del destinatario
  await setDoc(doc(db, "friendships", toUid, "requests", fromUid), {
    fromUid,
    sentAt: serverTimestamp(),
    status: "pending",
  });
  // Registrar que yo envié solicitud
  await setDoc(doc(db, "friendships", fromUid, "sent", toUid), {
    toUid,
    sentAt: serverTimestamp(),
  });
}

/**
 * Acepta una solicitud de amistad.
 */
export async function acceptFriendRequest(myUid, fromUid) {
  // Agregar en mi lado (tengo permiso seguro)
  await setDoc(doc(db, "friendships", myUid, "friends", fromUid), {
    uid: fromUid, addedAt: serverTimestamp(),
  });
  // Agregar en el lado del que envió (puede fallar por Rules)
  try {
    await setDoc(doc(db, "friendships", fromUid, "friends", myUid), {
      uid: myUid, addedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("No se pudo escribir en el lado del remitente:", e.message);
  }
  // Eliminar solicitud de mi lado
  await deleteDoc(doc(db, "friendships", myUid, "requests", fromUid));
  // Eliminar sent del lado del remitente
  try {
    await deleteDoc(doc(db, "friendships", fromUid, "sent", myUid));
  } catch (e) {
    console.warn("No se pudo borrar sent:", e.message);
  }
}

/**
 * Rechaza o cancela solicitud.
 */
export async function rejectFriendRequest(myUid, fromUid) {
  await deleteDoc(doc(db, "friendships", myUid, "requests", fromUid));
  await deleteDoc(doc(db, "friendships", fromUid, "sent", myUid));
}

/**
 * Elimina un amigo.
 */
export async function removeFriend(myUid, friendUid) {
  // Borrar mi lado (tengo permiso)
  await deleteDoc(doc(db, "friendships", myUid, "friends", friendUid));
  // Intentar borrar el lado del amigo (puede fallar por Rules, no es crítico)
  try {
    await deleteDoc(doc(db, "friendships", friendUid, "friends", myUid));
  } catch (e) {
    console.warn("No se pudo borrar el lado del amigo:", e.message);
  }
}

/**
 * Carga la lista de amigos de un usuario.
 * Retorna array de perfiles públicos.
 */
export async function loadFriends(uid) {
  const friends = [];
  try {
    const snap = await getDocs(collection(db, "friendships", uid, "friends"));
    const profilePromises = snap.docs.map(d =>
      getPublicProfile(d.data().uid).catch(() => null)
    );
    const profiles = await Promise.all(profilePromises);
    profiles.forEach(p => { if (p) friends.push(p); });
  } catch (err) {
    console.warn("loadFriends error:", err.message);
  }
  return friends;
}

/**
 * Carga solicitudes pendientes recibidas.
 */
export async function loadFriendRequests(uid) {
  const requests = [];
  try {
    const snap = await getDocs(collection(db, "friendships", uid, "requests"));
    const profilePromises = snap.docs.map(d =>
      getPublicProfile(d.data().fromUid)
        .then(profile => profile ? { ...profile, requestId: d.id } : null)
        .catch(() => null)
    );
    const profiles = await Promise.all(profilePromises);
    profiles.forEach(p => { if (p) requests.push(p); });
  } catch (err) {
    console.warn("loadFriendRequests error:", err.message);
  }
  return requests;
}

// ─── DATOS PÚBLICOS DE UN AMIGO ───────────────────────────────────────────────

/**
 * Carga los logs de la semana actual de un usuario.
 */
export async function loadFriendWeeklyLogs(friendUid) {
  const snap = await getDocs(collection(db, "users", friendUid, "gym_logs"));
  const logs = {};
  snap.forEach((d) => { logs[d.id] = d.data(); });

  // Filtrar solo la semana actual
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const weekly = {};
  Object.entries(logs).forEach(([key, session]) => {
    const sessionDate = new Date(session.date);
    if (sessionDate >= monday) weekly[key] = session;
  });
  return weekly;
}

/**
 * Carga la rutina completa de un amigo.
 */
export async function loadFriendRoutine(friendUid) {
  const result = {};
  try {
    // Cargar todos los documentos de la subcolección gym_routine
    const snap = await getDocs(collection(db, "users", friendUid, "gym_routine"));
    snap.forEach(d => { result[d.id] = d.data(); });
  } catch (err) {
    console.warn("loadFriendRoutine error:", err.message);
  }
  return result;
}

/**
 * Carga todos los logs de un amigo (para comparar pesos/reps).
 */
export async function loadFriendAllLogs(friendUid) {
  const logs = {};
  try {
    const snap = await getDocs(collection(db, "users", friendUid, "gym_logs"));
    snap.forEach((d) => { logs[d.id] = d.data(); });
  } catch (err) {
    console.warn("loadFriendAllLogs error:", err.message);
  }
  return logs;
}
