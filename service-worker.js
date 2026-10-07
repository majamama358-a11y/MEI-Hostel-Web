// Mahendra Hostel - Service Worker (PWA Offline Support)
const CACHE_NAME = 'mei-hostel-v1.4';
const STATIC_ASSETS = [
  './',
  './index.html',
  './login.html',
  './owner-panel.html',
  './admin-panel.html',
  './dashboard.html',
  './profile.html',
  './request.html',
  './pass-timing.html',
  './food.html',
  './attendance.html',
  './emergency.html',
  './parcel.html',
  './change-password.html',
  './staff-dashboard.html',
  './manifest.json',
  './css/style.css',
  './css/responsive.css',
  './js/firebase.js',
  './js/utils.js',
  './js/auth.js',
  './assets/icons/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some assets failed to precache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event - clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first for HTML, Cache first for assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests or Firebase Realtime DB websockets
  if (req.method !== 'GET' || url.protocol.startsWith('ws') || url.hostname.includes('firebaseio.com')) {
    return;
  }

  // HTML navigation: Stale-While-Revalidate or Network first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./dashboard.html') || caches.match('./login.html')))
    );
    return;
  }

  // Static files: Cache first, fallback to network
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) {
        return cachedRes;
      }
      return fetch(req)
        .then((networkRes) => {
          if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic') {
            return networkRes;
          }
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return networkRes;
        })
        .catch(() => {
          // If offline and request is an image, return fallback if available
        });
    })
  );
});
