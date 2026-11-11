// NASS LASU WebApp: speed and offline helper.
//  - Pages: always fetched fresh when online; the last copy is used if the phone is offline.
//  - Built files (/assets/...): kept after the first visit, so repeat visits load faster and use less data.
//  - Other files on this site (logo, photos): shown from the saved copy at once and refreshed quietly.
//  - Never touched: the chatbot and emergency alerts (/api/), Vercel statistics, Firebase and any other website.
const STATIC = 'nass-static-v1';
const IMAGES = 'nass-images-v1';
const MAX_IMAGES = 80;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC, IMAGES];
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Firebase, Google fonts, Unsplash... are left alone
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_vercel/')) return;

  // Pages
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          if (res.ok) (await caches.open(STATIC)).put('/', res.clone());
          return res;
        } catch (err) {
          const cached = await (await caches.open(STATIC)).match('/');
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Built files have a new name every time the site is rebuilt, so they are safe to keep
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })()
    );
    return;
  }

  // Photos, logos and icons
  if (/\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGES);
        const hit = await cache.match(req);
        const refresh = fetch(req)
          .then((res) => {
            if (res.ok) {
              cache.put(req, res.clone());
              trim(IMAGES, MAX_IMAGES);
            }
            return res;
          })
          .catch(() => hit);
        return hit || refresh;
      })()
    );
  }
});
