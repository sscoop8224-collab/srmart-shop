#!/usr/bin/env node
/**
 * 🔴 브랜드 화면 검사 — **운영과 같은 응답**으로 돌린다 (2026-11-17 밤샘 지시 2 · 대표 실물 확인에서 나옴)
 *
 *   node scripts/shop-shots/check-brand-live.cjs --build <빌드 폴더> [--brand aram] [--api http://127.0.0.1:5000]
 *        [--uploads D:/srmart_uploads] [--out <사진 폴더>] [--store <매장 id>] [--strict-data]
 *   node scripts/shop-shots/check-brand-live.cjs --self-test
 *
 * 왜: 2026-11-16 운영 /aram/ 에 에스알마트 로고·아이콘·「SR Mart에 오신 것을 환영해요!」 가 나갔다. 그 전날 밤 점검은
 *   ⑴ 글자만 셌고(그림은 아무도 안 봤다) ⑵ 화면은 **가짜 응답**으로 찍었다 — 가짜 배너에는 「SR Mart」 가 없었다.
 *   그래서 이 검사는 빌드 폴더를 127.0.0.1 에 띄우고, 화면이 부르는 /api 를 **운영 백엔드의 같은 주소**로 넘긴다.
 *
 * 무엇을 보나(브랜드 X 빌드에 다른 브랜드가 나오는가)
 *   - 화면 글자·대체글: 다른 브랜드 이름(에스알마트 · SR마트 · SR Mart · SRM / 아람마트 · Aram Mart)
 *       그 글자가 **서버 응답 안에 있으면 「자료」**(어드민에서 범위·문구를 고칠 것) · 없으면 **「빌드」(실패)**
 *   - 화면이 실제로 받은 그림: 다른 브랜드 그림과 바이트가 같으면 실패(scripts/brand-assets.cjs)
 *   - manifest·index.html 의 아이콘 · manifest theme_color(brand.json colors.splashBackground 와 같아야)
 *   - 화면 색 토큰 --brand: brand.json colors.screen 이 있으면 같아야 하고, 없으면 「정할 것」 으로만 적는다(대표 결정 대기)
 *
 * 🔴 운영에 쓰지 않는다
 *   - /api 는 **GET 이고 아래 ALLOW 에 있는 주소만** 넘긴다. 하나하나 핸들러·앞단 미들웨어에 INSERT/UPDATE/DELETE 가
 *     없음을 확인한 주소다(2026-11-17). 그 밖(POST·로그인·검색어 넣기 등)은 403 으로 막고 「막은 주소」 로 적는다.
 *   - 로그인하지 않는다(로그인 기록·잠금이 남는다). 검색어를 넣지 않는다(search_logs).
 *   - /uploads 는 디스크에서 읽기만.  - 🔴 주소는 127.0.0.1 고정.
 *
 * 끝: 빌드 몫 실패 1건 이상 → 종료코드 1. 화면을 못 돌았거나(홈이 안 뜸·응답 0) 서버에 못 붙으면 → 1(못 셌으면 통과 아님).
 *     자료 몫은 적기만 한다(배포가 고칠 수 없다) — --strict-data 를 주면 그것도 1.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { URL } = require('url');
const { foreignImages, md5 } = require('../brand-assets.cjs');

const ROOT = path.join(__dirname, '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const has = (k) => process.argv.includes(k);

// 핸들러에 쓰기가 없음을 확인한 GET 주소(숫자 자리는 :id) — 새 주소를 넣을 때는 핸들러와 앞단 미들웨어를 먼저 읽는다
const ALLOW = new Set([
  '/api/splash-ads', '/api/shop/business-info', '/api/signup-coupon', '/api/categories', '/api/banners',
  '/api/stores', '/api/stores/:id/delivery-promise', '/api/products/active', '/api/search/popular',
  '/api/shop/notices', '/api/shop/faqs', '/api/shop/seller-tax',
]);
const WORDS = {
  aram: /에스알마트|SR\s?마트|SR\s?Mart|\bSRM\b/i,
  srm: /아람마트|Aram\s?Mart/i,
};
const UPSTREAM_MAX = 40;   // 한 판에 운영으로 넘기는 최대 횟수(전역 한도 분당 100의 절반 아래)
const norm = (p) => p.replace(/\/\d+(?=\/|$)/g, '/:id');
const decode = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain' };

/** 빌드 폴더 + /api 넘기기 서버 */
function startServer({ build, prefix, api, uploads, rec }) {
  const apiUrl = new URL(api);
  const lib = apiUrl.protocol === 'https:' ? require('https') : http;
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname.startsWith('/api/')) {
      const key = norm(u.pathname);
      if (req.method !== 'GET' || !ALLOW.has(key)) { rec.blocked.set(`${req.method} ${key}`, (rec.blocked.get(`${req.method} ${key}`) || 0) + 1); res.writeHead(403, { 'content-type': 'application/json' }); return res.end('{"error":"brand-live-check: 막은 주소"}'); }
      const headers = { 'user-agent': 'SRM-BrandLiveCheck', accept: 'application/json' };
      if (req.headers['x-shop-brand']) headers['x-shop-brand'] = req.headers['x-shop-brand'];
      // 🔴 운영 한도를 지킨다(2026-11-17 실측) — 백엔드 전역 한도는 「IP당 분당 100회」이고 127.0.0.1 은 watchdog 의
      //    health 확인과 **같은 칸**이다. 첫 판은 화면 17개가 같은 주소를 167번 불러 한도에 걸렸고(화면이 「상품을 불러오지
      //    못했어요」로 찍혔다), watchdog 이 429 를 두 번 받았다(1/3 · 알림 없음). 그래서 ⑴ 같은 주소·같은 브랜드는 한 번만
      //    넘기고 나머지는 그 응답을 다시 쓴다 ⑵ 넘기는 사이 300ms ⑶ 한 판에 UPSTREAM_MAX 번을 넘기면 더 넘기지 않고 실패로 친다.
      const ck = `${u.pathname}${u.search}|${headers['x-shop-brand'] || ''}`;
      const send = (c) => { res.writeHead(c.status, { 'content-type': c.ctype }); res.end(c.body); };
      if (rec.cache.has(ck)) { rec.cache.get(ck).then(send); return undefined; }
      if (rec.upstream >= UPSTREAM_MAX) { rec.apiErrors.push(`운영으로 넘긴 횟수 ${UPSTREAM_MAX} 초과 — 더 넘기지 않음(${key})`); res.writeHead(503); return res.end(); }
      rec.upstream++;
      const p = (rec.chain = rec.chain.then(() => new Promise((r0) => setTimeout(r0, 300))).then(() => new Promise((done) => {
        const up = lib.request({ protocol: apiUrl.protocol, hostname: apiUrl.hostname, port: apiUrl.port, path: u.pathname + u.search, method: 'GET', headers, timeout: 15000 }, (r) => {
          const chunks = []; r.on('data', (d) => chunks.push(d));
          r.on('end', () => {
            const body = Buffer.concat(chunks);
            rec.passed.set(`GET ${key}`, (rec.passed.get(`GET ${key}`) || 0) + 1);
            if (r.statusCode === 200) rec.ok++;
            if (r.statusCode === 429) rec.apiErrors.push(`운영 한도(429)에 걸렸다 — ${key}`);
            rec.bodies.push({ path: u.pathname + u.search, text: decode(body.toString('utf8')) });
            done({ status: r.statusCode, ctype: r.headers['content-type'] || 'application/json', body });
          });
        });
        up.on('timeout', () => up.destroy(new Error('timeout')));
        up.on('error', (e) => { rec.apiErrors.push(`${key}: ${e.message}`); done({ status: 502, ctype: 'text/plain', body: Buffer.alloc(0) }); });
        up.end();
      })));
      rec.cache.set(ck, p);
      p.then(send);
      return undefined;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    if (u.pathname.startsWith('/uploads/') && uploads) {
      const f = path.join(uploads, decodeURIComponent(u.pathname.slice('/uploads/'.length)));
      if (!f.startsWith(path.resolve(uploads)) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' }); return fs.createReadStream(f).pipe(res);
    }
    if (u.pathname === prefix) { res.writeHead(301, { location: prefix + '/' }); return res.end(); }
    if (!u.pathname.startsWith(prefix + '/')) { res.writeHead(404); return res.end(); }
    let rel = decodeURIComponent(u.pathname.slice(prefix.length + 1)) || 'index.html';
    let f = path.join(build, rel);
    if (!path.resolve(f).startsWith(path.resolve(build))) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { if (path.extname(rel)) { res.writeHead(404); return res.end(); } f = path.join(build, 'index.html'); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((ok, bad) => { srv.on('error', bad); srv.listen(0, '127.0.0.1', () => ok(srv)); });
}

/** 기본 화면 목록 — 손님이 로그인 없이 볼 수 있는 곳 전부 + 설치 권유 */
const DEFAULT_SCREENS = [
  { id: 'B01', name: '처음 연 화면(매장 고르기 전)', fresh: true, noStore: true },
  { id: 'B02', name: '홈(매장 고름)', fresh: true, needGrid: true },
  { id: 'B03', name: '상품 상세', go: async (p) => { if (!(await p.locator('.pc:not(.soldout)').count())) return 'skip'; await p.locator('.pc:not(.soldout)').first().click({ timeout: 5000 }); } },
  { id: 'B04', name: '검색 탭', tab: '검색' },
  { id: 'B05', name: '장바구니', tab: '장바구니' },
  { id: 'B06', name: '주문내역', tab: '주문내역' },
  { id: 'B07', name: '마이(로그인 안 함)', tab: '마이' },
  { id: 'B08', name: '회사 소개·사업자 정보', tab: '마이', row: '회사 소개' },
  { id: 'B09', name: '매장안내', tab: '마이', row: '회사 소개', chip: '매장안내' },
  { id: 'B10', name: '고객센터', tab: '마이', row: '회사 소개', chip: '고객센터' },
  { id: 'B11', name: '공지사항', tab: '마이', row: '공지사항' },
  { id: 'B12', name: '로그인', tab: '마이', button: '로그인' },
  { id: 'B13', name: '회원가입 1단계', tab: '마이', button: '회원가입' },
  { id: 'B14', name: '아이디·비밀번호 찾기', tab: '마이', button: '로그인', then: '아이디/비밀번호 찾기' },
  { id: 'B15', name: 'AI 상담(보내지 않음)', button: 'AI 상담' },
  { id: 'B16', name: '설치 권유(안드로이드)', fresh: true, install: 'android' },
  { id: 'B17', name: '설치 권유(아이폰)', fresh: true, install: 'ios' },
];

async function run(o) {
  const { chromium } = require(path.join(o.repo || ROOT, 'node_modules', 'playwright'));
  const brand = o.brand;
  const bj = o.brandJson || JSON.parse(fs.readFileSync(path.join(ROOT, 'brands', brand, 'brand.json'), 'utf8'));
  const prefix = (bj.webPath || '/' + brand).replace(/\/+$/, '');
  const foreign = o.foreign || foreignImages(brand);
  const words = WORDS[brand];
  const rec = { blocked: new Map(), passed: new Map(), bodies: [], apiErrors: [], ok: 0, cache: new Map(), upstream: 0, chain: Promise.resolve() };
  const R = { fail: [], data: [], info: [], shots: [] };
  const out = o.out || fs.mkdtempSync(path.join(os.tmpdir(), 'brand-live-'));
  fs.mkdirSync(out, { recursive: true });

  // ① 정적 — manifest·index.html
  const mfPath = path.join(o.build, 'manifest.json');
  if (fs.existsSync(mfPath)) {
    const mf = JSON.parse(fs.readFileSync(mfPath, 'utf8'));
    const want = brand !== 'srm' && bj.colors && bj.colors.splashBackground;   // 에스알마트는 public/manifest.json 이 원본 그대로
    if (want && String(mf.theme_color || '').toLowerCase() !== want.toLowerCase()) R.fail.push({ where: 'manifest.json', what: `theme_color ${mf.theme_color} ≠ ${want}(brand.json splashBackground) — 설치한 앱 제목줄·시작 화면 색` });
    for (const ic of mf.icons || []) {
      const f = path.join(o.build, ic.src);
      if (fs.existsSync(f) && foreign.has(md5(fs.readFileSync(f)))) R.fail.push({ where: 'manifest.json', what: `아이콘 ${ic.src} = ${foreign.get(md5(fs.readFileSync(f)))}` });
    }
    if (mf.name && words.test(mf.name + ' ' + (mf.short_name || ''))) R.fail.push({ where: 'manifest.json', what: `이름 ${mf.name}` });
  }
  const ix = fs.readFileSync(path.join(o.build, 'index.html'), 'utf8');
  for (const m of ix.matchAll(/<(?:link|meta)[^>]+(?:href|content)="\.?\/?([^"]+\.(?:png|ico|svg|webp))"/g)) {
    const f = path.join(o.build, m[1]);
    if (fs.existsSync(f) && foreign.has(md5(fs.readFileSync(f)))) R.fail.push({ where: 'index.html', what: `${m[1]} = ${foreign.get(md5(fs.readFileSync(f)))}` });
  }
  const kw = (ix.match(/<meta name="keywords" content="([^"]*)"/) || [])[1];
  if (kw && words.test(kw)) R.fail.push({ where: 'index.html', what: `keywords 「${kw}」` });
  if (kw && bj.webKeywords && kw !== bj.webKeywords) R.fail.push({ where: 'index.html', what: `keywords 「${kw}」 ≠ brand.json webKeywords` });

  // ② 화면 — 운영과 같은 응답
  const srv = await startServer({ build: o.build, prefix, api: o.api, uploads: o.uploads, rec });
  const base = `http://127.0.0.1:${srv.address().port}${prefix}/`;
  const b = await chromium.launch();
  const UA = 'Mozilla/5.0 (Linux; Android 12; SM-A125N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 SRM-BrandLiveCheck';
  const IOS = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 SRM-BrandLiveCheck';
  let storeId = o.store || null;
  const seenImg = new Map();
  let shown = 0;
  try {
    if (!storeId) {
      // 이 브랜드 손님에게 보이는 첫 매장(서버가 X-Shop-Brand 로 거른다)
      const r = await fetch(`http://127.0.0.1:${srv.address().port}/api/stores?audience=customer`, { headers: { 'X-Shop-Brand': brand } }).then((x) => x.json()).catch(() => []);
      storeId = Array.isArray(r) && r[0] ? r[0].id : null;
    }
    const mkCtx = async (s) => {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, userAgent: s.install === 'ios' ? IOS : UA, serviceWorkers: 'block' });
      await ctx.route('**/*', (r) => { const h = new URL(r.request().url()).hostname; return h === '127.0.0.1' ? r.continue() : r.abort(); });
      await ctx.addInitScript(({ sid, key }) => { try { if (sid) localStorage.setItem(key, String(sid)); localStorage.setItem('srm_ai_tip_seen', '1'); } catch (e) { /* */ } }, { sid: s.noStore ? null : storeId, key: brand === 'srm' ? 'guestStoreId' : `guestStoreId:${brand}` });
      ctx.on('response', async (res) => {
        try {
          if (res.request().resourceType() !== 'image') return;
          const buf = await res.body();
          const h = md5(buf);
          if (foreign.has(h)) seenImg.set(new URL(res.url()).pathname, foreign.get(h));
        } catch (e) { /* 몸통 못 읽음 — 무시 */ }
      });
      return ctx;
    };
    const closeDlg = async (p) => { for (let i = 0; i < 3; i++) { const x = p.getByRole('button', { name: /^(확인|닫기)$/ }).first(); if (await x.isVisible().catch(() => false)) { await x.click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(300); } else break; } };
    const screens = o.screens || DEFAULT_SCREENS;
    let ctx = null; let p = null;
    for (const s of screens) {
      try {
        if (s.fresh || !ctx) { if (ctx) await ctx.close(); ctx = await mkCtx(s); p = await ctx.newPage(); }
        await p.goto(base + (s.install ? '?install=1' : ''), { waitUntil: 'load', timeout: 30000 });
        await p.waitForTimeout(1500);
        if (s.install === 'android') await p.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => {}; e.userChoice = Promise.resolve({ outcome: 'dismissed' }); window.dispatchEvent(e); });
        if (s.tab) { await closeDlg(p); await p.locator('.tabbar .tab', { hasText: s.tab }).first().click({ timeout: 5000 }); await p.waitForTimeout(700); }
        if (s.row) { await p.locator('button.row', { hasText: s.row }).first().click({ timeout: 5000 }); await p.waitForTimeout(700); }
        if (s.chip) { await p.locator('.chip', { hasText: s.chip }).first().click({ timeout: 5000 }); await p.waitForTimeout(500); }
        if (s.button) { await p.getByRole('button', { name: s.button, exact: true }).first().click({ timeout: 5000 }); await p.waitForTimeout(700); }
        if (s.then) { await p.getByRole('button', { name: s.then }).first().click({ timeout: 5000 }); await p.waitForTimeout(700); }
        if (s.go && (await s.go(p)) === 'skip') { R.info.push(`${s.id} ${s.name} 건너뜀 — 이 매장에 팔 수 있는 상품이 없다(전부 품절)`); continue; }
        await p.waitForTimeout(1000);
        if (s.needGrid) { const n = await p.locator('.pc').count(); if (!n) R.fail.push({ where: s.id, what: '홈에 상품이 한 개도 안 떴다 — 운영 응답을 못 받았거나 매장을 못 골랐다(못 셌으면 통과 아님)' }); }
        const file = `${s.id}.png`;
        await p.screenshot({ path: path.join(out, file) });
        R.shots.push({ id: s.id, name: s.name, file: path.join(out, file) });
        shown++;
        const data = await p.evaluate(() => ({
          txt: document.body.innerText || '',
          alts: [...document.querySelectorAll('[alt],[aria-label],[title]')].map((e) => e.getAttribute('alt') || e.getAttribute('aria-label') || e.getAttribute('title')).filter(Boolean),
          title: document.title,
          brandTok: getComputedStyle(document.documentElement).getPropertyValue('--brand').trim(),
        }));
        const lines = [...new Set([...data.txt.split('\n'), ...data.alts, data.title].map((l) => l.trim()).filter((l) => l && words.test(l)))];
        for (const l of lines) {
          const w = l.match(words)[0];
          const src = rec.bodies.find((x) => x.text.includes(l) || (l.length > 12 && x.text.includes(l.slice(0, 12))));
          if (src) R.data.push({ where: `${s.id} ${s.name}`, what: `「${l.slice(0, 80)}」`, api: src.path.split('?')[0] });
          else R.fail.push({ where: `${s.id} ${s.name}`, what: `글자 「${l.slice(0, 80)}」(「${w}」 — 서버 응답에 없음 → 빌드)` });
        }
        if (s.id === 'B02' || s.id === 'B01') {
          const want = bj.colors && bj.colors.screen;
          if (want && data.brandTok.toLowerCase() !== want.toLowerCase()) R.fail.push({ where: s.id, what: `화면 색 --brand ${data.brandTok} ≠ ${want}` });
          else if (!want && !R.info.some((x) => x.startsWith('화면 색'))) R.info.push(`화면 색 --brand = ${data.brandTok} (brand.json colors.screen 미정 — 대표 결정 대기)`);
        }
      } catch (e) {
        R.fail.push({ where: `${s.id} ${s.name}`, what: `화면을 못 열었다 — ${e.message.split('\n')[0].slice(0, 120)}` });
      }
    }
    if (ctx) await ctx.close();
  } finally {
    await b.close();
    srv.close();
  }
  for (const [u, f] of seenImg) R.fail.push({ where: '화면이 받은 그림', what: `${u} = ${f}` });
  // 자료 몫은 같은 문구를 한 번만
  const seen = new Set(); R.data = R.data.filter((d) => { const k = d.what + d.api; if (seen.has(k)) return false; seen.add(k); return true; });
  for (const e of rec.apiErrors.filter((x) => /429|초과/.test(x))) R.fail.push({ where: '서버', what: `${e} — 화면이 운영 응답을 못 받았을 수 있다(못 셌으면 통과 아님)` });
  if (!rec.ok) R.fail.push({ where: '서버', what: `운영 응답을 하나도 못 받았다(${o.api}) ${rec.apiErrors.slice(0, 3).join(' · ')}` });
  if (shown < Math.min(3, (o.screens || DEFAULT_SCREENS).length)) R.fail.push({ where: '화면', what: `찍은 화면 ${shown}개 — 너무 적다(못 셌으면 통과 아님)` });
  return { ...R, out, base, storeId, passed: [...rec.passed], blocked: [...rec.blocked], apiOk: rec.ok, upstream: rec.upstream };
}

function report(r, brand) {
  console.log(`\n브랜드 화면 검사(${brand}) — 운영과 같은 응답 · 매장 ${r.storeId ?? '없음'} · 사진 ${r.shots.length}장 → ${r.out}`);
  console.log(`  운영으로 넘긴 횟수 ${r.upstream}(같은 주소는 한 번 · 상한 ${UPSTREAM_MAX})`);
  console.log(`  넘긴 /api: ${r.passed.map(([k, n]) => `${k}×${n}`).join(' · ') || '없음'}`);
  console.log(`  막은 /api: ${r.blocked.map(([k, n]) => `${k}×${n}`).join(' · ') || '없음'}`);
  for (const i of r.info) console.log(`  ℹ ${i}`);
  if (r.data.length) {
    console.log(`  🟠 자료(서버 응답에 든 다른 브랜드 글자 — 어드민에서 범위·문구를 고칠 것) ${r.data.length}건`);
    for (const d of r.data) console.log(`     · ${d.where}: ${d.what} ← ${d.api}`);
  }
  if (r.fail.length) {
    console.log(`  🔴 빌드 몫 ${r.fail.length}건`);
    for (const f of r.fail) console.log(`     · ${f.where}: ${f.what}`);
  } else console.log('  ✅ 빌드 몫 0건');
}

async function selfTest() {
  // 가짜 운영 서버(배너에 「SR Mart」) + 가짜 빌드 두 벌(더러운 것 · 깨끗한 것)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-live-st-'));
  let posted = 0; let gets = 0;
  const stub = http.createServer((req, res) => {
    if (req.method !== 'GET') { posted++; res.writeHead(200); return res.end('{}'); }
    gets++;
    if (req.url.startsWith('/api/banners')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify([{ title: 'SR Mart에 오신 것을 환영해요!' }])); }
    if (req.url.startsWith('/api/stores')) { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('[{"id":13,"name":"아람마트 고촌점"}]'); }
    res.writeHead(404); res.end();
  });
  await new Promise((ok) => stub.listen(0, '127.0.0.1', ok));
  const api = `http://127.0.0.1:${stub.address().port}`;
  const srmIcon = fs.readFileSync(path.join(ROOT, 'public', 'logo192.png'));
  const aramIcon = fs.readFileSync(path.join(ROOT, 'brands', 'aram', 'public', 'logo192.png'));
  const mk = (name, { hard, icon, theme }) => {
    const d = path.join(tmp, name); fs.mkdirSync(d);
    fs.writeFileSync(path.join(d, 'logo.png'), icon);
    fs.writeFileSync(path.join(d, 'manifest.json'), JSON.stringify({ name: '아람마트', theme_color: theme, icons: [{ src: 'logo.png' }] }));
    fs.writeFileSync(path.join(d, 'index.html'), `<!doctype html><meta charset="utf-8"><title>아람마트</title><body><img src="./logo.png" alt="로고"><div id="b"></div>${hard ? '<p>SR Mart 할인</p>' : ''}<div class="pc">상품</div>
<script>fetch('/api/banners',{headers:{'X-Shop-Brand':'aram'}}).then(r=>r.json()).then(j=>{document.getElementById('b').textContent=j[0].title});fetch('/api/orders',{method:'POST'});</script></body>`);
    return d;
  };
  const screens = [{ id: 'B02', name: '홈', fresh: true, needGrid: true }, { id: 'B02b', name: '홈 다시', fresh: true }];
  const bj = { webPath: '/aram', colors: { splashBackground: '#DB102E' } };
  const results = [];
  const t = async (label, cond) => { results.push([label, cond]); console.log(`  ${cond ? '✅' : '🔴'} 자가 시험: ${label}`); };
  try {
    const dirty = await run({ build: mk('dirty', { hard: true, icon: srmIcon, theme: '#00c471' }), brand: 'aram', api, screens, brandJson: bj, out: path.join(tmp, 'o1') });
    await t('박힌 「SR Mart」 → 빌드 실패', dirty.fail.some((f) => /SR Mart 할인/.test(f.what)));
    await t('에스알마트 아이콘 그림(화면이 받음) → 빌드 실패', dirty.fail.some((f) => f.where === '화면이 받은 그림'));
    await t('manifest 아이콘·theme_color → 빌드 실패', dirty.fail.some((f) => f.where === 'manifest.json' && /아이콘/.test(f.what)) && dirty.fail.some((f) => /theme_color/.test(f.what)));
    await t('서버 배너 「SR Mart」 → 자료(빌드 아님)', dirty.data.some((d) => d.api === '/api/banners') && !dirty.fail.some((f) => /환영/.test(f.what)));
    await t('POST 는 서버로 안 넘긴다(막은 주소에 적힘)', posted === 0 && dirty.blocked.some(([k]) => k === 'POST /api/orders'));
    await t(`같은 주소는 한 번만 넘긴다(화면 2번 · 서버가 받은 GET ${gets})`, gets === 2 && dirty.upstream === 2);
    const clean = await run({ build: mk('clean', { hard: false, icon: aramIcon, theme: '#DB102E' }), brand: 'aram', api, screens, brandJson: bj, out: path.join(tmp, 'o2') });
    await t('깨끗한 빌드 → 빌드 몫 0(자료 1은 남는다)', clean.fail.length === 0 && clean.data.length === 1);
    const down = await run({ build: path.join(tmp, 'clean'), brand: 'aram', api: 'http://127.0.0.1:9', screens, brandJson: bj, out: path.join(tmp, 'o3') });
    await t('서버에 못 붙으면 통과 아님', down.fail.some((f) => f.where === '서버'));
  } finally { stub.close(); fs.rmSync(tmp, { recursive: true, force: true }); }
  const bad = results.filter(([, c]) => !c);
  console.log(bad.length ? `🔴 자가 시험 ${results.length - bad.length}/${results.length}` : `✅ 자가 시험 ${results.length}/${results.length}`);
  return bad.length === 0;
}

module.exports = { run, report, ALLOW, startServer };

if (require.main === module) {
  (async () => {
    if (has('--self-test')) process.exit((await selfTest()) ? 0 : 1);
    const build = arg('--build');
    if (!build || !fs.existsSync(path.join(build, 'index.html'))) { console.error('🔴 --build <빌드 폴더> 가 필요하다(index.html 이 있는 곳)'); process.exit(1); }
    const brand = arg('--brand', 'aram');
    if (!WORDS[brand]) { console.error(`🔴 모르는 브랜드 ${brand}`); process.exit(1); }
    if (!(await selfTest())) { console.error('🔴 자가 시험 실패 — 이 검사를 믿을 수 없다'); process.exit(1); }
    const up = arg('--uploads', fs.existsSync('D:/srmart_uploads') ? 'D:/srmart_uploads' : null);
    const r = await run({ build: path.resolve(build), brand, api: arg('--api', 'http://127.0.0.1:5000'), uploads: up, out: arg('--out'), store: arg('--store') });
    report(r, brand);
    fs.writeFileSync(path.join(r.out, 'brand-live.json'), JSON.stringify(r, null, 1));
    const strict = has('--strict-data') && r.data.length;
    process.exit(r.fail.length || strict ? 1 : 0);
  })().catch((e) => { console.error('🔴 brand-live 검사 오류 —', e.message); process.exit(1); });
}
