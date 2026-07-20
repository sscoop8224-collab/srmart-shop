/* SR마트 shop Service Worker — 기본 앱 셸 캐싱
 * 스코프: /shop/ (registration 위치 기준). 경로는 모두 스코프 상대(루트 절대 금지).
 * /api·/uploads 는 루트라 이 SW 스코프 밖 → 캐시 안 함(정상, 네트워크 직행).
 * 과하게 만들지 않음: 앱 셸(정적 자원) 런타임 캐시 + 오프라인 폴백만.
 */
const CACHE = 'srmart-shop-v4';
const OFFLINE_URL = 'offline.html'; // 스코프(/shop/) 상대

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll([OFFLINE_URL, 'icons/icon-192.png']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 페이지 이동: 캐시-우선(stale-while-revalidate) → 재실행 시 HTML 왕복 없이 즉시 셸 표시 + 백그라운드 갱신.
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        }).catch(() => cached || caches.match(OFFLINE_URL));
        return cached || network;   // 캐시 있으면 즉시, 없으면(첫 실행) 네트워크
      })
    );
    return;
  }

  // 정적 자원(같은 출처): 캐시 우선 + 런타임 캐싱
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부(CDN/도메인) 패스
  event.respondWith(
    caches.match(req).then((cached) =>
      cached ||
      fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached)
    )
  );
});
