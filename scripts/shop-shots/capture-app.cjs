#!/usr/bin/env node
/**
 * 쇼핑앱 화면 사진 — 화면ID(S01~)마다 폰·태블릿 × 밝게·어둡게.
 *
 *   node scripts/shop-shots/capture-app.cjs [--base http://127.0.0.1:5311] [--out docs/shots/before] [S01 S04 ...]
 *
 * - 앱은 `serve-static.cjs` 로 127.0.0.1 에 띄운 **로컬 빌드**를 본다. 운영 pm2 는 건드리지 않는다.
 * - 🔴 /api 는 전부 `fixtures.cjs` 의 가짜 응답이다. 운영 백엔드를 부르지 않으므로 로그인 기록·
 *   검색 기록·주문이 DB 에 남지 않는다. 그래서 로그인 뒤 화면도 테스트 계정 없이 찍힌다.
 * - 쇼핑앱은 주소(URL)로 화면이 갈리지 않는다(`page` 상태값). 그래서 손님처럼 **눌러서** 들어간다.
 * - 나중에 「앱 반영」 사진도 이 도구로 찍는다(--out docs/shots/app). 화면ID 와 순서가 같아야
 *   before·app 을 나란히 비교할 수 있다.
 *
 * 파일 이름: 폰 = S01_light.png / S01_dark.png, 태블릿 = S01_tablet_light.png / S01_tablet_dark.png
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { route, customer } = require('./fixtures.cjs');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:5311');
const OUT = path.resolve(arg('--out', path.join(__dirname, '../../docs/shots/before')));
const ONLY = process.argv.slice(2).filter(a => /^S\d+$/.test(a));
const SKIP_TABLET = process.argv.includes('--no-tablet');
const ONLY_TABLET = process.argv.includes('--only-tablet');

const DEVICES = [
  { key: '', viewport: { width: 390, height: 844 }, dsf: 2 },
  { key: 'tablet_', viewport: { width: 820, height: 1180 }, dsf: 1 },
];
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 12; SM-A125N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const wait = (p, ms) => p.waitForTimeout(ms);
// 폰 폭과 태블릿 폭(≥768)에서 같은 버튼이 둘 다 DOM 에 있고 한쪽만 보인다 — 보이는 것만 누른다.
const btn = (p, text) => p.getByRole('button', { name: text, exact: true }).filter({ visible: true }).first();
// 하단 탭바(.tabbar) — 묶음 1(2026-11-12)부터 폰·태블릿 모두 같은 탭바다(예전엔 태블릿이 상단 메뉴).
const nav = (p, text) => p.locator('.tabbar .tab', { hasText: text }).filter({ visible: true }).first();

async function login(p) {
  await p.locator('.app-nav button', { hasText: '로그인' }).click();
  await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill('guest_demo');
  await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill('x');
  await btn(p, '로그인').click();
  await wait(p, 900);
}
async function addTwo(p) {
  // 홈 카드의 「+」 — 메론킥·코카콜라
  const plus = p.locator('.pgrid .add');
  await plus.nth(0).click(); await wait(p, 200);
  await plus.nth(1).click(); await wait(p, 1700);   // 토스트가 사라질 때까지
}
async function openMyMenu(p, label) {
  await nav(p, '마이').click(); await wait(p, 700);
  await p.locator('.mypage-menu > div', { hasText: label }).first().click(); await wait(p, 900);
}

/**
 * 화면ID → { name, opts(가짜 API 설정), ctx(브라우저 설정), go(p) }.
 * go 는 새로 연 앱에서 그 화면까지 손님처럼 눌러 들어간다.
 */
const SCREENS = [
  { id: 'S01', name: '홈 — 상품 목록', go: async () => {} },
  { id: 'S02', name: '홈 — 매장 미리보기 띠(사장님)', opts: { user: { ...customer, role: 'owner', store_id: null, name: '대표님' } }, go: login },
  { id: 'S03', name: '홈 — 상품을 못 불러옴', opts: { productsFail: true }, go: async () => {} },
  { id: 'S04', name: '상품 상세', go: async p => { await p.locator('.pgrid img[alt="농심 메론킥"]').click(); await wait(p, 900); } },
  { id: 'S05', name: '상품 상세 — 리뷰', go: async p => {
    await login(p); await p.locator('.pgrid img[alt="농심 메론킥"]').click(); await wait(p, 900);
    // 「리뷰 쓰기」 버튼은 지금 앱에서 안 보인다 — App.js 가 ProductDetail 에 user 를 안 넘긴다(SHOP_SCREENS F10).
    // 그래서 리뷰 영역(목록·평균)까지만 찍는다.
    await p.evaluate(() => { const el = [...document.querySelectorAll('span')].find(x => x.textContent === '리뷰'); if (el) el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -60); });
    await wait(p, 400);
  } },
  { id: 'S06', name: '검색', tabletSkip: '태블릿 폭(≥768)에는 검색 입구가 없다 — 하단 탭바가 숨고 상단 메뉴에 검색이 없음(SHOP_SCREENS F9)', go: async p => { await nav(p, '검색').click(); await wait(p, 900); } },
  { id: 'S07', name: '검색 — 자동완성', tabletSkip: '태블릿 폭(≥768)에는 검색 입구가 없다 — 하단 탭바가 숨고 상단 메뉴에 검색이 없음(SHOP_SCREENS F9)', go: async p => { await nav(p, '검색').click(); await wait(p, 600); await p.getByPlaceholder('상품명 검색...').fill('콜라'); await wait(p, 900); } },
  { id: 'S08', name: '장바구니', go: async p => { await login(p); await addTwo(p); await nav(p, '장바구니').click(); await wait(p, 1500); } },
  { id: 'S09', name: '장바구니 — 비어 있음', go: async p => { await login(p); await nav(p, '장바구니').click(); await wait(p, 900); } },
  { id: 'S10', name: '결제 요약 — 쿠폰·포인트', go: async p => {
    await login(p); await addTwo(p); await nav(p, '장바구니').click(); await wait(p, 1500);
    await btn(p, '주문하기').click(); await wait(p, 1200);   // P03 — 할인은 주문서에(묶음 3)
    await p.locator('.v2 .row.tap', { hasText: '포인트' }).first().click(); await wait(p, 400);
  } },
  { id: 'S11', name: '배송지 — 다른 주소', go: async p => {
    await login(p); await addTwo(p); await nav(p, '장바구니').click(); await wait(p, 1200);
    await btn(p, '주문하기').click(); await wait(p, 1200);   // P03 — 배송지는 주문서에(묶음 3)
    await p.locator('.v2 .row.tap', { hasText: '변경' }).first().click(); await wait(p, 400);   // 배송지 줄 → 시트(묶음 3)
    const b = btn(p, '다른 주소'); await b.scrollIntoViewIfNeeded(); await b.click(); await wait(p, 400);
    await p.getByPlaceholder('받는 분 이름').scrollIntoViewIfNeeded();
  } },
  { id: 'S12', name: '바로 주문', go: async p => {
    await login(p); await p.locator('.pgrid img[alt="농심 메론킥"]').click(); await wait(p, 900);
    // 폰 폭에선 이 버튼 가운데를 하단 탭바가 덮는다(SHOP_SCREENS F11) — 위쪽 띠를 누른다(손님도 거기만 눌린다)
    await btn(p, '바로 주문').click({ position: { x: 40, y: 8 } }); await wait(p, 1500);
  } },
  { id: 'S13', name: '주문 완료(영수증)', go: async p => {
    await login(p); await addTwo(p); await nav(p, '장바구니').click(); await wait(p, 1800);
    await btn(p, '주문하기').click(); await wait(p, 1200);   // P03(묶음 3)
    await p.locator('.pay-bar button, .cart-checkout button').last().click(); await wait(p, 1500);
  } },
  { id: 'S14', name: '주문내역', go: async p => { await login(p); await openMyMenu(p, '주문내역'); } },
  { id: 'S15', name: '환불·교환 요청', go: async p => { await login(p); await openMyMenu(p, '주문내역'); await btn(p, '환불 요청').click(); await wait(p, 500); } },
  { id: 'S16', name: '구매 내역', go: async p => { await login(p); await openMyMenu(p, '구매 내역'); } },
  { id: 'S17', name: '매장 영수증', go: async p => { await login(p); await openMyMenu(p, '구매 내역'); await btn(p, '영수증 보기').click();   // 주문내역(P01) — 매장 카드의 「영수증 보기」(묶음 4)
    await wait(p, 900); } },
  { id: 'S18', name: '온라인 주문 상세', go: async p => { await login(p); await openMyMenu(p, '구매 내역'); await p.getByText('농심 메론킥 60g 외 2건').click(); await wait(p, 900); } },
  { id: 'S19', name: '찜 목록', go: async p => { await login(p); await nav(p, '찜').click(); await wait(p, 900); } },
  { id: 'S20', name: '마이페이지', go: async p => { await login(p); await nav(p, '마이').click(); await wait(p, 1000); } },
  { id: 'S21', name: '회원정보 수정', go: async p => { await login(p); await nav(p, '마이').click(); await wait(p, 700); await btn(p, '회원정보 수정').click(); await wait(p, 500); } },
  { id: 'S22', name: '비밀번호 변경', go: async p => { await login(p); await nav(p, '마이').click(); await wait(p, 700); await btn(p, '비밀번호 변경').click(); await wait(p, 500); } },
  { id: 'S23', name: '내 쿠폰', go: async p => { await login(p); await nav(p, '마이').click(); await wait(p, 900); await p.getByText('미사용 쿠폰').click(); await wait(p, 500); } },
  { id: 'S24', name: '로그인 이력', go: async p => { await login(p); await openMyMenu(p, '로그인 이력'); } },
  { id: 'S25', name: '회원탈퇴', go: async p => { await login(p); await nav(p, '마이').click(); await wait(p, 700); const b = btn(p, '회원탈퇴'); await b.scrollIntoViewIfNeeded(); await b.click(); await wait(p, 500); } },
  { id: 'S26', name: '공지사항', go: async p => { await login(p); await p.getByRole('button', { name: '공지' }).click(); await wait(p, 900); } },
  { id: 'S27', name: '로그인', go: async p => { await p.locator('.app-nav button', { hasText: '로그인' }).click(); await wait(p, 900); } },
  { id: 'S28', name: '회원가입', go: async p => { await p.locator('.app-nav button', { hasText: '로그인' }).click(); await wait(p, 500); await btn(p, '회원가입').click(); await wait(p, 900); } },
  { id: 'S29', name: '아이디·비밀번호 찾기', go: async p => { await p.locator('.app-nav button', { hasText: '로그인' }).click(); await wait(p, 500); await btn(p, '아이디/비밀번호 찾기').click(); await wait(p, 700); } },
  { id: 'S30', name: '점포 선택', ctx: { noStore: true }, go: async p => { await wait(p, 600); } },
  { id: 'S31', name: '비밀번호 바꾸기(첫 로그인)', opts: { user: { ...customer, must_change_password: 1 } }, go: login },
  { id: 'S32', name: '매장 이용 동의', opts: { user: { ...customer, needsThirdPartyConsent: true } }, go: login },
  { id: 'S33', name: '로그아웃 확인', go: async p => { await login(p); await nav(p, '마이').click(); await wait(p, 800); const b = p.getByText('로그아웃', { exact: true }).last(); await b.scrollIntoViewIfNeeded(); await b.click(); await wait(p, 400); } },   // 헤더 로그아웃은 묶음 1 에서 빠졌다(마이 맨 아래)
  { id: 'S34', name: '알림·확인창(공용)', go: async p => { await nav(p, '장바구니').click(); await wait(p, 400); } },
  { id: 'S35', name: '토스트', go: async p => { await login(p); await p.locator('.pgrid .add').first().click(); await wait(p, 300); } },
  { id: 'S36', name: '오프라인', go: async (p, c) => { await c.setOffline(true); await wait(p, 700); } },
  { id: 'S37', name: 'AI 상담', go: async p => {
    await p.getByRole('button', { name: 'AI 상담' }).click(); await wait(p, 500);
    const box = p.getByPlaceholder('메시지를 입력하세요').filter({ visible: true }).first(); await box.fill('콜라 있어요?'); await box.press('Enter'); await wait(p, 1200);
  } },
  { id: 'S38', name: '앱 설치 안내(아이폰)', ctx: { iphone: true, query: '?install=1' }, go: async p => { await wait(p, 1200); } },
  { id: 'S39', name: '스플래시 광고', skip: '네이티브 앱(Capacitor) 첫 실행에서만 뜬다 — 웹 빌드로는 재현 불가' },
  { id: 'S40', name: '회사 소개 첫 화면', skip: '진입 경로 없음 — App.js 가 page=\'homepage\' 로 가는 코드가 없다' },
  { id: 'S41', name: '최근 본 상품', go: async p => { await login(p); await openMyMenu(p, '최근 본 상품'); } },
  { id: 'S42', name: '내 리뷰', go: async p => { await login(p); await openMyMenu(p, '내 리뷰'); } },
  { id: 'S43', name: '불러오는 중', opts: { productsSlow: true }, go: async p => { await wait(p, 400); } },
];

async function shoot(browser, s, dev, dark) {
  const ctxOpt = s.ctx || {};
  const ctx = await browser.newContext({
    viewport: dev.viewport, deviceScaleFactor: dev.dsf, isMobile: true, hasTouch: true,
    userAgent: ctxOpt.iphone ? IPHONE_UA : ANDROID_UA, colorScheme: dark ? 'dark' : 'light', locale: 'ko-KR',
  });
  await ctx.addInitScript(({ noStore, iphone }) => {
    try {
      if (!noStore) localStorage.setItem('guestStoreId', '11');
      if (!iphone) localStorage.setItem('srmart_pwa_dismissed_at', String(Date.now()));
      window.open = () => null;                              // 결제창 팝업은 열지 않는다
    } catch (e) {}
  }, { noStore: !!ctxOpt.noStore, iphone: !!ctxOpt.iphone });
  const opts = s.opts || {};
  await ctx.route('**/*', async (r) => {
    const u = new URL(r.request().url());
    if (u.hostname === 'localhost' && u.port === '5001') {   // 카카오페이 준비(가짜)
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ next_redirect_pc_url: 'about:blank' }) });
    }
    if (u.origin === new URL(BASE).origin && u.pathname.startsWith('/api/')) {
      const res = route(u.pathname.slice(4), r.request().method(), u.search, opts);
      if (res.delay) return;                                  // 끝까지 안 답한다(로딩 화면)
      return r.fulfill({ status: res.status, contentType: 'application/json', body: JSON.stringify(res.body) });
    }
    if (/fonts\.googleapis|fonts\.gstatic|daumcdn/.test(u.hostname)) return r.abort();   // 외부 글꼴·우편번호 스크립트는 막는다(사진이 그날 인터넷에 좌우되지 않게)
    return r.continue();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message).slice(0, 120)));
  const file = path.join(OUT, `${s.id}_${dev.key}${dark ? 'dark' : 'light'}.png`);
  try {
    await page.goto(BASE + '/' + (ctxOpt.query || ''), { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(page, 1800);
    await s.go(page, ctx);
    const raw = await page.screenshot();
    await sharp(raw).png({ palette: true, quality: 92, compressionLevel: 9 }).toFile(file);
    return { ok: true, errors };
  } catch (e) {
    return { ok: false, errors: [...errors, e.message.split('\n')[0].slice(0, 140)] };
  } finally { await ctx.close(); }
}

if (require.main === module) (async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const list = ONLY.length ? SCREENS.filter(s => ONLY.includes(s.id)) : SCREENS;
  const browser = await chromium.launch();
  const report = [];
  for (const s of list) {
    if (s.skip) { console.log(`${s.id} ${s.name.padEnd(22)} ⏭  건너뜀 — ${s.skip}`); report.push({ id: s.id, skip: s.skip }); continue; }
    const row = [];
    for (const dev of DEVICES) {
      if (SKIP_TABLET && dev.key) continue;
      if (ONLY_TABLET && !dev.key) continue;
      if (dev.key && s.tabletSkip) { row.push('⏭태블릿 ' + s.tabletSkip); break; }
      for (const dark of [false, true]) {
        const r = await shoot(browser, s, dev, dark);
        row.push((r.ok ? '✅' : '🔴') + (dev.key ? '태블릿' : '폰') + (dark ? '·어둡게' : '·밝게') + (r.errors.length ? ' ' + r.errors.join(' / ') : ''));
      }
    }
    console.log(`${s.id} ${s.name.padEnd(22)} ${row.join('  ')}`);
    report.push({ id: s.id, row });
  }
  await browser.close();
  // 일부 화면만 다시 찍었으면 기존 보고서의 그 화면 줄만 바꾼다(나머지는 남긴다)
  const rp = path.join(OUT, '_capture-report.json');
  let old = []; try { old = JSON.parse(fs.readFileSync(rp, 'utf8')); } catch (e) { /* 처음 */ }
  const ids = new Set(report.map(r => r.id));
  const merged = [...old.filter(r => !ids.has(r.id)), ...report].sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(rp, JSON.stringify(merged, null, 1));
  console.log('저장: ' + OUT);
})().catch(e => { console.error('🔴', e); process.exit(1); });

module.exports = { SCREENS };
