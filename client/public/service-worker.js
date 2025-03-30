// Service Worker for Foodtopia PWA
const CACHE_NAME = 'foodtopia-v2';

// Get the base path from the service worker location
const getBasePath = () => {
  const scope = self.registration.scope;
  return new URL(scope).pathname;
};

// Assets to cache - will be prefixed with the base path at runtime
const urlsToCache = [
  '', // Root of the app
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

// Install the service worker and cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const basePath = getBasePath();
      // Add base path to all URLs
      const urlsToFetch = urlsToCache.map(url => basePath + url);
      return cache.addAll(urlsToFetch);
    })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Intercept fetch requests and serve from cache if available
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the response from cache
      if (response) {
        return response;
      }

      // Clone the request because it's a one-time use stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response because it's a one-time use stream
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Don't cache API requests or other dynamic content
          if (!event.request.url.includes('/api/')) {
            cache.put(event.request, responseToCache);
          }
        });

        return response;
      });
    })
  );
});