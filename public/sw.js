const CACHE_NAME = 'mineralvault-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
];

// Instalar Service Worker y cachear recursos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estrategia: Network First, falling back to cache
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Solo interceptar peticiones del mismo origen (no interceptar Supabase, Google Drive, CDNs)
  if (url.origin !== self.location.origin) return;

  // Ignorar rutas de API, endpoints de autenticación y Hot Module Replacement
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la red funciona y es una respuesta básica válida, clonar y guardar en cache
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si la red falla, intentar buscar en cache
        return caches.match(event.request);
      })
  );
});
