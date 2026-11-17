/**
 * AI 상담 단추 시트 (2026-11-13 대표님 지시 — B안: 홈 검색창 오른쪽 · ③ 로봇 얼굴 확정).
 *
 *   node scripts/shop-shots/ai-button-sheets.cjs [--out C:/srmart/srmart-shop-mockup/sheets/ai-button]
 *
 * 만드는 것(<out>):
 *   sheet_3_robot.png
 *     → 확정 아이콘 한 장: 줄 = (폰 세로 · 태블릿 세로 · 태블릿 가로) × (밝게 · 어둡게), 칸 = 로그인 안 함 · 로그인함.
 *       홈(P05) 위쪽(헤더 · 검색 줄 · 배송 줄)만 잘라 붙인다 — 단추가 놓인 자리를 크게 보려고.
 *   sheet_4_zoom.png   → ③ 아이콘 크게(밝게·어둡게) + 실제 크기(44px) 나란히
 *   sheet_5_first_tip.png → 처음 안내 말풍선 「궁금한 건 AI에게 물어보세요」(세 크기 × 밝게·어둡게)
 *   shots/   → 시트에 들어간 낱장
 *
 * 목업 주소: ?solo=P05&state=…&theme=…  (①·② 후보와 ?ai= 는 2026-11-13 ③ 확정으로 지웠다). 글자가 한글이라 HTML 로 짜서 찍는다.
 */
require('../lib/msys-path.cjs');   // Git Bash 경로 변환 막기(/shop·/srm·/aram) — 2026-11-13 지시 6
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MOCK = arg('--mockup', 'C:/srmart/srmart-shop-mockup/index.html');
const OUT = arg('--out', 'C:/srmart/srmart-shop-mockup/sheets/ai-button');
const FONT = path.join(path.dirname(MOCK), 'assets/fonts');
const SHOTS = path.join(OUT, 'shots');
const url = f => pathToFileURL(f).href;

// 2026-11-13 대표님 ③ 로봇 얼굴 확정 — ①·② 후보는 목업에서 지웠다(?ai= 주소도 없다)
const ICONS = [[3, 'robot', '③ 로봇 얼굴 (확정)']];
const SIZES = [
  ['phone', '폰 세로 390×844', { width: 390, height: 844 }],
  ['tablet', '태블릿 세로 820×1180', { width: 820, height: 1180 }],
  ['tland', '태블릿 가로 1180×820', { width: 1180, height: 820 }],
];
const CROP = 300;   // 화면 위에서부터 잘라 보는 높이(css px) — 헤더 · 검색 줄 · 배송 줄 · 처음 안내 말풍선까지

async function shoot(b, ai, sizeKey, vp, theme, state) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, colorScheme: theme, locale: 'ko-KR' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(`${url(MOCK)}?solo=P05&theme=${theme}&state=${encodeURIComponent(state)}`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(120);
  const r = await p.locator('.screen').boundingBox();
  const f = path.join(SHOTS, `ai${ai}_${sizeKey}_${theme}_${state === '로그인함' ? 'login' : state === '로그인 안 함' ? 'guest' : 'tip'}.png`);
  await p.screenshot({ path: f, clip: { x: r.x, y: r.y, width: r.width, height: Math.min(CROP, r.height) } });
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
  const imgW = { phone: 390, tablet: 615, tland: 885 };   // 시트 안 폭 — 폰은 실제 css 폭, 태블릿은 0.75배(단추가 작아지지 않게)
  for (const [ai, key, label] of ICONS) {
    let rows = '';
    for (const [sk, sl, vp] of SIZES) for (const th of ['light', 'dark']) {
      const cells = [];
      for (const st of ['로그인 안 함', '로그인함']) cells.push(`<td><img src="${url(await shoot(b, ai, sk, vp, th, st))}" style="width:${imgW[sk]}px"></td>`);
      rows += `<tr><td class="k">${sl}<br>${th === 'light' ? '밝게' : '어둡게'}</td>${cells.join('')}</tr>`;
    }
    const head = '<tr><th></th><th>로그인 안 함</th><th>로그인함</th></tr>';
    await render(b, `<h1>AI 상담 단추 — 후보 ${label}</h1><div class="sub">홈(P05) 위쪽만 잘라 붙임 · 검색창 오른쪽 44px 둥근 네모 · 글자 없이 선 아이콘 · 화면 읽기 이름 「AI 상담」 · 헤더에는 없다</div><table>${head}${rows}</table>`,
      path.join(OUT, `sheet_${ai}_${key}.png`), 160 + 2 * imgW.tland + 60);
  }

  // 확대 — 목업의 아이콘 정의를 그대로 꺼내 크게 그린다(다시 그리지 않는다)
  //   (ICON 은 목업 안의 const 라 바깥에서 못 읽는다 — 소스에서 그 줄을 꺼낸다)
  const src = fs.readFileSync(MOCK, 'utf8');
  const ICON_SRC = {};
  for (const n of ['robot', 'search', 'bell']) {
    const m = src.match(new RegExp(`\\b${n}: '([^']+)'`));
    if (!m) throw new Error(`목업에 아이콘 ${n} 이 없다`);
    ICON_SRC[n] = m[1];
  }
  const svg = (n, px, color, sw = 2) => `<svg viewBox="0 0 24 24" width="${px}" height="${px}" style="stroke:${color};fill:none;stroke-width:${sw};stroke-linecap:round;stroke-linejoin:round;display:block">${ICON_SRC[n]}</svg>`;
  const THEME = { light: { bg: '#ffffff', soft: '#e5f8ef', ink: '#007a43', name: '밝게' }, dark: { bg: '#000000', soft: 'rgba(0,196,113,.18)', ink: '#30d98b', name: '어둡게' } };
  let zoom = '';
  for (const [ai, key, label] of ICONS) {
    const n = 'robot';
    const cells = ['light', 'dark'].map(t => { const T = THEME[t]; return `<td><div style="background:${T.bg};padding:24px;border-radius:16px;display:flex;gap:28px;align-items:center">
      <div style="width:220px;height:220px;border-radius:50px;background:${T.soft};display:flex;align-items:center;justify-content:center">${svg(n, 120, T.ink)}</div>
      <div style="display:flex;flex-direction:column;gap:14px;align-items:center;color:${t === 'light' ? '#555' : '#aaa'};font-size:13px">
        <div style="width:44px;height:44px;border-radius:10px;background:${T.soft};display:flex;align-items:center;justify-content:center">${svg(n, 24, T.ink)}</div>실제 크기 44px
        <div style="display:flex;gap:12px">${svg('search', 24, t === 'light' ? '#111' : '#eee')}${svg('bell', 24, t === 'light' ? '#111' : '#eee')}${svg(n, 24, t === 'light' ? '#111' : '#eee')}</div>다른 아이콘과 나란히</div></div></td>`; }).join('');
    zoom += `<tr><td class="k">${label}</td>${cells}</tr>`;
  }
  await render(b, `<h1>AI 상담 아이콘 — ③ 로봇 얼굴(확정) 크게 보기</h1><div class="sub"> 다른 아이콘과 같은 24 칸 · 선 굵기 2 · 끝 둥글게. 「AI」 글자도 선으로 그렸다(기기 글꼴·이모지에 기대지 않는다). 단추 바탕은 --brand-soft, 아이콘은 --brand-strong(밝게 #007a43 · 어둡게 #30d98b).</div><table><tr><th></th><th>밝게</th><th>어둡게</th></tr>${zoom}</table>`,
    path.join(OUT, 'sheet_4_zoom.png'), 120 + 2 * 520 + 60);

  // 처음 안내 말풍선
  let tip = '';
  for (const [sk, sl, vp] of SIZES) {
    const cells = [];
    for (const th of ['light', 'dark']) cells.push(`<td><img src="${url(await shoot(b, 3, sk, vp, th, 'AI 처음 안내'))}" style="width:${imgW[sk]}px"></td>`);
    tip += `<tr><td class="k">${sl}</td>${cells.join('')}</tr>`;
  }
  await render(b, `<h1>처음 안내 — 「궁금한 건 AI에게 물어보세요」</h1><div class="sub">처음 들어온 손님에게 한 번만 · ✕ 로 닫거나 AI 단추를 한 번 누르면 다시 안 뜬다 · 아이콘과 무관(③ 로봇) · 로그인한 손님도 처음이면 같다</div><table><tr><th></th><th>밝게</th><th>어둡게</th></tr>${tip}</table>`,
    path.join(OUT, 'sheet_5_first_tip.png'), 160 + 2 * imgW.tland + 60);
  await b.close();
})().catch(e => { console.error('🔴', e); process.exit(1); });
