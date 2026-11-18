#!/usr/bin/env node
/**
 * 브랜드별 웹 주소 검사 — /shop · /srm · /aram 이 한 출처에서 같이 돌 때 (2026-11-15 대표님 지시 1·5) — prebuild
 *
 *   node scripts/check-brand-paths.cjs           # 검사(자가 시험 먼저)
 *
 * 보는 것
 *  ① 앱이 여는 주소: capacitor.config.ts 의 url = brands/srm/brand.json 의 url · 브랜드 url 이 https://www.dongsinmarket.com/<webPath>/
 *  ② 배포 스크립트(deploy-shop.cjs)에 브랜드마다 칸이 있고, 포트·폴더·pm2 이름이 서로 겹치지 않는다 · 에스알마트는 /shop 도 본다
 *  ③ nginx 초안(deploy/nginx/nginx.conf.draft-*)의 443 블록: 네 이름(.co.kr·.com · www) · /shop/ 은 3000 그대로 ·
 *     브랜드마다 location /<webPath>/ → 127.0.0.1:<배포 스크립트의 그 포트>/ · = /<webPath> 301
 *  ④ 서비스워커: 캐시 이름에 범위가 들어간다 · activate 가 「내 이름 아닌 것 전부」를 지우지 않는다 · caches.match 를 바로 쓰지 않는다
 *     (Cache Storage 는 출처 단위 — 범위가 다른 서비스워커끼리 서로의 캐시를 지운다)
 *  ⑤ 손님이 고른 매장의 기억 자리(localStorage)가 브랜드마다 다르다 · 'guestStoreId' 를 화면 코드에 바로 쓰지 않는다
 *     시작 광고 기억 자리도(2026-11-17 낮 지시 5): splashAdCache.js 는 SPLASH_AD_KEY 를 · public/index.html 은 %REACT_APP_BRAND% 로 같은 규칙을 ·
 *     광고 미리 받기는 X-Shop-Brand 를 보낸다
 *  ⑥ QR 안내 화면(landing/app/index.html)의 웹 쇼핑몰 주소 = brand.json webPath
 *  ⑦ 브랜드별 앱 주소 사본(android/app/src/<브랜드>/assets/capacitor.config.json)이 git 에서 빠져 있다
 * 종료코드: 0 통과 · 1 실패
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const R = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const { brands: readBrands, urlProblem } = require('./cap-brand-config.cjs');

// ── 판정 함수(자가 시험이 같은 것을 부른다) ─────────────────────────────
function checkCapacitor(capSrc, list) {
  const out = [];
  const m = capSrc.match(/url:\s*'([^']+)'/);
  const srm = list.find(b => b.id === 'srm');
  if (!m) out.push('capacitor.config.ts 에 server.url 이 없다');
  else if (srm && m[1] !== srm.url) out.push(`capacitor.config.ts url(${m[1]}) ≠ brands/srm/brand.json url(${srm.url})`);
  for (const b of list) { const p = urlProblem(b); if (p) out.push(p); }
  return out;
}
function parseProfiles(deploySrc) {
  const i = deploySrc.indexOf('const PROFILES = {');
  if (i < 0) return null;
  const body = deploySrc.slice(i, deploySrc.indexOf('\n};', i));
  const out = {};
  for (const m of body.matchAll(/^\s*(\w+):\s*\{([^\n]*)\},?\s*$/gm)) {
    const g = (k) => ((m[2].match(new RegExp(`${k}:\\s*'([^']*)'`)) || [])[1]);
    out[m[1]] = { pm2: g('pm2'), dir: g('dir'), next: g('next'), prev: g('prev'), port: Number((m[2].match(/port:\s*(\d+)/) || [])[1]), also: m[2].match(/also:\s*\[([^\]]*)\]/)?.[1] || '' };
  }
  return out;
}
function checkProfiles(prof, list) {
  if (!prof) return ['deploy-shop.cjs 에 PROFILES 가 없다'];
  const out = [];
  for (const b of list) if (!prof[b.id]) out.push(`deploy-shop.cjs PROFILES 에 ${b.id} 가 없다`);
  for (const k of ['pm2', 'port', 'dir', 'next', 'prev']) {
    const vals = Object.values(prof).map(p => p[k]);
    if (new Set(vals).size !== vals.length) out.push(`deploy-shop.cjs PROFILES 의 ${k} 가 브랜드끼리 겹친다(${vals.join(', ')})`);
  }
  if (prof.srm && (prof.srm.port !== 3000 || prof.srm.dir !== 'build' || prof.srm.pm2 !== 'srmart-shop')) out.push('에스알마트 칸이 운영(3000 · build · srmart-shop)과 다르다');
  if (prof.srm && !/dongsinmarket\.com\/shop'/.test(prof.srm.also)) out.push('에스알마트 확인에 /shop(이미 깔린 앱이 여는 주소)이 빠졌다');
  return out;
}
function serverBlock443(conf) {
  const i = conf.search(/listen\s+443\s+ssl/);
  if (i < 0) return '';
  const start = conf.lastIndexOf('server {', i);
  let depth = 0;
  for (let j = start; j < conf.length; j++) {
    if (conf[j] === '{') depth++;
    else if (conf[j] === '}') { depth--; if (!depth) return conf.slice(start, j + 1); }
  }
  return '';
}
function checkNginx(conf, list, prof) {
  const out = [];
  const blk = serverBlock443(conf);
  if (!blk) return ['nginx 초안에 443 server 블록이 없다'];
  const names = (blk.match(/server_name\s+([^;]+);/) || [])[1] || '';
  for (const n of ['dongsinmarket.co.kr', 'www.dongsinmarket.co.kr', 'dongsinmarket.com', 'www.dongsinmarket.com']) if (!names.split(/\s+/).includes(n)) out.push(`443 server_name 에 ${n} 가 없다`);
  const loc = (p) => { const m = blk.match(new RegExp(`location\\s+${p.replace(/\//g, '\\/')}\\s*\\{([^}]*)\\}`)); return m ? m[1] : null; };
  const shop = loc('/shop/');
  if (!shop || !/proxy_pass\s+http:\/\/127\.0\.0\.1:3000\/;/.test(shop)) out.push('/shop/ 이 127.0.0.1:3000/ 그대로가 아니다(이미 깔린 앱이 여는 주소)');
  for (const b of list) {
    const p = prof && prof[b.id];
    const body = loc(`${b.webPath}/`);
    if (!body) { out.push(`location ${b.webPath}/ 가 없다`); continue; }
    if (!p || !new RegExp(`proxy_pass\\s+http://127\\.0\\.0\\.1:${p.port}/;`).test(body)) out.push(`location ${b.webPath}/ 가 127.0.0.1:${p ? p.port : '?'}/ 로 안 간다`);
    if (!new RegExp(`location\\s*=\\s*${b.webPath.replace(/\//g, '\\/')}\\s*\\{\\s*return\\s+301\\s+${b.webPath.replace(/\//g, '\\/')}\\/;`).test(blk)) out.push(`location = ${b.webPath} → 301 ${b.webPath}/ 가 없다`);
  }
  return out;
}
function checkSW(sw) {
  const out = [];
  const cache = (sw.match(/const CACHE\s*=\s*([^;\n]+)/) || [])[1] || '';
  if (!/SCOPE_PATH/.test(cache)) out.push(`서비스워커 캐시 이름에 범위(SCOPE_PATH)가 없다(${cache.trim() || '못 찾음'}) — 한 출처의 다른 브랜드와 이름이 겹친다`);
  if (/keys\.filter\(\s*\(?\s*k\s*\)?\s*=>\s*k\s*!==\s*CACHE\s*\)/.test(sw)) out.push('서비스워커 activate 가 「내 이름이 아닌 캐시 전부」를 지운다 — 다른 브랜드(/srm·/aram·/shop)의 캐시가 사라진다');
  if (/[^.\w]caches\.match\(/.test(sw)) out.push('서비스워커가 caches.match(출처 전체)를 쓴다 — 내 캐시(caches.open(CACHE))에서만 꺼낼 것');
  if (/caches\.delete/.test(sw) && !/SCOPE_PATH/.test((sw.match(/const isMineOld[^\n]*/) || [''])[0])) out.push('서비스워커가 지우는 캐시를 내 범위로 거르지 않는다(isMineOld)');
  return out;
}
function checkGuestKey(brandSrc, files) {
  const out = [];
  if (!/export const GUEST_STORE_KEY\s*=\s*BRAND\.code === 'srm' \? 'guestStoreId' : `guestStoreId:\$\{BRAND\.code\}`/.test(brandSrc)) out.push('src/brand.js 에 브랜드별 GUEST_STORE_KEY 가 없다(에스알마트는 옛 키 guestStoreId 그대로)');
  for (const [f, s] of Object.entries(files)) if (/localStorage\.\w+\(\s*'guestStoreId'/.test(s)) out.push(`${f} 가 'guestStoreId' 를 바로 쓴다 — GUEST_STORE_KEY 를 쓸 것(브랜드끼리 매장이 섞인다)`);
  return out;
}
function checkSplashKey(brandSrc, cacheSrc, html) {
  const out = [];
  if (!/export const SPLASH_AD_KEY\s*=\s*BRAND\.code === 'srm' \? 'srmart_splash_ad' : `srmart_splash_ad:\$\{BRAND\.code\}`/.test(brandSrc)) out.push('src/brand.js 에 브랜드별 SPLASH_AD_KEY 가 없다(에스알마트는 옛 키 srmart_splash_ad 그대로)');
  if (/'srmart_splash_ad'|'srmart-splash-ads-v1'/.test(cacheSrc) || !/SPLASH_AD_KEY/.test(cacheSrc)) out.push("src/utils/splashAdCache.js 가 시작 광고 키를 바로 쓴다 — SPLASH_AD_KEY · SPLASH_AD_CACHE 를 쓸 것(브랜드끼리 광고가 섞인다)");
  if (!/'%REACT_APP_BRAND%' === 'aram'/.test(html) || /localStorage\.getItem\('srmart_splash_ad'\)/.test(html)) out.push('public/index.html 미리 받기가 브랜드별 키를 안 쓴다(%REACT_APP_BRAND% → srmart_splash_ad:<브랜드>)');
  if (!/fetch\('\/api\/splash-ads'[^)]*'X-Shop-Brand'/.test(html)) out.push('public/index.html 광고 미리 받기가 X-Shop-Brand 를 안 보낸다 — 다른 브랜드 광고 그림을 미리 받는다');
  return out;
}
function checkLanding(html, list) {
  const out = [];
  for (const b of list) {
    const m = html.match(new RegExp(`${b.id}:\\s*\\{[^}]*web:\\s*'([^']*)'`));
    if (!m) out.push(`landing/app/index.html 에 ${b.id} 의 web 이 없다`);
    else if (m[1] !== `${b.webPath}/`) out.push(`landing/app/index.html ${b.id} web(${m[1]}) ≠ ${b.webPath}/`);
  }
  return out;
}
function checkGitignore(gi, list) {
  return list.filter(b => !gi.split(/\r?\n/).includes(`app/src/${b.id}/assets/capacitor.config.json`)).map(b => `android/.gitignore 에 app/src/${b.id}/assets/capacitor.config.json 이 없다(생성물이 커밋된다)`);
}

// ── 자가 시험 — 일부러 틀린 것을 넣어 잡는지 ────────────────────────
function selftest() {
  const L = [{ id: 'srm', webPath: '/srm', url: 'https://www.dongsinmarket.com/srm/' }, { id: 'aram', webPath: '/aram', url: 'https://www.dongsinmarket.com/aram/' }];
  const P = { srm: { pm2: 'srmart-shop', port: 3000, dir: 'build', next: 'n1', prev: 'p1', also: "'https://www.dongsinmarket.com/shop'" }, aram: { pm2: 'a', port: 3002, dir: 'build_aram', next: 'n2', prev: 'p2', also: '' } };
  const good = 'server {\n listen 443 ssl;\n server_name dongsinmarket.co.kr www.dongsinmarket.co.kr dongsinmarket.com www.dongsinmarket.com;\n location /shop/ { proxy_pass http://127.0.0.1:3000/; }\n location /srm/ { proxy_pass http://127.0.0.1:3000/; }\n location = /srm { return 301 /srm/; }\n location /aram/ { proxy_pass http://127.0.0.1:3002/; }\n location = /aram { return 301 /aram/; }\n}';
  const swGood = "const SCOPE_PATH=1;\nconst CACHE = `shop-${VERSION}:${SCOPE_PATH}`;\nconst isMineOld = (k) => k.endsWith(`:${SCOPE_PATH}`);\nkeys.filter(isMineOld).map((k) => caches.delete(k));\nconst fromMine = (req) => caches.open(CACHE).then((c) => c.match(req));";
  const cases = [
    ['좋은 nginx', checkNginx(good, L, P).length === 0],
    ['/aram 빠진 nginx', checkNginx(good.replace(/ location \/aram\/[^\n]*\n/, ''), L, P).some(x => /\/aram\//.test(x))],
    ['/aram 포트 틀림', checkNginx(good.replace('3002/', '3000/'), L, P).some(x => /3002/.test(x))],
    ['.com 빠짐', checkNginx(good.replace(' www.dongsinmarket.com;', ';'), L, P).some(x => /www\.dongsinmarket\.com/.test(x))],
    ['/shop 바뀜', checkNginx(good.replace('location /shop/ { proxy_pass http://127.0.0.1:3000/', 'location /shop/ { proxy_pass http://127.0.0.1:3002/'), L, P).some(x => /\/shop\//.test(x))],
    ['좋은 SW', checkSW(swGood).length === 0],
    ['옛 SW(이름 고정 · 전부 지움 · caches.match)', checkSW("const CACHE = 'srmart-shop-v6';\nkeys.filter((k) => k !== CACHE).map((k) => caches.delete(k));\nreturn caches.match(req);").length >= 3],
    ['포트 겹침', checkProfiles({ ...P, aram: { ...P.aram, port: 3000 } }, L).some(x => /port/.test(x))],
    ['/shop 확인 빠짐', checkProfiles({ ...P, srm: { ...P.srm, also: '' } }, L).some(x => /\/shop/.test(x))],
    ['아람 칸 없음', checkProfiles({ srm: P.srm }, L).some(x => /aram/.test(x))],
    ['capacitor 주소 어긋남', checkCapacitor("url: 'https://www.dongsinmarket.com/shop/',", L).length === 1],
    ['매장 키 바로 씀', checkGuestKey("export const GUEST_STORE_KEY = BRAND.code === 'srm' ? 'guestStoreId' : `guestStoreId:${BRAND.code}`;", { 'x.js': "localStorage.getItem('guestStoreId')" }).length === 1],
    ['시작 광고 키 바로 씀', checkSplashKey("export const SPLASH_AD_KEY = BRAND.code === 'srm' ? 'srmart_splash_ad' : `srmart_splash_ad:${BRAND.code}`;", "const LS_KEY = 'srmart_splash_ad';", "var brand = '%REACT_APP_BRAND%' === 'aram'; fetch('/api/splash-ads', { headers: { 'X-Shop-Brand': brand } })").length === 1],
    ['광고 미리 받기 브랜드 빠짐', checkSplashKey("export const SPLASH_AD_KEY = BRAND.code === 'srm' ? 'srmart_splash_ad' : `srmart_splash_ad:${BRAND.code}`;", "SPLASH_AD_KEY", "localStorage.getItem('srmart_splash_ad'); fetch('/api/splash-ads', { headers: {} })").length === 2],
    ['QR 안내 아람 주소 빠짐', checkLanding("srm: { web: '/srm/' }, aram: { web: null }", L).length === 1],
    ['gitignore 빠짐', checkGitignore('app/src/srm/assets/capacitor.config.json', L).length === 1],
  ];
  const bad = cases.filter(c => !c[1]);
  if (bad.length) { console.error(`🔴 [브랜드 주소] 자가 시험 실패: ${bad.map(c => c[0]).join(', ')}`); process.exit(1); }
  return cases.length;
}

function main() {
  const n = selftest();
  const list = readBrands();
  const prof = parseProfiles(R('scripts/deploy-shop.cjs'));
  const draftDir = path.join(ROOT, 'deploy/nginx');
  const drafts = fs.existsSync(draftDir) ? fs.readdirSync(draftDir).filter(f => /^nginx\.conf\.draft-\d{8}$/.test(f)).sort() : [];
  const problems = [
    ...checkCapacitor(R('capacitor.config.ts'), list),
    ...checkProfiles(prof, list),
    ...(drafts.length ? checkNginx(R('deploy/nginx/' + drafts[drafts.length - 1]), list, prof) : ['deploy/nginx/nginx.conf.draft-<날짜> 가 없다']),
    ...checkSW(R('public/service-worker.js')),
    ...checkGuestKey(R('src/brand.js'), Object.fromEntries(['src/StoreContext.jsx', 'src/pushSetup.js', 'src/App.js'].map(f => [f, R(f)]))),
    ...checkSplashKey(R('src/brand.js'), R('src/utils/splashAdCache.js'), R('public/index.html')),
    ...checkLanding(R('landing/app/index.html'), list),
    ...checkGitignore(R('android/.gitignore'), list),
  ];
  if (problems.length) { problems.forEach(p => console.error('🔴 ' + p)); console.error(`🔴 [브랜드 주소] ${problems.length}건 (자가 시험 ${n}/${n})`); process.exit(1); }
  console.log(`✅ [브랜드 주소] ${list.map(b => `${b.id} ${b.webPath}/ → 127.0.0.1:${prof[b.id].port}`).join(' · ')} · /shop/ → 3000 · nginx 초안 ${drafts[drafts.length - 1]} · 서비스워커 범위별 캐시 · 매장 기억 브랜드별 (자가 시험 ${n}/${n})`);
}
module.exports = { checkNginx, checkSW, checkProfiles, checkCapacitor, checkGuestKey, checkSplashKey, checkLanding, checkGitignore, parseProfiles };
if (require.main === module) main();
