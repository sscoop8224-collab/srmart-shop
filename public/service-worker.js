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
 * 🔴 판(VERSION)을 올리면 activate 가 **이 범위의** 옛 캐시를 지운다 — 이미 설치한 기기의 옛 /api 캐시도 이걸로 사라진다.
 *
 * 🔴 **캐시 이름에 범위(/shop/ · /srm/ · /aram/)를 넣고, 지울 때도 내 범위 것만 지운다** (2026-11-15 아람 웹 경로).
 *   Cache Storage 는 범위가 아니라 **출처(www.dongsinmarket.com) 단위**다. 예전 activate 는 「내 이름이 아닌 캐시는
 *   전부」 지웠다. 그래서 같은 출처에 /srm/·/aram/ 이 생기면 서비스워커끼리 **서로의 캐시를 지운다**(오프라인 화면이 사라진다).
 *   ⑴ 이름 = shop-<판>:<범위>  ⑵ activate 는 같은 범위의 다른 판 + 범위를 넣기 전의 옛 이름(srmart-shop-v1~v6)만 지운다
 *   ⑶ 꺼낼 때도 내 캐시에서만 찾는다(caches.match 는 출처의 모든 캐시를 뒤진다 — 다른 브랜드 화면이 나올 수 있다).
 *   지키는 검사: scripts/check-brand-paths.cjs
 *
 * 🔴 v8 (2026-11-17 밤샘 지시 1·2) — 아이콘·offline·manifest 처럼 **이름이 고정된 파일도 캐시-먼저로** 나간다.
 *   운영 /aram/ 을 한 번 연 기기에는 shop-v7:/aram/ 에 **에스알마트 icon-192** 가 들어 있다(2026-11-17 실측).
 *   아람 그림을 고쳐 내보내도 이 파일이 같으면 브라우저가 새 서비스워커를 안 받고 옛 캐시를 계속 쓴다 → 판을 올린다.
 *   지키는 관문: deploy-shop.cjs 1-c(이름 고정 파일이 바뀌었는데 이 파일이 그대로면 반영하지 않는다).
 */
// 이 SW 가 맡는 주소의 앞머리(예: /shop/)
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const VERSION = 'v8';
const CACHE = `shop-${VERSION}:${SCOPE_PATH}`;
const OFFLINE_URL = 'offline.html'; // 스코프 상대 — serve.json 의 cleanUrls:false 가 있어야 301 을 안 탄다
// 지워도 되는 캐시 — 같은 범위의 다른 판, 또는 범위를 이름에 넣기 전의 옛 이름
const isMineOld = (k) => k !== CACHE && ((k.startsWith('shop-') && k.endsWith(`:${SCOPE_PATH}`)) || /^srmart-shop-v\d+$/.test(k));
const fromMine = (req) => caches.open(CACHE).then((c) => c.match(req));

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
      .then((keys) => Promise.all(keys.filter(isMineOld).map((k) => caches.delete(k))))
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
      }).catch(() => fromMine(req).then((c) => c || fromMine(OFFLINE_URL)))
    );
    return;
  }

  // 정적 자원(스코프 안): 캐시 우선 + 런타임 캐싱
  event.respondWith(
    fromMine(req).then((cached) =>
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
