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
 *   ⑤ 헤더 단추끼리 겹치지 않는다(로고·매장·종·로그인) — 폰 세로가 가장 좁다
 *   ⑪ AI 상담 단추(2026-11-13 B안) — 홈 검색창 오른쪽: 헤더에는 없어야 하고, 검색 줄에서 검색창과 겹치지 않고
 *      높이가 같으며(±1px), 검색창이 AI_MIN_SEARCH(200px) 아래로 좁아지지 않고, 단추·처음 안내 말풍선이 화면 안에 있다
 *   ⑥ 홈(P05 모든 상태)의 **첫 상품 줄** — 폰 세로·태블릿 세로·태블릿 가로·PC 는 첫 카드가 **통째로** 탭바 위에(B-4 · 2026-11-12 지시 1).
 *      폰 가로(높이 390)는 카드 한 장이 화면 높이를 넘으므로 「통째로」는 불가능 — 대신 첫 줄이 **첫 화면에서 시작**해
 *      탭바 위로 사진이 FIRST_PEEK(80px) 이상 보여야 한다(배너·매장 미리보기 띠를 숨겨 얻은 자리 · 숨김이 풀리면 여기서 걸린다)
 *   ⑦ 열린 창(시트·알림창)이 화면 밖으로 나가지 않는다 — 폰 가로(높이 390)에서 잘리기 쉽다
 *   ⑧ 태블릿 가로·PC 의 상품 격자는 5~6열(B-9)
 *   ⑨ 하단 고정 바(.bar · .tabbar)가 본문 단추를 가리지 않는다(2026-11-12 지시 1) — 본문을 끝까지 내렸을 때
 *      어떤 단추·입력 칸도 고정 바 아래에 깔리면 안 된다(리뷰 쓰기 S05 의 「리뷰 등록」 같은 자리). 열린 창 뒤는 보지 않는다
 *   ⑩ PC 는 폰 시계(9:41)·홈 막대를 그리지 않는다(기기 장식은 목업 액자일 뿐 — 지시 1)
 *
 * --self-test: 일부러 망가뜨린 목업(떠 있는 단추를 되살림 · 헤더 단추를 겹침 · 배너를 키워 첫 줄을 밀어냄 ·
 *              격자를 4열로 · 폰 가로에서 배너를 되살림 · 바 위 여백을 없앰 · PC 에 시계를 되살림 · AI 단추를 헤더로 되돌림 ·
 *              AI 단추를 넓혀 검색창을 좁힘 · 안내 말풍선을 화면 밖으로)을 만들어 위 검사가 잡는지 본다.
 *              못 잡으면 검사기가 없는 것과 같다.
 */
require('../lib/msys-path.cjs');   // Git Bash 경로 변환 막기(/shop·/srm·/aram) — 2026-11-13 지시 6
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
const AI_MIN_SEARCH = 200;   // AI 단추 옆 검색창의 최소 폭(px) — 「검색창이 너무 좁아지지 않게」(2026-11-13)
const FIRST_PEEK = 80;   // 폰 가로: 첫 상품 사진이 탭바 위로 이만큼은 보여야 한다(px)
// --brand aram → 같은 화면을 아람마트 설정(?brand=aram)으로 — 로고·매장 이름이 길어져 넘치는지 본다(2026-11-13 화이트라벨)
const BRAND_Q = (b => b ? '&brand=' + encodeURIComponent(b) : '')(arg('--brand', ''));
const PICK = (arg('--sizes', '') || Object.keys(SIZES).join(',')).split(',').filter(k => SIZES[k]);

async function run(mockFile, { quiet = false, sizes = PICK, ids = null } = {}) {
  const url = pathToFileURL(mockFile).href;
  const b = await chromium.launch();
  const probe = await b.newPage(); await probe.goto(url);
  const all = await probe.evaluate(() => window.__SCREENS); await probe.close();
  const found = { error: 0, over: 0, external: 0, fab: 0, header: 0, ai: 0, firstRow: 0, overlay: 0, cols: 0, bottom: 0, chrome: 0 };
  let runs = 0;
  const log = m => { if (!quiet) console.log(m); };
  for (const key of sizes) {
    const d = SIZES[key];
    for (const theme of ['light', 'dark']) {
      const ctx = await b.newContext({ viewport: d.vp, deviceScaleFactor: d.dsf, colorScheme: theme, locale: 'ko-KR' });
      await ctx.route('**/*', r => {
        if (/^(file|data):/.test(r.request().url())) return r.continue();
        found.external++; log('🔴 외부 요청 ' + r.request().url()); return r.abort();
      });
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(e.message.slice(0, 120)));
      for (const s of all.filter(x => !ids || ids.includes(x.id))) for (const st of (s.states.length ? s.states : [''])) {
        errs.length = 0; runs++;
        await p.goto(`${url}?solo=${s.id}&theme=${theme}${BRAND_Q}${st ? '&state=' + encodeURIComponent(st) : ''}`);
        await p.waitForTimeout(60);
        const r = await p.evaluate((AI_MIN_SEARCH_) => {
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
          // ⑪ AI 상담 단추 — 헤더에 없고, 검색 줄에서 검색창 옆에
          const ai = [];
          if (hb && hb.querySelector('[aria-label="AI 상담"]')) ai.push('헤더에 AI 상담이 있다');
          const sr = scr.querySelector('.search-row');
          if (sr) {
            const sq = sr.querySelector('.search')?.getBoundingClientRect(), b = sr.querySelector('.ai-btn');
            if (!b) ai.push('검색 줄에 AI 단추 없음');
            else {
              const bq = b.getBoundingClientRect();
              if (b.getAttribute('aria-label') !== 'AI 상담') ai.push('화면 읽기 이름이 「AI 상담」이 아니다');
              if (b.textContent.trim()) ai.push('단추에 글자가 있다');
              if (sq && hit(sq, bq)) ai.push('검색창과 겹침');
              if (sq && Math.abs(sq.height - bq.height) > 1) ai.push(`높이 다름 ${Math.round(sq.height)}/${Math.round(bq.height)}`);
              if (sq && sq.width < AI_MIN_SEARCH_) ai.push(`검색창 ${Math.round(sq.width)}px(${AI_MIN_SEARCH_} 미만)`);
              if (bq.right > SR.right + 0.5) ai.push('단추 화면 밖');
            }
            const tip = sr.querySelector('.ai-tip');
            if (tip) { const tq = tip.getBoundingClientRect(); if (tq.right > SR.right + 0.5 || tq.left < SR.left - 0.5) ai.push('안내 말풍선 화면 밖'); }
          }
          // ⑥ 첫 상품 줄 — 첫 카드의 아래 끝(가격 줄까지)이 탭바 위에 있나
          let first = null;
          const pc = scr.querySelector('.grid .pc'), tb = scr.querySelector('.tabbar');
          if (pc && tb) { const q = pc.getBoundingClientRect(); first = { top: Math.round(q.top), bottom: Math.round(q.bottom), tab: Math.round(tb.getBoundingClientRect().top) }; }
          // ⑦ 열린 창이 화면 안에
          const ov = [];
          for (const el of scr.querySelectorAll('.overlay .sheet, .overlay .alert')) {
            const q = el.getBoundingClientRect();
            if (q.top < SR.top - 0.5 || q.bottom > SR.bottom + 0.5 || q.left < SR.left - 0.5 || q.right > SR.right + 0.5) ov.push(el.className);
          }
          // ⑧ 격자 열 수
          const g = scr.querySelector('.grid'); const cols = g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0;
          // ⑩ 기기 장식(시계·홈 막대)이 보이나
          const shown = el => el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
          const chrome = shown(scr.querySelector('.status')) || shown(scr.querySelector('.home-ind'));
          // ⑨ 본문을 끝까지 내린 뒤, 고정 바 아래에 깔린 단추·입력 칸(맨 마지막에 잰다 — 스크롤을 바꾸므로)
          const under = [];
          const fixed = [...scr.querySelectorAll(':scope > .bar, :scope > .tabbar')].map(x => x.getBoundingClientRect()).filter(q => q.height);
          const sc = scr.querySelector(':scope > .scroll');
          if (fixed.length && sc && !scr.querySelector(':scope > .overlay')) {
            const barTop = Math.min(...fixed.map(q => q.top));
            const nm = el => (el.getAttribute('aria-label') || el.textContent.trim() || el.className).slice(0, 14);
            const parts = () => [...sc.querySelectorAll('button, .btn, .field, .area, .switch')].filter(el => !el.closest('.chips, .hscroll') && getComputedStyle(el).visibility !== 'hidden').map(el => ({ el, q: el.getBoundingClientRect() })).filter(x => x.q.width && x.q.height);
            // ㉠ 첫 화면: 화면의 **주 행동 단추**(빈 화면·오류 화면의 단추 .empty · 칸 아래 「취소/등록」 줄 .btn-row) 또는 스크롤되지 않는 화면의 단추가
            //    바에 **반쯤 걸쳐** 잘려 보이면 — 누르려다 바를 누른다(S05 리뷰 쓰기에서 실제로 그랬다). 긴 목록(상품 격자·장바구니 줄)이
            //    첫 화면 끝에서 잘리는 것은 정상이라 보지 않는다
            const still = sc.scrollHeight <= sc.clientHeight + 1;
            for (const { el, q } of parts()) if (q.top < barTop - 0.5 && q.bottom > barTop + 0.5 && el.matches('button, .btn') && (still || (el.closest('.empty, .btn-row') && !el.closest('.ocard, .grid, .review')))) under.push('첫 화면 ' + nm(el) + `(${Math.round(q.bottom - barTop)}px 걸침)`);
            // ㉡ 끝까지 내렸을 때: 어떤 단추·칸도 바 밑에 남으면 안 된다(끝 여백이 모자람)
            sc.scrollTop = sc.scrollHeight;
            for (const { el, q } of parts()) if (q.bottom > barTop + 0.5 && q.top < SR.bottom) under.push('끝 ' + nm(el) + `(${Math.round(q.bottom - barTop)}px)`);
            sc.scrollTop = 0;
          }
          return { over: [...new Set(over)].slice(0, 3), fab: scr.querySelectorAll('.fab').length, hdr, ai, first, ov, cols, under: [...new Set(under)].slice(0, 4), chrome };
        }, AI_MIN_SEARCH);
        const tag = `${s.id}${st ? '[' + st + ']' : ''} ${d.k}·${theme === 'light' ? '밝게' : '어둡게'}`;
        if (r.none) { found.error++; log(`🔴 ${tag} 화면 없음`); continue; }
        if (errs.length) { found.error++; log(`🔴 ${tag} 오류: ${errs.join(' / ')}`); }
        if (r.over.length) { found.over++; log(`🔴 ${tag} 가로 넘침: ${r.over.join(',')}`); }
        if (r.fab) { found.fab++; log(`🔴 ${tag} 떠 있는 단추(.fab)가 있다 — 헤더 아이콘으로 옮겼는데 되살아났다`); }
        if (r.hdr.length) { found.header++; log(`🔴 ${tag} 헤더 겹침: ${r.hdr.join(', ')}`); }
        if (r.ai.length) { found.ai++; log(`🔴 ${tag} AI 상담 단추: ${r.ai.join(', ')}`); }
        if (s.id === 'P05' && r.first) {
          if (key === 'pland') { if (r.first.tab - r.first.top < FIRST_PEEK) { found.firstRow++; log(`🔴 ${tag} 첫 상품 줄이 첫 화면에서 시작하지 않는다 — 카드 위 ${r.first.top} · 탭바 ${r.first.tab}(${FIRST_PEEK}px 이상 보여야)`); } }
          else if (r.first.bottom > r.first.tab) { found.firstRow++; log(`🔴 ${tag} 첫 상품 줄이 첫 화면에 다 안 보인다 — 카드 아래 ${r.first.bottom} > 탭바 ${r.first.tab}`); }
        }
        if (r.under.length) { found.bottom++; log(`🔴 ${tag} 하단 고정 바가 단추를 가린다: ${r.under.join(', ')}`); }
        if (key === 'pc' && r.chrome) { found.chrome++; log(`🔴 ${tag} PC 에 폰 시계·홈 막대가 그려진다 — 기기 장식은 목업 액자일 뿐`); }
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
  // 자가 시험은 경우마다 그 크기·그 화면만 — 시간을 줄인다
  const cases = [
    { name: '떠 있는 단추를 되살리면', expect: 'fab', sizes: ['phone'], ids: ['P05'], mut: t => t.replace('${bar}${tab ? tabbar(tab, cart) : \'\'}', '<button class="fab">AI 상담</button>${bar}${tab ? tabbar(tab, cart) : \'\'}') },
    { name: '헤더 단추를 겹치면', expect: 'header', sizes: ['phone'], ids: ['P05'], mut: t => t.replace('.homebar img { height: 28px; }', '.homebar img { height: 28px; } .homebar .icon-btn { left: -230px; }') },
    { name: 'AI 상담을 헤더로 되돌리면', expect: 'ai', sizes: ['phone'], ids: ['P05'], mut: t => t.replace('<span class="sp"></span><button class="icon-btn" aria-label="공지">', '<span class="sp"></span><button class="icon-btn" aria-label="AI 상담">AI</button><button class="icon-btn" aria-label="공지">') },
    { name: 'AI 단추를 넓혀 검색창을 좁히면', expect: 'ai', sizes: ['phone'], ids: ['P05'], mut: t => t.replace('.ai-btn { width: 44px;', '.ai-btn { width: 160px;') },
    { name: 'AI 처음 안내 말풍선을 화면 밖으로 밀면', expect: 'ai', sizes: ['phone'], ids: ['P05'], mut: t => t.replace('.ai-tip { position: absolute; right: 0;', '.ai-tip { position: absolute; right: -120px;') },
    { name: '홈 배너를 키워 첫 줄을 밀어내면', expect: 'firstRow', sizes: ['phone'], ids: ['P05'], mut: t => t.replace('.banner.home { min-height: 112px;', '.banner.home { min-height: 420px;') },
    { name: '태블릿 가로 격자를 4열로 두면', expect: 'cols', sizes: ['tland'], ids: ['P05'], mut: t => t.replace('@container (min-width: 1000px) { .grid { grid-template-columns: repeat(5, 1fr); }', '@container (min-width: 1000px) { .grid { grid-template-columns: repeat(4, 1fr); }').replace('@container (min-width: 1150px) { .grid { grid-template-columns: repeat(6, 1fr); } }', '') },
    { name: '태블릿 가로에서 배송 줄·쿠폰 띠를 다시 두 줄로 두면', expect: 'firstRow', sizes: ['tland'], ids: ['P05'], mut: t => t.replace('@container (min-width: 1000px) { .grid { grid-template-columns: repeat(5, 1fr); } .dl-row { flex-direction: row; }', '@container (min-width: 1000px) { .grid { grid-template-columns: repeat(5, 1fr); } .dl-row { flex-direction: column; } .banner.home { min-height: 150px; }') },
    { name: '폰 가로에서 행사 배너를 되살리면', expect: 'firstRow', sizes: ['pland'], ids: ['P05'], mut: t => t.replace('@container dev (max-height: 520px) { .banner.home, .owner { display: none; }', '@container dev (max-height: 520px) { .owner { display: none; }') },
    { name: '바 위 여백(.pad-bar)을 없애면', expect: 'bottom', sizes: ['pland'], ids: ['S10', 'S12'], mut: t => t.replace('.pad-bar { height: calc(var(--bar-h) + var(--safe-bottom) + var(--sp-6)); }', '.pad-bar { height: 0; }') },
    { name: 'S05 리뷰 등록 단추를 본문으로 되돌리면(바 밑에 깔린다)', expect: 'bottom', sizes: ['pland'], ids: ['S05'], mut: t => t.replace('<div class="area" style="margin-top:var(--sp-3)">맛·양·배송은 어땠는지 적어 주세요</div></div></section>', '<div class="area" style="margin-top:var(--sp-3)">맛·양·배송은 어땠는지 적어 주세요</div><div class="btn-row" style="margin-top:var(--sp-3)"><button class="btn md gray">취소</button><button class="btn md pri">리뷰 등록</button></div></div></section>') },
    { name: 'PC 에 폰 시계·홈 막대를 되살리면', expect: 'chrome', sizes: ['pc'], ids: ['P05'], mut: t => t.replace('.status, .home-ind { display: none; } }', '}') },
  ];
  let bad = 0;
  for (const c of cases) {
    const t = c.mut(src);
    if (t === src) { console.log(`🔴 자가 시험 「${c.name}」 — 망가뜨릴 자리를 못 찾았다(목업이 바뀌었나)`); bad++; continue; }
    const f = path.join(dir, `case_${c.expect}.html`);
    fs.writeFileSync(f, t);
    // 상대 경로(assets/…)가 맞게 목업 폴더를 가리키는 <base> 를 넣는다
    fs.writeFileSync(f, t.replace('<head>', `<head><base href="${pathToFileURL(path.dirname(MOCK)).href}/">`));
    const r = await run(f, { quiet: true, sizes: c.sizes, ids: c.ids });
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
  console.log(`   오류 ${found.error} · 가로 넘침 ${found.over} · 외부 요청 ${found.external} · 떠 있는 단추 ${found.fab} · 헤더 겹침 ${found.header} · AI 단추 ${found.ai} · 첫 상품 줄 ${found.firstRow} · 창 잘림 ${found.overlay} · 격자 열 ${found.cols} · 하단 바 가림 ${found.bottom} · PC 기기 장식 ${found.chrome}`);
  console.log(total ? `🔴 문제 ${total}건` : '✅ 전부 통과');
  process.exit(total ? 1 : 0);
})().catch(e => { console.error('🔴', e); process.exit(1); });
