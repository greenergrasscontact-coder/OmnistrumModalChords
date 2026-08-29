/* Modal Chords service worker
   Bump VERSION whenever you change index.html — that's what forces phones
   to pick up the new build instead of serving the cached one forever. */
const VERSION = 'modalchords-v4';
const CORE_CACHE = VERSION + '-core';
const CDN_CACHE = VERSION + '-cdn';
const KEEP = [CORE_CACHE, CDN_CACHE];

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CORE_CACHE)
      .then(function (cache) { return cache.addAll(CORE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return KEEP.indexOf(k) === -1 ? caches.delete(k) : null;
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var sameOrigin = new URL(req.url).origin === self.location.origin;

  if (sameOrigin) {
    // Network first for the page itself, so a fresh deploy shows up when
    // online; fall back to the cached copy when there's no signal.
    if (req.mode === 'navigate') {
      event.respondWith(
        fetch(req)
          .then(function (res) {
            var copy = res.clone();
            caches.open(CORE_CACHE).then(function (c) { c.put(req, copy); });
            return res;
          })
          .catch(function () {
            return caches.match(req).then(function (hit) {
              return hit || caches.match('./index.html');
            });
          })
      );
      return;
    }
    // Icons, manifest: cache first.
    event.respondWith(
      caches.match(req).then(function (hit) { return hit || fetch(req); })
    );
    return;
  }

  // Cross-origin (Google Fonts, React from unpkg): cache first, and stash a
  // copy the first time it loads successfully. After one online visit these
  // are available offline.
  event.respondWith(
    caches.open(CDN_CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          try { cache.put(req, res.clone()); } catch (e) {}
          return res;
        });
      });
    })
  );
});
