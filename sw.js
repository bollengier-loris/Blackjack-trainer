/* Service worker — réseau d'abord pour le HTML, "stale-while-revalidate" pour le reste.
   Permet aux mises à jour de se propager automatiquement en ligne, tout en gardant le hors-ligne. */
var CACHE = 'bjtrainer-v6';
var ASSETS = ['./','./index.html','./styles.css','./strategy.js','./app.js',
  './manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  // HTML / navigation : réseau d'abord, repli sur le cache hors-ligne
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { try { c.put(req, copy); } catch (x) {} });
        return resp;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }

  // CSS / JS / images : on sert le cache tout de suite, et on rafraîchit en arrière-plan
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { try { c.put(req, copy); } catch (x) {} });
        return resp;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
