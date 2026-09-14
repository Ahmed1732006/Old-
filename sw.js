/* IN THE VOID — Offline-first service worker */
const CACHE_NAME = 'in-the-void-offline-v2';
const APP_SHELL = [
  './',
  './index.html',
  './2.html',
  './app/index.html',
  './manifest.webmanifest',
  './manifest.json',
  './sw.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh && (fresh.ok || fresh.type === 'opaque')) {
        const cache = await caches.open(CACHE_NAME);
        try { await cache.put(req, fresh.clone()); } catch (_) {}
      }
      return fresh;
    } catch (_) {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const fallback = await caches.match('./2.html') || await caches.match('./index.html');
        if (fallback) return fallback;
      }
      return new Response('', {status: 503, statusText: 'Offline'});
    }
  })());
});
