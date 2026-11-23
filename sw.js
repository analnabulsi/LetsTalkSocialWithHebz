/* Service worker: makes the site installable and fast, with an offline page.
   Bump VERSION whenever you change CSS/JS so visitors get the new files. */
var VERSION = 'lts-v1';
var CORE = [
  './', 'index.html', 'event.html', 'legal.html', 'offline.html',
  'css/styles.css', 'js/main.js', 'js/map.js', 'js/event.js', 'js/gate.js',
  'manifest.webmanifest', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/favicon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('lts-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // fonts, WhatsApp, Stripe etc. go straight to the network

  // Pages and data: network first (always fresh), cache as fallback.
  if (req.mode === 'navigate' || url.pathname.indexOf('/data/') !== -1) {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      if (res.ok) caches.open(VERSION).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: req.mode === 'navigate' && url.pathname.slice(-10) === 'event.html' }).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('offline.html') : Response.error());
      });
    }));
    return;
  }

  // CSS, JS, images: cache first, then network.
  e.respondWith(caches.match(req).then(function (hit) {
    return hit || fetch(req).then(function (res) {
      var copy = res.clone();
      if (res.ok) caches.open(VERSION).then(function (c) { c.put(req, copy); });
      return res;
    });
  }));
});
