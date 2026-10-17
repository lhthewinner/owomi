/**
 * Service Worker pour Asoro PWA.
 * Conforme à la Story O1 & O2 :
 * « L'application s'ouvre sans internet une fois installée »
 */

const CACHE_NAME = "asoro-static-v1";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// 1. Installation : mise en cache des ressources essentielles de l'application
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activation : nettoyage des anciens caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Interception des requêtes : Network-first avec secours sur le cache
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ne pas intercepter les requêtes non-GET ou vers des API tierces
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Requêtes de navigation (pages HTML) : réseau d'abord, repli sur le cache hors ligne
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Met à jour la page en cache pour la prochaine ouverture hors ligne
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          // Hors ligne : renvoie la page d'accueil mise en cache
          return caches.match("/") || caches.match(request);
        })
    );
    return;
  }

  // Fichiers statiques internes (Next.js chunks, images, icônes) : Cache first, repli réseau
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith("/_next/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname === "/manifest.json")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
  }
});
