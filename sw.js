const CACHE_NAME = 'tictactoe-v1';
const ASSETS_TO_CACHE = [
  'index.html',
  'style.css',
  'app.js',
  'firebase.js'
];

// Install Service Worker and cache essential UI assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Network-first falling back to cache strategy for reliable real-time database loads
self.addEventListener('fetch', event => {
  // Only cache standard web GET requests (skips Firebase internal sockets)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});