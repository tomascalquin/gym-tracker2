import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

// VAPID key pública de Firebase — la obtienes en:
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
// Por ahora usamos una placeholder — debes reemplazarla
const VAPID_PUBLIC_KEY = "YOUR_VAPID_PUBLIC_KEY";

/**
 * Registra el service worker y solicita permiso de notificaciones.
 * Guarda el token FCM en Firestore para que otros puedan enviarte notifs.
 */
export async function registerPushNotifications(uid) {
  try {
    // Verificar soporte
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push no soportado en este navegador.");
      return false;
    }

    // Registrar SW
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Pedir permiso
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Permiso de notificaciones denegado.");
      return false;
    }

    // Suscribirse al push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Guardar endpoint en Firestore
    await setDoc(doc(db, "push_tokens", uid), {
      uid,
      endpoint:   subscription.endpoint,
      p256dh:     btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("p256dh")))),
      auth:       btoa(String.fromCharCode(...new Uint8Array(subscription.getKey("auth")))),
      updatedAt:  new Date().toISOString(),
    });

    console.log("Push registrado OK");
    return true;
  } catch (err) {
    console.warn("registerPushNotifications error:", err.message);
    return false;
  }
}

/**
 * Registrar solo el service worker (para modo offline, sin push).
 */
export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
    console.log("Service Worker registrado OK");
  } catch (err) {
    console.warn("SW registration error:", err.message);
  }
}

/**
 * Verifica si el usuario ya tiene permiso de notificaciones.
 */
export function hasNotificationPermission() {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Muestra una notificación local (in-app, sin servidor).
 * Funciona aunque la app esté en primer plano.
 */
export function showLocalNotification(title, body) {
  if (!hasNotificationPermission()) return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body,
      icon:    "/icon-192.png",
      badge:   "/icon-192.png",
      vibrate: [100, 50, 100],
    });
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
