// Cambia este número cada vez que subas una versión nueva
const CACHE = 'misfinanzas-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
  './fonts/syne-400.woff2', './fonts/syne-600.woff2', './fonts/syne-700.woff2', './fonts/syne-800.woff2',
  './fonts/dmmono-400.woff2', './fonts/dmmono-500.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Página: primero red (para recibir actualizaciones), si no hay internet usa la copia
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  // Resto: primero copia local
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
