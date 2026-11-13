/**
 * 태블릿 **세로 ↔ 가로** 를 돌려도 손님이 하던 것이 남는지 본다 (2026-11-12 블록 B-11).
 *
 *   node -r <listen-guard.cjs> scripts/shop-shots/serve-static.cjs <빌드 폴더> 5311 --uploads D:/srmart_uploads   (따로 띄워 둔다)
 *   node scripts/shop-shots/check-rotate.cjs [--base http://127.0.0.1:5311] [--rounds 2]
 *
 * 앱(쇼핑앱 로컬 빌드)을 820×1180 으로 열고 손님처럼:
 *   ① 로그인 → 홈 상품 두 개를 담는다(장바구니)
 *   ② 홈을 아래로 내린다(스크롤 자리)
 *   ③ AI 상담 창을 열고 글을 쓰다 만다(열린 창 · 입력한 글)
 * 그다음 1180×820 으로 돌리고, 다시 820×1180 으로 돌린다(--rounds 번). 돌릴 때마다:
 *   - 페이지가 새로 읽히지 않았다(표시해 둔 값이 그대로)            — 새로 읽히면 아래가 전부 날아간다
 *   - 장바구니 개수가 그대로
 *   - 열린 창이 아직 열려 있고, 쓰던 글이 그대로
 *   - 스크롤이 맨 위(0)로 튀지 않았다 — 폭이 바뀌면 줄 수가 바뀌어 같은 픽셀 자리일 수는 없다.
 *     그래서 「창을 닫았을 때 보던 상품 카드가 화면 안에 있나」로 본다
 *
 * 🔴 /api 는 전부 fixtures.cjs 의 가짜 응답이다 — 운영 백엔드를 부르지 않는다(로그인·검색 기록이 안 남는다).
 * 🔴 지금 앱(목업 반영 전)의 결과다. 앱 반영 때 같은 스크립트로 다시 돌린다 — 목업에는 상태가 없어 못 본다.
 *
 *   node scripts/shop-shots/check-rotate.cjs --self-test [--base …]
 *     → 자가 시험(2026-11-12 지시 8): 앱을 **일부러 망가뜨려**(회전할 때 페이지를 새로 읽음 · 장바구니가 빔 ·
 *       열린 창이 닫힘 · 쓰던 글이 지워짐 · 스크롤이 맨 위로 튐) 검사가 그것을 잡는지 본다. 하나라도 못 잡으면
 *       종료코드 1 — 못 잡는 검사기의 ✅ 는 아무 뜻이 없다. 망가뜨리기는 시험 브라우저 안의 init script 로만 한다
 *       (앱 빌드·운영은 건드리지 않는다). 먼저 멀쩡한 앱이 통과하는지 보고(전제), 그다음 사례를 돈다.
 */
require('../lib/msys-path.cjs');   // Git Bash 경로 변환 막기(/shop·/srm·/aram) — 2026-11-13 지시 6
const { chromium } = require('playwright');
const { route } = require('./fixtures.cjs');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:5311');
const ROUNDS = Number(arg('--rounds', 2));
const PORTRAIT = { width: 820, height: 1180 }, LANDSCAPE = { width: 1180, height: 820 };
const TYPED = '콜라 1.5L 있나요';

// 자가 시험 사례 — 창 크기가 바뀔 때(resize) 앱이 하면 안 되는 일을 브라우저 안에서 일부러 한다.
// __rotMark 는 준비가 끝난 뒤에 생기므로, 준비 단계의 크기 변화에는 망가뜨리지 않는다.
// expect: 그 회전에서 검사가 남겨야 하는 실패 문구(일부)
const BREAKERS = [
  { name: '회전할 때 페이지를 새로 읽으면', expect: '페이지가 새로 읽혔다',
    js: () => { window.addEventListener('resize', () => { if (window.__rotMark) location.reload(); }); } },
  { name: '회전할 때 장바구니가 비면', expect: '장바구니',
    js: () => { window.addEventListener('resize', () => {
      if (!window.__rotMark) return;
      const kill = () => document.querySelectorAll('.tabbar .bdg').forEach(el => { if (el.textContent !== '0') el.textContent = '0'; });
      kill(); new MutationObserver(kill).observe(document.body, { subtree: true, childList: true, characterData: true });
    }); } },
  { name: '회전할 때 열린 창이 닫히면', expect: '열린 창이 닫혔다',
    js: () => { window.addEventListener('resize', () => {
      if (!window.__rotMark) return;
      const st = document.createElement('style'); st.textContent = '[placeholder="메시지를 입력하세요"]{display:none !important}'; document.head.appendChild(st);
    }); } },
  { name: '회전할 때 쓰던 글이 지워지면', expect: '쓰던 글이 사라졌다',
    js: () => { window.addEventListener('resize', () => {
      if (!window.__rotMark) return;
      document.querySelectorAll('input, textarea').forEach(el => { if (el.placeholder === '메시지를 입력하세요') el.value = ''; });
    }); } },
  { name: '회전할 때 스크롤이 맨 위로 튀면', expect: '스크롤이 맨 위로 튀었다',
    js: () => { window.addEventListener('resize', () => { if (window.__rotMark) setTimeout(() => window.scrollTo(0, 0), 50); }); } },
];

async function run({ breaker = null, quiet = false } = {}) {
  const log = m => { if (!quiet) console.log(m); };
  const failText = [];
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: PORTRAIT, deviceScaleFactor: 1, isMobile: true, hasTouch: true, locale: 'ko-KR',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
  await ctx.addInitScript(() => { try { localStorage.setItem('guestStoreId', '11'); localStorage.setItem('srmart_pwa_dismissed_at', String(Date.now())); } catch (e) {} });
  if (breaker) await ctx.addInitScript(breaker.js);
  await ctx.route('**/*', async r => {
    const u = new URL(r.request().url());
    if (u.origin === new URL(BASE).origin && u.pathname.startsWith('/api/')) {
      // manyProducts — 태블릿 4칸에서도 홈이 한 화면을 넘게(묶음 2 부터 8개로는 스크롤이 안 생겨 「스크롤 튐」을 못 쟀다)
      const res = route(u.pathname.slice(4), r.request().method(), u.search, { manyProducts: true });
      if (res.delay) return;
      return r.fulfill({ status: res.status, contentType: 'application/json', body: JSON.stringify(res.body) });
    }
    if (u.origin !== new URL(BASE).origin) return r.abort();   // 외부(글꼴·우편번호)는 막는다
    return r.continue();
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(String(e.message).slice(0, 120)));
  const wait = ms => p.waitForTimeout(ms);
  const vis = (sel, text) => p.locator(sel, text ? { hasText: text } : {}).filter({ visible: true }).first();

  await p.goto(BASE.replace(/\/+$/, '') + '/', { waitUntil: 'domcontentloaded' }); await wait(1800);
  // ① 로그인 → 담기
  await vis('.app-nav button', '로그인').click();
  await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill('guest_demo');
  await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill('x');
  await p.getByRole('button', { name: '로그인', exact: true }).filter({ visible: true }).first().click(); await wait(900);
  const plus = p.locator('.pgrid .add');
  await plus.nth(0).click(); await wait(200); await plus.nth(1).click(); await wait(1700);
  await p.evaluate(() => { window.__rotMark = 'same-page'; });
  // ② 스크롤 — 홈을 내리고, 그때 화면 위쪽에 보이는 상품 카드를 표시해 둔다
  await p.evaluate(() => window.scrollTo(0, 700)); await wait(300);
  await p.evaluate(() => {
    const cards = [...document.querySelectorAll('.pgrid > *')];
    const c = cards.find(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
    if (c) c.setAttribute('data-rot-anchor', '1');
  });
  // ③ AI 상담 창 + 쓰다 만 글
  await p.getByRole('button', { name: 'AI 상담' }).filter({ visible: true }).first().click(); await wait(500);
  const box = p.getByPlaceholder('메시지를 입력하세요').filter({ visible: true }).first();
  await box.fill(TYPED);

  const read = () => p.evaluate((typed) => {
    const cnt = [...document.querySelectorAll('.tabbar .bdg')].find(el => el.offsetParent !== null);
    const inp = [...document.querySelectorAll('input, textarea')].find(el => el.placeholder === '메시지를 입력하세요' && el.offsetParent !== null);
    const anchor = document.querySelector('[data-rot-anchor]');
    return {
      mark: window.__rotMark || null,
      cart: cnt ? cnt.textContent.trim() : '0',
      dialog: !!inp, typed: inp ? inp.value === typed : false,
      scrollY: Math.round(window.scrollY), anchorRect: anchor ? Math.round(anchor.getBoundingClientRect().top) : null,
    };
  }, TYPED);
  const before = await read();
  log(`처음(태블릿 세로 820×1180): 장바구니 ${before.cart} · 창 ${before.dialog ? '열림' : '🔴닫힘'} · 글 ${before.typed ? '그대로' : '🔴없음'} · 스크롤 ${before.scrollY}`);
  if (before.cart !== '2' || !before.dialog || !before.typed) { await browser.close(); return { setupFailed: true, bad: 1, failText: ['준비 단계'] }; }

  let bad = 0;
  for (let i = 0; i < ROUNDS * 2; i++) {
    const land = i % 2 === 0;
    await p.setViewportSize(land ? LANDSCAPE : PORTRAIT); await wait(700);
    const now = await read();
    const fail = [];
    if (now.mark !== 'same-page') fail.push('페이지가 새로 읽혔다');
    if (now.cart !== before.cart) fail.push(`장바구니 ${before.cart}→${now.cart}`);
    if (!now.dialog) fail.push('열린 창이 닫혔다');
    else if (!now.typed) fail.push('쓰던 글이 사라졌다');
    if (now.scrollY === 0 && before.scrollY > 0) fail.push('스크롤이 맨 위로 튀었다');
    if (fail.length) { bad++; failText.push(...fail); }
    log(`${fail.length ? '🔴' : '✅'} ${i + 1}번째 → ${land ? '태블릿 가로 1180×820' : '태블릿 세로 820×1180'}: 장바구니 ${now.cart} · 창 ${now.dialog ? '열림' : '닫힘'} · 글 ${now.typed ? '그대로' : '없음'} · 스크롤 ${now.scrollY}${fail.length ? '  — ' + fail.join(', ') : ''}`);
  }
  // 창을 닫고 보던 상품이 화면 안에 있나(스크롤 자리)
  await p.keyboard.press('Escape'); await wait(300);
  const close = p.getByRole('button', { name: /닫기|✕|×/ }).filter({ visible: true });
  if (await close.count()) { await close.first().click().catch(() => {}); await wait(300); }
  const after = await read();
  const inView = after.anchorRect != null && after.anchorRect > -400 && after.anchorRect < PORTRAIT.height;
  log(`${inView ? '✅' : '⚠'} 창을 닫은 뒤 보던 상품 카드 위치: ${after.anchorRect}px (화면 높이 ${PORTRAIT.height}) — ${inView ? '화면 안' : '화면 밖 — 스크롤 자리를 잃었다(판단 필요)'}`);
  if (errors.length) { bad++; failText.push('스크립트 오류'); log('🔴 스크립트 오류: ' + errors.join(' / ')); }
  await browser.close();
  return { bad, failText };
}

(async () => {
  if (process.argv.includes('--self-test')) {
    const base = await run({ quiet: true });
    if (base.setupFailed || base.bad) { console.log(`🔴 자가 시험 전제 — 멀쩡한 앱이 이미 실패한다(${base.failText.join(', ')}). 본 검사부터 고친다`); process.exit(1); }
    console.log('  · 멀쩡한 앱 → 통과(전제 확인)');
    let missed = 0;
    for (const b of BREAKERS) {
      const r = await run({ breaker: b, quiet: true });
      const caught = !r.setupFailed && r.failText.some(t => t.includes(b.expect));
      if (!caught) missed++;
      const seen = r.setupFailed ? '준비 단계에서 멈춤' : ([...new Set(r.failText)].join(', ') || '실패 없음');
      console.log(`  ${caught ? '✅' : '🔴'} 「${b.name}」 → ${caught ? '잡았다' : '못 잡았다'} (${seen})`);
    }
    console.log(missed ? `🔴 자가 시험 — ${missed}건을 못 잡았다` : `🧪 자가 시험 ${BREAKERS.length}/${BREAKERS.length} — 망가뜨린 앱을 모두 잡았다`);
    process.exit(missed ? 1 : 0);
  }
  const r = await run();
  if (r.setupFailed) { console.log('🔴 준비 단계가 안 됐다(앱 화면이 바뀌었나) — 검사를 믿을 수 없다'); process.exit(1); }
  console.log(r.bad ? `🔴 회전 ${ROUNDS * 2}번 중 문제 ${r.bad}건` : `✅ 회전 ${ROUNDS * 2}번 — 장바구니·열린 창·쓰던 글·페이지 유지`);
  process.exit(r.bad ? 1 : 0);
})().catch(e => { console.error('🔴', e.message.split('\n')[0]); process.exit(1); });
