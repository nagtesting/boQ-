// sw.js — BOQ Capital Cost Estimator v5 Service Worker
// Provides offline capability for field engineers at remote sites

const CACHE_NAME  = 'boq-v5-cache-v1';
const CACHE_PAGES = [
  '/boq-capital-cost-estimator/',
  '/boq-capital-cost-estimator/index.html',
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap',
];

// On install — pre-cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(CACHE_PAGES).catch(e => {
        console.log('[SW] Pre-cache partial failure (OK):', e.message);
      });
    }).then(() => self.skipWaiting())
  );
});

// On activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   - API calls  → Network first, fall back to cached response (stale-while-revalidate)
//   - HTML/fonts → Cache first, update in background
//   - Everything else → Network first with cache fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // API: /api/boq — network first, cache on success
  if (url.pathname.startsWith('/api/boq')) {
    event.respondWith(
      fetch(event.request.clone())
        .then(response => {
          // Only cache successful GET requests (live data)
          if (response.ok && event.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: return cached API response if available
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            // For POST calc requests, return a structured error so the client knows why
            if (event.request.method === 'POST') {
              return new Response(JSON.stringify({
                ok: false, offline: true,
                error: 'Offline — calculation requires API connection. Results shown use cached data only.'
              }), { headers: { 'Content-Type': 'application/json' } });
            }
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // HTML page — cache first, background update
  if (url.pathname.includes('/boq-capital-cost-estimator')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Google Fonts — cache aggressively (rarely change)
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
