const CACHE_NAME = 'jiangway-v1';
const urlsToCache = [
  '/jiangway-order-system/',
  '/jiangway-order-system/index.html',
  '/jiangway-order-system/manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 激活 Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 攔截網路請求 - 優先離線快取，失敗則線上請求
self.addEventListener('fetch', event => {
  // 只攔截 GET 請求
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(response => {
        // 對成功的請求進行快取
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    }).catch(() => {
      // 離線時返回快取
      return caches.match(event.request);
    })
  );
});
