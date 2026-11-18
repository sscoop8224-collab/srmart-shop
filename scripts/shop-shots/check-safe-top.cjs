#!/usr/bin/env node
/**
 * 상태 줄(시계·배터리) 겹침 검사 — 아이폰처럼 위 안전 영역(safe-area-inset-top)이 있을 때 화면 맨 위 글자가 상태 줄 밑으로 들어가는지,
 * 그리고 「매장 미리보기 중」 띠와 그 아래 머리 사이가 너무 비는지 본다. (2026-11-19 밤샘 지시 6 — 대표님이 아이폰에서 찾음)
 *
 *   node scripts/shop-shots/check-safe-top.cjs --build <빌드 폴더> [--out <사진 폴더>] [--inset 47] [--only owner|customer] [--pages home,search]
 *   node scripts/shop-shots/check-safe-top.cjs --self-test
 *
 * 왜 이렇게 재나: 데스크톱 크롬은 env(safe-area-inset-top) 을 늘 0 으로 준다 → 그냥 찍으면 아이폰 겹침이 **절대 안 보인다**
 *   (그래서 그동안의 사진 검사가 다 통과했다). 그래서 빌드의 CSS·JS 를 내려줄 때 `env(safe-area-inset-top)` 을 아이폰 값(47px)으로
 *   바꿔 넣는다 — 앱이 쓰는 글자 그대로를 바꾸므로 앱 코드가 안전 영역을 **어디서 몇 번** 더하는지가 그대로 드러난다.
 *   사진에는 상태 줄(9:41 · 배터리)을 그려 넣는다(사람 눈 확인용 · 판정에는 안 쓴다).
 *
 * 판정(화면마다 · 맨 위로 스크롤한 상태):
 *   ① 겹침 — 보이는 글자·단추·입력칸·그림 중 위끝이 inset 보다 위(겹침 2px 넘게)인 것이 있으면 실패
 *   ② 빈 틈 — 「매장 미리보기 중」 띠가 있으면, 띠 아래끝과 그 아래 첫 내용 사이가 GAP_MAX(24px)보다 크면 실패
 *   ③ 띠 위치 — 띠가 있으면 띠의 위끝은 inset 아래여야 한다(①과 같지만 따로 적는다 — 이 사고의 모양)
 * /api 는 전부 가짜 응답(fixtures) — 「가짜 자료 기준」. 운영 서버는 부르지 않는다. 주소는 127.0.0.1 고정(listen-guard).
 */
require('../lib/msys-path.cjs');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);
const INSET = Number(arg('--inset', 47));
const GAP_MAX = 24;
const OVERLAP_TOL = 2;

/** 화면 안에서 재는 함수(문자열로 넘긴다 — 자가 시험도 같은 함수를 쓴다) */
const MEASURE = `(({ inset }) => {
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const isContent = (el) => {
    if (el.closest('[data-fake-status]')) return false;
    if (el.tagName === 'IMG' && el.getBoundingClientRect().width >= innerWidth * 0.9) return false;   // 화면 끝까지 차는 큰 사진(상품 상세 위)은 일부러 상태 줄 밑까지 깐다 — 글자가 아니다
    if (/^(BUTTON|INPUT|SELECT|TEXTAREA|IMG|svg)$/.test(el.tagName)) return true;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  };
  const els = [...document.querySelectorAll('body *')].filter((el) => isContent(el) && vis(el) && !el.closest('svg *'));
  const rects = els.map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.bottom > 0 && r.top < innerHeight);
  const overlap = rects.filter(({ r }) => r.top < inset - ${OVERLAP_TOL}).map(({ el, r }) => ({ tag: el.tagName, text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20), top: Math.round(r.top) }));
  const band = document.querySelector('.owner .notice');
  let bandInfo = null;
  if (band && vis(band)) {
    const br = band.getBoundingClientRect();
    const below = rects.filter(({ el, r }) => !band.contains(el) && r.top >= br.bottom - 1).sort((a, b) => a.r.top - b.r.top)[0];
    bandInfo = { top: Math.round(br.top), bottom: Math.round(br.bottom), nextTop: below ? Math.round(below.r.top) : null, nextText: below ? (below.el.textContent || below.el.getAttribute('aria-label') || below.el.tagName).trim().slice(0, 20) : null };
    bandInfo.gap = bandInfo.nextTop == null ? null : bandInfo.nextTop - bandInfo.bottom;
  }
  const firstTop = rects.length ? Math.round(Math.min(...rects.filter(({ el }) => !(band && band.contains(el))).map(({ r }) => r.top))) : null;
  return { overlap: overlap.slice(0, 6), overlapCount: overlap.length, band: bandInfo, firstTop };
})`;

// base = 같은 화면을 띠 없이 잰 값. 있으면 「띠가 없을 때보다 더 비는가」로 본다(큰 제목 위 빈 머리 줄 같은 화면 본래 여백은 빈 틈이 아니다).
// 없으면(--only owner) 고정 한도 GAP_MAX 로 본다.
function judge(m, inset = INSET, base = null) {
  const fails = [];
  if (m.band && m.band.top < inset - OVERLAP_TOL) fails.push(`띠가 상태 줄과 겹침(띠 위끝 ${m.band.top}px < ${inset}px)`);
  if (m.overlapCount) fails.push(`상태 줄과 겹치는 글자·단추 ${m.overlapCount}개 — ${m.overlap.map((o) => `${o.tag}「${o.text}」@${o.top}`).join(' · ')}`);
  const allow = base && base.firstTop != null ? Math.max(0, base.firstTop - inset) + 8 : GAP_MAX;
  if (m.band && m.band.gap != null && m.band.gap > allow) fails.push(`띠와 아래 머리 사이 ${m.band.gap}px(> ${allow}${base ? ' = 띠 없을 때 여백 + 8' : ''}) — 「${m.band.nextText}」`);
  return fails;
}

const FAKE_STATUS = (inset) => `(() => { const add = () => { if (document.querySelector('[data-fake-status]')) return;
  const d = document.createElement('div'); d.setAttribute('data-fake-status', '');
  d.style.cssText = 'position:fixed;left:0;right:0;top:0;height:${inset}px;z-index:2147483647;pointer-events:none;display:flex;align-items:center;justify-content:space-between;padding:6px 30px 0;font:600 16px -apple-system,sans-serif;color:#000;mix-blend-mode:normal;outline:1px dashed rgba(255,0,0,.55);outline-offset:-1px';
  d.innerHTML = '<span>9:41</span><span>▂▄▆ ▮▮▮▯</span>'; document.documentElement.appendChild(d); };
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add); })()`;

async function selfTest() {
  const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const cases = [
    // 이번 사고 모양: 띠가 맨 위(안전 영역 없음) + 아래 머리가 안전 영역을 또 더함 → 겹침 + 빈 틈
    ['사고 모양', `<div class="owner"><div class="notice">매장 미리보기 중</div></div><header style="padding-top:${INSET}px"><h1>장바구니</h1></header>`, 2],
    ['고친 모양', `<div class="owner" style="padding-top:${INSET}px"><div class="notice">매장 미리보기 중</div></div><header style="padding-top:8px"><h1>장바구니</h1></header>`, 0],
    ['띠 없음 · 정상', `<header style="padding-top:${INSET}px"><h1>홈</h1></header>`, 0],
    ['띠 없음 · 머리가 겹침', `<header style="padding-top:0"><h1>홈</h1></header>`, 1],
  ];
  let ok = 0;
  for (const [name, html, want] of cases) {
    await p.setContent(`<style>h1{margin:0}</style><body style="margin:0">${html}</body>`);
    const m = await p.evaluate(`${MEASURE}(${JSON.stringify({ inset: INSET })})`);
    const got = judge(m).length; const pass = want ? got >= want : got === 0;
    console.log(`  ${pass ? '✅' : '🔴'} ${name} — 실패 ${got}건(기대 ${want ? want + '건 이상' : 0})`); if (pass) ok++;
  }
  await b.close();
  console.log(`🧪 자가 시험 ${ok}/${cases.length}`); return ok === cases.length;
}

async function run() {
  const BUILD = path.resolve(arg('--build', path.join(ROOT, 'build')));
  const OUT = arg('--out', null);
  if (OUT) fs.mkdirSync(OUT, { recursive: true });
  const PORT = Number(arg('--port', 5363));
  const only = arg('--only', null);
  const pickPages = arg('--pages', null);
  const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
  const { route } = require(path.join(__dirname, 'fixtures.cjs'));
  const guard = 'C:/srmart/srmart-backend/tools/listen-guard.cjs';
  const srv = spawn(process.execPath, [...(fs.existsSync(guard) ? ['-r', guard] : []), path.join(__dirname, 'serve-static.cjs'), BUILD, String(PORT)], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1500));
  const browser = await chromium.launch();
  const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
  const wait = (p, ms) => p.waitForTimeout(ms);
  const tab = async (p, t) => { await p.locator('.tabbar .tab', { hasText: t }).filter({ visible: true }).first().click(); await wait(p, 1200); };
  const row = async (p, t) => { await tab(p, '마이'); const el = p.locator('button.row .lbl').filter({ hasText: new RegExp('^' + t) }).filter({ visible: true }).first();
    // 줄 이름 + 작은 설명이 한 칸이라 exact 로는 못 찾는다 · 아래 탭바가 덮지 않게 가운데로 굴린 뒤 누른다
    await el.evaluate((n) => n.scrollIntoView({ block: 'center' })); await wait(p, 300); await el.click(); await wait(p, 1200); };
  const PAGES = [
    ['home', async () => {}],
    ['search', async (p) => tab(p, '검색')],
    ['cart', async (p) => tab(p, '장바구니')],
    ['orderSheet', async (p) => { await tab(p, '장바구니'); await p.getByRole('button', { name: /주문하기/ }).filter({ visible: true }).first().click(); await wait(p, 1500); }],
    ['orders', async (p) => tab(p, '주문내역')],
    ['mypage', async (p) => tab(p, '마이')],
    ['productDetail', async (p) => { await tab(p, '홈'); await p.locator('.pc').first().click(); await wait(p, 1500); }],
    ['quickOrder', async (p) => { await tab(p, '홈'); await p.locator('.pc').first().click(); await wait(p, 1200); await p.getByRole('button', { name: '바로 주문', exact: true }).filter({ visible: true }).first().click(); await wait(p, 1500); }],
    ['wishlist', async (p) => row(p, '찜')],
    ['recentViews', async (p) => row(p, '최근 본 상품')],
    ['myReviews', async (p) => row(p, '내 리뷰')],
    ['notificationSettings', async (p) => row(p, '알림 설정')],
    ['notice', async (p) => row(p, '공지사항')],
    ['about', async (p) => row(p, '회사 소개·사업자 정보')],
    ['receipt', async (p) => { await tab(p, '장바구니'); await p.getByRole('button', { name: /주문하기/ }).filter({ visible: true }).first().click(); await wait(p, 1500); await p.getByRole('button', { name: /결제하기/ }).filter({ visible: true }).first().click(); await wait(p, 2000); }],
  ].filter(([id]) => !pickPages || pickPages.split(',').includes(id));
  const results = [];
  const baseOf = {};
  for (const mode of ['customer', 'owner'].filter((m) => !only || m === only)) {
    for (const [id, go] of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: 'block', userAgent: UA });
      await ctx.addInitScript(() => { try { localStorage.setItem('guestStoreId', '11'); localStorage.setItem('srmart_pwa_dismissed_at', String(Date.now())); } catch (e) { /* */ } window.open = () => null; });
      await ctx.addInitScript(FAKE_STATUS(INSET));
      const opts = { cartPreset: 'promo', _cart: {} };
      await ctx.route('**/*', async (r) => {
        const req = r.request(); const u = new URL(req.url());
        // 결제 준비(웹 localhost:5001) — 가짜로 「됐다」 (주문 완료 화면까지 가려는 것 · 결제는 안 일어난다)
        if (u.hostname === 'localhost' && u.port === '5001') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ tid: 'T', next_redirect_pc_url: 'about:blank', next_redirect_mobile_url: 'about:blank' }) });
        if (u.port === String(PORT) && u.pathname.startsWith('/api/')) {
          let body = null; try { body = JSON.parse(req.postData() || 'null'); } catch (e) { body = null; }
          const res = route(u.pathname.slice(4), req.method(), u.search, opts, body);
          if (!res || res.delay) return r.abort();
          let out = res.body;
          if (mode === 'owner' && out && out.user) out = { ...out, user: { ...out.user, role: 'owner', store_id: 1 } };
          if (mode === 'owner' && /\/(me|users\/me|auth\/me)$/.test(u.pathname) && out && out.role) out = { ...out, role: 'owner', store_id: 1 };
          return r.fulfill({ status: res.status || 200, contentType: 'application/json', body: JSON.stringify(out) });
        }
        if (u.port === String(PORT) && /\.(css|js)$/.test(u.pathname)) {
          const resp = await r.fetch(); let text = await resp.text();
          text = text.split('env(safe-area-inset-top)').join(`${INSET}px`);
          return r.fulfill({ response: resp, body: text });
        }
        if (u.port === String(PORT)) return r.continue();
        return r.abort();
      });
      const p = await ctx.newPage();
      let status = 'ok', fails = [], m = null;
      try {
        await p.goto(`http://127.0.0.1:${PORT}/`); await wait(p, 2200);
        await p.locator('.app-nav button', { hasText: '로그인' }).first().click(); await wait(p, 800);
        await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill(mode === 'owner' ? 'owner_demo' : 'kimmem');
        await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill('k' + require('crypto').randomBytes(6).toString('hex') + '7!');
        await p.getByRole('button', { name: /^로그인$/ }).filter({ visible: true }).first().click(); await wait(p, 1800);
        await go(p);
        await p.evaluate(() => window.scrollTo(0, 0)); await wait(p, 300);
        m = await p.evaluate(`${MEASURE}(${JSON.stringify({ inset: INSET })})`);
        if (mode === 'customer') baseOf[id] = m;
        fails = judge(m, INSET, mode === 'owner' ? baseOf[id] || null : null);
        if (mode === 'owner' && !m.band) fails.push('「매장 미리보기 중」 띠가 안 보임(띠 있는 경우를 못 잼)');
        if (OUT) await p.screenshot({ path: path.join(OUT, `${mode === 'owner' ? '띠있음' : '띠없음'}_${id}.png`) });
      } catch (e) { status = 'nav'; fails = [`화면에 못 감: ${String(e.message).split('\n')[0].slice(0, 80)}`]; }
      results.push({ mode, id, status, fails, band: m && m.band });
      console.log(`  ${fails.length ? '🔴' : '✅'} ${mode === 'owner' ? '띠 있음' : '띠 없음'} · ${id}${fails.length ? ' — ' + fails.join(' / ') : ''}${m && m.band ? ` (띠 ${m.band.top}~${m.band.bottom} · 아래 ${m.band.nextTop})` : ''}`);
      await ctx.close();
    }
  }
  await browser.close(); srv.kill();
  const bad = results.filter((r) => r.fails.length);
  console.log(`${bad.length ? '🔴' : '✅'} 상태 줄 검사(inset ${INSET}px · 가짜 자료 기준) — ${results.length}개 중 실패 ${bad.length}`);
  if (OUT) fs.writeFileSync(path.join(OUT, 'result.json'), JSON.stringify(results, null, 2));
  return bad.length === 0;
}

(async () => {
  if (has('--self-test')) process.exit((await selfTest()) ? 0 : 1);
  process.exit((await run()) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
