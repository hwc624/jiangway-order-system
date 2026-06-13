// Service Worker - 網路優先策略（確保使用者永遠拿到最新版本）
const CACHE_VERSION = 'jiangway-v3-' + Date.now(); // 每次部署都會是新版本
const CACHE_NAME = 'jiangway-app';

// 安裝時立即接管（不等待）
self.addEventListener('install', event => {
  console.log('[SW] 安裝新版本:', CACHE_VERSION);
  self.skipWaiting(); // 立即取代舊 SW
});

// 啟動時清除所有舊快取
self.addEventListener('activate', event => {
  console.log('[SW] 啟動，清除所有舊快取');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[SW] 刪除舊快取:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // 立即控制所有頁面（不等使用者重新整理）
      return self.clients.claim();
    })
  );
});

// fetch 攔截：網路優先策略
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // 對於 HTML 檔案：永遠先試網路（取得最新版）
  const url = new URL(event.request.url);
  const isHTML = event.request.mode === 'navigate' || 
                 event.request.destination === 'document' ||
                 url.pathname.endsWith('.html') || 
                 url.pathname.endsWith('/');
  
  if (isHTML) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })  // 強制不用瀏覽器快取
        .then(response => {
          // 取得新版，更新快取
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // 網路失敗才用快取（離線模式）
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // 對於其他資源（JS、CSS、圖片）：網路優先，失敗用快取
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// 收到訊息時更新（讓客戶端可以強制更新）
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
