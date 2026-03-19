import {
  collection, doc, addDoc, getDocs,
  deleteDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Clave única de una sesión para comentarios.
 * Usa el uid del dueño + key de sesión para evitar colisiones.
 */
function sessionCommentId(ownerUid, sessionKey) {
  return `${ownerUid}_${sessionKey.replace(/ /g, "_")}`;
}

/**
 * Carga los comentarios de una sesión.
 */
export async function loadComments(ownerUid, sessionKey) {
  try {
    const ref  = collection(db, "session_comments", sessionCommentId(ownerUid, sessionKey), "comments");
    const q    = query(ref, orderBy("createdAt", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("loadComments error:", err.message);
    return [];
  }
}

/**
 * Agrega un comentario a una sesión.
 */
export async function addComment(ownerUid, sessionKey, { uid, displayName, emoji, text }) {
  const ref = collection(db, "session_comments", sessionCommentId(ownerUid, sessionKey), "comments");
  const doc_ = await addDoc(ref, {
    uid, displayName,
    emoji:     emoji || "",
    text:      text  || "",
    createdAt: serverTimestamp(),
  });
  return doc_.id;
}

/**
 * Elimina un comentario propio.
 */
export async function deleteComment(ownerUid, sessionKey, commentId) {
  const ref = doc(db, "session_comments", sessionCommentId(ownerUid, sessionKey), "comments", commentId);
  await deleteDoc(ref);
}
