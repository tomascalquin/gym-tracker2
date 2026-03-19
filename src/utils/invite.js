import { sendFriendRequest, findUserByCode } from "./friends";

const INVITE_KEY = "gymtracker_pending_invite";

/**
 * Genera el link de invitación del usuario.
 */
export function getInviteLink(friendCode) {
  return `${window.location.origin}?invite=${friendCode}`;
}

/**
 * Copia el link de invitación al portapapeles.
 */
export async function copyInviteLink(friendCode) {
  const link = getInviteLink(friendCode);
  try {
    await navigator.clipboard.writeText(link);
    return true;
  } catch {
    return false;
  }
}

/**
 * Revisa si hay un código de invitación en la URL y lo guarda.
 * Se llama al cargar la app.
 */
export function checkInviteParam() {
  const params = new URLSearchParams(window.location.search);
  const code   = params.get("invite");
  if (code) {
    localStorage.setItem(INVITE_KEY, code);
    // Limpiar la URL sin recargar
    window.history.replaceState({}, "", window.location.pathname);
  }
}

/**
 * Si hay una invitación pendiente después de registrarse,
 * envía la solicitud de amistad automáticamente.
 */
export async function processPendingInvite(myUid) {
  const code = localStorage.getItem(INVITE_KEY);
  if (!code) return null;

  try {
    const inviter = await findUserByCode(code);
    if (inviter && inviter.uid !== myUid) {
      await sendFriendRequest(myUid, inviter.uid);
      localStorage.removeItem(INVITE_KEY);
      return inviter;
    }
  } catch (err) {
    console.warn("processPendingInvite error:", err.message);
  }
  localStorage.removeItem(INVITE_KEY);
  return null;
}
