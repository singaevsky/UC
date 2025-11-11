// file: public/sw.js
/* Service Worker – кеширует GET‑запросы к черновикам (offline‑режим) */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method === 'GET' && url.pathname.startsWith('/api/cake/draft')) {
    event.respondWith(
      caches.open('draft-cache-v1').then(async cache => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then(response => {
          cache.put(event.request, response.clone());
          return response;
        });
        return cached || fetchPromise;
      })
    );
  }
});
