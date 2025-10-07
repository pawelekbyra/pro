const CACHE_NAME = 'ting-tong-cache-v3'; // Bump version

// Instalacja Service Workera
self.addEventListener('install', event => {
  event.waitUntil(
    self.skipWaiting().then(() => { // Force activation
      return caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Opened cache');

        // ✅ FIX: Odczytaj themeUrl z parametru zapytania URL serwisu workera
        const urlParams = new URL(self.location).searchParams;
        const themeUrl = urlParams.get('themeUrl');

        if (!themeUrl) {
          console.error('[SW] Theme URL is missing from query parameters. Cannot cache assets.');
          return Promise.resolve(); // Nie blokuj instalacji, ale nic nie buforuj
        }

        console.log(`[SW] Using themeUrl from query param: ${themeUrl}`);

        const relativeUrls = [
          '/',
          'style.css',
          'js/app.js',
          'js/modules/api.js',
          'js/modules/config.js',
          'js/modules/handlers.js',
          'js/modules/ui.js',
          'js/modules/utils.js',
          'js/modules/state.js',
          'js/modules/pwa.js',
          'js/modules/notifications.js',
          'js/modules/account.js',
          'manifest.json'
        ];

        // Zbuduj pełne ścieżki URL do buforowania
        const urlsToCache = relativeUrls.map(relativeUrl => {
            // Dla głównego URL (start_url) użyj themeUrl bez dodawania czegokolwiek
            if (relativeUrl === '/') {
                return themeUrl;
            }
            // Dla pozostałych, połącz themeUrl z relatywną ścieżką
            return themeUrl + relativeUrl;
        });

        // Dodaj zewnętrzne URL-e bez modyfikacji
        urlsToCache.push('https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.js');
        urlsToCache.push('https://cdn.jsdelivr.net/npm/swiper@12.0.2/swiper-bundle.min.css');

        console.log('[SW] Caching assets:', urlsToCache);

        // Użyj indywidualnych żądań, aby uniknąć błędu przy pojedynczym zasobie
        const promises = urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.error(`[SW] Failed to cache ${url}:`, err);
          });
        });

        return Promise.all(promises);
      });
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