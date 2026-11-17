/**
 * 브랜드(화이트라벨) 목업 시트 (2026-11-13 대표님 지시 10).
 *
 *   node scripts/shop-shots/brand-sheets.cjs [--brand aram] [--out C:/srmart/srmart-shop-mockup/sheets/brand-<brand>]
 *
 * 만드는 것(<out>):
 *   sheet_<n>_<화면>.png  → 화면마다 한 장: 줄 = 폰 세로 · 태블릿 세로 · 태블릿 가로, 칸 = 밝게 · 어둡게
 *                          (홈 · 매장 선택 · 매장안내 · 마이 · 스플래시 · 앱 아이콘)
 *   compare_srm_vs_<brand>.png → 같은 화면을 에스알마트 | <브랜드> 나란히(폰 세로 · 밝게·어둡게)
 *   zoom_logo_icon.png     → 헤더 로고 실제 크기(높이 28px · 기기 배율 1·2·3) + 홈 화면 아이콘 48px 를 에스알마트와 나란히
 *   shots/                 → 낱장
 * 목업은 주소로 브랜드를 고른다(?brand=aram). 앱 화면 코드는 건드리지 않는다 — 대표님이 목업을 본 뒤에 옮긴다.
 */
require('../lib/msys-path.cjs');   // Git Bash 경로 변환 막기(/shop·/srm·/aram) — 2026-11-13 지시 6
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BRAND = arg('--brand', 'aram');
const NAME = { srm: '에스알마트', aram: '아람마트' }[BRAND] || BRAND;
const MOCK = arg('--mockup', 'C:/srmart/srmart-shop-mockup/index.html');
const OUT = arg('--out', `C:/srmart/srmart-shop-mockup/sheets/brand-${BRAND}`);
const FONT = path.join(path.dirname(MOCK), 'assets/fonts');
const SHOTS = path.join(OUT, 'shots');
const url = f => pathToFileURL(f).href;

const SCREENS = [
  ['P05', '로그인 안 함', 'home', '홈'],
  ['S30', '목록', 'store_pick', '매장 선택'],
  ['S44', '목록', 'store_info', '매장안내'],
  ['P02', '로그인함', 'my', '마이'],
  ['S39', '로고', 'splash', '스플래시'],
  ['B01', '', 'app_icon', '앱 아이콘(홈 화면)'],
];
const SIZES = [
  ['phone', '폰 세로 390×844', { width: 390, height: 844 }, 300],
  ['tablet', '태블릿 세로 820×1180', { width: 820, height: 1180 }, 440],
  ['tland', '태블릿 가로 1180×820', { width: 1180, height: 820 }, 640],
];

async function shoot(b, brand, id, state, sizeKey, vp, theme) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: theme, locale: 'ko-KR' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${url(MOCK)}?solo=${id}&theme=${theme}&brand=${brand}${state ? '&state=' + encodeURIComponent(state) : ''}`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
  const f = path.join(SHOTS, `${brand}_${id}_${sizeKey}_${theme}.png`);
  await p.locator('.screen').screenshot({ path: f });
  await ctx.close();
  if (errs.length) throw new Error(`${f}: ${errs.join(' / ')}`);
  return f;
}

async function render(b, html, file, width) {
  const tmp = path.join(SHOTS, '_sheet.html');
  fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><style>
    @font-face { font-family: P; font-weight: 400; src: url("${url(path.join(FONT, 'pretendard_regular.woff2'))}"); }
    @font-face { font-family: P; font-weight: 700; src: url("${url(path.join(FONT, 'pretendard_bold.woff2'))}"); }
    body { margin: 0; padding: 28px; font-family: P, sans-serif; background: #f2f3f5; color: #111; width: ${width}px; }
    h1 { font-size: 26px; margin: 0 0 6px; } .sub { color: #555; font-size: 15px; margin-bottom: 20px; }
    table { border-collapse: separate; border-spacing: 14px 10px; } th { font-size: 15px; text-align: left; padding: 0 2px; }
    td { vertical-align: top; } td.k { font-weight: 700; font-size: 15px; width: 150px; padding-top: 8px; }
    img { display: block; border-radius: 12px; border: 1px solid #ccd; background: #fff; }
    .cap { font-size: 13px; color: #555; margin-top: 4px; }
  </style>${html}`);
  const page = await b.newPage({ viewport: { width: width + 56, height: 600 }, deviceScaleFactor: 1 });
  await page.goto(url(tmp)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
  fs.unlinkSync(tmp);   // 방금 만든 임시 html 하나만
  console.log('✅ ' + file);
}

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const b = await chromium.launch();
  const tag = '';
  let n = 0;
  for (const [id, st, key, label] of SCREENS) {
    n++;
    let rows = '';
    for (const [sk, sl, vp, w] of SIZES) {
      const cells = [];
      for (const th of ['light', 'dark']) cells.push(`<td><img src="${url(await shoot(b, BRAND, id, st, sk, vp, th))}" style="width:${w}px"></td>`);
      rows += `<tr><td class="k">${sl}</td>${cells.join('')}</tr>`;
    }
    await render(b, `<h1>${NAME} 앱 — ${label} (${id}${st ? ' · ' + st : ''})${tag}</h1><div class="sub">같은 화면 코드 · 브랜드 설정만 다르다(로고·이름·매장 목록·아이콘). 매장은 이 브랜드 매장만 보인다.</div><table><tr><th></th><th>밝게</th><th>어둡게</th></tr>${rows}</table>`,
      path.join(OUT, `sheet_${n}_${key}.png`), 150 + 2 * 640 + 60);
  }
  // 에스알마트와 나란히 — 폰 세로
  let rows = '';
  for (const [id, st, , label] of SCREENS) {
    const cells = [];
    for (const th of ['light', 'dark']) for (const br of ['srm', BRAND]) cells.push(`<td><img src="${url(await shoot(b, br, id, st, 'phone', SIZES[0][2], th))}" style="width:260px"></td>`);
    rows += `<tr><td class="k">${label}<br><small>${id}</small></td>${cells.join('')}</tr>`;
  }
  await render(b, `<h1>에스알마트 | ${NAME} — 나란히 (폰 세로)${tag}</h1><div class="sub">화면 구조는 같고 로고·이름·매장(에스알마트 검암·왕길·신흥 / ${NAME} 고촌)·스플래시·아이콘만 다르다. 회원·포인트·주문·사업자 정보(동신마켓)는 하나다.</div><table><tr><th></th><th>에스알마트 · 밝게</th><th>${NAME} · 밝게</th><th>에스알마트 · 어둡게</th><th>${NAME} · 어둡게</th></tr>${rows}</table>`,
    path.join(OUT, `compare_srm_vs_${BRAND}.png`), 150 + 4 * 274 + 40);

  // 확대 — ⑴ 헤더 로고: 목업 헤더를 기기 배율 1·2·3 으로 찍어 4배(배율 1)·2배·1.33배 늘려 같은 크기로 본다(뭉개짐은 배율 1 에서 가장 잘 보인다)
  //        ⑵ 홈 화면 아이콘: 실제 크기 48px 를 배율 1·3 으로, 에스알마트와 나란히(바탕·모양으로 구분되는지)
  const head = async (br, th, dsf) => {
    const ctx = await b.newContext({ viewport: SIZES[0][2], deviceScaleFactor: dsf, colorScheme: th, locale: 'ko-KR' });
    const p = await ctx.newPage();
    await p.goto(`${url(MOCK)}?solo=P05&theme=${th}&brand=${br}&state=${encodeURIComponent('로그인 안 함')}`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    const f = path.join(SHOTS, `zoom_head_${br}_${th}_x${dsf}.png`);
    const r = await p.locator('.homebar').boundingBox();
    await p.screenshot({ path: f, clip: { x: r.x, y: r.y, width: 200, height: r.height } });
    await ctx.close(); return f;
  };
  let zr = '';
  for (const th of ['light', 'dark']) for (const br of ['srm', BRAND]) {
    const cells = [];
    for (const dsf of [1, 2, 3]) cells.push(`<td><img src="${url(await head(br, th, dsf))}" style="width:600px;image-rendering:pixelated"><div class="cap">기기 배율 ${dsf}${dsf === 1 ? ' (가장 거친 화면)' : dsf === 3 ? ' (요즘 폰)' : ''}</div></td>`);
    zr += `<tr><td class="k">${br === 'srm' ? '에스알마트' : NAME}<br>${th === 'light' ? '밝게' : '어둡게'}</td>${cells.join('')}</tr>`;
  }
  const icoSrc = fs.readFileSync(MOCK, 'utf8');
  const iconOf = br => { const m = new RegExp(`${br}: \\{[^\\n]*?icon: '([^']+)'`).exec(icoSrc); if (!m) throw new Error(`목업 BRANDS.${br}.icon 없음`); return url(path.join(path.dirname(MOCK), m[1])); };
  const ico = (br, px) => `<div style="display:inline-flex;flex-direction:column;align-items:center;gap:6px;margin:0 10px;font-size:12px;color:#fff"><img src="${iconOf(br)}" style="width:${px}px;height:${px}px;border-radius:${Math.round(px * 0.3)}px;display:block;border:0;background:none">${br === 'srm' ? '에스알마트' : NAME}</div>`;
  const icoRow = (dsfLabel) => `<div style="background:linear-gradient(160deg,#3a4a6b,#1d2433);padding:18px 14px;border-radius:12px;display:inline-block">${ico('srm', 48)}${ico(BRAND, 48)}${ico('srm', 48)}${ico(BRAND, 48)}</div><div class="cap">${dsfLabel}</div>`;
  const zf = path.join(OUT, 'zoom_logo_icon.png');
  // 아이콘 칸은 배율 1 과 3 으로 따로 찍어 붙인다
  const iconShot = async (dsf) => {
    const tmp = path.join(SHOTS, `_icon_${dsf}.html`);
    fs.writeFileSync(tmp, `<!doctype html><meta charset="utf-8"><body style="margin:0;font-family:sans-serif">${icoRow('')}</body>`);
    const pg = await b.newPage({ viewport: { width: 360, height: 120 }, deviceScaleFactor: dsf });
    await pg.goto(url(tmp)); await pg.waitForTimeout(150);
    const f = path.join(SHOTS, `zoom_icon_x${dsf}.png`);
    await pg.locator('body > div').first().screenshot({ path: f });
    await pg.close(); fs.unlinkSync(tmp); return f;
  };
  const i1 = await iconShot(1), i3 = await iconShot(3);
  await render(b, `<h1>확대 — 헤더 로고(높이 28px) · 홈 화면 아이콘(48px)</h1><div class="sub">헤더: 목업 헤더 왼쪽 200px 를 기기 배율 1·2·3 으로 찍어 같은 폭으로 늘렸다(점이 보이게 — 배율 1 이 가장 거칠다). 아이콘: 실제 48px 를 배율 1·3 으로 찍어 4배·1.33배로 늘렸다.</div>
    <table><tr><th></th><th>배율 1</th><th>배율 2</th><th>배율 3</th></tr>${zr}</table>
    <h1 style="margin-top:24px">홈 화면 아이콘 48px — 에스알마트 | ${NAME} 나란히</h1>
    <table><tr><td><img src="${url(i1)}" style="width:1080px;image-rendering:pixelated"><div class="cap">기기 배율 1 (48px 그대로 · 4배 확대)</div></td></tr>
    <tr><td><img src="${url(i3)}" style="width:1080px"><div class="cap">기기 배율 3 (요즘 폰 · 144px 실제 화소)</div></td></tr></table>`,
    zf, 150 + 3 * 614 + 40);
  await b.close();
})().catch(e => { console.error('🔴', e); process.exit(1); });
