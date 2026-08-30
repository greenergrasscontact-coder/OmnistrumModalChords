/* Modal Chords service worker
   Bump VERSION whenever you change index.html — that's what forces phones
   to pick up the new build instead of serving the cached one forever. */
const VERSION = 'modalchords-v7';
const CORE_CACHE = VERSION + '-core';
const FONT_CACHE = VERSION + '-fonts';
const KEEP = [CORE_CACHE, FONT_CACHE];

/* index.html now bundles React itself, so the only cross-origin request left
   is the Google Fonts stylesheet (and the font files it pulls in). Everything
   else the app needs is same-origin. */
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
      .then(function (cache) {
        // addAll() is all-or-nothing: one 404 and the whole install fails and
        // the worker never activates. Cache entries individually so a missing
        // icon can't take the app down.
        return Promise.all(CORE.map(function (url) {
          return cache.add(url).catch(function () { return null; });
        }));
      })
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

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Never touch blob: or data: URLs — the app uses those for MIDI export and
  // for saving/opening project files.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (url.origin === self.location.origin) {
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

  // Google Fonts: cache first, stashing a copy the first time it loads. The
  // app has full font fallbacks, so if this never succeeds it still looks
  // right — it just uses system faces instead.
  event.respondWith(
    caches.open(FONT_CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          try { cache.put(req, res.clone()); } catch (e) {}
          return res;
        }).catch(function () {
          return new Response('', { status: 504, statusText: 'offline' });
        });
      });
    })
  );
});
