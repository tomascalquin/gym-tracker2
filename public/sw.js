/**
 * sw.js — Service Worker con soporte offline completo
 *
 * Estrategia:
 * - Assets estáticos (JS/CSS/img con hash): Cache-first
 * - Navegación (HTML): Network-first con fallback a index.html cacheado
 * - Firebase/API: Network-only (no se cachea)
 */

const CACHE_VERSION = "gymtracker-v3";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/muscle_front.png",
  "/muscle_back.png",
];

const SKIP_CACHE_ORIGINS = [
  "firebaseio.com",
  "googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "api.anthropic.com",
  "api.groq.com",
];

function shouldSkip(url) {
  return SKIP_CACHE_ORIGINS.some(o => url.hostname.includes(o));
}

function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|ico|webp)$/.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => !k.startsWith(CACHE_VERSION)).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (shouldSkip(url)) return;
  if (url.origin !== location.origin) return;

  if (event.request.mode === "navigate") {
    const hasAuthParams =
      url.search.length > 1 ||
      (url.hash && url.hash.length > 1) ||
      /^(state|code|session_state|scope)=/.test(url.search.slice(1));
    if (hasAuthParams) {
      event.respondWith(fetch(event.request));
      return;
    }
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          if (cached) return cached;
          return caches.match("/index.html");
        })
      )
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Gym Tracker", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data.url || "/",
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data || "/"));
});
