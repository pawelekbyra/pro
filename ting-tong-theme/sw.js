const CACHE_NAME = 'ting-tong-cache-v7'; // Inkrementacja wersji, aby wymusić aktualizację

const ESSENTIAL_URLS = [
  '/',
  'style.css',
];

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

        const urlsToCache = ESSENTIAL_URLS.map(url => url === '/' ? themeUrl + url : themeUrl + url.substring(1));

        const cachePromises = urlsToCache.map(fullUrl => {
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

self.addEventListener('fetch', event => {
  const { request } = event;

  if (!request.url.startsWith('http')) {
    return;
  }

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

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
      .catch(error => {
        console.error(`[SW] ❌ Fetch error for ${request.url}:`, error);
        return caches.match('/');
      })
  );
});