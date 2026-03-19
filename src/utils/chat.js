import {
  collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { compressImage } from "./profile";

/**
 * Genera el ID de chat entre dos usuarios (orden alfabético para consistencia).
 */
export function getDMChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

/**
 * Genera el ID de chat de un grupo.
 */
export function getGroupChatId(groupId) {
  return `group_${groupId}`;
}

/**
 * Suscribe a los mensajes de un chat en tiempo real.
 * @returns función para desuscribirse
 */
export function subscribeToChat(chatId, callback, msgLimit = 50) {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc"),
    limit(msgLimit)
  );
  return onSnapshot(q, snap => {
    const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(msgs);
  });
}

/**
 * Envía un mensaje de texto.
 */
export async function sendMessage(chatId, { uid, displayName, photoURL, text }) {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    uid, displayName,
    photoURL: photoURL || null,
    text:     text.trim(),
    image:    null,
    createdAt: serverTimestamp(),
  });
}

/**
 * Envía una imagen (comprimida a Base64).
 */
export async function sendImage(chatId, { uid, displayName, photoURL, file }) {
  const base64 = await compressImage(file);
  await addDoc(collection(db, "chats", chatId, "messages"), {
    uid, displayName,
    photoURL: photoURL || null,
    text:     "",
    image:    base64,
    createdAt: serverTimestamp(),
  });
}
