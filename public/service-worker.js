/* SR마트 Service Worker v1 */
const SW_VERSION = 'srmart-v1';
const STATIC_CACHE = SW_VERSION + '-static';
const API_CACHE    = SW_VERSION + '-api';
const IMAGE_CACHE  = SW_VERSION + '-images';
const OFFLINE_URL  = '/offline.html';

const IMAGE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7일

// ── install: 오프라인 fallback 사전 캐시 ─────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([OFFLINE_URL, '/icons/icon-192.png'])
    ).then(() => self.skipWaiting())
  );
});

// ── activate: 이전 버전 캐시 정리 ────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !currentCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── fetch: 요청 종류별 전략 ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chrome extension / non-http skip
  if (!url.protocol.startsWith('http')) return;

  // API 요청: Network First (오프라인 시 캐시)
  if (url.hostname === 'localhost' && url.port === '5000') {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // 외부 이미지 (CDN, unsplash 등): Cache First + 7일 만료
  if (request.destination === 'image') {
    event.respondWith(cacheFirstWithExpiry(request, IMAGE_CACHE));
    return;
  }

  // HTML 탐색: Network First (최신 앱 셸 우선)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL)
      )
    );
    return;
  }

  // JS/CSS/Font 정적 자산: Cache First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 나머지: Network First
  event.respondWith(networkFirstWithCache(request, STATIC_CACHE));
});

// ── 전략 함수 ─────────────────────────────────────────────────
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(
      JSON.stringify({ error: '오프라인 상태예요. 네트워크 연결을 확인해주세요.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function cacheFirstWithExpiry(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const dateHeader = cached.headers.get('sw-cache-date');
    if (dateHeader) {
      const age = Date.now() - new Date(dateHeader).getTime();
      if (age < IMAGE_CACHE_MAX_AGE) return cached;
    } else {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      const modified = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, modified);
    }
    return response;
  } catch {
    return cached || new Response('', { status: 503 });
  }
}

// ── Push 알림 ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'SR마트', body: '새 알림이 도착했어요!', url: '/' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'srmart-notification',
      data: { url: data.url },
      actions: data.actions || [],
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(targetUrl) && 'focus' in c);
      if (existing) return existing.focus();
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// ── Background Sync (장바구니 오프라인 저장) ──────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

async function syncCart() {
  // IndexedDB에서 대기 중인 장바구니 항목을 서버에 전송
  // (실제 구현은 IndexedDB 연동 필요 - 추후 확장)
  console.log('[SW] background sync: cart');
}
