/**
 * F11 확인 — 상품 상세의 「장바구니 담기 / 바로 주문」 버튼을 **전체 면적에서** 누를 수 있는가.
 *
 *   node scripts/shop-shots/check-f11.cjs --base http://127.0.0.1:5312 [--out docs/shots/fix] [--tag after]
 *
 * 폰 390×844 · 태블릿 820×1180 × 밝게·어둡게에서
 *  ⑴ 두 버튼 안을 가로 7 × 세로 5 = 35 점씩 찍어 그 자리의 맨 위 요소가 **그 버튼(또는 그 안)** 인지 본다
 *  ⑵ 「바로 주문」을 **가운데**로 실제 눌러 바로 주문 화면으로 넘어가는지 본다(로그인은 가짜 응답)
 *  ⑶ 버튼 영역 사진을 남긴다 — <out>/F11_<tag>_<phone|tablet>_<light|dark>.png
 * 하나라도 막히면 종료코드 1.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { route } = require('./fixtures.cjs');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:5312');
const OUT = arg('--out', path.join(__dirname, '../../docs/shots/fix'));
const TAG = arg('--tag', 'after');
const DEVICES = [
  { key: 'phone', viewport: { width: 390, height: 844 }, dsf: 2 },
  { key: 'tablet', viewport: { width: 820, height: 1180 }, dsf: 1 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  let bad = 0;
  for (const dev of DEVICES) for (const dark of [false, true]) {
    // 서비스워커는 막는다 — 서비스워커가 받은 요청은 아래 가짜 응답을 건너뛰어 **실서버 API 로 나간다**(운영에 돌릴 때 기록이 남는다)
    const ctx = await browser.newContext({ viewport: dev.viewport, deviceScaleFactor: dev.dsf, isMobile: true, hasTouch: true, colorScheme: dark ? 'dark' : 'light', locale: 'ko-KR', serviceWorkers: 'block' });
    await ctx.addInitScript(() => { try { localStorage.setItem('guestStoreId', '11'); localStorage.setItem('srmart_pwa_dismissed_at', String(Date.now())); } catch (e) {} });
    await ctx.route('**/*', r => {
      const u = new URL(r.request().url());
      if (u.origin === new URL(BASE).origin && u.pathname.startsWith('/api/')) { const x = route(u.pathname.slice(4), r.request().method(), u.search, {}); return r.fulfill({ status: x.status, contentType: 'application/json', body: JSON.stringify(x.body) }); }
      if (/fonts\.googleapis|fonts\.gstatic|daumcdn/.test(u.hostname)) return r.abort();
      return r.continue();
    });
    const p = await ctx.newPage();
    const label = `${dev.key === 'phone' ? '폰 390×844' : '태블릿 820×1180'}·${dark ? '어둡게' : '밝게'}`;
    try {
      await p.goto(BASE + '/'); await p.waitForTimeout(1800);
      // 로그인(가짜 응답) — 바로 주문은 로그인한 손님만 넘어간다
      await p.locator('.app-nav button', { hasText: '로그인' }).click(); await p.waitForTimeout(500);
      await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill('guest_demo'); await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill('x');
      await p.getByRole('button', { name: '로그인', exact: true }).filter({ visible: true }).first().click(); await p.waitForTimeout(1500);
      await p.locator('.pgrid img[alt="농심 메론킥"]').click(); await p.waitForTimeout(1000);
      const probe = await p.evaluate(() => {
        const bar = document.querySelector('.pd-bar, .pd-cart-bar');
        return [...bar.querySelectorAll('button')].map(b => {
          const r = b.getBoundingClientRect(); let ok = 0, n = 0; const blockers = new Set();
          for (let i = 1; i <= 7; i++) for (let j = 1; j <= 5; j++) {
            const x = r.left + r.width * i / 8, y = r.top + r.height * j / 6; n++;
            const top = document.elementFromPoint(x, y);
            if (top && (top === b || b.contains(top))) ok++;
            else blockers.add(top ? (top.closest('nav') ? 'nav.' + top.closest('nav').className : top.tagName.toLowerCase() + (top.className ? '.' + String(top.className).split(' ')[0] : '')) : '화면 밖');
          }
          return { text: b.textContent.trim(), ok, n, blockers: [...blockers], rect: [Math.round(r.top), Math.round(r.bottom)] };
        });
      });
      // 바 영역 사진(버튼과 그 아래 탭바까지)
      const box = await p.locator('.pd-bar, .pd-cart-bar').boundingBox();
      const y0 = Math.max(0, Math.floor(box.y) - 60);
      const shot = path.join(OUT, `F11_${TAG}_${dev.key}_${dark ? 'dark' : 'light'}.png`);
      await p.screenshot({ path: shot, clip: { x: 0, y: y0, width: dev.viewport.width, height: dev.viewport.height - y0 } });
      // 실제로 가운데를 눌러 본다(위치 지정 없음 = 버튼 한가운데)
      let clicked = '안 넘어감';
      try {
        await p.getByRole('button', { name: '바로 주문', exact: true }).filter({ visible: true }).first().click({ timeout: 4000 });
        await p.waitForTimeout(1200);
        // 넘어갔으면 상세의 버튼 바가 사라지고 QuickOrder 의 제목(h2 「바로 주문」)이 보인다
        const moved = (await p.locator('.pd-bar, .pd-cart-bar').count()) === 0 && (await p.locator('h2', { hasText: '바로 주문' }).filter({ visible: true }).count()) > 0;
        clicked = moved ? '바로 주문 화면으로 넘어감' : '🔴 눌렀는데 바로 주문 화면이 안 나옴';
      } catch (e) { clicked = '🔴 가운데를 못 누름(' + e.message.split('\n')[0].slice(0, 60) + ')'; }
      const allOk = probe.every(b => b.ok === b.n) && !clicked.startsWith('🔴');
      if (!allOk) bad++;
      console.log(`${allOk ? '✅' : '🔴'} ${label}  ` + probe.map(b => `「${b.text.replace(/^🛒\s*/, '')}」 ${b.ok}/${b.n}점${b.blockers.length ? ' 덮은 것:' + b.blockers.join(',') : ''}`).join('  ') + `  · 가운데 클릭: ${clicked}`);
    } catch (e) { bad++; console.log(`🔴 ${label} 진행 실패: ${e.message.split('\n')[0]}`); }
    await ctx.close();
  }
  await browser.close();
  console.log(bad ? `🔴 ${bad}건 실패` : '✅ 네 경우 모두 두 버튼 전체 면적이 눌린다');
  process.exit(bad ? 1 : 0);
})();
