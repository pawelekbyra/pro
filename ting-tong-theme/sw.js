const CACHE_NAME = 'ting-tong-cache-v6';

// ✅ Minimalna lista - tylko kluczowe zasoby. Manifest jest dynamiczny, nie cachujemy go.
const ESSENTIAL_URLS = [
  '/',
  'style.css',
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
          console.warn('[SW] ⚠️ No themeUrl, cannot cache essential assets.');
          return Promise.resolve();
        }

        console.log(`[SW] 📁 Theme URL: ${themeUrl}`);

        // Cache każdy URL osobno z resilient error handling
        const cachePromises = ESSENTIAL_URLS.map(url => {
          // ✅ FIX: Poprawnie obsługuj ścieżki absolutne (jak '/') i relatywne
          const fullUrl = url.startsWith('/') ? url : themeUrl + url;
          return cache.add(fullUrl)
            .then(() => console.log(`[SW] ✅ Cached: ${fullUrl}`))
            .catch(err => {
              console.warn(`[SW] ⚠️ Failed to cache ${fullUrl}:`, err.message);
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

// Fetch - Network-first for AJAX/POST, Cache-first for others
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignoruj żądania non-HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Dla żądań non-GET lub zapytań AJAX, zawsze idź do sieci.
  if (request.method !== 'GET' || request.url.includes('admin-ajax.php')) {
    console.log(`[SW] 🌐 Network-only request: ${request.url}`);
    event.respondWith(
      fetch(request).catch(error => {
        console.error(`[SW] ❌ Network-only fetch error for ${request.url}:`, error);
        return new Response('Network error', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
    );
    return;
  }

  // Dla wszystkich innych żądań GET, użyj strategii "Network-first"
  event.respondWith(
    fetch(request) // Spróbuj pobrać z sieci (PRIORYTET)
      .then(networkResponse => {
        // Jeśli sukces, zaktualizuj cache i zwróć odpowiedź z sieci
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jeśli błąd sieci, spróbuj z cache (FALLBACK)
        return caches.match(request);
      })
  );
});