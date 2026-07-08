/* ============================================================
   PicklePoint — Service Worker
   Strategy:
     - Precache the app shell (local files) on install.
     - Local requests: cache-first, fall back to network.
     - CDN/font requests: stale-while-revalidate (works offline
       once cached, refreshes in the background when online).
   Bump CACHE_VERSION whenever you change index.html or assets
   so returning users get the update.
   ============================================================ */

const CACHE_VERSION = 'picklepoint-v1';

// Local app-shell files (relative to the service worker's scope).
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// Cross-origin assets we want available offline after first load.
const RUNTIME_HOSTS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isRuntimeHost = RUNTIME_HOSTS.some((host) => request.url.startsWith(host));

  // Local files: cache-first (fast, offline-ready).
  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
            return response;
          })
          .catch(() => caches.match('./index.html')); // offline navigation fallback
      })
    );
    return;
  }

  // CDN & fonts: stale-while-revalidate.
  if (isRuntimeHost) {
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request)
            .then((response) => { cache.put(request, response.clone()); return response; })
            .catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});
