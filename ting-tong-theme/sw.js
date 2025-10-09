const CACHE_NAME = 'ting-tong-cache-v5';

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

// Fetch - Network for AJAX/POST, Cache-first for others
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignoruj żądania non-HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Zawsze używaj sieci dla żądań AJAX do WordPressa i dla wszystkich żądań POST
  if (request.url.includes('admin-ajax.php') || request.method !== 'GET') {
    console.log(`[SW] 🌐 Network request (AJAX/POST): ${request.url}`);
    // Przekaż żądanie do sieci, nie używaj cache
    return;
  }

  // Dla pozostałych żądań GET, użyj strategii "cache-first"
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log(`[SW] 💾 Serving from cache: ${request.url}`);
          return cachedResponse;
        }

        console.log(`[SW] ☁️ Fetching from network: ${request.url}`);
        return fetch(request).then(networkResponse => {
          // Klonuj odpowiedź i zapisz w cache, jeśli jest poprawna
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              console.log(`[SW]  caching new asset: ${request.url}`);
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
      .catch(error => {
        console.error(`[SW] ❌ Fetch error for ${request.url}:`, error);
        // Zwróć prostą odpowiedź błędu sieciowego
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});