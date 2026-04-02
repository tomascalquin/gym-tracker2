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
  confirmPasswordReset,
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
  return platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

function isIOSBrowser() {
  if (isAppleMobileOrTablet()) return true;
  return /CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent || "");
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export async function loginWithGoogle() {
  const isPWA = isStandaloneDisplay();
  const isIOS = isIOSBrowser();

  // Solo usamos Redirect en Safari móvil sin instalar. 
  // En Web, PC y PWA usamos Popup.
  const useRedirect = isIOS && !isPWA;

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
export async function confirmNewPassword(code, newPassword) {
  await confirmPasswordReset(auth, code, newPassword);
}