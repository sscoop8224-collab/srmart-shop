#!/usr/bin/env node
// 휴대폰 본인확인 화면 흐름 — 손님처럼 눌러 보고 사진을 찍는다 (2026-11-16 대표 지시 7)
//
//   시험 빌드(REACT_APP_IDENTITY_MOCK=1 · 저장소 밖 BUILD_PATH) + 임시 백엔드(IDENTITY_PROVIDER=mock · 임시 MySQL — 백엔드 tools/lib/tempBackend.cjs).
//   본인확인·가입·찾기·회원 입구(/identity · /register · /auth · /users/me/identity · /users/me/phone)는 **임시 백엔드로 실제로** 보낸다 —
//   앱과 서버의 칸 이름(existing_accounts · accounts · resetToken · verificationToken …)이 맞는지까지 본다. 나머지 /api 는 촬영용 가짜(fixtures.cjs).
//   🔴 운영 DB·운영 서버는 부르지 않는다. 두 서버 다 127.0.0.1(정적 서버는 serve-static.cjs 고정 · 임시 백엔드는 확인 줄을 찍는다).
//
//   1) set REACT_APP_IDENTITY_MOCK=1 & set BUILD_PATH=<저장소 밖 폴더> & npm run build
//   2) node scripts/shop-shots/identity-flow.cjs --build <그 폴더> --backend <백엔드 폴더> [--out <사진 폴더>] [--guard <listen-guard.cjs>]
//   보는 것: 가입 2단계(본인확인 전·업체 창·확인 중·완료·가입 완료 + DB) · 같은 사람 가입 · 실패 · 아이디 찾기(결과·없음) ·
//            비밀번호 재설정(새 비밀번호로 서버 로그인) · 마이 본인확인 · 회원정보 수정 · 번호 바꾸기(DB) · 성인 상품 안내
'use strict';
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { spawn } = require('child_process');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BK = path.resolve(arg('--backend', path.join(__dirname, '../../../srmart-backend')));
const BUILD = arg('--build', null);
if (!BUILD || !fs.existsSync(path.join(BUILD, 'index.html'))) { console.error('🔴 --build <시험 빌드 폴더> 가 필요하다(REACT_APP_IDENTITY_MOCK=1 로 만든 것)'); process.exit(2); }
const GUARD = arg('--guard', ['C:/srmart/worktrees/backend-pda/tools/listen-guard.cjs', path.join(BK, 'tools/listen-guard.cjs')].find((p) => fs.existsSync(p)) || null);
const { start } = require(path.join(BK, 'tools/lib/tempBackend.cjs'));
const bcrypt = require(path.join(BK, 'node_modules/bcryptjs'));
const { chromium } = require('playwright');
const { route, customer } = require('./fixtures.cjs');
const OUT = path.resolve(arg('--out', path.join(require('os').tmpdir(), 'srm-identity-flow')));
fs.mkdirSync(OUT, { recursive: true });
const PW = 'k' + require('crypto').randomBytes(9).toString('base64url') + '7!';   // 실행마다 무작위(2026-11-18 · 저장소에 값을 남기지 않는다) — 화면에 찍지 않는다
const NEW_PW = 'n' + require('crypto').randomBytes(9).toString('base64url') + '3!';   // 비밀번호 재설정에 넣는 새 값 — 실행마다 무작위(2026-11-18)
const REAL = (p) => /^\/(identity\/|register$|auth\/|users\/me\/identity|users\/me\/phone$)/.test(p);
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else fail++; console.log(`  ${c ? '✅' : '🔴'} ${m}`); };
const wait = (p, ms) => p.waitForTimeout(ms);

function forward(apiPort, req) {
  return new Promise((res, rej) => {
    const u = new URL(req.url());
    const body = req.postData();
    const headers = { 'Content-Type': 'application/json; charset=utf-8' };
    const a = req.headers().authorization; if (a) headers.Authorization = a;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const r = http.request({ host: '127.0.0.1', port: apiPort, method: req.method(), path: u.pathname + u.search, headers }, (rs) => {
      const ch = []; rs.on('data', (c) => ch.push(c)); rs.on('end', () => res({ status: rs.statusCode, body: Buffer.concat(ch).toString('utf8') }));
    });
    r.on('error', rej); if (body) r.write(body); r.end();
  });
}

(async () => {
  let h = null, web = null, browser = null;
  try {
    const hash = bcrypt.hashSync(PW, 10);
    h = await start(BK, [
      "INSERT IGNORE INTO brands (code, name, app_name, app_id, web_path, primary_color, sort_order) VALUES ('srm', '에스알마트', '에스알마트', 'com.dongsin.srmart', '/srm', '#00c471', 1)",
      "INSERT INTO stores (id, code, name, is_active, customer_visible, brand_code) VALUES (11, '011', '에스알마트 왕길점', 1, 1, 'srm'), (1, '001', '에스알마트 검암점', 1, 1, 'srm')",
      `INSERT INTO users (id, name, email, username, password, role, store_id, is_active, phone, is_adult, address, zipcode, dong_name, third_party_consent, third_party_consent_asked_at, third_party_consent_at) VALUES (700, '김손님', 'mem@t.local', 'kimmem', '${hash}', 'customer', 11, 1, '01012345678', 1, '인천 서구 왕길로 123', '22689', '왕길동', 1, NOW(), NOW())`,
    ], { dbName: 'srmart_idvshots', env: { IDENTITY_PROVIDER: 'mock', IDENTITY_MOCK_LIVE: '1', IDENTITY_CI_SECRET: crypto.randomBytes(32).toString('hex') } });
    ok(h.apiLoop.only && h.dbLoop.only, `임시 백엔드 ${h.apiPort} · MySQL ${h.dbPort} — 127.0.0.1 에만`);
    // 이미 가입한 사람 하나(같은 사람 가입 막기 화면용)
    const EXIST = { name: '이가입', birthdate: '19850707', phone: '01055556666' };
    {
      const s = await h.request('POST', '/api/identity/start', { purpose: 'signup' });
      const c = await h.request('POST', '/api/identity/complete', { tx_id: s.body.tx_id, result: EXIST });
      const r = await h.request('POST', '/api/register', { username: 'leejoin', email: 'lee@t.local', password: PW, address: '인천 서구 시험로 1', addressDetail: '1호', zipcode: '22689', dong_name: '왕길동', privacyConsent: true, store_id: 11, identityToken: c.body.token });
      ok(r.status === 200 || r.status === 201, `미리 가입(leejoin) ${r.status}`);
    }

    const webPort = 5390 + Math.floor(Math.random() * 50);
    web = spawn(process.execPath, [...(GUARD ? ['-r', GUARD] : []), path.join(__dirname, 'serve-static.cjs'), BUILD, String(webPort)], { stdio: 'ignore', env: { ...process.env, LISTEN_HOST: '127.0.0.1' } });
    await new Promise((r) => setTimeout(r, 1500));
    const BASE = `http://127.0.0.1:${webPort}`;
    browser = await chromium.launch();

    const shoot = async (name, fn, opts = {}) => {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'light', serviceWorkers: 'block' });
      await ctx.addInitScript(() => { try { localStorage.setItem('guestStoreId', '11'); localStorage.setItem('srmart_pwa_dismissed_at', String(Date.now())); localStorage.setItem('srm_ai_tip_seen', '1'); localStorage.setItem('srm_theme_mode', 'light'); window.open = () => null; } catch (e) { /* */ } });
      const fopts = { ...(opts.fixtures || {}), _cart: {} };
      await ctx.route('**/*', async (r) => {
        const u = new URL(r.request().url());
        if (u.origin === BASE && u.pathname.startsWith('/api/')) {
          const p = u.pathname.slice(4);
          if (opts.failComplete && p === '/identity/complete') return r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: '본인확인 정보가 맞지 않아요. 다시 해 주세요.' }) });
          if (opts.slowComplete && p === '/identity/complete') await new Promise((x) => setTimeout(x, opts.slowComplete));
          if (REAL(p) || (opts.realLogin && p === '/login')) { const res = await forward(h.apiPort, r.request()); return r.fulfill({ status: res.status, contentType: 'application/json', body: res.body }); }
          const res = route(p, r.request().method(), u.search, fopts, (() => { try { return JSON.parse(r.request().postData() || 'null'); } catch (e) { return null; } })());
          if (res.delay) return undefined;
          if (res.abort) return r.abort();
          return r.fulfill({ status: res.status, contentType: 'application/json', body: JSON.stringify(res.body) });
        }
        if (u.origin !== BASE) return r.abort();
        return r.continue();
      });
      const p = await ctx.newPage();
      await p.goto(BASE + '/'); await wait(p, 1500);
      try {
        await fn(p, async (tag) => { await p.screenshot({ path: path.join(OUT, `${tag}.png`) }); console.log(`    📷 ${tag}`); });
      } catch (e) { ok(false, `${name}: ${e.message.split('\n')[0]}`); await p.screenshot({ path: path.join(OUT, `_err_${name}.png`) }); }
      await ctx.close();
    };
    const loginPage = async (p) => { await p.locator('.app-nav button', { hasText: '로그인' }).click(); await wait(p, 700); };
    const fakePostcode = (p) => p.evaluate(() => { window.daum = { Postcode: function Postcode(o) { this.open = () => o.oncomplete({ roadAddress: '인천 서구 왕길로 123', zonecode: '22689', bname: '왕길동' }); } }; });
    const toStep2 = async (p, username) => {
      await loginPage(p); await p.getByRole('button', { name: '회원가입', exact: true }).click(); await wait(p, 700);
      await fakePostcode(p);
      await p.getByPlaceholder('이름을 입력해 주세요').fill('김손님');
      await p.getByRole('button', { name: '주소 찾기', exact: true }).click(); await wait(p, 600);
      await p.getByPlaceholder('상세 주소 (동·호수)').fill('101동 1001호');
      await p.getByRole('button', { name: '다음', exact: true }).click(); await wait(p, 600);
      await p.getByPlaceholder('아이디를 입력해 주세요').fill(username);
      await p.getByPlaceholder('비밀번호를 입력해 주세요').fill(PW);
      await p.getByPlaceholder('이메일을 입력해 주세요').fill(`${username}@example.com`);
    };
    const mockFill = async (p, who) => {
      await p.locator('#mv-name').fill(who.name); await p.locator('#mv-birth').fill(who.birthdate); await p.locator('#mv-phone').fill(who.phone);
      await p.getByLabel('인증번호').fill('482917');
    };
    const mockSubmit = (p) => p.locator('.verify-win').getByRole('button', { name: '확인', exact: true }).click();
    const NEW = { name: '김손님', birthdate: '19900512', phone: '01012340000' };

    // ① 가입 2단계 — 본인확인 전 · 업체 창 · 확인 중 · 완료 · 가입 완료
    await shoot('signup', async (p, snap) => {
      await toStep2(p, 'kimnew');
      ok(await p.locator('.idv-card').isVisible(), '가입 2단계 — 본인확인 카드가 보인다(번호·생년월일 칸 없음)');
      ok(!(await p.getByPlaceholder('010-0000-0000').count()), '가입 2단계 — 손으로 넣는 번호 칸이 없다');
      await snap('P04_2단계_본인확인_전');
      await p.getByRole('button', { name: '다음', exact: true }).click(); await wait(p, 400);
      ok(await p.getByText('휴대폰 본인확인을 해 주세요.').isVisible(), '본인확인 없이 「다음」 → 「휴대폰 본인확인을 해 주세요」');
      await p.locator('.idv-card button').click(); await wait(p, 600);
      await mockFill(p, NEW); await snap('S48_업체_창');
      await mockSubmit(p); await wait(p, 300); await snap('S48_확인_중');
      await wait(p, 2200);
      ok(await p.locator('.idv-done').isVisible(), '본인확인 완료 — 초록 안내');
      ok(await p.getByText('010-****-0000').isVisible(), '완료 — 가린 번호');
      await snap('P04_2단계_본인확인_완료');
      await p.getByRole('button', { name: '다음', exact: true }).click(); await wait(p, 500);
      await p.locator('.consent.all').click(); await p.getByRole('button', { name: '가입하기', exact: true }).click(); await wait(p, 1500);
      await snap('P04_가입_완료');
      const [[u]] = await h.conn.query("SELECT name, phone, DATE_FORMAT(birthday,'%Y-%m-%d') b, identity_verified_at IS NOT NULL v, ci_hash IS NOT NULL c FROM users WHERE username='kimnew'");
      ok(u && u.name === '김손님' && u.phone === '01012340000' && u.v && u.c, `가입 — DB 에 본인확인 이름·번호·확인 시각·ci_hash (${JSON.stringify(u)})`);
    }, { slowComplete: 1800 });

    // ② 같은 사람이 또 가입 → 「이미 가입하셨어요」 → 아이디 찾기
    await shoot('already', async (p, snap) => {
      await toStep2(p, 'leeagain');
      await p.locator('.idv-card button').click(); await wait(p, 600);
      await mockFill(p, EXIST); await mockSubmit(p); await wait(p, 1500);
      ok(await p.getByText('이미 가입하셨어요').isVisible(), '같은 사람 — 「이미 가입하셨어요」');
      ok(await p.getByText(/lee\*+in/).isVisible(), '같은 사람 — 가린 아이디');
      await snap('S48_이미_가입한_번호');
      await p.getByRole('button', { name: '아이디 찾기', exact: true }).click(); await wait(p, 900);
      ok(await p.getByRole('tab', { name: '아이디 찾기' }).isVisible(), '「아이디 찾기」 → 찾기 화면');
      await snap('S29_아이디_찾기');
    });

    // ③ 실패
    await shoot('fail', async (p, snap) => {
      await toStep2(p, 'kimfail');
      await p.locator('.idv-card button').click(); await wait(p, 600);
      await mockFill(p, NEW); await mockSubmit(p); await wait(p, 1200);
      ok(await p.getByText('본인확인을 마치지 못했어요').isVisible(), '실패 — 「본인확인을 마치지 못했어요」 · 다시 하기');
      await snap('S48_실패_취소');
    }, { failComplete: true });

    // ④ 아이디 찾기 — 결과 · 없음
    await shoot('findid', async (p, snap) => {
      await loginPage(p); await p.getByRole('button', { name: '아이디/비밀번호 찾기' }).click(); await wait(p, 900);
      await p.locator('.idv-card button').click(); await wait(p, 600);
      await mockFill(p, EXIST); await mockSubmit(p); await wait(p, 1500);
      ok(await p.getByText(/lee\*+in/).isVisible(), '아이디 찾기 결과 — 가린 아이디');
      await snap('S29_아이디_찾기_결과');
    });
    await shoot('findnone', async (p, snap) => {
      await loginPage(p); await p.getByRole('button', { name: '아이디/비밀번호 찾기' }).click(); await wait(p, 900);
      await p.locator('.idv-card button').click(); await wait(p, 600);
      await mockFill(p, { name: '박없음', birthdate: '19990101', phone: '01077770000' }); await mockSubmit(p); await wait(p, 1500);
      ok(await p.getByText('이 번호로 가입한 아이디가 없어요').isVisible(), '아이디 찾기 — 없음');
      await snap('S29_가입_정보_없음');
    });

    // ⑤ 비밀번호 재설정 → 새 비밀번호 → 그 비밀번호로 로그인되는지(서버)
    await shoot('reset', async (p, snap) => {
      await loginPage(p); await p.getByRole('button', { name: '아이디/비밀번호 찾기' }).click(); await wait(p, 900);
      await p.getByRole('tab', { name: '비밀번호 재설정' }).click(); await wait(p, 300);
      await p.locator('#fa-id').fill('leejoin'); await snap('S29_비밀번호_재설정');
      await p.locator('.idv-card button').click(); await wait(p, 600);
      await mockFill(p, EXIST); await mockSubmit(p); await wait(p, 1500);
      await p.locator('#fa-pw').fill(NEW_PW); await p.locator('#fa-pw2').fill(NEW_PW); await wait(p, 200);
      await snap('S29_비밀번호_재설정_새_비밀번호');
      await p.getByRole('button', { name: '비밀번호 바꾸기' }).click(); await wait(p, 1200);
      ok(await p.getByText('비밀번호를 바꿨어요').isVisible(), '재설정 — 「비밀번호를 바꿨어요」');
      const r = await h.request('POST', '/api/login', { username: 'leejoin', password: NEW_PW });
      ok(r.status === 200, `새 비밀번호로 로그인(서버) ${r.status}`);
    });

    // ⑥ 회원 — 마이 「본인확인 하기」 → 완료 · 정보 수정 · 번호 바꾸기
    await shoot('member', async (p, snap) => {
      await loginPage(p);
      await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill('kimmem'); await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill(PW);
      await p.getByRole('button', { name: '로그인', exact: true }).filter({ visible: true }).first().click(); await wait(p, 1200);
      await p.locator('.tabbar .tab', { hasText: '마이' }).first().click(); await wait(p, 900);
      ok(await p.getByText('본인확인 하기').isVisible(), '마이 — 「본인확인 하기」 줄');
      await snap('P02_로그인함_본인확인_전');
      await p.locator('.my-v2 .row.prof').click(); await wait(p, 700);
      ok(await p.locator('#my-name').isVisible(), '본인확인 전 — 이름은 고칠 수 있다');
      await snap('S21_본인확인_전');
      await p.locator('.sheet .nav-btn', { hasText: '취소' }).click(); await wait(p, 400);
      await p.locator('.my-v2 button.row', { hasText: '본인확인' }).click(); await wait(p, 600);
      await mockFill(p, { name: '김손님', birthdate: '19900512', phone: '01012345678' }); await mockSubmit(p); await wait(p, 1500);
      ok(await p.getByText('본인확인을 마쳤어요').first().isVisible(), '회원 본인확인 — 「본인확인을 마쳤어요」');
      await p.getByRole('button', { name: '확인', exact: true }).last().click(); await wait(p, 500);
      ok(await p.locator('.my-v2 .row', { hasText: '본인확인' }).getByText('완료').isVisible(), '마이 — 본인확인 「완료」');
      await snap('P02_로그인함_본인확인_완료');
      await p.locator('.my-v2 .row.prof').click(); await wait(p, 700);
      ok(!(await p.locator('#my-name').count()), '본인확인 뒤 — 이름 읽기 전용');
      await snap('S21_기본');
      await p.getByRole('button', { name: '본인확인으로 변경' }).click(); await wait(p, 600);
      await mockFill(p, { name: '김손님', birthdate: '19900512', phone: '01098765432' }); await mockSubmit(p); await wait(p, 1500);
      ok(await p.getByText('본인확인으로 휴대폰 번호를 바꿨어요').isVisible(), '번호 바꾸기 — 안내');
      await snap('S21_휴대폰_번호_바뀜');
      const [[u]] = await h.conn.query("SELECT phone, identity_verified_at IS NOT NULL v FROM users WHERE id=700");
      ok(u.phone === '01098765432' && u.v, `번호 바꾸기 — DB ${JSON.stringify(u)}`);
    }, { realLogin: true });

    // ⑦ 성인 상품 토스트(본인확인 켬)
    await shoot('adult', async (p, snap) => {
      await p.locator('.app-nav button', { hasText: '로그인' }).click();
      await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill('guest_demo'); await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill('x');
      await p.getByRole('button', { name: '로그인', exact: true }).filter({ visible: true }).first().click(); await wait(p, 1200);
      await p.locator('.pgrid .pc', { hasText: '참이슬' }).first().locator('img').click(); await wait(p, 1000); await p.getByRole('button', { name: '장바구니 담기' }).click(); await wait(p, 400);
      ok(await p.getByText('주류는 19세 이상 본인확인 뒤 매장 픽업으로 살 수 있어요').isVisible(), '성인 상품 — 본인확인 안내 토스트');
      await snap('S35_성인_상품');
    }, { fixtures: { user: { ...customer, is_adult: 0, isAdult: false } } });
  } catch (e) {
    ok(false, e.stack);
  } finally {
    if (browser) await browser.close();
    if (web) web.kill();
    if (h) await h.stop();
    console.log(`\n${fail ? '🔴' : '✅'} 본인확인 화면 흐름 ${pass}/${pass + fail} · 사진 ${OUT}`);
    process.exit(fail ? 1 : 0);
  }
})();
