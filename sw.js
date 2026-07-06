// Service worker del Museum Botellitas Rosario
// Estrategia: red primero para la página (así las actualizaciones llegan solas),
// caché primero para íconos y archivos fijos. Sin internet, sirve la última versión guardada.
const CACHE = "mbr-v3";
const APP = "./index.html";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll([APP, "./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Navegación (abrir la app): red primero, caché si no hay conexión
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(APP, copia));
        return r;
      }).catch(() => caches.match(APP))
    );
    return;
  }

  // Resto de archivos del mismo sitio: caché primero, red de respaldo
  e.respondWith(
    caches.match(req).then(hit =>
      hit || fetch(req).then(r => {
        if (new URL(req.url).origin === location.origin) {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(req, copia));
        }
        return r;
      })
    )
  );
});
