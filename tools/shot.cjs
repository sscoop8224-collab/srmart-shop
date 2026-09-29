#!/usr/bin/env node
/**
 * 쇼핑앱 화면 캡처 — `node tools/shot.cjs [화면이름...]`
 *
 * 왜 있는가(2026-09-29): 쇼핑앱은 손님이 **폰으로** 쓰는데, 고칠 때마다 대표님이 폰을 꺼내
 * 확인해 주셔야 했다. 왕복이 한 번씩 늘고, "헤더가 띠를 덮는다" 같은 문제는 **아이폰에서만**
 * 나서(safe-area) 데스크탑 브라우저로는 재현도 안 됐다.
 *
 * 그래서 아이폰 크기 그대로 띄워 찍는다. 라이트·다크를 같이 찍는 이유는 어느 한쪽만 깨지는
 * 일이 실제로 있었기 때문이다(다크에서 글자색이 배경에 묻히는 식).
 *
 * ⚠️ 이건 **사람 눈을 대신하지 않는다.** 스크롤·터치로만 드러나는 것(결제 칸 접힘, AI 버튼이
 *    스크롤 중 작아지는 것)은 아래처럼 동작을 흉내 내 찍지만, 실기기의 관성 스크롤·안전영역
 *    실제 크기까지 같지는 않다. 실물 확인을 대체하지 말 것.
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

// :3000 은 쇼핑앱 **루트**다 — '/shop/' 은 nginx 가 붙이는 경로라 여기선 붙이면 안 된다
// (붙이면 번들 요청이 404 HTML 로 떨어져 'Unexpected token <' 가 난다. 실제로 한 번 겪었다).
// 🔴 **도메인으로 띄워야 한다.** :3000 은 정적 파일 서버라 '/api' 요청이 SPA 의 index.html 로
// 떨어진다(200 인데 HTML) — 앱은 그걸 JSON 으로 읽으려다 'pt.map is not a function' 로 죽는다.
// /api 프록시는 nginx 가 한다. 실제로 이걸 앱 버그로 오진할 뻔했다(2026-09-29).
const BASE = process.env.SHOP_URL || 'https://dongsinmarket.co.kr/shop';
const OUT = process.env.SHOT_DIR || 'C:/srmart/스크린샷/shop';
const IPHONE = devices['iPhone 13'];

/** 화면 목록 — 이름, 경로, (선택) 들어간 뒤 할 일. */
const SCREENS = [
  { name: 'home', path: '/' },
  { name: 'search', path: '/#search' },
  { name: 'cart', path: '/#cart' },
  { name: 'quickorder', path: '/#quickorder' },
  { name: 'orders', path: '/#orders' },
  { name: 'mypage', path: '/#mypage' },
  { name: 'login', path: '/#login' },
];

async function shoot(browser, screen, dark) {
  const ctx = await browser.newContext({
    ...IPHONE,
    colorScheme: dark ? 'dark' : 'light',
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => errors.push('pageerror: ' + String(e.message).slice(0, 160)));

  try {
    await page.goto(BASE + screen.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
    // 첫 렌더 + 데이터 로드를 기다린다. networkidle 은 폴링이 있으면 영영 안 와서 안 쓴다.
    await page.waitForTimeout(2500);
    const tag = `${screen.name}-${dark ? 'dark' : 'light'}`;
    await page.screenshot({ path: path.join(OUT, `${tag}.png`) });

    // 스크롤한 상태도 한 장 — 결제 칸 접힘·AI 버튼 축소는 스크롤해야 드러난다.
    const scrollable = await page.evaluate(() => document.body.scrollHeight > window.innerHeight + 40);
    if (scrollable) {
      await page.evaluate(() => window.scrollTo(0, 400));
      await page.waitForTimeout(250);                       // 스크롤 중(버튼이 작아진 순간)
      await page.screenshot({ path: path.join(OUT, `${tag}-scrolling.png`) });
      await page.waitForTimeout(900);                       // 멈춘 뒤(버튼이 되돌아온 뒤)
      await page.screenshot({ path: path.join(OUT, `${tag}-scrolled.png`) });
    }
    return { tag, errors, scrollable };
  } catch (e) {
    return { tag: `${screen.name}-${dark ? 'dark' : 'light'}`, errors: [...errors, 'FAIL: ' + e.message.slice(0, 120)], scrollable: false };
  } finally {
    await ctx.close();
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const want = process.argv.slice(2);
  const list = want.length ? SCREENS.filter(s => want.includes(s.name)) : SCREENS;
  if (!list.length) { console.error('🔴 그런 화면이 없다:', want.join(', ')); process.exit(1); }

  const browser = await chromium.launch();
  console.log('기기: iPhone 13 (' + IPHONE.viewport.width + '×' + IPHONE.viewport.height + ') · 주소: ' + BASE);
  console.log('─'.repeat(78));
  for (const s of list) {
    for (const dark of [false, true]) {
      const r = await shoot(browser, s, dark);
      console.log(
        '  ' + r.tag.padEnd(22),
        (r.scrollable ? '스크롤 3장' : '1장').padEnd(11),
        r.errors.length ? '🔴 오류 ' + r.errors.length + '건: ' + r.errors[0] : '✅');
      for (const e of r.errors.slice(1, 3)) console.log(' '.repeat(38) + e);
    }
  }
  await browser.close();
  console.log('─'.repeat(78));
  console.log('저장: ' + OUT);
})().catch(e => { console.error('🔴', e.message); process.exit(1); });
