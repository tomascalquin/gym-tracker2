import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db } from "./firebase";
import { auth } from "./firebase";

/**
 * Actualiza la foto de perfil del usuario.
 * Guarda la URL en Firebase Auth y en user_public.
 * @param {string} uid
 * @param {string} photoURL - URL pública de la imagen
 */
export async function updateProfilePhoto(uid, photoURL) {
  // Actualizar en Firebase Auth
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL });
  }
  // Actualizar en user_public para que amigos la vean
  await updateDoc(doc(db, "user_public", uid), { photoURL });
}

/**
 * Actualiza el nombre de display del usuario.
 */
export async function updateDisplayName(uid, displayName) {
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName });
  }
  await updateDoc(doc(db, "user_public", uid), { displayName });
}
