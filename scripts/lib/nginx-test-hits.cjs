#!/usr/bin/env node
// 배포 확인 중 「시험 브라우저가 실서버 /api 를 불렀나」— nginx 기록 판정 (2026-11-17 밤샘 지시 7)
//
//   deploy-shop.cjs 의 마지막 확인(check-sw · check-f11)은 운영 주소를 시험 브라우저로 연다. 그 브라우저의 /api 는
//   가짜 응답으로 막아야 한다 — 실서버로 나가면 검색 기록·로그인 기록·주문이 운영 DB 에 남는다(CLAUDE.md 2026-11-04).
//
//   예전 판정: 확인하는 동안 새로 생긴 줄 전체에서 「HeadlessChrome + /api」.
//     🔴 넓다 — 같은 시각 다른 창(어드민·PDA)의 시험 브라우저가 /admin 에서 부른 /api 까지 걸려 멀쩡한 반영을 되돌린다.
//     🔴 좁다 — 사진 도구·브랜드 검사는 UA 를 휴대폰으로 바꾼다(HeadlessChrome 글자가 없다). 그 브라우저가 새면 못 잡는다.
//   지금 판정: **배포 주소(/srm/ · /shop/ · /aram/)에서 나간 /api 만** 보고, 그 안에서는 시험 흔적을 넓게 잡는다.
//     ① 요청이 /api/… 이고 ② 보낸 화면(referer)의 경로가 배포 주소 아래이고 ③ 시험 흔적이 있다:
//        UA 에 HeadlessChrome · Playwright · SRM-…Check, 또는 UA 의 Chrome 버전이 두 마디(Chrome/126.0 — 진짜 크롬은 네 마디),
//        또는 **이 PC 에서** 휴대폰 UA(Android · iPhone · iPad)로 온 요청(이 PC 는 윈도 데스크톱이다).
//   쓰는 법: const { testHits } = require('./lib/nginx-test-hits.cjs'); testHits(lines) → { hits, otherTest }
//           node scripts/lib/nginx-test-hits.cjs --selftest   (deploy-shop.cjs 가 시작할 때도 돌린다)
'use strict';

const DEPLOY_PATHS = ['/srm/', '/shop/', '/aram/'];
// 이 PC 의 주소 — nginx 가 보는 손님 주소. 공인 IP(이더넷 7) · Tailscale · 자기 자신
const THIS_PC = new Set(['112.217.202.242', '100.73.58.124', '127.0.0.1', '::1']);

// combined: IP - - [시각] "GET /api/x HTTP/1.1" 200 12 "referer" "UA"
const LINE = /^(\S+) \S+ \S+ \[[^\]]*\] "([A-Z]+) (\S+)[^"]*" \d{3} \S+ "([^"]*)" "([^"]*)"/;

function parse(l) {
  const m = LINE.exec(l);
  if (!m) return null;
  let refPath = '';
  try { refPath = m[4] && m[4] !== '-' ? new URL(m[4]).pathname : ''; } catch (e) { refPath = ''; }
  return { ip: m[1], method: m[2], path: m[3], referer: m[4], refPath, ua: m[5] };
}

function looksTest(r) {
  if (/HeadlessChrome|Playwright|SRM-[A-Za-z]*Check/.test(r.ua)) return true;
  if (/Chrome\/\d+\.0(?=[ )]|$)/.test(r.ua)) return true;                       // 두 마디 버전 — 촬영·검사 도구가 지어 넣은 UA
  if (THIS_PC.has(r.ip) && /Android|iPhone|iPad/.test(r.ua)) return true;      // 이 PC 에서 휴대폰인 척
  return false;
}

/** nginx 줄들 → 배포 주소에서 나간 시험 브라우저의 /api(hits) · 다른 주소의 시험 /api(otherTest — 세기만) */
function testHits(lines, paths = DEPLOY_PATHS) {
  const hits = [], otherTest = [];
  for (const l of lines) {
    const r = parse(l);
    if (!r || !/^\/api(\/|$|\?)/.test(r.path) || !looksTest(r)) continue;
    if (paths.some((p) => r.refPath === p.slice(0, -1) || r.refPath.startsWith(p))) hits.push(l);
    else otherTest.push(l);
  }
  return { hits, otherTest };
}

// ── 자가 시험 — 「쇼핑앱 시험이 실서버를 부르면 여전히 잡힌다」를 보인다 ──
const T = (ip, req, ref, ua) => `${ip} - - [17/Nov/2026:02:00:00 +0900] "${req} HTTP/1.1" 200 12 "${ref}" "${ua}"`;
const HEADLESS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.6478.126 Safari/537.36';
const SHOT_ANDROID = 'Mozilla/5.0 (Linux; Android 12; SM-A125N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const SHOT_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const REAL_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36';
const REAL_PHONE = 'Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.81 Mobile Safari/537.36';
const CASES = [
  // [이름, 줄, 잡혀야(hits), 다른 주소로 세져야(otherTest)]
  ['시험 브라우저(HeadlessChrome)가 /shop 에서 실서버 /api', T('112.217.202.242', 'GET /api/products?store_id=1', 'https://www.dongsinmarket.com/shop/', HEADLESS), 1, 0],
  ['사진 도구(휴대폰 UA · 두 마디 버전)가 /srm 에서 /api', T('112.217.202.242', 'GET /api/stores', 'https://www.dongsinmarket.com/srm/', SHOT_ANDROID), 1, 0],
  ['아이폰인 척(이 PC 에서) /aram 에서 /api', T('112.217.202.242', 'GET /api/banners', 'https://www.dongsinmarket.com/aram/', SHOT_IPHONE), 1, 0],
  ['브랜드 검사 UA 꼬리표', T('127.0.0.1', 'POST /api/login', 'https://dongsinmarket.co.kr/shop/login', SHOT_ANDROID + ' SRM-BrandLiveCheck'), 1, 0],
  ['🔴 다른 창의 시험 브라우저가 /admin 에서 부른 /api — 반영을 되돌리면 안 된다', T('112.217.202.242', 'GET /api/admin/alerts', 'https://dongsinmarket.com/admin/staff', HEADLESS), 0, 1],
  ['대표님 PC 크롬이 /admin 에서', T('112.217.202.242', 'GET /api/admin/alerts', 'https://dongsinmarket.com/admin/staff', REAL_PC), 0, 0],
  ['진짜 손님 휴대폰이 /shop 에서', T('211.36.1.2', 'GET /api/products', 'https://www.dongsinmarket.com/shop/', REAL_PHONE), 0, 0],
  ['진짜 아이폰 손님(다른 IP)이 /aram 에서', T('39.7.1.2', 'GET /api/stores', 'https://www.dongsinmarket.com/aram/', SHOT_IPHONE), 0, 0],
  ['시험 브라우저가 화면 파일만(/api 아님)', T('112.217.202.242', 'GET /shop/static/js/main.abc.js', 'https://www.dongsinmarket.com/shop/', HEADLESS), 0, 0],
  ['/srmart 같은 비슷한 경로는 배포 주소가 아니다', T('112.217.202.242', 'GET /api/x', 'https://www.dongsinmarket.com/srmart/', HEADLESS), 0, 1],
  ['referer 가 /shop(끝 / 없음)', T('112.217.202.242', 'GET /api/x', 'https://www.dongsinmarket.com/shop', HEADLESS), 1, 0],
];
function selftest() {
  const bad = [];
  for (const [name, line, h, o] of CASES) {
    const r = testHits([line]);
    if (r.hits.length !== h || r.otherTest.length !== o) bad.push(`${name} — 기대 잡힘 ${h}·다른 ${o} · 실제 ${r.hits.length}·${r.otherTest.length}`);
  }
  // 섞인 기록 — 다른 창 줄 사이에 쇼핑앱 시험 줄 하나
  const mixed = [CASES[4][1], CASES[5][1], CASES[1][1], CASES[6][1], 'garbage line'];
  const m = testHits(mixed);
  if (m.hits.length !== 1 || m.otherTest.length !== 1) bad.push(`섞인 기록 — 기대 1·1 · 실제 ${m.hits.length}·${m.otherTest.length}`);
  return { ok: !bad.length, bad, n: CASES.length + 1 };
}

module.exports = { testHits, selftest, DEPLOY_PATHS, parse, looksTest };

if (require.main === module) {
  const r = selftest();
  if (!r.ok) { console.log(`🔴 nginx 시험 기록 판정 자가 시험 ${r.n - r.bad.length}/${r.n}`); r.bad.forEach((b) => console.log('   ' + b)); process.exit(1); }
  console.log(`✅ nginx 시험 기록 판정 자가 시험 ${r.n}/${r.n} — 배포 주소의 시험 /api 는 잡고, 다른 창(/admin)·진짜 손님은 안 잡는다`);
}
