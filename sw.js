// Service Worker - 網路優先策略（同網域檔案離線時才用快取）
const CACHE_NAME = 'jiangway-app-v2';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // 只刪除舊版本的快取，保留目前版本
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // 外部網站（CDN、Firebase、字型、WhatsApp）交給瀏覽器自己處理，不攔截
  if (url.origin !== self.location.origin) return;
  const isHTML = event.request.mode === 'navigate' || url.pathname.endsWith('/');
  event.respondWith(
    fetch(event.request, isHTML ? { cache: 'no-store' } : undefined)
      .then(res => {
        // 成功就順便存一份，供離線時使用
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(event.request).then(r =>
          r || (isHTML
            ? new Response('<meta charset="utf-8"><h2 style="font-family:sans-serif;text-align:center;margin-top:40px">📡 目前沒有網路，請連線後再重新整理<br>You are offline</h2>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
            : Response.error())
        )
      )
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
