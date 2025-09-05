self.addEventListener('install', (event) => {
  // Perform install steps
});

self.addEventListener('activate', (event) => {
  // Perform activate steps
});

self.addEventListener('fetch', (event) => {
  // This is required to make the app installable.
  // We are not caching anything in this version.
  event.respondWith(fetch(event.request));
});
