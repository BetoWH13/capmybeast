// service-worker.js for CapMyBeast - Offline Support

const CACHE_NAME = 'capmybeast-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/beasts.json',
  '/assets/beasts/beast-1.svg',
  '/assets/beasts/beast-2.svg',
  '/assets/beasts/beast-3.svg',
  '/assets/beasts/beast-4.svg',
  '/assets/beasts/beast-5.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

