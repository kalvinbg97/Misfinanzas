// Cambia este número cada vez que subas una versión nueva
const CACHE = 'misfinanzas-v3';
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

  // Página: abre al instante la copia guardada y actualiza en segundo plano.
  // Si no hay copia, usa la red con un límite de 6 s para no quedarse cargando.
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async cache => {
      const cached = await cache.match('./index.html');
      const network = fetch(req, { cache: 'no-store' }).then(res => {
        if (res.ok) cache.put('./index.html', res.clone());
        return res;
      });
      if (cached) {
        e.waitUntil(network.catch(() => {}));
        return cached;
      }
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000));
      return Promise.race([network, timeout]).catch(() =>
        new Response('<meta name="viewport" content="width=device-width"><body style="background:#0d0f14;color:#e8eaf0;font-family:sans-serif;padding:24px">Sin conexión. Cierra y vuelve a abrir la app.</body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
    }));
    return;
  }
  // Resto: primero copia local
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
