/**
 * 비교 시트 — 「현재 | 목업 밝게 | 목업 어둡게」를 화면 4개씩 한 장에.
 *
 *   node scripts/shop-shots/build-sheets.cjs [--out C:/srmart/srmart-shop-mockup/sheets]
 *   node scripts/shop-shots/build-sheets.cjs --changes S01,S06,P05 [--out …/sheets/changes]
 *     → 「변경 시트」: 화면마다 현재(폰) | 폰 밝게 | 폰 어둡게 | 태블릿 밝게 | 태블릿 어둡게, 3개씩 한 장
 *
 * 재료: docs/shots/before/<ID>_light.png(현재, 폰) · docs/shots/mockup/<ID>_light.png · _dark.png
 *      (변경 시트는 docs/shots/mockup/tablet/<ID>_tablet_light.png · _dark.png 도)
 * 글자가 한글이라 이미지 합성 대신 **HTML 로 짜서 Playwright 로 찍는다**(Pretendard 로 또렷하게).
 * 배율 2 로 찍어 사진 속 앱 글자도 읽힌다.
 * 현재 사진이 없는 화면(S39 앱 전용 · S40 들어갈 길 없음)은 이유를 적은 빈 칸,
 * 확정 화면(P01~)은 대신하는(replaces) 첫 화면, 없으면 대응 첫 화면의 현재 사진을 쓴다. 결정 기록(D01~)은 앱에 없는 화면이라 현재 칸을 비운다.
 */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const CHANGES = (arg('--changes', '') || '').split(',').map(x => x.trim()).filter(Boolean);
const OUT = arg('--out', CHANGES.length ? 'C:/srmart/srmart-shop-mockup/sheets/changes' : 'C:/srmart/srmart-shop-mockup/sheets');
const MOCK = arg('--mockup', 'C:/srmart/srmart-shop-mockup/index.html');
const FONT = path.join(path.dirname(MOCK), 'assets/fonts');
const PER = CHANGES.length ? 3 : 4;
const NO_BEFORE = {
  S39: '현재 사진 없음 — 안드로이드 앱 첫 실행에서만 뜬다(웹 빌드로 재현 불가)',
  S40: '현재 사진 없음 — 앱 안에 이 화면으로 가는 길이 없다(F6)',
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
  fs.mkdirSync(OUT, { recursive: true });
  const url = f => pathToFileURL(f).href;
  const made = [];
  for (let i = 0; i < screens.length; i += PER) {
    const chunk = screens.slice(i, i + PER);
    const cells = chunk.map(s => {
      let beforeId = s.id, cap = '현재';
      // 확정 화면(P)은 대신한 옛 화면(replaces) 첫 ID, 없으면 「대응」 첫 ID 의 현재 사진
      if (s.prop) { const m = (s.replaces || s.covers || '').match(/S\d\d/); beforeId = m ? m[0] : ''; cap = `현재 (${beforeId})`; }
      const bf = path.join(ROOT, 'docs/shots/before', `${beforeId}_light.png`);
      const before = !s.dec && fs.existsSync(bf) ? `<img src="${url(bf)}">`
        : `<div class="none">${s.dec ? '결정 기록 화면 — 앱에는 없다' : NO_BEFORE[s.id] || '현재 사진 없음'}</div>`;
      const shot = (dir, suf) => `<img src="${url(path.join(ROOT, 'docs/shots/mockup', dir, `${s.id}_${suf}.png`))}">`;
      const fig = (c, body, cls = '') => `<figure class="${cls}"><figcaption>${c}</figcaption>${body}</figure>`;
      const em = s.prop ? ` <em>확정(2026-11-12)${s.replaces ? ' · ' + s.replaces + ' 대신' : ''}</em>` : s.dec ? ' <em class="d">결정 · 확정</em>' : '';
      const cols = CHANGES.length
        ? fig(cap + '(폰)', before) + fig('폰 밝게', shot('', 'light')) + fig('폰 어둡게', shot('', 'dark'))
          + fig('태블릿 밝게', shot('tablet', 'tablet_light'), 't') + fig('태블릿 어둡게', shot('tablet', 'tablet_dark'), 't')
        : fig(cap, before) + fig('목업 밝게', shot('', 'light')) + fig('목업 어둡게', shot('', 'dark'));
      return `<section><h2><span class="id ${s.prop ? 'p' : s.dec ? 'd' : ''}">${s.id}</span>${s.name}${em}</h2><div class="row">${cols}</div></section>`;
    }).join('');
    const first = chunk[0].id, last = chunk[chunk.length - 1].id;
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
      @font-face { font-family: P; font-weight: 400; src: url("${url(path.join(FONT, 'pretendard_regular.otf'))}"); }
      @font-face { font-family: P; font-weight: 700; src: url("${url(path.join(FONT, 'pretendard_bold.otf'))}"); }
      * { margin: 0; box-sizing: border-box; } body { font-family: P, sans-serif; background: #e9e9ee; color: #111; padding: 24px; width: 1720px; }
      header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; gap: 24px; }
      header h1 { font-size: 26px; } header p { font-size: 15px; color: #555; }
      .grid { display: grid; grid-template-columns: ${CHANGES.length ? '1fr' : '1fr 1fr'}; gap: 20px; }
      section { background: #fff; border-radius: 16px; padding: 14px; }
      h2 { font-size: 19px; margin-bottom: 10px; display: flex; gap: 8px; align-items: center; }
      h2 em { font-style: normal; font-size: 13px; color: #b86400; background: #fff3e0; border-radius: 99px; padding: 2px 8px; }
      h2 em.d { color: #0a5fc2; background: #e6f0fc; }
      .id { background: #00c471; color: #fff; border-radius: 6px; padding: 1px 8px; font-size: 15px; } .id.p { background: #ff9500; } .id.d { background: #007aff; }
      .row { display: grid; grid-template-columns: ${CHANGES.length ? '1fr 1fr 1fr 1.6fr 1.6fr' : 'repeat(3, 1fr)'}; gap: 10px; align-items: start; }
      figure { display: flex; flex-direction: column; gap: 6px; }
      figcaption { font-size: 14px; font-weight: 700; color: #444; text-align: center; }
      img, .none { width: 100%; aspect-ratio: 390 / 844; border-radius: 14px; border: 1px solid #ccc; object-fit: cover; object-position: top; background: #f2f2f7; }
      figure.t img { aspect-ratio: 820 / 1180; }
      .none { display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; color: #888; font-size: 15px; }
    </style></head><body><header><h1>에스알마트 쇼핑앱 — ${CHANGES.length ? '바뀐 화면 · 폰·태블릿' : '현재 | 목업'} (${first}~${last})</h1><p>목업 3차(결정 2~8 · 2026-11-12 지시 9~16 반영) · P01~P05 확정 · 목업 전체는 최종 승인 전 · 2026-11-12 · 버튼 초록 B(#00864a) 확정 · 로그인 화면 데이터는 가짜 응답</p></header><div class="grid">${cells}</div></body></html>`;
    const tmp = path.join(OUT, '_sheet.html');
    fs.writeFileSync(tmp, html);
    const page = await browser.newPage({ viewport: { width: 1768, height: 800 }, deviceScaleFactor: CHANGES.length ? 1.5 : 2 });
    await page.goto(url(tmp)); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(200);
    const name = `${CHANGES.length ? 'changes' : 'sheet'}_${String(i / PER + 1).padStart(2, '0')}_${first}-${last}.png`;
    await page.screenshot({ path: path.join(OUT, name), fullPage: true });
    await page.close();
    made.push(name);
  }
  fs.unlinkSync(path.join(OUT, '_sheet.html'));   // 방금 만든 임시 파일 하나만 지운다
  await browser.close();
  console.log(made.map(n => path.join(OUT, n)).join('\n'));
  console.log(`✅ 시트 ${made.length}장`);
})().catch(e => { console.error('🔴', e); process.exit(1); });
