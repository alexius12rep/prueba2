// sw.js
const CACHE_NAME = 'louvle-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logosinfondo.png', // Corrected path if it's in the root
  '/googleimg.png',   // Corrected path if it's in the root
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js',
  'https://fonts.googleapis.com/css2?family=Audiowide&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  '/googleimg.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache abierto');
        // Use Promise.allSettled to allow some assets to fail without failing the whole install
        // This is more robust for external resources.
        return Promise.allSettled(
          ASSETS_TO_CACHE.map(url => {
            return fetch(url).then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
              }
              return cache.put(url, response);
            });
          })
        ).then(results => {
          results.forEach(result => {
            if (result.status === 'rejected') {
              console.warn(`Fallo al añadir asset al cache: ${result.reason}`);
            }
          });
          // If you want the install to fail if ANY asset fails, revert to cache.addAll(ASSETS_TO_CACHE)
          // If you want it to succeed even if some fail, this is better.
          // For critical assets, ensure they are always available.
        });
      })
  );
});

// Estrategia de caché: Cache First, fallback a network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devuelve la respuesta en caché o realiza la petición
        return response || fetch(event.request);
      })
  );
});

// Limpieza de cachés antiguos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logosinfondo.png',
    badge: '/logosinfondo.png'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});