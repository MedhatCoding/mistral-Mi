/* mistral-Mi — Service Worker: تثبيت كتطبيق حقيقي + شغل أوفلاين (نسخة Next.js) */
const SAHMY_CACHE = "mistral-mi-next-v5.00";
const SAHMY_ASSETS = ["./", "./app.html", "./manifest.json", "./icon.svg"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(SAHMY_CACHE).then(function (c) { return c.addAll(SAHMY_ASSETS) }).then(function () { return self.skipWaiting() }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== SAHMY_CACHE }).map(function (k) { return caches.delete(k) })) }).then(function () { return self.clients.claim() }));
});
self.addEventListener("fetch", function (e) {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then(function (r) {
        const cp = r.clone();
        caches.open(SAHMY_CACHE).then(function (c) { c.put(e.request, cp) });
        return r;
      }).catch(function () { return caches.match("./app.html") })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (m) {
      return m || fetch(e.request).then(function (r) {
        const cp = r.clone();
        caches.open(SAHMY_CACHE).then(function (c) { c.put(e.request, cp) });
        return r;
      }).catch(function () { return m });
    })
  );
});