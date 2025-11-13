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

  // Ignoruj żądania non-HTTP/HTTPS, pozwalając im przejść do sieci
  if (!request.url.startsWith('http')) {
    return; // Przeglądarka obsłuży to żądanie domyślnie
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

// ============================================================================
// LISTENERY DLA POWIADOMIEŃ PUSH I ODZNAK (BADGE API)
// ============================================================================

/**
 * Listener zdarzenia 'push'. Wywoływany, gdy serwer wysyła powiadomienie.
 */
self.addEventListener('push', event => {
  console.log('[SW] 📥 Push Received.');

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    data = {
      title: 'Nowe powiadomienie',
      body: 'Otrzymano nowe powiadomienie.',
      badge: 0
    };
  }

  const title = data.title || 'Ting Tong';
  const options = {
    body: data.body || 'Masz nową wiadomość.',
    icon: data.icon || '/assets/icons/icon-192x192.svg',
    badge: data.badge ? '/assets/icons/badge.png' : '', // URL do ikony odznaki
    data: {
      url: self.registration.scope // URL do otwarcia po kliknięciu
    }
  };

  // Ustaw odznakę aplikacji (Badge API)
  if (navigator.setAppBadge && typeof data.badge !== 'undefined') {
    navigator.setAppBadge(data.badge).catch(err => {
      console.error('[SW] Error setting app badge:', err);
    });
  }

  // Wyświetl powiadomienie
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Listener zdarzenia 'notificationclick'. Wywoływany, gdy użytkownik kliknie powiadomienie.
 */
self.addEventListener('notificationclick', event => {
  console.log('[SW] 🖱️ Notification clicked.');
  event.notification.close(); // Zamknij powiadomienie

  // Wyczyść odznakę aplikacji
  if (navigator.clearAppBadge) {
    navigator.clearAppBadge().catch(err => {
      console.error('[SW] Error clearing app badge:', err);
    });
  }

  // Otwórz okno aplikacji lub przejdź do istniejącego
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const urlToOpen = event.notification.data.url || '/';

      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});