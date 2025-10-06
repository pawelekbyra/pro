const CACHE_NAME = 'ting-tong-cache-v1';
const urlsToCache = [
  '/',
  '/index.php',
  '/style.css',
  '/js/app.js',
  '/js/modules/api.js',
  '/js/modules/config.js',
  '/js/modules/handlers.js',
  '/js/modules/ui.js',
  '/js/modules/utils.js',
  '/js/modules/state.js',
  '/js/modules/pwa.js',
  '/js/modules/notifications.js',
  '/js/modules/account.js',
  'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.js',
  'https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.css',
  '/manifest.json'
];

// Instalacja Service Workera
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Aktywacja Service Workera
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Przechwytywanie żądań sieciowych
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Zwróć z cache lub pobierz z sieci
        return response || fetch(event.request);
      })
  );
});