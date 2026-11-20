// Repeat visits load instantly: built JS/CSS (content-hashed, never change) and textures come straight
// from the cache. Pages and data (tle.txt) always go to the network first, so deploys show up right away.
const CACHE = 'zoomverse-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  const immutable = url.pathname.includes('/assets/'), texture = url.pathname.includes('/textures/');
  if (!immutable && !texture) return;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(request);
    // textures aren't hashed: serve the cached copy, refresh it in the background
    const fresh = fetch(request).then((res) => { if (res.ok) cache.put(request, res.clone()); return res; });
    if (hit) { if (texture) e.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh;
  }));
});
