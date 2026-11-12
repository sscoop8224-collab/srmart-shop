#!/usr/bin/env node
/**
 * 쇼핑앱 운영 반영 — 한 번에, 실패하면 스스로 되돌린다.
 *
 *   node scripts/deploy-shop.cjs                # 빌드 → 바꿔 끼우기 → 확인 → (실패 시) 되돌리기
 *   node scripts/deploy-shop.cjs --check-only   # 지금 운영에 확인만 돌린다(아무것도 안 바꾼다)
 *
 * 순서
 *  0. 사전 점검: src/·public/·package*.json 에 커밋 안 된 변경이 있으면 멈춘다
 *     (커밋에 없는 코드로 운영을 만들면 나중에 무엇이 나가 있는지 코드로 확인할 수 없다)
 *  1. build_next 로 따로 빌드(운영 build 는 안 건드림)
 *  2. pm2 stop srmart-shop
 *  3. 운영 build → build_prev_<날짜_시각> 로 보관(이름 바꾸기) · build_next → build
 *     🔴 윈도에서는 serve 가 build 폴더를 잡고 있어 **멈추기 전에는 이름을 못 바꾼다**(2026-11-11 실측 —
 *        Permission denied). 그래서 보관은 멈춘 몇 초 안에 한다. 복사하지 않으니 같은 폴더가 둘 생기지 않는다.
 *  4. pm2 start srmart-shop → 127.0.0.1:3000 이 새 번들을 내주는지
 *  5. 확인 — 손님 앱이 여는 주소(capacitor.config.ts server.url, 기본 https://www.dongsinmarket.com/shop)에서
 *     ⑴ 새 번들 이름이 내려오는지 ⑵ check-sw.cjs ⑶ check-f11.cjs
 *     ⑷ 확인하는 동안 nginx 기록에 시험 브라우저(HeadlessChrome)의 /api 요청이 0줄인지(가짜 응답만 썼는지)
 *  6. 하나라도 실패하면: 멈춤 → build 를 build_failed_<시각> 로 · build_prev_<시각> 를 build 로 → 시작 → 옛 번들인지 확인
 *
 * 🔴 백엔드·어드민은 건드리지 않는다. nginx 도 안 건드린다. 지우는 것도 없다(보관 폴더 정리는 사람이 한다).
 * 종료코드: 0 반영 완료 · 1 실패(되돌림 완료) · 3 실패했고 되돌리기도 실패 — 🔴 사람이 바로 봐야 한다
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const NGINX_LOG = 'C:/nginx/logs/access.log';
const CHECK_ONLY = process.argv.includes('--check-only');
const SITE = (() => {
  const m = fs.readFileSync(path.join(ROOT, 'capacitor.config.ts'), 'utf8').match(/url:\s*'([^']+)'/);
  return (m ? m[1] : 'https://www.dongsinmarket.com/shop/').replace(/\/+$/, '');
})();
const pad = n => String(n).padStart(2, '0');
const now = new Date();
const STAMP = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
const P = n => path.join(ROOT, n);
const log = s => console.log(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32', ...opts });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
function get(url) {
  return new Promise(res => {
    (url.startsWith('https') ? https : http).get(url, { headers: { 'Cache-Control': 'no-cache' } }, r => {
      let b = ''; r.on('data', d => (b += d)); r.on('end', () => res({ status: r.statusCode, body: b }));
    }).on('error', e => res({ status: 0, body: String(e.message) }));
  });
}
const mainOf = html => (String(html).match(/static\/js\/main\.[a-z0-9]+\.js/) || [''])[0];
async function rename(a, b) {
  for (let i = 0; i < 6; i++) {
    try { fs.renameSync(P(a), P(b)); return true; } catch (e) { if (i === 5) { log(`🔴 ${a} → ${b} 이름 바꾸기 실패: ${e.code}`); return false; } await sleep(700); }
  }
}
const pm2 = verb => { const r = run('pm2', [verb, 'srmart-shop']); log(`   pm2 ${verb} srmart-shop → 종료코드 ${r.code}`); return r.code === 0; };
async function waitLocal(expect) {
  for (let i = 0; i < 30; i++) { const r = await get('http://127.0.0.1:3000/'); const m = mainOf(r.body); if (r.status === 200 && (!expect || m === expect)) return m; await sleep(700); }
  return mainOf((await get('http://127.0.0.1:3000/')).body) || '(응답 없음)';
}
const nginxLines = () => { try { return fs.readFileSync(NGINX_LOG, 'utf8').split('\n').length; } catch (e) { return -1; } };

async function verify(expectMain) {
  const bad = [];
  const L0 = nginxLines();
  const live = mainOf((await get(SITE + '/')).body);
  log(`   손님 주소 ${SITE}/ → ${live || '(번들 못 찾음)'}`);
  if (expectMain && live !== expectMain) bad.push(`손님 주소의 번들이 ${live} — 새 번들 ${expectMain} 가 아니다`);
  for (const [name, args] of [
    ['check-sw', ['scripts/shop-shots/check-sw.cjs', '--base', SITE]],
    ['check-f11', ['scripts/shop-shots/check-f11.cjs', '--base', SITE, '--out', path.join(require('os').tmpdir(), 'deploy-shop-f11'), '--tag', STAMP]],
  ]) {
    const r = run('node', args, { shell: false, timeout: 400000 });
    const tail = r.out.trim().split('\n').filter(l => !/화면 로그/.test(l)).slice(-6).map(l => '      ' + l).join('\n');
    log(`   ${r.code === 0 ? '✅' : '🔴'} ${name} (종료코드 ${r.code})\n${tail}`);
    if (r.code !== 0) bad.push(`${name} 실패(종료코드 ${r.code})`);
  }
  await sleep(1500);
  if (L0 > 0) {
    const lines = fs.readFileSync(NGINX_LOG, 'utf8').split('\n').slice(L0 - 1);
    const hits = lines.filter(l => /HeadlessChrome/.test(l) && /"[A-Z]+ \/api/.test(l));
    log(`   nginx: 확인 중 새 줄 ${lines.length}개 · 시험 브라우저의 /api ${hits.length}줄`);
    if (hits.length) bad.push(`시험 브라우저가 실서버 /api 를 ${hits.length}번 불렀다: ${hits.slice(0, 2).map(l => (l.match(/"[A-Z]+ [^ ]+/) || [''])[0]).join(', ')}`);
  } else log('   ⚠ nginx 기록을 못 읽었다 — /api 0줄 확인은 사람이 한다');
  return bad;
}

(async () => {
  log(`쇼핑앱 운영 반영 ${STAMP}${CHECK_ONLY ? ' (확인만)' : ''} · 손님 주소 ${SITE}/`);
  if (CHECK_ONLY) { const bad = await verify(''); bad.forEach(b => log('🔴 ' + b)); log(bad.length ? '🔴 확인 실패' : '✅ 확인 통과'); process.exit(bad.length ? 1 : 0); }

  // 0. 사전 점검
  const dirty = run('git', ['status', '--porcelain', '--', 'src', 'public', 'package.json', 'package-lock.json']);
  if (dirty.code !== 0) { log('🔴 git status 를 못 읽었다 — 커밋 상태를 셀 수 없으면 반영하지 않는다'); process.exit(1); }
  if (dirty.out.trim()) { log('🔴 커밋 안 된 변경이 있다 — 커밋한 뒤 다시:\n' + dirty.out); process.exit(1); }
  if (fs.existsSync(P('build_next'))) { log('🔴 build_next 가 이미 있다 — 무엇인지 확인하고 치운 뒤 다시(이 스크립트는 지우지 않는다)'); process.exit(1); }
  if (fs.existsSync(P(`build_prev_${STAMP}`))) { log(`🔴 build_prev_${STAMP} 가 이미 있다 — 1분 뒤 다시`); process.exit(1); }
  const head = run('git', ['log', '-1', '--format=%h %s']).out.trim();
  log(`0. 커밋 ${head}`);

  // 1. 빌드
  log('1. build_next 로 빌드');
  const b = run('npm', ['run', 'build'], { env: { ...process.env, BUILD_PATH: 'build_next' }, timeout: 900000 });
  const newMain = fs.existsSync(P('build_next/index.html')) ? mainOf(fs.readFileSync(P('build_next/index.html'), 'utf8')) : '';
  if (b.code !== 0 || !newMain) { log('🔴 빌드 실패 — 운영은 그대로\n' + b.out.slice(-1500)); process.exit(1); }
  const oldMain = mainOf(fs.readFileSync(P('build/index.html'), 'utf8'));
  log(`   새 번들 ${newMain} (지금 운영 ${oldMain})`);

  // 2~4. 멈춤 · 보관 · 바꿔 끼우기 · 시작
  const t0 = Date.now();
  log('2. 멈춤'); pm2('stop');
  log(`3. build → build_prev_${STAMP} 보관 · build_next → build`);
  let swapped = false;
  if (await rename('build', `build_prev_${STAMP}`)) {
    if (await rename('build_next', 'build')) swapped = true;
    else await rename(`build_prev_${STAMP}`, 'build');
  }
  log('4. 시작'); pm2('start');
  const served = await waitLocal(swapped ? newMain : oldMain);
  log(`   멈춘 시간 ${((Date.now() - t0) / 1000).toFixed(1)}초 · 127.0.0.1:3000 → ${served}`);
  if (!swapped) { log('🔴 바꿔 끼우지 못했다 — 운영은 옛 빌드 그대로'); process.exit(1); }
  log(`   운영 build/index.html 시각 ${fs.statSync(P('build/index.html')).mtime.toLocaleString('ko-KR')}`);

  // 5. 확인
  log('5. 확인');
  const bad = served === newMain ? await verify(newMain) : [`127.0.0.1:3000 이 새 번들을 안 내준다(${served})`];
  if (!bad.length) { log(`✅ 반영 완료 — ${newMain} · 되돌릴 곳 build_prev_${STAMP}`); process.exit(0); }

  // 6. 되돌리기
  bad.forEach(x => log('🔴 ' + x));
  log(`6. 되돌린다 — build → build_failed_${STAMP} · build_prev_${STAMP} → build`);
  pm2('stop');
  const ok = (await rename('build', `build_failed_${STAMP}`)) && (await rename(`build_prev_${STAMP}`, 'build'));
  pm2('start');
  const back = await waitLocal(oldMain);
  log(`   127.0.0.1:3000 → ${back}`);
  if (ok && back === oldMain) { log(`🔴 반영 실패 — 옛 번들 ${oldMain} 로 되돌렸다. 실패한 빌드는 build_failed_${STAMP}`); process.exit(1); }
  log('🔴🔴 되돌리기도 실패 — 지금 운영 상태를 사람이 바로 봐야 한다'); process.exit(3);
})().catch(e => { console.error('🔴 중단', e); process.exit(3); });
