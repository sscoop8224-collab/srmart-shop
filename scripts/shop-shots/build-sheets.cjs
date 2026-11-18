/**
 * 비교 시트 — 목업 사진(capture-mockup.cjs)을 한 장에 모은다.
 *
 *   node scripts/shop-shots/build-sheets.cjs [--out C:/srmart/srmart-shop-mockup/sheets]
 *     → 「전체 시트」: 화면마다 현재 | 목업 밝게 | 목업 어둡게, 4개씩 한 장 (폰 세로)
 *   node scripts/shop-shots/build-sheets.cjs --changes S01,S06,P05 [--theme light|dark|both] [--out …/sheets/changes5]
 *     → 「변경 시트」(2026-11-12 블록 B 기본): 화면마다 **현재(폰) | 폰 세로 | 태블릿 세로 | 태블릿 가로**, 3개씩 한 장.
 *       밝게·어둡게는 따로 묶는다(<out>/light · <out>/dark). 한 칸에 두 테마를 섞으면 크기 비교가 안 된다.
 *   node scripts/shop-shots/build-sheets.cjs --collect pland|pc [--changes …] [--theme …] [--out …]
 *     → 「모음 시트」: 폰 가로(844×390) 또는 PC(1440×900) 만 모아 본다 — 기본 비교 시트에는 넣지 않는다
 *       (앱은 폰 세로 고정이고, PC 는 태블릿 가로를 폭만 묶은 것이라 깨지는지만 보면 된다).
 *
 * 재료: docs/shots/before/<ID>_light.png(현재, 폰) · docs/shots/mockup/<ID>_<theme>.png(폰 세로)
 *      · mockup/tablet/<ID>_tablet_<theme>.png · mockup/tablet-land/<ID>_tland_<theme>.png
 *      · mockup/phone-land/<ID>_pland_<theme>.png · mockup/pc/<ID>_pc_<theme>.png
 * 글자가 한글이라 이미지 합성 대신 **HTML 로 짜서 Playwright 로 찍는다**(Pretendard 로 또렷하게).
 * 현재 사진이 없는 화면(S39 앱 전용 · S40 들어갈 길 없음 · 새 화면)은 이유를 적은 빈 칸,
 * 확정 화면(P01~)은 대신하는(replaces) 첫 화면, 없으면 대응 첫 화면의 현재 사진을 쓴다. 결정 기록(D01~)은 현재 칸을 비운다.
 */
require('../lib/msys-path.cjs');   // Git Bash 경로 변환 막기(/shop·/srm·/aram) — 2026-11-13 지시 6
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const CHANGES = (arg('--changes', '') || '').split(',').map(x => x.trim()).filter(Boolean);
const COLLECT = arg('--collect', '');   // pland | pc
const THEMES = (t => t === 'both' ? ['light', 'dark'] : [t])(arg('--theme', 'both'));
const MODE = COLLECT ? 'collect' : CHANGES.length ? 'changes' : 'all';
if (COLLECT && !['pland', 'pc'].includes(COLLECT)) throw new Error('--collect 는 pland 또는 pc');
const OUT = arg('--out', MODE === 'all' ? 'C:/srmart/srmart-shop-mockup/sheets' : MODE === 'changes' ? 'C:/srmart/srmart-shop-mockup/sheets/changes' : `C:/srmart/srmart-shop-mockup/sheets/${COLLECT === 'pc' ? 'pc' : 'phone-land'}`);
const MOCK = arg('--mockup', 'C:/srmart/srmart-shop-mockup/index.html');
const FONT = path.join(path.dirname(MOCK), 'assets/fonts');
const NO_BEFORE = {
  S39: '현재 사진 없음 — 안드로이드 앱 첫 실행에서만 뜬다(웹 빌드로 재현 불가)',
  S40: '현재 사진 없음 — 앱 안에 이 화면으로 가는 길이 없다(F6)',
};
const SHOT = {   // 크기 → [폴더, 파일 이름 꼬리, 가로/세로 비]
  phone: ['', '', '390 / 844'], pland: ['phone-land', 'pland_', '844 / 390'],
  tablet: ['tablet', 'tablet_', '820 / 1180'], tland: ['tablet-land', 'tland_', '1180 / 820'], pc: ['pc', 'pc_', '1440 / 900'],
};

(async () => {
  const browser = await chromium.launch();
  const probe = await browser.newPage();
  await probe.goto(pathToFileURL(MOCK).href);
  const all = await probe.evaluate(() => window.__SCREENS.map(s => ({ ...s })));
  await probe.close();
  const miss = CHANGES.filter(id => !all.some(s => s.id === id));
  if (miss.length) throw new Error('목업에 없는 화면: ' + miss.join(','));
  const screens = CHANGES.length ? CHANGES.map(id => all.find(s => s.id === id)) : all;
  const url = f => pathToFileURL(f).href;
  const shotFile = (size, id, theme) => { const [dir, suf] = SHOT[size]; return path.join(ROOT, 'docs/shots/mockup', dir, `${id}_${suf}${theme}.png`); };
  const img = (size, id, theme) => {
    const f = shotFile(size, id, theme);
    return fs.existsSync(f) ? `<img src="${url(f)}" style="aspect-ratio:${SHOT[size][2]}">` : `<div class="none" style="aspect-ratio:${SHOT[size][2]}">사진 없음 — capture-mockup.cjs 를 먼저</div>`;
  };
  const beforeCell = (s) => {
    let beforeId = s.id, cap = '현재';
    if (s.prop) { const m = (s.replaces || s.covers || '').match(/S\d\d/); beforeId = m ? m[0] : ''; cap = `현재 (${beforeId})`; }
    const bf = path.join(ROOT, 'docs/shots/before', `${beforeId}_light.png`);
    const body = !s.dec && fs.existsSync(bf) ? `<img src="${url(bf)}" style="aspect-ratio:390 / 844">`
      : `<div class="none" style="aspect-ratio:390 / 844">${s.dec ? '결정 기록 화면 — 앱에는 없다' : NO_BEFORE[s.id] || '현재 사진 없음'}</div>`;
    return fig(cap + '(폰)', body);
  };
  const fig = (c, body) => `<figure><figcaption>${c}</figcaption>${body}</figure>`;
  const em = s => s.prop ? ` <em>확정(2026-11-12)${s.replaces ? ' · ' + s.replaces + ' 대신' : ''}</em>` : s.dec ? ' <em class="d">결정 · 확정</em>' : '';
  const T = t => t === 'light' ? '밝게' : '어둡게';

  // 시트 한 종류 = { dir, theme, per, cols(css), cells(s) , title }
  const jobs = [];
  if (MODE === 'all') jobs.push({ dir: OUT, theme: 'light', per: 4, grid: '1fr 1fr', row: 'repeat(3, 1fr)', title: '현재 | 목업', name: 'sheet',
    cell: s => beforeCell(s) + fig('목업 밝게', img('phone', s.id, 'light')) + fig('목업 어둡게', img('phone', s.id, 'dark')) });
  else if (MODE === 'changes') for (const th of THEMES) jobs.push({ dir: path.join(OUT, th), theme: th, per: 3, grid: '1fr', row: '0.62fr 0.62fr 1.3fr 1.85fr', title: `바뀐 화면 · 폰 세로 | 태블릿 세로 | 태블릿 가로 · ${T(th)}`, name: 'changes',
    cell: s => beforeCell(s) + fig(`폰 세로 ${T(th)}`, img('phone', s.id, th)) + fig(`태블릿 세로 ${T(th)}`, img('tablet', s.id, th)) + fig(`태블릿 가로 ${T(th)}`, img('tland', s.id, th)) });
  else for (const th of THEMES) jobs.push({ dir: path.join(OUT, th), theme: th, per: COLLECT === 'pc' ? 4 : 6, grid: '1fr 1fr', row: '1fr', title: `${COLLECT === 'pc' ? 'PC 1440×900' : '폰 브라우저 가로 844×390'} 모음 · ${T(th)}`, name: COLLECT === 'pc' ? 'pc' : 'phone-land',
    cell: s => fig(`${COLLECT === 'pc' ? 'PC' : '폰 가로'} ${T(th)}`, img(COLLECT, s.id, th)) });

  const made = [];
  for (const job of jobs) {
    fs.mkdirSync(job.dir, { recursive: true });
    for (let i = 0; i < screens.length; i += job.per) {
      const chunk = screens.slice(i, i + job.per);
      const cells = chunk.map(s => `<section><h2><span class="id ${s.prop ? 'p' : s.dec ? 'd' : ''}">${s.id}</span>${s.name}${em(s)}</h2><div class="row">${job.cell(s)}</div></section>`).join('');
      const first = chunk[0].id, last = chunk[chunk.length - 1].id;
      const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
        @font-face { font-family: P; font-weight: 400; src: url("${url(path.join(FONT, 'pretendard_regular.woff2'))}"); }
        @font-face { font-family: P; font-weight: 700; src: url("${url(path.join(FONT, 'pretendard_bold.woff2'))}"); }
        * { margin: 0; box-sizing: border-box; } body { font-family: P, sans-serif; background: ${job.theme === 'dark' ? '#2a2a2e' : '#e9e9ee'}; color: ${job.theme === 'dark' ? '#f2f2f7' : '#111'}; padding: 24px; width: 1720px; }
        header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; gap: 24px; }
        header h1 { font-size: 26px; } header p { font-size: 15px; opacity: .7; }
        .grid { display: grid; grid-template-columns: ${job.grid}; gap: 20px; }
        section { background: ${job.theme === 'dark' ? '#3a3a3e' : '#fff'}; border-radius: 16px; padding: 14px; }
        h2 { font-size: 19px; margin-bottom: 10px; display: flex; gap: 8px; align-items: center; }
        h2 em { font-style: normal; font-size: 13px; color: #b86400; background: #fff3e0; border-radius: 99px; padding: 2px 8px; }
        h2 em.d { color: #0a5fc2; background: #e6f0fc; }
        .id { background: #00c471; color: #fff; border-radius: 6px; padding: 1px 8px; font-size: 15px; } .id.p { background: #ff9500; } .id.d { background: #007aff; }
        .row { display: grid; grid-template-columns: ${job.row}; gap: 10px; align-items: start; }
        figure { display: flex; flex-direction: column; gap: 6px; }
        figcaption { font-size: 14px; font-weight: 700; opacity: .8; text-align: center; }
        img, .none { width: 100%; border-radius: 14px; border: 1px solid #888; object-fit: cover; object-position: top; background: #f2f2f7; }
        .none { display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: #888; font-size: 15px; }
      </style></head><body><header><h1>에스알마트 쇼핑앱 — ${job.title} (${first}~${last})</h1><p>목업 5차(2026-11-12 블록 B — 최종 승인 전 마지막 수정) · P01~P05 확정 · 버튼 초록 B(#00864a) · 로그인 화면 데이터는 가짜 응답</p></header><div class="grid">${cells}</div></body></html>`;
      const tmp = path.join(job.dir, '_sheet.html');
      fs.writeFileSync(tmp, html);
      const page = await browser.newPage({ viewport: { width: 1768, height: 800 }, deviceScaleFactor: MODE === 'all' ? 2 : 1.5 });
      await page.goto(url(tmp)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
      const name = `${job.name}_${String(i / job.per + 1).padStart(2, '0')}_${first}-${last}.png`;
      await page.screenshot({ path: path.join(job.dir, name), fullPage: true });
      await page.close();
      fs.unlinkSync(tmp);   // 방금 만든 임시 파일 하나만 지운다
      made.push(path.join(job.dir, name));
    }
  }
  await browser.close();
  console.log(made.join('\n'));
  console.log(`✅ 시트 ${made.length}장`);
})().catch(e => { console.error('🔴', e); process.exit(1); });
