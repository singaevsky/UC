// file: public/sw.js
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/cake/draft')) {
    event.respondWith(
      caches.open('draft-cache').then((cache) =>
        cache.match(event.request).then((response) => response || fetch(event.request))
      )
    );
  }
});
