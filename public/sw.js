const CACHE_NAME = "gymtracker-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Instalar — cachear assets estáticos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activar — limpiar caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first, cache fallback
self.addEventListener("fetch", (event) => {
  // Solo interceptar GET del mismo origen
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;

  // OAuth / Firebase Auth: la vuelta trae query o hash; no usar caché del SW (iOS Safari rompe sesión)
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

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cachear respuesta válida
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red — usar cache
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback a index.html para rutas SPA
          return caches.match("/index.html");
        });
      })
  );
});

// ── Push Notifications ─────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Gym Tracker", {
      body:  data.body  || "",
      icon:  "/icon-192.png",
      badge: "/icon-192.png",
      data:  data.url || "/",
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data || "/")
  );
});
