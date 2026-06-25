/* Service worker — cache hors-ligne simple (cache-first) */
var CACHE = 'bjtrainer-v3';
var ASSETS = ['./','./index.html','./styles.css','./strategy.js','./app.js',
  './manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(function (r) {
    return r || fetch(e.request).then(function (resp) {
      var copy = resp.clone();
      caches.open(CACHE).then(function (c) { try { c.put(e.request, copy); } catch (x) {} });
      return resp;
    }).catch(function () { return caches.match('./index.html'); });
  }));
});
