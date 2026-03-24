/**
 * PWA Install helper.
 * Captura el evento beforeinstallprompt para mostrar
 * un botón de instalación nativo dentro de la app.
 */

let deferredPrompt = null;

export function initPWAInstall() {
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export function canInstall() {
  return !!deferredPrompt;
}

export async function installPWA() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === "accepted";
}

export function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}
