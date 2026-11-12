/* SR마트 shop Service Worker — 기본 앱 셸 캐싱
 * 스코프: /shop/ (registration 위치 기준). 경로는 모두 스코프 상대(루트 절대 금지).
 *
 * 🔴 **화면 파일만 캐시한다 — `/api`·`/uploads` 는 아예 가로채지 않는다** (2026-11-12).
 *   예전 주석은 「/api 는 스코프 밖이라 캐시 안 함」이라고 했는데 틀렸다. 스코프는 **어느 화면을
 *   이 SW 가 맡느냐**를 정할 뿐이고, 맡은 화면이 부르는 요청은 주소와 상관없이 전부 fetch 로 들어온다.
 *   그래서 `/api/banners`·`/api/categories`·`/api/stores`·`/api/splash-ads` 가 **캐시-우선으로**
 *   저장돼, 앱을 설치한 손님은 배너·분류·매장이 바뀌어도 옛 값을 봤다(운영에서 실측).
 *   → 같은 출처 + 스코프(/shop/) 안 주소만 손댄다. 나머지는 respondWith 를 부르지 않는다(브라우저가 그대로 보냄).
 *   재발 방지 검사: scripts/shop-shots/check-sw.cjs
 *
 * 🔴 CACHE 이름을 올리면 activate 가 옛 캐시를 통째로 지운다 — 이미 설치한 기기의 옛 /api 캐시도 이걸로 사라진다.
 */
const CACHE = 'srmart-shop-v6';
const OFFLINE_URL = 'offline.html'; // 스코프(/shop/) 상대 — serve.json 의 cleanUrls:false 가 있어야 301 을 안 탄다

// 이 SW 가 맡는 주소의 앞머리(예: /shop/)
const SCOPE_PATH = new URL(self.registration.scope).pathname;

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
  const url = new URL(req.url);
  // 같은 출처 + 스코프 안(화면 파일)만. /api·/uploads·외부 주소는 손대지 않는다
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(SCOPE_PATH)) return;

  // 페이지 이동(HTML): 네트워크-우선 → 배포가 즉시 반영됨(옛 번들 stale 문제 해소).
  // HTML은 작아서 네트워크 왕복 비용이 작고, 큰 비용인 정적 JS는 아래에서 캐시-우선 유지 → 로딩 속도 영향 최소.
  // 네트워크 실패(오프라인)에만 캐시/오프라인 폴백.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // 정적 자원(스코프 안): 캐시 우선 + 런타임 캐싱
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
