#!/usr/bin/env node
// 🔴 빌드 뒤 — 브랜드 정적 파일 바꿔 끼우기 + 번들에 다른 브랜드 이름이 0 인지 (2026-11-14 대표님 지시 10) — postbuild
//
//   · JS 번들의 브랜드는 src/brand.js(REACT_APP_BRAND)가 정한다. 그런데 public/ 의 index.html · manifest.json ·
//     offline.html · service-worker.js 는 빌드가 **그대로 복사**한다 — 그래서 아람마트 빌드일 때 여기서 이름을 바꾼다.
//     원본(public/)은 고치지 않는다(에스알마트가 기본).
//   · 그 뒤 빌드 폴더 전체(.js .html .json .css .txt)를 읽어 **다른 브랜드 이름**을 센다. CRA 압축기는 한글을 \uXXXX 로
//     바꾸므로 풀어서 센다(그냥 grep 하면 0 으로 보여 거짓 통과한다).
//       아람마트 빌드: 「에스알마트」 · 「SR마트」 · 「SR Mart」 가 0 이어야 한다.
//       에스알마트 빌드: 「아람마트」 가 0 이어야 한다.
//     하나라도 있으면 종료코드 1 — 배포(deploy-shop.cjs)가 거기서 멈춘다.
//   · 사용: npm run build 가 부른다(postbuild). 따로: node scripts/brand-build.cjs [빌드 폴더]
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BRAND = process.env.REACT_APP_BRAND === 'aram' ? 'aram' : 'srm';
const OUT = path.resolve(ROOT, process.argv[2] || process.env.BUILD_PATH || 'build');

const FORBID = { aram: ['에스알마트', 'SR마트', 'SR Mart'], srm: ['아람마트'] };
// 아람마트 빌드에서 바꿀 글자(긴 것부터). 회사 이름 「동신마켓」 은 두 브랜드 같다(결정 d).
const SWAP = [
  ['에스알마트 동신마켓', '아람마트'],
  ['에스알마트', '아람마트'],
  ['SR마트', '아람마트'],
  ['SR Mart', 'Aram Mart'],
];
const SWAP_FILES = ['index.html', 'manifest.json', 'offline.html', 'service-worker.js'];

const decode = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(js|html|json|css|txt)$/.test(e.name) && !/\.map$/.test(e.name)) acc.push(p);
  }
  return acc;
}

/** 빌드 폴더에서 금지 글자를 센다 → [{ file, word, n }] */
function count(dir, words) {
  const out = [];
  for (const f of walk(dir)) {
    const s = decode(fs.readFileSync(f, 'utf8'));
    for (const w of words) { const n = s.split(w).length - 1; if (n) out.push({ file: path.relative(dir, f).replace(/\\/g, '/'), word: w, n }); }
  }
  return out;
}

// 자가 시험 — \uXXXX 로 숨은 글자도 잡는다
{
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'brand-build-st-'));
  fs.writeFileSync(path.join(tmp, 'a.js'), 'var x="\\uc5d0\\uc2a4\\uc54c\\ub9c8\\ud2b8";');   // 에스알마트
  const got = count(tmp, ['에스알마트']);
  fs.rmSync(tmp, { recursive: true, force: true });
  if (got.length !== 1) { console.error('🔴 brand-build 자가 시험 실패 — \\uXXXX 로 적힌 브랜드 이름을 못 찾았다'); process.exit(1); }
}

if (!fs.existsSync(path.join(OUT, 'index.html'))) { console.error(`🔴 빌드 폴더가 없다: ${OUT}`); process.exit(1); }

if (BRAND === 'aram') {
  for (const name of SWAP_FILES) {
    const f = path.join(OUT, name);
    if (!fs.existsSync(f)) continue;
    let s = fs.readFileSync(f, 'utf8');
    for (const [a, b] of SWAP) s = s.split(a).join(b);
    fs.writeFileSync(f, s);
  }
}

// 🔴 그림도 브랜드 것으로 (2026-11-16 밤샘 · 아람 점검) — public/ 의 홈 화면 아이콘·파비콘은 빌드가 그대로 복사해서
//    아람 빌드에 에스알마트 아이콘이 나갔다(홈 화면에 추가하면 SRM 아이콘). 위 글자 검사는 그림을 못 본다.
//    brands/<id>/public/ 을 빌드 폴더 위에 덮어쓰고, 덮어쓴 뒤 **에스알마트 그림과 한 바이트도 같으면 실패**한다.
//    그림 만들기: node brand/generate-brand-web.cjs <id>
if (BRAND !== 'srm') {
  const PUB = path.join(ROOT, 'brands', BRAND, 'public');
  const copyTree = (from, to, acc = []) => {
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      const a = path.join(from, e.name), b = path.join(to, e.name);
      if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copyTree(a, b, acc); } else { fs.copyFileSync(a, b); acc.push(b); }
    }
    return acc;
  };
  if (!fs.existsSync(PUB)) { console.error(`🔴 ${BRAND} 웹 그림이 없다(${PUB}) — node brand/generate-brand-web.cjs ${BRAND}`); process.exit(1); }
  const copied = copyTree(PUB, OUT);
  const md5 = (f) => require('crypto').createHash('md5').update(fs.readFileSync(f)).digest('hex');
  const MUST = ['favicon.ico', 'logo192.png', 'logo512.png', ...fs.readdirSync(path.join(ROOT, 'public', 'icons')).map(f => `icons/${f}`)];
  const same = MUST.filter(rel => !fs.existsSync(path.join(OUT, rel)) || md5(path.join(OUT, rel)) === md5(path.join(ROOT, 'public', rel)));
  if (same.length) { console.error(`🔴 ${BRAND} 빌드에 에스알마트 그림이 남았다(없거나 같은 바이트) — ${same.join(' · ')}`); process.exit(1); }
  console.log(`   ${BRAND} 그림 ${copied.length}개를 덮어썼다(홈 화면 아이콘 · 파비콘)`);
}

// 🔴 부팅 배경색도 브랜드 것으로 (2026-11-16 밤샘 · 아람 점검) — 네이티브 스플래시는 브랜드 색(아람 빨강 #DB102E)인데
//    웹이 올라오는 구간(index.html 초기 배경 · 시작 광고 바탕 · 상태바)은 에스알마트 초록 #077D3C 이 코드에 박혀 있어
//    아람 앱이 빨강 → 초록 → 화면으로 깜빡였다. 원본(src/·public/)은 고치지 않는다 — 색을 화면 코드에 새로 쓰면
//    check-ui-rules 가 막고(옳다), 브랜드별 토큰을 tokens.css 에 넣는 것은 공용 토큰 변경이라 대표님 승인 거리다.
//    그래서 지금은 빌드 뒤에 글자처럼 바꿔 끼운다: index.html · static/js/*.js 의 #077D3C → brand.json colors.splashBackground.
//    바꾼 뒤 #077D3C 가 하나라도 남으면 실패한다(에스알마트 색이 아람 앱에 남는 것).
const SRM_BOOT = '#077D3C';
if (BRAND !== 'srm') {
  const bg = JSON.parse(fs.readFileSync(path.join(ROOT, 'brands', BRAND, 'brand.json'), 'utf8')).colors.splashBackground;
  if (!/^#[0-9a-fA-F]{6}$/.test(bg || '')) { console.error(`🔴 brands/${BRAND}/brand.json colors.splashBackground 가 #rrggbb 가 아니다: ${bg}`); process.exit(1); }
  const re = new RegExp(SRM_BOOT, 'gi');
  const targets = [path.join(OUT, 'index.html'), ...walk(path.join(OUT, 'static', 'js')).filter(f => f.endsWith('.js'))];
  let n = 0;
  for (const f of targets) {
    const s = fs.readFileSync(f, 'utf8');
    const hit = (s.match(re) || []).length;
    if (hit) { fs.writeFileSync(f, s.replace(re, bg)); n += hit; }
  }
  const left = targets.filter(f => new RegExp(SRM_BOOT, 'i').test(fs.readFileSync(f, 'utf8')));   // g 정규식의 test 는 lastIndex 를 들고 다녀 거짓 통과한다 — 새로 만든다
  if (left.length) { console.error(`🔴 ${BRAND} 빌드에 에스알마트 부팅색 ${SRM_BOOT} 가 남았다 — ${left.map(f => path.relative(OUT, f)).join(' · ')}`); process.exit(1); }
  console.log(`   ${BRAND} 부팅색 ${SRM_BOOT} → ${bg} ${n}곳(index.html · 시작 광고 · 상태바)`);
}

// 🔴 운영 /aram/ 에 에스알마트가 나온 자리 중 빌드 몫 (2026-11-17 밤샘 지시 1·2 — 대표 실물 확인)
//   ⑴ public/ 의 에스알마트 전용 그림(srm-logo-transparent.png · srm-logo.svg)이 아람 빌드에 그대로 복사돼 주소로 열렸다
//      (홈 랜딩 HomePage 가 그 주소를 썼다 — 이제 BRAND.logo). 다른 브랜드 빌드에서는 뺀다.
//   ⑵ manifest.json 의 theme_color(설치한 앱의 제목줄·시작 화면 색)가 에스알마트 초록 → brand.json colors.splashBackground.
//   ⑶ index.html 검색어(keywords)의 「검암」(에스알마트 매장 동네) → brand.json webKeywords.
//   그리고 빌드 폴더 **전체** 그림을 다른 브랜드 그림 바이트와 대조한다 — 한 장이라도 같으면 실패.
//   (예전 검사는 덮어쓴 아이콘 몇 장의 「에스알마트 원본과 같은가」만 봤다. 운영에 나간 main 에는 그 검사조차 없었다.)
const { foreignImages, md5: md5buf, IMG } = require('./brand-assets.cjs');
if (BRAND !== 'srm') {
  const bj = JSON.parse(fs.readFileSync(path.join(ROOT, 'brands', BRAND, 'brand.json'), 'utf8'));
  for (const rel of ['srm-logo-transparent.png', 'srm-logo.svg']) {
    const f = path.join(OUT, rel);
    if (fs.existsSync(f)) fs.rmSync(f);   // 빌드 산출물에서만 뺀다(public/ 원본은 그대로)
  }
  const mf = path.join(OUT, 'manifest.json');
  if (fs.existsSync(mf)) {
    const s = fs.readFileSync(mf, 'utf8');
    const t = s.replace(/("theme_color"\s*:\s*")#[0-9a-fA-F]{6}(")/, `$1${bj.colors.splashBackground}$2`);
    if (!t.includes(`"theme_color": "${bj.colors.splashBackground}"`) && !t.includes(`"theme_color":"${bj.colors.splashBackground}"`)) { console.error(`🔴 ${BRAND} manifest theme_color 를 못 바꿨다`); process.exit(1); }
    fs.writeFileSync(mf, t);
  }
  if (bj.webKeywords) {
    const ix = path.join(OUT, 'index.html');
    const s = fs.readFileSync(ix, 'utf8');
    const t = s.replace(/(<meta name="keywords" content=")[^"]*(")/, `$1${bj.webKeywords}$2`);
    if (t === s && !s.includes(bj.webKeywords)) { console.error(`🔴 ${BRAND} index.html keywords 를 못 바꿨다`); process.exit(1); }
    fs.writeFileSync(ix, t);
  }
}
{
  const foreign = foreignImages(BRAND);
  const hits = [];
  const all = (function w(d, acc = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p, acc); else acc.push(p); } return acc; })(OUT);
  for (const f of all.filter((x) => IMG.test(x))) {
    const h = md5buf(fs.readFileSync(f));
    if (foreign.has(h)) hits.push(`${path.relative(OUT, f).replace(/\\/g, '/')} = ${foreign.get(h)}`);
  }
  if (hits.length) { console.error(`🔴 ${BRAND} 빌드에 다른 브랜드 그림이 ${hits.length}장 있다(바이트가 같다) —\n   ${hits.join('\n   ')}`); process.exit(1); }
  console.log(`   ${BRAND} 빌드 그림 ${all.filter((x) => IMG.test(x)).length}장 — 다른 브랜드 그림 ${foreign.size}장과 바이트가 같은 것 0`);
}

const bad = count(OUT, FORBID[BRAND]);
if (bad.length) {
  console.error(`🔴 ${BRAND} 빌드에 다른 브랜드 이름이 남았다 — ${bad.map(b => `${b.file} 「${b.word}」 ${b.n}`).join(' · ')}`);
  process.exit(1);
}
console.log(`✅ ${BRAND} 빌드 — 다른 브랜드 이름(${FORBID[BRAND].join('·')}) 0 · ${OUT}`);
