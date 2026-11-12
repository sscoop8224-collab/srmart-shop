#!/usr/bin/env node
/**
 * 묶음 비교 사진 — 「목업 | 앱 | 차이(빨강)」 를 화면마다 세 크기 × 밝게·어둡게로 찍고 픽셀 차이를 잰다.
 * (2026-11-12 밤 지시 5 — 묶음마다 docs/shots/compare/bundleN/ 에 시트로 모은다)
 *
 *   node scripts/shop-shots/compare-bundle.cjs --bundle 1 [--base http://127.0.0.1:5312]
 *
 * - 앱은 serve-static.cjs 로 127.0.0.1 에 띄운 **로컬 빌드**를 본다(운영 build·pm2 는 건드리지 않는다).
 * - 🔴 /api 는 전부 fixtures.cjs 의 가짜 응답이다 — 운영 백엔드를 부르지 않는다(로그인·검색 기록이 안 남는다).
 * - 목업은 file:// 로 ?solo=ID&theme=&state= 를 연다.
 * - 크기: 폰 세로 390×844(배율 2) · 태블릿 세로 820×1180 · 태블릿 가로 1180×820 (SHOP_DESIGN_TOKENS 5절 기본 시트)
 * - 차이: 같은 크기로 맞춘 두 사진에서 R·G·B 중 하나라도 32 넘게 다른 점의 비율(%).
 *   🔴 이 숫자는 「얼마나 같은가」의 대략이다 — 목업에는 기기 액자(상태바 시계·홈 막대)가 있고 앱에는 없어서 0 이 될 수 없다.
 *   그래서 화면 전체 말고 **부품만 잘라 비교하는 칸**(헤더·탭바처럼 selector 를 준 것)을 같이 둔다.
 *
 * 나오는 것:
 *   docs/shots/app/<ID>_<theme>.png · <ID>_tland_<theme>.png · <ID>_tablet_<theme>.png   (앱 사진)
 *   docs/shots/compare/<ID>_<theme>.png · <ID>_tland_<theme>.png                         (목업|앱 두 칸 — check-progress.js 가 본다)
 *   docs/shots/compare/bundleN/<ID>_<size>_<theme>_diff.png                              (빨간 표시)
 *   docs/shots/compare/bundleN/sheet_<theme>.png · report.json · report.md                (시트·숫자)
 */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const sharp = require('sharp');
const { route, customer } = require('./fixtures.cjs');

const ROOT = path.join(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:5312');
const BUNDLE = arg('--bundle', '1');
const MOCK = pathToFileURL(arg('--mockup', 'C:/srmart/srmart-shop-mockup/index.html')).href;
const APP_DIR = path.join(ROOT, 'docs/shots/app');
const CMP_DIR = path.join(ROOT, 'docs/shots/compare');
const OUT = path.join(CMP_DIR, `bundle${BUNDLE}`);

const SIZES = [
  { key: 'phone', tag: '', label: '폰 세로', viewport: { width: 390, height: 844 }, dsf: 2 },
  { key: 'tablet', tag: 'tablet_', label: '태블릿 세로', viewport: { width: 820, height: 1180 }, dsf: 1 },
  { key: 'tland', tag: 'tland_', label: '태블릿 가로', viewport: { width: 1180, height: 820 }, dsf: 1 },
];
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 12; SM-A125N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const wait = (p, ms) => p.waitForTimeout(ms);

async function login(p) {
  await p.locator('.app-nav button', { hasText: '로그인' }).click();
  await p.getByPlaceholder('아이디를 입력해주세요').fill('guest_demo');
  await p.getByPlaceholder('비밀번호를 입력해주세요').fill('x');
  await p.getByRole('button', { name: '로그인', exact: true }).filter({ visible: true }).first().click();
  await wait(p, 900);
}
const tab = (p, label) => p.locator('.tabbar .tab', { hasText: label }).first();

/**
 * 묶음별 화면. state = 목업 상태 이름, go = 앱에서 그 화면까지 손님처럼 누르기,
 * part = 부품만 잘라 비교(목업 selector, 앱 selector), opts = 가짜 API 설정.
 */
const BUNDLES = {
  1: [
    { id: 'S34', name: '확인창 — 안내(로그인이 필요해요)', state: '안내', go: async p => { await tab(p, '장바구니').click(); await wait(p, 500); }, part: ['.alert', '.alert'] },
    { id: 'S35', name: '토스트 — 담김', state: '담김', go: async p => { await login(p); await p.locator('.product-grid button', { hasText: '+' }).first().click(); await wait(p, 300); }, part: ['.toast', '.toast'] },
    { id: 'S36', name: '오프라인', state: '기본', go: async (p, c) => { await c.setOffline(true); await wait(p, 900); } },
    { id: 'S43', name: '불러오는 중(화면 조각을 받는 동안)', go: async (p, c, ctl) => { ctl.holdChunks = true; await tab(p, '검색').click(); await wait(p, 700); } },
    { id: 'P05H', mock: 'P05', name: '홈 헤더(로그인 안 함)', state: '로그인 안 함', go: async () => {}, part: ['.homebar', '.homebar'], partOnly: true },
    { id: 'P05T', mock: 'P05', name: '하단 탭바(홈)', state: '로그인 안 함', go: async () => {}, part: ['.tabbar .in', '.tabbar .in'], partOnly: true },
  ],
};

async function shootMock(browser, s, size, theme) {
  const ctx = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.dsf, colorScheme: theme });
  await ctx.route('**/*', r => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  await p.goto(`${MOCK}?solo=${s.mock || s.id}&theme=${theme}${s.state ? `&state=${encodeURIComponent(s.state)}` : ''}`);
  await wait(p, 500);
  const full = await p.screenshot();
  const part = s.part ? await p.locator(s.part[0]).first().screenshot().catch(() => null) : null;
  await ctx.close();
  return { full, part };
}

async function shootApp(browser, s, size, theme) {
  const ctx = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.dsf, isMobile: true, hasTouch: true, userAgent: ANDROID_UA, colorScheme: theme, locale: 'ko-KR' });
  await ctx.addInitScript(() => { try { localStorage.setItem('guestStoreId', '11'); localStorage.setItem('srmart_pwa_dismissed_at', String(Date.now())); window.open = () => null; } catch (e) {} });
  const ctl = { holdChunks: false };
  await ctx.route('**/*', async (r) => {
    const u = new URL(r.request().url());
    if (u.origin === new URL(BASE).origin && u.pathname.startsWith('/api/')) {
      const res = route(u.pathname.slice(4), r.request().method(), u.search, s.opts || {});
      if (res.delay) return;
      return r.fulfill({ status: res.status, contentType: 'application/json', body: JSON.stringify(res.body) });
    }
    if (ctl.holdChunks && /\.chunk\.js$/.test(u.pathname)) return;   // 조각을 끝까지 안 준다 → 불러오는 중 화면
    if (u.origin !== new URL(BASE).origin) return r.abort();          // 외부(글꼴·우편번호·사진 CDN)는 막는다 — 사진이 그날 인터넷에 좌우되지 않게
    return r.continue();
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(String(e.message).slice(0, 120)));
  try {
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(p, 1800);
    await s.go(p, ctx, ctl);
    const full = await p.screenshot();
    const part = s.part ? await p.locator(s.part[1]).filter({ visible: true }).first().screenshot().catch(() => null) : null;
    return { full, part, errors };
  } finally { await ctx.close(); }
}

// 두 사진을 같은 크기(목업 기준)로 맞추고 차이 비율 + 빨간 표시 사진
async function diff(a, b) {
  const ma = await sharp(a).metadata();
  const W = ma.width, H = ma.height;
  const ra = await sharp(a).ensureAlpha().raw().toBuffer();
  const rb = await sharp(b).resize(W, H, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
  const out = Buffer.alloc(W * H * 4);
  let n = 0;
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    const d = Math.max(Math.abs(ra[o] - rb[o]), Math.abs(ra[o + 1] - rb[o + 1]), Math.abs(ra[o + 2] - rb[o + 2]));
    if (d > 32) { n++; out[o] = 255; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 255; }
    else { const g = Math.round((rb[o] + rb[o + 1] + rb[o + 2]) / 3 * 0.35 + 165); out[o] = g; out[o + 1] = g; out[o + 2] = g; out[o + 3] = 255; }
  }
  const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
  return { pct: Math.round((n / (W * H)) * 1000) / 10, png };
}

const small = buf => sharp(buf).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();

// 두 칸(목업|앱) 사진 — check-progress.js 가 보는 compare/<ID>_<theme>.png
async function sideBySide(a, b) {
  const ma = await sharp(a).metadata();
  const bb = await sharp(b).resize(ma.width, ma.height, { fit: 'fill' }).toBuffer();
  const gap = 16;
  return sharp({ create: { width: ma.width * 2 + gap, height: ma.height, channels: 3, background: { r: 128, g: 128, b: 128 } } })
    .composite([{ input: a, left: 0, top: 0 }, { input: bb, left: ma.width + gap, top: 0 }]).png({ palette: true, compressionLevel: 9 }).toBuffer();
}

async function sheet(browser, rows, theme) {
  const cells = rows.filter(r => r.theme === theme);
  const ids = [...new Set(cells.map(c => c.id))];
  const rel = f => pathToFileURL(f).href;
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;font:14px/1.4 -apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;background:${theme === 'dark' ? '#111' : '#f4f4f6'};color:${theme === 'dark' ? '#eee' : '#111'}}
    h1{font-size:20px;margin:0 0 4px} p.n{margin:0 0 16px;color:#888}
    .row{margin:0 0 28px} .row h2{font-size:16px;margin:0 0 8px}
    .sz{display:inline-block;vertical-align:top;margin:0 18px 0 0}
    .sz b{display:block;margin:0 0 4px} .trip{display:flex;gap:6px} .trip figure{margin:0}
    .trip img{height:300px;border:1px solid #888;display:block} figcaption{font-size:12px;color:#888;text-align:center}
    .pct{font-weight:700;color:#e33}
  </style><h1>묶음 ${BUNDLE} 비교 — ${theme === 'dark' ? '어둡게' : '밝게'} · 목업 | 앱 | 차이(빨강)</h1>
  <p class="n">차이 % = 목업 크기로 맞춘 두 사진에서 다른 점의 비율. 전체 칸은 목업 기기 액자(상태바 시계·홈 막대) 때문에 0 이 될 수 없다 — 「부품」 칸이 진짜 비교다.</p>
  ${ids.map(id => { const rs = cells.filter(c => c.id === id); return `<div class="row"><h2>${id} ${rs[0].name}</h2>${rs.map(c => `<div class="sz"><b>${c.label}${c.part ? ' · 부품' : ''} <span class="pct">${c.pct}%</span></b><div class="trip"><figure><img src="${rel(c.mockFile)}"><figcaption>목업</figcaption></figure><figure><img src="${rel(c.appFile)}"><figcaption>앱</figcaption></figure><figure><img src="${rel(c.diffFile)}"><figcaption>차이</figcaption></figure></div></div>`).join('')}</div>`; }).join('')}`;
  const f = path.join(OUT, `_sheet_${theme}.html`);
  fs.writeFileSync(f, html);
  const ctx = await browser.newContext({ viewport: { width: 2400, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(rel(f));
  await wait(p, 600);
  const buf = await p.screenshot({ fullPage: true });
  await ctx.close();
  fs.writeFileSync(path.join(OUT, `sheet_${theme}.png`), await small(buf));
  fs.unlinkSync(f);
}

(async () => {
  const list = BUNDLES[BUNDLE];
  if (!list) throw new Error(`묶음 ${BUNDLE} 화면 목록이 없다`);
  for (const d of [APP_DIR, CMP_DIR, OUT, path.join(OUT, 'parts')]) fs.mkdirSync(d, { recursive: true });
  const browser = await chromium.launch();
  const rows = [];
  for (const s of list) {
    for (const size of SIZES) for (const theme of ['light', 'dark']) {
      const m = await shootMock(browser, s, size, theme);
      let a;
      try { a = await shootApp(browser, s, size, theme); } catch (e) { console.log(`🔴 ${s.id} ${size.label} ${theme} 앱 사진 실패 — ${e.message.split('\n')[0]}`); continue; }
      const base = `${s.id}_${size.tag}${theme}`;
      if (!s.partOnly) {
        const appFile = path.join(APP_DIR, `${base}.png`);
        fs.writeFileSync(appFile, await small(a.full));
        if (size.key !== 'tablet') fs.writeFileSync(path.join(CMP_DIR, `${base}.png`), await sideBySide(m.full, a.full));
        const dd = await diff(m.full, a.full);
        const mockFile = path.join(OUT, `${base}_mock.png`), diffFile = path.join(OUT, `${base}_diff.png`), appCopy = path.join(OUT, `${base}_app.png`);
        fs.writeFileSync(mockFile, await small(m.full)); fs.writeFileSync(diffFile, await small(dd.png)); fs.writeFileSync(appCopy, await small(a.full));
        rows.push({ id: s.id, name: s.name, theme, size: size.key, label: size.label, part: false, pct: dd.pct, mockFile, appFile: appCopy, diffFile, errors: a.errors });
      }
      if (m.part && a.part) {
        const dd = await diff(m.part, a.part);
        const pb = path.join(OUT, 'parts', base);
        fs.writeFileSync(pb + '_mock.png', m.part); fs.writeFileSync(pb + '_app.png', a.part); fs.writeFileSync(pb + '_diff.png', dd.png);
        rows.push({ id: s.id, name: s.name, theme, size: size.key, label: size.label, part: true, pct: dd.pct, mockFile: pb + '_mock.png', appFile: pb + '_app.png', diffFile: pb + '_diff.png', errors: a.errors });
      } else if (s.part) {
        console.log(`⚠ ${s.id} ${size.label} ${theme} 부품을 못 찾았다(목업 ${m.part ? '있음' : '없음'} · 앱 ${a.part ? '있음' : '없음'})`);
      }
    }
    const mine = rows.filter(r => r.id === s.id);
    console.log(`${s.id} ${s.name} — ${mine.map(r => `${r.label}${r.part ? '·부품' : ''}·${r.theme === 'dark' ? '어둡게' : '밝게'} ${r.pct}%`).join(' | ')}${mine.some(r => r.errors.length) ? ' 🔴 스크립트 오류: ' + [...new Set(mine.flatMap(r => r.errors))].join(' / ') : ''}`);
  }
  for (const t of ['light', 'dark']) await sheet(browser, rows, t);
  await browser.close();
  const relp = f => path.relative(ROOT, f).split(path.sep).join('/');
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rows.map(r => ({ ...r, mockFile: relp(r.mockFile), appFile: relp(r.appFile), diffFile: relp(r.diffFile) })), null, 1));
  const md = [`# 묶음 ${BUNDLE} 픽셀 차이 (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)`, '', '| 화면 | 크기 | 비교 | 밝게 % | 어둡게 % |', '|---|---|---|---|---|'];
  for (const s of list) for (const size of SIZES) for (const part of [false, true]) {
    const l = rows.find(r => r.id === s.id && r.size === size.key && r.part === part && r.theme === 'light');
    const d = rows.find(r => r.id === s.id && r.size === size.key && r.part === part && r.theme === 'dark');
    if (l || d) md.push(`| ${s.id} ${s.name} | ${size.label} | ${part ? '부품' : '화면 전체'} | ${l ? l.pct : '-'} | ${d ? d.pct : '-'} |`);
  }
  fs.writeFileSync(path.join(OUT, 'report.md'), md.join('\n') + '\n');
  console.log('저장: ' + relp(OUT));
})().catch(e => { console.error('🔴', e); process.exit(1); });
