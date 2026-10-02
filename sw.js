/* Offline support: app shell is precached, recipe photos are cached on first use
   and warmed in the background after install. */
const VERSION = 'v1.4.3';
const SHELL = `shell-${VERSION}`;
const IMAGES = 'images-v1';
const SHELL_FILES = ['./', 'index.html', 'styles.css', 'app.js', 'cloud.js', 'config.js', 'recipes.json', 'manifest.webmanifest',
  'icons/logo.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== SHELL && k !== IMAGES) await caches.delete(k);
    await self.clients.claim();
    warmImages();
  })());
});

async function warmImages() {
  try {
    const res = await caches.match('recipes.json') || await fetch('recipes.json');
    const recipes = await res.clone().json();
    const cache = await caches.open(IMAGES);
    for (const r of recipes) for (const src of r.images || []) {
      if (!(await cache.match(src))) { try { await cache.add(src); } catch (e) {} }
    }
  } catch (e) {}
}

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/img/')) {
    e.respondWith(caches.open(IMAGES).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  // App shell: network first (so updates arrive), fall back to cache offline.
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) caches.open(SHELL).then(c => c.put(e.request, res.clone()));
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
