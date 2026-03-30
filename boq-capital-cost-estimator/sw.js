// sw.js — BOQ Capital Cost Estimator v5 Service Worker
// Provides offline capability for field engineers at remote sites

const CACHE_NAME  = 'boq-v5-cache-v2';  // v2: fix AbortSignal DataCloneError
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
  // NOTE: We reconstruct the request instead of clone() to avoid DataCloneError.
  // AbortSignal (attached by the client's apiPost timeout) is NOT structured-cloneable.
  // The SW manages its own fetch — no signal needed here.
  if (url.pathname.startsWith('/api/boq')) {
    event.respondWith(
      (async () => {
        try {
          // Reconstruct request body without AbortSignal (clone() would throw DataCloneError)
          let safeRequest;
          if (event.request.method === 'POST') {
            const body = await event.request.text();
            safeRequest = new Request(event.request.url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: body,
            });
          } else {
            safeRequest = new Request(event.request.url, {
              method: event.request.method,
              headers: event.request.headers,
            });
          }
          const response = await fetch(safeRequest);
          // Only cache successful GET responses
          if (response.ok && event.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request.url, clone));
          }
          return response;
        } catch (err) {
          // Offline fallback — return cached response or structured error
          const cached = await caches.match(event.request.url);
          if (cached) return cached;
          if (event.request.method === 'POST') {
            return new Response(JSON.stringify({
              ok: false, offline: true,
              error: 'Offline — calculation requires API connection.'
            }), { headers: { 'Content-Type': 'application/json' } });
          }
          return new Response('Offline', { status: 503 });
        }
      })()
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
