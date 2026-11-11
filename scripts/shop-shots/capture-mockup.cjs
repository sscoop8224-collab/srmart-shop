/**
 * 목업(C:\srmart\srmart-shop-mockup\index.html) 화면을 하나씩 찍는다.
 *
 *   node scripts/shop-shots/capture-mockup.cjs [--mockup <index.html>] [--out <폴더>] [--no-tablet] [S01 P01 ...]
 *
 * - 폰 390×844(배율 2) → docs/shots/mockup/S01_light.png · S01_dark.png
 * - 태블릿 820×1180   → docs/shots/mockup/tablet/S01_tablet_light.png … (깨지는지 보는 용도)
 * - 목업은 ?solo=ID&theme=light|dark 로 한 화면만 꽉 차게 그린다. 버튼 초록은 목업 기본값(후보 B)으로 찍힌다.
 * - 화면마다 ⑴ 스크립트 오류 ⑵ 가로 넘침(가로 스크롤이 생기는 요소)을 재서 보고한다 — 넘치면 🔴.
 * - 서버를 띄우지 않는다(file:// 로 연다). 외부 요청은 전부 막는다(목업은 외부 CDN 을 안 쓴다 — 쓰면 여기서 🔴).
 */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const sharp = require('sharp');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MOCK = arg('--mockup', 'C:/srmart/srmart-shop-mockup/index.html');
const OUT = arg('--out', path.join(__dirname, '../../docs/shots/mockup'));
const NO_TABLET = process.argv.includes('--no-tablet');
const ONLY = process.argv.slice(2).filter(a => /^[SPD]\d\d$/.test(a));   // S 화면 · P 제안 · D 대표님이 고를 것

const DEVICES = [
  { key: '', viewport: { width: 390, height: 844 }, dsf: 2, dir: OUT },
  { key: 'tablet_', viewport: { width: 820, height: 1180 }, dsf: 1, dir: path.join(OUT, 'tablet') },
];

(async () => {
  const base = pathToFileURL(MOCK).href;
  const browser = await chromium.launch();
  // 화면 목록은 목업이 스스로 내보낸다(window.__SCREENS) — 목록을 두 군데에 적지 않는다
  const probe = await browser.newPage();
  await probe.goto(base);
  const all = await probe.evaluate(() => window.__SCREENS);
  await probe.close();
  const list = ONLY.length ? all.filter(s => ONLY.includes(s.id)) : all;
  let bad = 0;
  for (const s of list) {
    const row = [];
    for (const dev of DEVICES) {
      if (NO_TABLET && dev.key) continue;
      fs.mkdirSync(dev.dir, { recursive: true });
      for (const theme of ['light', 'dark']) {
        const ctx = await browser.newContext({ viewport: dev.viewport, deviceScaleFactor: dev.dsf, colorScheme: theme, locale: 'ko-KR' });
        const external = [];
        await ctx.route('**/*', r => {
          const u = r.request().url();
          if (u.startsWith('file:') || u.startsWith('data:')) return r.continue();
          external.push(u); return r.abort();
        });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(String(e.message).slice(0, 120)));
        await page.goto(`${base}?solo=${s.id}&theme=${theme}`);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);
        // 가로 넘침: 화면 안 요소 중 화면 오른쪽 밖으로 나가는 것(가로로 미는 칩·상품 줄은 원래 넘치므로 뺀다)
        const overflow = await page.evaluate(() => {
          const scr = document.querySelector('.screen'); if (!scr) return ['화면 없음'];
          const W = scr.getBoundingClientRect().right + 1;
          const out = [];
          for (const el of scr.querySelectorAll('*')) {
            if (el.closest('.chips, .hscroll, .barcode')) continue;
            const r = el.getBoundingClientRect();
            if (r.width && r.right > W) out.push((el.className && String(el.className).slice(0, 30)) || el.tagName);
          }
          return [...new Set(out)].slice(0, 4);
        });
        const file = path.join(dev.dir, `${s.id}_${dev.key}${theme}.png`);
        await sharp(await page.screenshot()).png({ palette: true, quality: 92, compressionLevel: 9 }).toFile(file);
        await ctx.close();
        const ok = !errors.length && !overflow.length && !external.length;
        if (!ok) bad++;
        row.push(`${ok ? '✅' : '🔴'}${dev.key ? '태블릿' : '폰'}·${theme === 'light' ? '밝게' : '어둡게'}`
          + (errors.length ? ' 오류:' + errors.join('/') : '') + (overflow.length ? ' 넘침:' + overflow.join(',') : '') + (external.length ? ' 외부요청:' + external[0] : ''));
      }
    }
    console.log(`${s.id} ${s.name.slice(0, 22).padEnd(22)} ${row.join('  ')}`);
  }
  await browser.close();
  console.log(bad ? `🔴 문제 ${bad}건` : `✅ ${list.length}개 화면 전부 오류·넘침·외부요청 없음`);
  console.log('저장: ' + OUT);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error('🔴', e); process.exit(1); });
