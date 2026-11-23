// Offline support: precache every local asset on install, serve
// network-first (refreshing the cache) and fall back to the cache offline.
// Bump VERSION when the asset list changes.
const VERSION = 'pocket-blocks-v8';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'styles/base.css',
  'styles/materials.css',
  'styles/effects.css',
  'styles/environments.css',
  'src/main.js',
  'src/core/shapes.js',
  'src/core/rng.js',
  'src/core/rules.js',
  'src/core/generator.js',
  'src/core/generator-rhythm.js',
  'src/core/generator-blast.js',
  'src/core/generator-flow.js',
  'src/core/modes.js',
  'src/core/generators.js',
  'src/core/boardeval.js',
  'src/core/openings.js',
  'src/core/game.js',
  'src/core/settings.js',
  'src/gen/service.js',
  'src/gen/worker.js',
  'src/themes/themes.js',
  'src/audio/engine.js',
  'src/audio/kits.js',
  'src/ui/app.js',
  'src/ui/render.js',
  'src/ui/drag.js',
  'src/ui/input.js',
  'src/ui/effects.js',
  'src/ui/vfx.js',
  'src/ui/vfx-recipes.js',
  'src/ui/environments.js',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' skips the browser's HTTP cache (GitHub Pages allows 10
  // minutes), so a new version never precaches stale copies of old files.
  event.waitUntil(caches.open(VERSION)
    .then((c) => c.addAll(ASSETS.map((url) => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Network-first keeps deployments fresh; the cache answers when offline.
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      try {
        // Revalidate with the server instead of trusting the HTTP cache, so
        // the page, scripts and styles always come from the same deployment.
        const res = await fetch(req, { cache: 'no-cache' });
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      } catch (e) {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        if (req.mode === 'navigate') return (await cache.match('index.html')) || new Response('Offline', { status: 503 });
        return new Response('', { status: 504 });
      }
    }),
  );
});
