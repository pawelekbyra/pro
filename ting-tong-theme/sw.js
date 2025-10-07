const CACHE_NAME = 'ting-tong-cache-v4';

// ✅ Minimalna lista - tylko kluczowe zasoby
const ESSENTIAL_URLS = [
  'style.css',
  'manifest.json'
];

// Instalacja
self.addEventListener('install', event => {
  console.log('[SW] 🔧 Installing Service Worker...');

  event.waitUntil(
    self.skipWaiting().then(() => {
      return caches.open(CACHE_NAME).then(cache => {
        const urlParams = new URL(self.location).searchParams;
        const themeUrl = urlParams.get('themeUrl') || '';

        if (!themeUrl) {
          console.warn('[SW] ⚠️ No themeUrl - minimal cache only');
          return cache.add('manifest.json').catch(err => {
            console.warn('[SW] Could not cache manifest:', err.message);
          });
        }

        console.log(`[SW] 📁 Theme URL: ${themeUrl}`);

        // Cache każdy URL osobno z resilient error handling
        const cachePromises = ESSENTIAL_URLS.map(url => {
          const fullUrl = themeUrl + url;
          return cache.add(fullUrl)
            .then(() => console.log(`[SW] ✅ Cached: ${url}`))
            .catch(err => {
              console.warn(`[SW] ⚠️ Failed to cache ${url}:`, err.message);
              // Nie blokuj instalacji
            });
        });

        return Promise.all(cachePromises)
          .then(() => console.log('[SW] ✅ Installation complete'));
      });
    })
  );
});

// Aktywacja
self.addEventListener('activate', event => {
  console.log('[SW] ⚡ Activating...');

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] 🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      ).then(() => self.clients.claim());
    }).then(() => {
      console.log('[SW] ✅ Service Worker activated and ready');
    })
  );
});

// Fetch - cache-first strategy
self.addEventListener('fetch', event => {
  // Ignoruj non-GET requests
  if (event.request.method !== 'GET') return;

  // Ignoruj chrome-extension i inne non-http(s)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log(`[SW] 💾 Serving from cache: ${event.request.url}`);
          return response;
        }

        return fetch(event.request).then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(err => {
        console.error('[SW] ❌ Fetch error:', err);
        // Możesz zwrócić offline page tutaj
        return new Response('Offline', { status: 503 });
      })
  );
});