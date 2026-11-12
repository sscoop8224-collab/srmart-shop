/**
 * 서비스워커 캐시 검사 — 캐시에 `/api` 응답이나 로그인 손님 정보가 남으면 실패.
 *
 *   node scripts/shop-shots/check-sw.cjs [--base https://www.dongsinmarket.com/shop]
 *
 * 기본 주소는 **손님 안드로이드 앱이 실제로 여는 주소**(capacitor.config.ts server.url)다.
 * 로컬로 볼 때는 운영처럼 /shop 아래로 띄운다(스코프가 같아야 같은 결과가 나온다):
 *   node -r <listen-guard> scripts/shop-shots/serve-static.cjs build 5313 --uploads D:/srmart_uploads --prefix /shop
 *   node scripts/shop-shots/check-sw.cjs --base http://127.0.0.1:5313/shop
 *
 * 하는 일
 *  ⑴ 앱을 열어 서비스워커가 화면을 맡을 때까지 기다린다
 *  ⑵ 가짜 응답으로 로그인하고, 상품 상세와 하단 탭 화면들을 두 바퀴 오간다(중간에 새로고침)
 *  ⑶ 서비스워커 캐시를 전부 열어 본다 —
 *     · `/api` 주소가 하나라도 있으면 🔴
 *     · 화면이 부른 `/api` 응답이 서비스워커를 거쳐 왔으면(가로챘으면) 🔴
 *     · 캐시된 글자 파일 안에 가짜 손님의 아이디·이메일·전화·이름·토큰이 있으면 🔴
 *     · 오프라인 화면(offline.html)이 진짜 오프라인 화면으로 저장돼 있지 않으면 🔴 (301 로 엉뚱한 화면이 저장되던 것)
 *
 * 🔴 실서버 API 는 부르지 않는다. 화면의 /api 는 전부 가짜 응답(fixtures.cjs)이고, 서비스워커가 보내는 요청도
 *    가로채도록 Playwright 실험 플래그를 켠다. 운영에 돌릴 때는 nginx 기록으로 0줄을 확인할 것.
 * 종료코드: 0 통과 · 1 실패 · 2 검사 못 함(서비스워커가 화면을 못 맡음 등)
 */
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';
const { chromium } = require('playwright');
const { route } = require('./fixtures.cjs');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'https://www.dongsinmarket.com/shop').replace(/\/+$/, '');
const ORIGIN = new URL(BASE).origin;
// 가짜 손님(fixtures.cjs) 정보 — 이 글자가 캐시에 남으면 손님 정보가 남은 것이다
const SECRETS = ['guest_demo', 'demo@example.com', '010-1234-5678', 'mock.token.value', '김손님', '왕길로 123'];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ko-KR' });
  await ctx.addInitScript(() => { try { localStorage.setItem('guestStoreId', '11'); localStorage.setItem('srmart_pwa_dismissed_at', String(Date.now())); } catch (e) {} });
  const api = { all: 0, viaSW: 0, viaSWPaths: new Set() };
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.origin === ORIGIN && u.pathname.startsWith('/api/')) {
      api.all++;
      if (r.request().serviceWorker()) { api.viaSW++; api.viaSWPaths.add(u.pathname); }
      const x = route(u.pathname.slice(4), r.request().method(), u.search, {});
      return r.fulfill({ status: x.status, contentType: 'application/json', body: JSON.stringify(x.body) });
    }
    if (/fonts\.googleapis|fonts\.gstatic|daumcdn/.test(u.hostname)) return r.abort();
    return r.continue();
  });
  const p = await ctx.newPage();
  const fromSW = new Set();
  p.on('response', r => { const u = new URL(r.url()); if (u.origin === ORIGIN && u.pathname.startsWith('/api/') && r.fromServiceWorker()) fromSW.add(u.pathname); });

  const problems = [];
  const step = async (label, fn) => { try { await fn(); } catch (e) { console.log(`  ⚠ ${label} 건너뜀: ${e.message.split('\n')[0].slice(0, 80)}`); } };
  p.on('console', m => { if (/service ?worker|SW/i.test(m.text())) console.log('  [화면 로그] ' + m.text().slice(0, 120)); });
  await p.goto(BASE + '/');
  // ready 는 등록이 실패하면 영원히 안 끝난다 — 시한을 건다(2026-11-12 실제로 멈췄다)
  const ready = await p.evaluate(() => Promise.race([
    navigator.serviceWorker ? navigator.serviceWorker.ready.then(r => 'ready ' + r.scope) : Promise.resolve('서비스워커 기능 없음'),
    new Promise(r => setTimeout(() => r('시한 15초 넘김'), 15000)),
  ]));
  await p.reload(); await p.waitForTimeout(1500);
  const controlled = await p.evaluate(() => !!(navigator.serviceWorker && navigator.serviceWorker.controller));
  if (!controlled) { console.log(`🔴 검사 못 함 — 서비스워커가 화면을 맡지 않았다(${ready})`); await browser.close(); process.exit(2); }

  await step('로그인', async () => {
    await p.locator('.app-nav button', { hasText: '로그인' }).click({ timeout: 4000 }); await p.waitForTimeout(500);
    await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill('guest_demo'); await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill('x');
    await p.getByRole('button', { name: '로그인', exact: true }).filter({ visible: true }).first().click(); await p.waitForTimeout(1500);
  });
  const tabs = ['장바구니', '검색', '주문내역', '마이', '홈'];   // 5칸 탭바(묶음 1) — 찜은 마이 안으로 갔다
  const tab = t => p.locator('.tabbar .tab').filter({ visible: true }).filter({ hasText: t }).first();
  let moved = 0;
  for (let round = 1; round <= 2; round++) {
    // 🔴 p.goBack() 을 쓰지 않는다 — 이 앱은 주소가 안 바뀌는 한 장짜리라 브라우저 뒤로가기는 about:blank 로 나간다
    await step('상품 상세', async () => { await p.locator('.pgrid img').first().click({ timeout: 4000 }); await p.waitForTimeout(900); moved++; await tab('홈').click({ timeout: 3000 }).catch(() => p.goto(BASE + '/')); await p.waitForTimeout(600); });
    for (const t of tabs) await step(`탭 ${t}`, async () => {
      // 장바구니처럼 하단 탭을 숨기는 화면이 있다 — 탭이 안 보이면 첫 화면을 다시 연다(새로 고침도 한 번 더 되는 셈)
      if (!(await tab(t).isVisible().catch(() => false))) { await p.goto(BASE + '/'); await p.waitForTimeout(1200); }
      // 장바구니 화면은 결제 바가 탭바를 덮는다(보이지만 눌리지 않는다 — 3번 묶음에서 목업처럼 결제 바가 탭바를 대신한다) — 그때도 첫 화면을 다시 연다
      await tab(t).click({ timeout: 3000 }).catch(async () => { await p.goto(BASE + '/'); await p.waitForTimeout(1200); await tab(t).click({ timeout: 3000 }); });
      await p.waitForTimeout(700); moved++;
    });
    if (round === 1) { await p.reload(); await p.waitForTimeout(1500); }
  }
  await p.waitForTimeout(800);
  // 화면을 실제로 오가지 못했으면 「통과」라고 말할 수 없다
  if (moved < 8) { console.log(`🔴 검사 못 함 — 화면 이동 ${moved}번뿐(12번 중)`); await browser.close(); process.exit(2); }
  console.log(`  화면 이동 ${moved}번(상품 상세 + 탭 5개 × 2바퀴, 중간 새로고침 1번)`);

  const dump = await p.evaluate(async () => {
    const out = [];
    for (const name of await caches.keys()) {
      const c = await caches.open(name);
      for (const req of await c.keys()) {
        const res = await c.match(req);
        const type = (res && res.headers.get('content-type')) || '';
        const text = /text|json|javascript|html/.test(type) || /\.(html|json|js|css)$/.test(new URL(req.url).pathname) ? await res.clone().text() : '';
        out.push({ cache: name, path: new URL(req.url).pathname, type, text });
      }
    }
    return { names: await caches.keys(), scope: (await navigator.serviceWorker.getRegistration()).scope, out };
  });
  const scopePath = new URL(dump.scope).pathname;
  const apiKeys = dump.out.filter(e => e.path.startsWith('/api'));
  const outside = dump.out.filter(e => !e.path.startsWith(scopePath));
  const leaked = [];
  for (const e of dump.out) for (const s of SECRETS) if (e.text.includes(s)) leaked.push(`${e.path} ← 「${s}」`);
  const off = dump.out.find(e => e.path === scopePath + 'offline.html');

  if (apiKeys.length) problems.push(`캐시에 /api 주소 ${apiKeys.length}개: ${apiKeys.map(e => e.path).join(', ')}`);
  if (fromSW.size || api.viaSW) problems.push(`서비스워커가 /api 를 가로챘다: ${[...new Set([...fromSW, ...api.viaSWPaths])].join(', ')}`);
  if (leaked.length) problems.push(`캐시에 손님 정보: ${leaked.slice(0, 6).join(' · ')}`);
  if (!off) problems.push('오프라인 화면(offline.html)이 캐시에 없다');
  else if (!off.text.includes('인터넷 연결이 없어요')) problems.push('오프라인 화면 자리에 다른 화면이 저장돼 있다(301 → 엉뚱한 주소)');

  console.log(`주소 ${BASE} · 서비스워커 범위 ${dump.scope} · 캐시 ${dump.names.join(', ') || '(없음)'}`);
  console.log(`캐시 항목 ${dump.out.length}개 — 범위 밖 ${outside.length}개${outside.length ? '(' + outside.map(e => e.path).slice(0, 4).join(', ') + ')' : ''}`);
  console.log(`화면이 부른 /api ${api.all}번(전부 가짜 응답) · 서비스워커를 거친 것 ${fromSW.size + api.viaSW}번`);
  for (const pr of problems) console.log('🔴 ' + pr);
  console.log(problems.length ? `🔴 실패 ${problems.length}건` : '✅ 캐시에 /api·손님 정보 없음 · 오프라인 화면 정상');
  await browser.close();
  process.exit(problems.length ? 1 : 0);
})().catch(e => { console.error('🔴 검사 못 함', e.message); process.exit(2); });
