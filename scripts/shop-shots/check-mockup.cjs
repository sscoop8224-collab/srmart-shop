/**
 * 목업 전 화면·전 상태를 **5개 크기 × 밝게/어둡게**로 검사한다 (2026-11-12 블록 B).
 *
 *   node scripts/shop-shots/check-mockup.cjs [--mockup <index.html>] [--sizes phone,pland,tablet,tland,pc] [--self-test]
 *
 * 크기(SHOP_DESIGN_TOKENS.md 「화면 방향 규칙」과 같다):
 *   phone 390×844(폰 세로) · pland 844×390(폰 브라우저 가로) · tablet 820×1180(태블릿 세로)
 *   tland 1180×820(태블릿 가로) · pc 1440×900
 *
 * 보는 것(하나라도 걸리면 종료코드 1):
 *   ① 스크립트 오류 ② 가로 넘침(가로로 미는 칩·상품 줄·바코드는 뺀다) ③ 외부 요청
 *   ④ 떠 있는 단추(.fab)가 **없어야** 한다 — 2026-11-12 B-1 로 없앴다(되살아나면 담기·찜을 다시 가린다)
 *   ⑤ 헤더 단추끼리 겹치지 않는다(로고·매장·AI 상담·종·로그인) — 폰 세로가 가장 좁다
 *   ⑥ 폰 세로 홈(P05 모든 상태)에서 **첫 상품 줄이 통째로** 탭바 위에 보인다(B-4)
 *   ⑦ 열린 창(시트·알림창)이 화면 밖으로 나가지 않는다 — 폰 가로(높이 390)에서 잘리기 쉽다
 *   ⑧ 태블릿 가로·PC 의 상품 격자는 5~6열(B-9)
 *
 * --self-test: 일부러 망가뜨린 목업(떠 있는 단추를 되살림 · 헤더 단추를 겹침 · 배너를 키워 첫 줄을 밀어냄 ·
 *              격자를 4열로)을 만들어 위 검사가 잡는지 본다. 못 잡으면 검사기가 없는 것과 같다.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const MOCK = arg('--mockup', 'C:/srmart/srmart-shop-mockup/index.html');
const SIZES = {
  phone: { k: '폰 세로', vp: { width: 390, height: 844 }, dsf: 2 },
  pland: { k: '폰 가로', vp: { width: 844, height: 390 }, dsf: 2 },
  tablet: { k: '태블릿 세로', vp: { width: 820, height: 1180 }, dsf: 1 },
  tland: { k: '태블릿 가로', vp: { width: 1180, height: 820 }, dsf: 1 },
  pc: { k: 'PC', vp: { width: 1440, height: 900 }, dsf: 1 },
};
const PICK = (arg('--sizes', '') || Object.keys(SIZES).join(',')).split(',').filter(k => SIZES[k]);

async function run(mockFile, { quiet = false } = {}) {
  const url = pathToFileURL(mockFile).href;
  const b = await chromium.launch();
  const probe = await b.newPage(); await probe.goto(url);
  const all = await probe.evaluate(() => window.__SCREENS); await probe.close();
  const found = { error: 0, over: 0, external: 0, fab: 0, header: 0, firstRow: 0, overlay: 0, cols: 0 };
  let runs = 0;
  const log = m => { if (!quiet) console.log(m); };
  for (const key of PICK) {
    const d = SIZES[key];
    for (const theme of ['light', 'dark']) {
      const ctx = await b.newContext({ viewport: d.vp, deviceScaleFactor: d.dsf, colorScheme: theme, locale: 'ko-KR' });
      await ctx.route('**/*', r => {
        if (/^(file|data):/.test(r.request().url())) return r.continue();
        found.external++; log('🔴 외부 요청 ' + r.request().url()); return r.abort();
      });
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
      for (const s of all) for (const st of (s.states.length ? s.states : [''])) {
        errs.length = 0; runs++;
        await p.goto(`${url}?solo=${s.id}&theme=${theme}${st ? '&state=' + encodeURIComponent(st) : ''}`);
        await p.waitForTimeout(60);
        const r = await p.evaluate(() => {
          const scr = document.querySelector('.screen'); if (!scr) return { none: 1 };
          const SR = scr.getBoundingClientRect(), W = SR.right + 1, over = [];
          for (const el of scr.querySelectorAll('*')) {
            if (el.closest('.chips, .hscroll, .barcode')) continue;
            const q = el.getBoundingClientRect(); if (q.width && q.right > W) over.push(String(el.className || el.tagName).slice(0, 30));
          }
          const hit = (a, c) => a.left < c.right - 0.5 && a.right > c.left + 0.5 && a.top < c.bottom - 0.5 && a.bottom > c.top + 0.5;
          // ⑤ 헤더(홈바) 안 단추·로고끼리
          const hb = scr.querySelector('.homebar'); const hdr = [];
          if (hb) {
            const parts = [...hb.children].filter(x => !x.classList.contains('sp')).map(x => ({ n: x.getAttribute('aria-label') || x.textContent.trim().slice(0, 6) || x.tagName, q: x.getBoundingClientRect() }));
            for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) if (hit(parts[i].q, parts[j].q)) hdr.push(parts[i].n + '×' + parts[j].n);
            for (const x of parts) if (x.q.right > SR.right + 0.5 || x.q.left < SR.left - 0.5) hdr.push(x.n + ' 화면 밖');
          }
          // ⑥ 첫 상품 줄 — 첫 카드의 아래 끝(가격 줄까지)이 탭바 위에 있나
          let first = null;
          const pc = scr.querySelector('.grid .pc'), tb = scr.querySelector('.tabbar');
          if (pc && tb) first = { bottom: Math.round(pc.getBoundingClientRect().bottom), tab: Math.round(tb.getBoundingClientRect().top) };
          // ⑦ 열린 창이 화면 안에
          const ov = [];
          for (const el of scr.querySelectorAll('.overlay .sheet, .overlay .alert')) {
            const q = el.getBoundingClientRect();
            if (q.top < SR.top - 0.5 || q.bottom > SR.bottom + 0.5 || q.left < SR.left - 0.5 || q.right > SR.right + 0.5) ov.push(el.className);
          }
          // ⑧ 격자 열 수
          const g = scr.querySelector('.grid'); const cols = g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0;
          return { over: [...new Set(over)].slice(0, 3), fab: scr.querySelectorAll('.fab').length, hdr, first, ov, cols };
        });
        const tag = `${s.id}${st ? '[' + st + ']' : ''} ${d.k}·${theme === 'light' ? '밝게' : '어둡게'}`;
        if (r.none) { found.error++; log(`🔴 ${tag} 화면 없음`); continue; }
        if (errs.length) { found.error++; log(`🔴 ${tag} 오류: ${errs.join(' / ')}`); }
        if (r.over.length) { found.over++; log(`🔴 ${tag} 가로 넘침: ${r.over.join(',')}`); }
        if (r.fab) { found.fab++; log(`🔴 ${tag} 떠 있는 단추(.fab)가 있다 — 헤더 아이콘으로 옮겼는데 되살아났다`); }
        if (r.hdr.length) { found.header++; log(`🔴 ${tag} 헤더 겹침: ${r.hdr.join(', ')}`); }
        if (key === 'phone' && s.id === 'P05' && r.first && r.first.bottom > r.first.tab) { found.firstRow++; log(`🔴 ${tag} 첫 상품 줄이 첫 화면에 다 안 보인다 — 카드 아래 ${r.first.bottom} > 탭바 ${r.first.tab}`); }
        if (r.ov.length) { found.overlay++; log(`🔴 ${tag} 창이 화면 밖으로 나간다: ${r.ov.join(',')}`); }
        if ((key === 'tland' || key === 'pc') && r.cols && (r.cols < 5 || r.cols > 6)) { found.cols++; log(`🔴 ${tag} 상품 격자 ${r.cols}열 — 5~6열이어야 한다`); }
      }
      await ctx.close();
    }
  }
  await b.close();
  return { found, runs, screens: all.length };
}

async function selfTest() {
  const src = fs.readFileSync(MOCK, 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-mockup-'));
  // 자가 시험은 폰 세로·태블릿 가로 둘만 — 시간을 줄인다
  PICK.length = 0; PICK.push('phone', 'tland');
  const cases = [
    { name: '떠 있는 단추를 되살리면', expect: 'fab', mut: t => t.replace('${bar}${tab ? tabbar(tab, cart) : \'\'}', '<button class="fab">AI 상담</button>${bar}${tab ? tabbar(tab, cart) : \'\'}') },
    { name: '헤더 단추를 겹치면', expect: 'header', mut: t => t.replace('.homebar img { height: 28px; }', '.homebar img { height: 28px; } .homebar .icon-btn { margin-left: -40px; }') },
    { name: '홈 배너를 키워 첫 줄을 밀어내면', expect: 'firstRow', mut: t => t.replace('.banner.home { min-height: 112px;', '.banner.home { min-height: 420px;') },
    { name: '태블릿 가로 격자를 4열로 두면', expect: 'cols', mut: t => t.replace('@container (min-width: 1000px) { .grid { grid-template-columns: repeat(5, 1fr); }', '@container (min-width: 1000px) { .grid { grid-template-columns: repeat(4, 1fr); }').replace('@container (min-width: 1150px) { .grid { grid-template-columns: repeat(6, 1fr); } }', '') },
  ];
  let bad = 0;
  for (const c of cases) {
    const t = c.mut(src);
    if (t === src) { console.log(`🔴 자가 시험 「${c.name}」 — 망가뜨릴 자리를 못 찾았다(목업이 바뀌었나)`); bad++; continue; }
    const f = path.join(dir, `case_${c.expect}.html`);
    fs.writeFileSync(f, t);
    // 상대 경로(assets/…)가 맞게 목업 폴더를 가리키는 <base> 를 넣는다
    fs.writeFileSync(f, t.replace('<head>', `<head><base href="${pathToFileURL(path.dirname(MOCK)).href}/">`));
    const r = await run(f, { quiet: true });
    const ok = r.found[c.expect] > 0;
    if (!ok) bad++;
    console.log(`  ${ok ? '✅' : '🔴'} 자가 시험 「${c.name}」 → ${ok ? '잡았다' : '못 잡았다'} (${c.expect} ${r.found[c.expect]}건)`);
  }
  fs.rmSync(dir, { recursive: true, force: true });   // 방금 만든 임시 폴더 하나만
  return bad;
}

(async () => {
  if (process.argv.includes('--self-test')) {
    const bad = await selfTest();
    console.log(bad ? `🔴 자가 시험 실패 ${bad}건` : '🧪 자가 시험 — 망가뜨린 목업을 모두 잡았다');
    process.exit(bad ? 1 : 0);
  }
  const { found, runs, screens } = await run(MOCK);
  const total = Object.values(found).reduce((a, b) => a + b, 0);
  console.log(`── 크기 ${PICK.map(k => SIZES[k].k).join(' · ')} × 밝게·어둡게 — 화면 ${screens}개 · 상태 포함 ${runs}번`);
  console.log(`   오류 ${found.error} · 가로 넘침 ${found.over} · 외부 요청 ${found.external} · 떠 있는 단추 ${found.fab} · 헤더 겹침 ${found.header} · 첫 상품 줄 ${found.firstRow} · 창 잘림 ${found.overlay} · 격자 열 ${found.cols}`);
  console.log(total ? `🔴 문제 ${total}건` : '✅ 전부 통과');
  process.exit(total ? 1 : 0);
})().catch(e => { console.error('🔴', e); process.exit(1); });
