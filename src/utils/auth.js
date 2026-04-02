import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export async function registerWithEmail(email, password, displayName) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  return credential.user;
}

export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

function isAppleMobileOrTablet() {
  const ua = navigator.userAgent || "";
  if (/iP(hone|ad|od)/i.test(ua)) return true;
  const platform = navigator.platform || "";
  if (platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
  return false;
}

function isIOSBrowser() {
  if (isAppleMobileOrTablet()) return true;
  // Chrome/Firefox/Edge en iPhone usan WebKit; el UA suele incluir CriOS/FxiOS
  return /CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent || "");
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

/**
 * Popup de Google suele fallar en iOS (ITP, ventanas, PWA). Redirect es el camino estable.
 * En Android escritorio/móvil el popup suele ir bien.
 */
export async function loginWithGoogle() {
  const useRedirect = isIOSBrowser() || isStandaloneDisplay();

  if (useRedirect) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function checkRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    return { user: result?.user || null, error: null };
  } catch (err) {
    console.warn("checkRedirectResult:", err.code, err.message);
    return { user: null, error: err };
  }
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}
