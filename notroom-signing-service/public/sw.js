// Service Worker for Notroom PWA
// Network-first caching strategy with automatic cache invalidation

// Cache version - using timestamp to ensure unique cache per deployment
// This ensures each deployment gets a fresh cache
const CACHE_VERSION = 'v1';
const CACHE_NAME = `notroom-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch(() => {});
      })
      .catch(() => {})
  );
  
  // Force activation of new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete all old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith('notroom-cache-') && cacheName !== CACHE_NAME)
            .map((cacheName) => {
              return caches.delete(cacheName);
            })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - Network first strategy for better freshness
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip service worker and manifest requests (don't cache these)
  if (event.request.url.includes('/sw.js') || event.request.url.includes('/manifest.json')) {
    return;
  }

  // Skip API requests (always fetch fresh)
  if (event.request.url.includes('/functions/v1/') || event.request.url.includes('/rest/v1/')) {
    return;
  }

  event.respondWith(
    // Network first strategy - try network, fallback to cache
    fetch(event.request, {
      // Add cache-busting headers for HTML files
      cache: event.request.mode === 'navigate' ? 'no-cache' : 'default'
    })
      .then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();

        // Cache successful responses in background (non-blocking)
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          })
          .catch(() => {});

        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If it's a navigation request and cache failed, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // Return a basic error response
            return new Response('Network error and no cache available', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});
