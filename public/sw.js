/**
 * sw.js — Service Worker con soporte offline completo para iOS y Android
 *
 * Este archivo usa la estrategia "injectManifest" de vite-plugin-pwa:
 * - En build, el plugin reemplaza self.__WB_MANIFEST con la lista exacta
 *   de todos los assets generados por Vite (con sus hashes).
 * - Eso garantiza que iOS cachee TODOS los JS/CSS antes de necesitarlos.
 *
 * Estrategias:
 *   - Precache (todos los assets Vite): Cache-first, siempre disponible offline
 *   - Navegación HTML: NetworkFirst con fallback al index.html en cache
 *   - Firebase / APIs externas: Network-only, nunca se cachea
 */

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, NavigationRoute }                                    from "workbox-routing";
import { NetworkFirst, CacheFirst, NetworkOnly }                             from "workbox-strategies";
import { ExpirationPlugin }                                                  from "workbox-expiration";

// ── 1. Precache de todos los assets de Vite ─────────────────────────────────
// El plugin reemplaza self.__WB_MANIFEST en build time con algo como:
// [{ url: "/assets/index-Bx3kL9mR.js", revision: null }, ...]
// En dev, este array está vacío (el plugin lo omite).
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ── 2. Rutas SPA — sirve index.html para cualquier navegación ───────────────
const navHandler = createHandlerBoundToURL("/index.html");
const navRoute   = new NavigationRoute(navHandler, {
  // No interceptar rutas que sean assets o auth callbacks
  denylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
});
registerRoute(navRoute);

// ── 3. Firebase y APIs — siempre online, nunca cachear ──────────────────────
const NETWORK_ONLY_PATTERNS = [
  /firebaseio\.com/,
  /googleapis\.com/,
  /identitytoolkit\.googleapis\.com/,
  /securetoken\.googleapis\.com/,
  /api\.anthropic\.com/,
  /api\.groq\.com/,
  /fonts\.googleapis\.com/,   // las fonts ya se precachean si están en build,
  /fonts\.gstatic\.com/,      // pero si vienen de CDN en runtime → no cachear
];

NETWORK_ONLY_PATTERNS.forEach(pattern => {
  registerRoute(({ url }) => pattern.test(url.href), new NetworkOnly());
});

// ── 4. Imágenes runtime (no precacheadas) — CacheFirst 30 días ──────────────
registerRoute(
  ({ request, url }) =>
    request.destination === "image" &&
    url.origin === location.origin,
  new CacheFirst({
    cacheName: "gymtracker-images-v1",
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  })
);

// ── 5. Push Notifications ────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Gym Tracker", {
      body:    data.body  || "",
      icon:    "/icon-192.png",
      badge:   "/icon-192.png",
      data:    data.url   || "/",
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data || "/"));
});
