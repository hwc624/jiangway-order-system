// 網路優先：開頁先向網路要最新版，失敗才用這份快取（離線仍可點餐）。
// 舊版曾把整站 cache-first（先回快取），已安裝的手機會一直先看到舊頁，
// 直到新的 SW 在 activate 裡把那些分頁導回最新網址。
const CACHE_NAME = 'jiangway-app-v8';

function isHtmlRequest(request, url) {
  return request.mode === 'navigate'
    || request.destination === 'document'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/');
}

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
    // 舊頁面的 JS 不一定會在換 SW 時自己重新整理。這裡直接導回同一網址，
    // 這次導覽由新的 SW 處理（網路優先），已開著的分頁也會換成最新版。
    // 不能 await navigate：導覽的 fetch 要等 activate 結束才跑得動，等它會卡住。
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if (!client.url || typeof client.navigate !== 'function') continue;
      client.navigate(client.url).catch(() => {});
    }
  })());
});

async function fromCache(request, html) {
  const cache = await caches.open(CACHE_NAME);
  const exact = await cache.match(request);
  if (exact) return exact;
  if (!html) return null;
  const loose = await cache.match(request, { ignoreSearch: true });
  if (loose) return loose;
  const keys = await cache.keys();
  const hit = keys.find(key => {
    try {
      const path = new URL(key.url).pathname;
      return path.endsWith('.html') || path.endsWith('/');
    } catch (e) { return false; }
  });
  return hit ? cache.match(hit) : null;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  // sw.js 不進快取。舊的 cache-first 若曾存過它，更新檢查會一直拿到舊檔。
  if (url.pathname.endsWith('/sw.js')) return;
  const html = isHtmlRequest(event.request, url);
  event.respondWith((async () => {
    try {
      // no-store：不要再用瀏覽器 HTTP 快取裡的舊 index.html／css。離線副本只放 Cache Storage。
      const res = await fetch(event.request, { cache: 'no-store' });
      if (res && res.ok) {
        const copy = res.clone();
        const store = caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => {});
        try { event.waitUntil(store); } catch (err) { /* respondWith 之後有的瀏覽器不再接受 waitUntil */ }
      }
      return res;
    } catch (e) {
      const cached = await fromCache(event.request, html);
      if (cached) return cached;
      if (html) {
        return new Response('<meta charset="utf-8"><h2 style="font-family:sans-serif;text-align:center;margin-top:40px">📡 目前沒有網路，請連線後再重新整理<br>You are offline</h2>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      return Response.error();
    }
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
