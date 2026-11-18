#!/usr/bin/env node
/**
 * 쇼핑앱 운영 반영 — 한 번에, 실패하면 스스로 되돌린다.
 *
 *   node scripts/deploy-shop.cjs                # 빌드 → 바꿔 끼우기 → 확인 → (실패 시) 되돌리기
 *   node scripts/deploy-shop.cjs --check-only   # 지금 운영에 확인만 돌린다(아무것도 안 바꾼다)
 *   node scripts/deploy-shop.cjs --build-only [--out <저장소 밖 폴더>]
 *                                               # 시험: HEAD 꺼내기·빌드·산출물 확인·치우기까지만(pm2·build 안 건드림)
 *
 * 순서
 *  0. 사전 점검: 작업 폴더의 미커밋 변경(git status --porcelain)을 **보여 주고 경고만** 한다 —
 *     🔴 빌드는 작업 폴더가 아니라 **커밋된 HEAD** 로 하므로 그 변경들은 이번 배포에 들어가지 않는다.
 *     (2026-11-12 대표님 지시 7: 다른 창의 미커밋 줄이 작업 폴더 빌드에 섞여 운영에 나갈 뻔했다)
 *  0-b. 🔴 금액 일치 검사 — 백엔드 tools/check-shop-amount-parity.cjs --live(장바구니 = 주문서 = 실제 주문). 실패하면 빌드도 안 한다
 *  1-b. 🔴 브랜드 화면 검사(scripts/shop-shots/check-brand-live.cjs) — 꺼낸 폴더의 빌드를 127.0.0.1 에 띄우고 화면이 부르는 /api 를
 *     **운영 백엔드의 같은 주소(읽기만 하는 GET 목록)** 로 넘겨 화면마다 다른 브랜드 글자·그림이 나오는지 본다. 빌드 몫이 1건이라도
 *     있으면 바꿔 끼우지 않는다(2026-11-17 — 운영 /aram/ 에 에스알마트 로고·아이콘이 나간 일. 글자 검사만 있었고 그림·서버 응답은 안 봤다).
 *     서버 자료 몫(예: 범위가 「전체」 인 배너의 「SR Mart」)은 적기만 한다 — 배포로는 못 고친다.
 *  1-d. 🔴 상태 줄 겹침 검사(scripts/shop-shots/check-safe-top.cjs) — 안전 영역 47px 을 넣고 「매장 미리보기 중」 띠 있음/없음 전 화면.
 *     겹치거나 띠 아래가 띠 없을 때보다 더 비면 바꿔 끼우지 않는다(2026-11-19 · 아이폰에서 띠가 시계 줄과 겹친 채 11-13 부터 나가 있었다).
 *  1-c. 🔴 서비스워커 판 —서비스워커는 아이콘·offline·manifest 처럼 이름이 고정된 파일도 「캐시 먼저」로 내준다. 그런 파일이
 *     바뀌었는데 service-worker.js 가 지금 운영과 바이트까지 같으면, 이미 연 기기는 새 서비스워커를 안 받고 옛 그림을 계속 낸다
 *     (2026-11-17 실측: 운영 /aram/ 을 연 기기의 shop-v7:/aram/ 에 에스알마트 icon-192). 그때는 반영하지 않는다 — public/service-worker.js 의 VERSION 을 올릴 것.
 *  1. HEAD 를 깨끗한 폴더로 꺼내(git worktree add --detach C:/srmart/_deploy_wt-shop-<시각>) 거기서 빌드 →
 *     산출물에 BUILD_COMMIT.txt(커밋 해시)를 넣고 → 작업 폴더의 build_next 로 옮긴다 → worktree 를 치운다.
 *     · node_modules 는 작업 폴더 것을 junction 으로 연결한다(다시 설치하지 않는다).
 *       🔴 치울 때는 junction 을 **먼저 링크만** 풀고(unlink) 그 다음 worktree remove — 순서가 바뀌면
 *          원본 node_modules 가 지워진다. junction 에 rmSync recursive 를 쓰지 않는다.
 *     · .env* (git 에 없는 빌드 설정, 예: .env.local 의 REACT_APP_SITE)는 worktree 로 복사해 같은 값으로 빌드한다.
 *     · worktree 를 저장소 **옆**(C:/srmart 바로 아래)에 두는 이유: 옆 저장소를 ../srmart-* 로 찾는 검사기가 그대로 돈다.
 *  2. pm2 stop srmart-shop
 *  3. 운영 build → build_prev_<날짜_시각> 로 보관(이름 바꾸기) · build_next → build
 *     🔴 윈도에서는 serve 가 build 폴더를 잡고 있어 **멈추기 전에는 이름을 못 바꾼다**(2026-11-11 실측 —
 *        Permission denied). 그래서 보관은 멈춘 몇 초 안에 한다. 복사하지 않으니 같은 폴더가 둘 생기지 않는다.
 *  4. pm2 start srmart-shop → 127.0.0.1:3000 이 새 번들을 내주는지
 *  5. 확인 — 손님 앱이 여는 주소(capacitor.config.ts server.url, 기본 https://www.dongsinmarket.com/shop)에서
 *     ⑴ 새 번들 이름이 내려오는지 ⑵ check-sw.cjs ⑶ check-f11.cjs
 *     ⑷ 확인하는 동안 nginx 기록에서 **배포 주소(/srm/·/shop/·/aram/)에서 나간** 시험 브라우저의 /api 요청이 0줄인지
 *        (가짜 응답만 썼는지 · 시험 흔적은 HeadlessChrome·지어 넣은 휴대폰 UA·이 PC 의 휴대폰 UA — scripts/lib/nginx-test-hits.cjs)
 *  6. 하나라도 실패하면: 멈춤 → build 를 build_failed_<시각> 로 · build_prev_<시각> 를 build 로 → 시작 → 옛 번들인지 확인
 *
 * 🔴 백엔드·어드민은 건드리지 않는다. nginx 도 안 건드린다. 반영 흐름은 아무것도 지우지 않는다
 *    (보관 폴더 정리는 따로: --prune 으로 보고 --prune --yes 로 최근 2개만 남긴다 — 아래 prune()).
 * 종료코드: 0 반영 완료 · 1 실패(되돌림 완료) · 3 실패했고 되돌리기도 실패 — 🔴 사람이 바로 봐야 한다
 */
require('./lib/msys-path.cjs');   // Git Bash 경로 변환 막기(/shop·/srm·/aram) — 2026-11-13 지시 6
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const NGINX_LOG = 'C:/nginx/logs/access.log';
// 마지막 확인의 nginx 판정 — 멀쩡한지 먼저 묻는다(못 믿을 판정으로 반영·되돌리기를 정하지 않는다 · 2026-11-17 지시 7)
const nginxTest = require('./lib/nginx-test-hits.cjs');
{
  const st = nginxTest.selftest();
  if (!st.ok) { console.log(`🔴 nginx 시험 기록 판정 자가 시험 실패 — 반영하지 않는다\n   ${st.bad.join('\n   ')}`); process.exit(1); }
}
const CHECK_ONLY = process.argv.includes('--check-only');
// ── 브랜드 (2026-11-15 대표님 지시 — 아람 웹 경로) ─────────────────────────────────────────
//   node scripts/deploy-shop.cjs                 # 에스알마트(srm) — 지금까지와 같다
//   node scripts/deploy-shop.cjs --brand aram    # 아람마트 — 따로 빌드해 따로 띄운다(build_aram · pm2 srmart-shop-aram · 127.0.0.1:3002)
//   손님 주소는 brands/<id>/brand.json 의 url 이 원본이다. 에스알마트는 옛 앱이 여는 /shop 도 같은 build 를 내주는지 본다.
//   🔴 nginx 에 /srm/·/aram/ 이 걸리기 전에는 그 주소가 홈페이지를 내주므로 확인에서 멈추고 되돌린다(안전한 쪽으로 실패).
const BRAND = (() => { const i = process.argv.indexOf('--brand'); return i > 0 ? String(process.argv[i + 1] || '') : 'srm'; })();
const PROFILES = {
  srm: { pm2: 'srmart-shop', port: 3000, dir: 'build', next: 'build_next', prev: 'build_prev_', failed: 'build_failed_', env: {}, also: ['https://www.dongsinmarket.com/shop'] },
  aram: { pm2: 'srmart-shop-aram', port: 3002, dir: 'build_aram', next: 'build_aram_next', prev: 'build_aram_prev_', failed: 'build_aram_failed_', env: { REACT_APP_BRAND: 'aram' }, also: [] },
};
if (!PROFILES[BRAND]) { console.log(`🔴 --brand ${BRAND} — 모르는 브랜드(${Object.keys(PROFILES).join('·')})`); process.exit(1); }
const PROF = PROFILES[BRAND];
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'brands', BRAND, 'brand.json'), 'utf8')).url.replace(/\/+$/, '');
const LOCAL = `http://127.0.0.1:${PROF.port}`;
// 아람은 처음 반영할 때 pm2 에 새로 올린다 — 에스알마트(ecosystem.config.js)와 같은 serve 로, 🔴 127.0.0.1 에만 연다
const SERVE_MAIN = 'C:/Users/user/AppData/Roaming/npm/node_modules/serve/build/main.js';
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
const pm2 = verb => { const r = run('pm2', [verb, PROF.pm2]); log(`   pm2 ${verb} ${PROF.pm2} → 종료코드 ${r.code}`); return r.code === 0; };
async function waitLocal(expect) {
  for (let i = 0; i < 30; i++) { const r = await get(LOCAL + '/'); const m = mainOf(r.body); if (r.status === 200 && (!expect || m === expect)) return m; await sleep(700); }
  return mainOf((await get(LOCAL + '/')).body) || '(응답 없음)';
}
// 🔴 번들 이름만 보면 「화면 번들은 같고 service-worker.js 만 바뀐」 배포에서 바꿔 끼웠는지 못 가린다(2026-11-12).
//    그래서 build 폴더의 index.html·service-worker.js 와 **실제로 내려오는 것**의 해시를 맞춘다.
const md5 = t => require('crypto').createHash('md5').update(t).digest('hex').slice(0, 12);
async function sameAsBuild(base) {
  const out = [];
  for (const f of ['index.html', 'service-worker.js']) {
    const want = md5(fs.readFileSync(P(PROF.dir + '/' + f)));
    const got = md5((await get(base + '/' + f.replace('index.html', ''))).body);
    out.push({ f, ok: want === got, want, got });
  }
  return out;
}
// ── HEAD 를 깨끗한 폴더로 꺼내 빌드한다 (2026-11-12 대표님 지시 7) ─────────────────────────
const WT_PARENT = path.resolve(ROOT, '..');
const WT_PREFIX = '_deploy_wt-shop-';
const ENV_FILES = ['.env', '.env.local', '.env.production', '.env.production.local'];
const git = args => run('git', args, { shell: false });
const samePath = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
function ourWorktrees() {
  return git(['worktree', 'list', '--porcelain']).out.split('\n')
    .filter(l => l.startsWith('worktree ')).map(l => path.resolve(l.slice(9).trim()))
    .filter(p => path.basename(p).startsWith(WT_PREFIX));
}
// 🔴 node_modules junction 은 **링크만** 푼다. 진짜 폴더로 보이면(링크 아님) 그건 worktree 자신의 것이라 그대로 둔다.
function unlinkJunction(link) {
  let st; try { st = fs.lstatSync(link); } catch (e) { return true; }
  let isLink = st.isSymbolicLink();
  try { if (!samePath(fs.realpathSync(link), link)) isLink = true; } catch (e) { /* 끊긴 링크 */ isLink = true; }
  if (!isLink) return true;
  try { fs.unlinkSync(link); } catch (e) { try { fs.rmdirSync(link); } catch (e2) { log(`🔴 링크 풀기 실패 ${link}: ${e2.code}`); return false; } }
  try { fs.lstatSync(link); log(`🔴 링크가 아직 있다 ${link}`); return false; } catch (e) { return true; }
}
function cleanupWorktree(wt) {
  if (!unlinkJunction(path.join(wt, 'node_modules'))) { log(`🔴 junction 을 못 풀어 worktree 를 치우지 않았다 — ${wt} 를 사람이 본다(원본 node_modules 보호)`); return false; }
  const r = git(['worktree', 'remove', '--force', wt]);
  if (r.code !== 0) log(`   ⚠ git worktree remove 종료코드 ${r.code}: ${r.out.trim().slice(0, 300)}`);
  git(['worktree', 'prune']);
  const left = fs.existsSync(wt) || ourWorktrees().some(p => samePath(p, wt));
  if (left) log(`🔴 worktree 가 남았다 — ${wt}`);
  return !left;
}
/** HEAD 를 꺼내 빌드하고, 산출물 폴더를 take(buildDir) 에 넘긴 뒤 worktree 를 치운다. */
function buildFromHead(take) {
  const hash = git(['rev-parse', 'HEAD']).out.trim();
  const subj = git(['log', '-1', '--format=%s']).out.trim();
  const sec = pad(new Date().getSeconds());
  const wt = path.join(WT_PARENT, WT_PREFIX + STAMP + sec);
  const res = { hash, subj, wt, ok: false, main: '', env: [], secs: 0, out: '' };
  if (!/^[0-9a-f]{40}$/.test(hash)) { res.out = 'HEAD 를 못 읽었다'; return res; }
  if (fs.existsSync(wt)) { res.out = `${wt} 가 이미 있다`; return res; }
  // 🔴 core.autocrlf=false — 이 PC 는 전역 autocrlf=true 라 새로 꺼내면 CRLF 가 된다. 그러면 커밋과 바이트가 달라져
  //    「사본이 한 바이트도 같은가」 검사(어드민 check-selftests ④)가 거짓으로 실패한다. 커밋된 바이트 그대로 꺼낸다.
  const add = git(['-c', 'core.autocrlf=false', 'worktree', 'add', '--detach', wt, hash]);
  if (add.code !== 0) { res.out = 'git worktree add 실패\n' + add.out; res.cleaned = true; return res; }
  log(`   worktree ${wt} (${hash.slice(0, 8)})`);
  try {
    fs.symlinkSync(P('node_modules'), path.join(wt, 'node_modules'), 'junction');
    for (const f of ENV_FILES) if (fs.existsSync(P(f)) && !fs.existsSync(path.join(wt, f))) { fs.copyFileSync(P(f), path.join(wt, f)); res.env.push(f); }
    if (res.env.length) log(`   git 에 없는 빌드 설정 복사: ${res.env.join(', ')}`);
    // 옆 저장소 검사기(예: 백엔드 check-store-settings-defaults)가 「이 앱」을 작업 폴더가 아니라 꺼낸 폴더에서 읽게 한다
    const env = { ...process.env, ...PROF.env, REPO_DIR_SHOP: wt }; delete env.BUILD_PATH;
    if (BRAND === 'srm') delete env.REACT_APP_BRAND;   // 셸에 남은 aram 이 에스알마트 빌드에 섞이지 않게(.env.production 의 srm 이 쓰인다)
    const t = Date.now();
    const b = run('npm', ['run', 'build'], { cwd: wt, env, timeout: 900000 });
    res.secs = (Date.now() - t) / 1000; res.out = b.out;
    const idx = path.join(wt, 'build', 'index.html');
    res.main = fs.existsSync(idx) ? mainOf(fs.readFileSync(idx, 'utf8')) : '';
    if (b.code === 0 && res.main) {
      fs.writeFileSync(path.join(wt, 'build', 'BUILD_COMMIT.txt'), `${hash}\n${subj}\nbuilt ${new Date().toISOString()}\n`);
      res.ok = take(path.join(wt, 'build'), res) !== false;
    }
  } catch (e) { res.out += '\n' + (e.stack || e); res.ok = false; }
  finally { res.cleaned = cleanupWorktree(wt); }
  return res;
}
/** 1-b. 브랜드 화면 검사 — 꺼낸 폴더(wt)의 검사기로, 꺼낸 폴더의 빌드를 본다(작업 폴더의 미커밋 검사기가 섞이지 않게) */
function brandLive(dir, wt) {
  const tool = path.join(wt, 'scripts', 'shop-shots', 'check-brand-live.cjs');
  if (!fs.existsSync(tool)) { log('🔴 브랜드 화면 검사기가 없다(check-brand-live.cjs) — 반영하지 않는다'); return false; }
  const out = path.join(require('os').tmpdir(), `deploy-shop-brand-${BRAND}-${STAMP}`);
  const r = spawnSync(process.execPath, [tool, '--build', dir, '--brand', BRAND, '--out', out], { cwd: wt, encoding: 'utf8', timeout: 600000 });
  const lines = (r.stdout || '').split('\n');
  const i = lines.findIndex(l => /브랜드 화면 검사\(/.test(l));
  log((i >= 0 ? lines.slice(i) : lines.slice(-12)).filter(Boolean).map(l => '   ' + l).join('\n') + ((r.stderr || '').trim() ? '\n   ' + r.stderr.trim().slice(-400) : ''));
  log(`   ${r.status === 0 ? '✅' : '🔴'} 브랜드 화면 검사 종료코드 ${r.status} · 사진 ${out}`);
  return r.status === 0;
}
/** 1-d. 상태 줄 겹침 검사 — 아이폰 안전 영역(47px)을 넣고 「매장 미리보기 중」 띠 있음/없음 전 화면(가짜 자료 · 운영 서버 안 부름).
 *  2026-11-19 — 띠가 시계·배터리 줄과 겹친 채 11-13 부터 운영에 나가 있었다(데스크톱 크롬은 안전 영역을 0 으로 줘서 어느 사진에도 안 보였다). */
function safeTop(dir, wt) {
  const tool = path.join(wt, 'scripts', 'shop-shots', 'check-safe-top.cjs');
  if (!fs.existsSync(tool)) { log('🔴 상태 줄 검사기가 없다(check-safe-top.cjs) — 반영하지 않는다'); return false; }
  const out = path.join(require('os').tmpdir(), `deploy-shop-safetop-${BRAND}-${STAMP}`);
  const r = spawnSync(process.execPath, [tool, '--build', dir, '--out', out], { cwd: wt, encoding: 'utf8', timeout: 1200000 });
  const lines = (r.stdout || '').split('\n').filter((l) => /🔴|상태 줄 검사/.test(l));
  log(lines.slice(-12).map((l) => '   ' + l).join('\n') + ((r.stderr || '').trim() ? '\n   ' + r.stderr.trim().slice(-400) : ''));
  log(`   ${r.status === 0 ? '✅' : '🔴'} 상태 줄 검사 종료코드 ${r.status} · 사진 ${out}`);
  return r.status === 0;
}
/** 1-c. 이름 고정 파일이 바뀌었는데 서비스워커가 그대로인가 → 바뀐 파일 목록(비어 있으면 통과) */
function swStale(newDir, oldDir) {
  const swNew = path.join(newDir, 'service-worker.js'), swOld = path.join(oldDir, 'service-worker.js');
  if (!fs.existsSync(swOld) || !fs.existsSync(swNew)) return [];
  if (!fs.readFileSync(swNew).equals(fs.readFileSync(swOld))) return [];   // 서비스워커가 바뀌면 기기가 새로 받고, 판이 갈리면 옛 캐시를 지운다
  const FIXED = /\.(png|jpe?g|webp|gif|svg|ico)$|(^|\/)(manifest\.json|offline\.html)$/i;
  const walk = (d, acc = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!(d === newDir && e.name === 'static')) walk(p, acc); } else acc.push(p);   // static/ 은 이름에 해시가 있다
    }
    return acc;
  };
  return walk(newDir).map(f => path.relative(newDir, f).replace(/\\/g, '/')).filter(rel => FIXED.test(rel))
    .filter(rel => { const o = path.join(oldDir, rel); return !fs.existsSync(o) || !fs.readFileSync(o).equals(fs.readFileSync(path.join(newDir, rel))); });
}
function moveDirSync(src, dst) {
  for (let i = 0; i < 6; i++) {
    try { fs.renameSync(src, dst); return true; } catch (e) {
      if (i === 5) { log(`🔴 ${src} → ${dst} 옮기기 실패: ${e.code}`); return false; }
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 700);
    }
  }
}
// --build-only: 산출물을 확인만 하고(원하면 저장소 밖 --out 으로 복사) 작업 폴더에는 아무것도 안 남긴다
function buildOnly() {
  const i = process.argv.indexOf('--out');
  const out = i > 0 ? path.resolve(process.argv[i + 1] || '') : '';
  if (out && (samePath(out, ROOT) || path.resolve(out).toLowerCase().startsWith(path.resolve(ROOT).toLowerCase() + path.sep))) { log('🔴 --out 은 저장소 밖이어야 한다'); return 1; }
  if (out && fs.existsSync(out)) { log(`🔴 --out ${out} 가 이미 있다 — 새 이름으로`); return 1; }
  const r = buildFromHead((dir, res) => {
    if (!brandLive(dir, res.wt)) return false;
    const js = path.join(dir, mainOfPath(dir));
    log(`   산출물 index.html ${fs.statSync(path.join(dir, 'index.html')).size}B · main ${fs.statSync(js).size}B · BUILD_COMMIT.txt ${fs.existsSync(path.join(dir, 'BUILD_COMMIT.txt')) ? '있음' : '없음'}`);
    if (out) { fs.cpSync(dir, out, { recursive: true }); log(`   복사 → ${out}`); }
  });
  log(`   빌드 ${r.secs.toFixed(0)}초 · 번들 ${r.main || '(없음)'} · 커밋 ${r.hash.slice(0, 8)} ${r.subj}`);
  if (!r.ok) log('🔴 빌드 실패\n' + r.out.slice(-1500));
  log(`   worktree 치움 ${r.cleaned ? '✅' : '🔴 실패'} · ${PROF.next} ${fs.existsSync(P(PROF.next)) ? '🔴 있음' : '없음'} · node_modules ${fs.existsSync(P('node_modules/react-scripts/package.json')) ? '멀쩡' : '🔴 이상'}`);
  return r.ok && r.cleaned ? 0 : 1;
}
const mainOfPath = dir => mainOf(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'));

const nginxLines = () => { try { return fs.readFileSync(NGINX_LOG, 'utf8').split('\n').length; } catch (e) { return -1; } };

async function verify(expectMain) {
  const bad = [];
  const L0 = nginxLines();
  for (const base of [SITE, ...PROF.also]) {
    for (const x of await sameAsBuild(base)) {
      log(`   ${base}/ ${x.f} ${x.ok ? '= build' : '≠ build'} (${x.got})`);
      if (!x.ok) bad.push(`${base}/ 의 ${x.f} 가 ${PROF.dir} 와 다르다(${x.got} ≠ ${x.want})${base === SITE ? ' — nginx 에 이 경로가 걸렸는지 볼 것(docs/ARAM_WEB_PATH.md)' : ''}`);
    }
  }
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
    // 🔴 배포 주소(/srm/·/shop/·/aram/)에서 나간 기록만 본다 — 다른 창의 시험 브라우저(/admin 등)는 세기만 한다.
    //    시험 흔적은 넓게(HeadlessChrome · 지어 넣은 휴대폰 UA · 이 PC 의 휴대폰 UA) — scripts/lib/nginx-test-hits.cjs (2026-11-17 지시 7)
    const lines = fs.readFileSync(NGINX_LOG, 'utf8').split('\n').slice(L0 - 1);
    const { hits, otherTest } = nginxTest.testHits(lines);
    log(`   nginx: 확인 중 새 줄 ${lines.length}개 · 배포 주소에서 나간 시험 브라우저의 /api ${hits.length}줄${otherTest.length ? ` · (다른 주소의 시험 /api ${otherTest.length}줄 — 다른 창 · 세지 않음)` : ''}`);
    if (hits.length) bad.push(`시험 브라우저가 배포 주소에서 실서버 /api 를 ${hits.length}번 불렀다: ${hits.slice(0, 2).map(l => (l.match(/"[A-Z]+ [^ ]+/) || [''])[0]).join(', ')}`);
  } else log('   ⚠ nginx 기록을 못 읽었다 — /api 0줄 확인은 사람이 한다');
  return bad;
}

/**
 * 보관 폴더 정리 — 본 흐름과 따로 부른다. 본 흐름(반영)은 여전히 아무것도 지우지 않는다.
 *
 *   node scripts/deploy-shop.cjs --prune          # 무엇을 지울지 보여 주기만
 *   node scripts/deploy-shop.cjs --prune --yes    # 최근 2개(build_prev_*)만 남기고 지운다
 *   node scripts/deploy-shop.cjs --brand aram --prune [--yes]   # 아람(build_aram_prev_*) — 브랜드마다 따로 센다
 *
 * 🔴 지우는 것은 이름이 정확히 build_prev_YYYYMMDD 또는 build_prev_YYYYMMDD_HHMM 인 폴더뿐이다.
 *    운영 build · build_next · build_failed_* 는 건드리지 않는다(실패본은 원인을 보기 전까지 사람이 판단).
 *    지울 때는 저장소 안의 그 폴더 전체 경로를 하나씩 집어서 지운다(* 를 쓰지 않는다 — CLAUDE.md).
 */
const PRUNE_KEEP = 2;
function prune(yes) {
  const re = new RegExp('^' + PROF.prev + '(\\d{8})(?:_(\\d{4}))?$');   // 에스알마트 build_prev_* · 아람 build_aram_prev_*
  const list = fs.readdirSync(ROOT, { withFileTypes: true })
    .filter(d => d.isDirectory() && re.test(d.name))
    .map(d => { const m = d.name.match(re); return { name: d.name, key: m[1] + (m[2] || '0000') }; })
    .sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));   // 최근 것이 앞
  const keep = list.slice(0, PRUNE_KEEP), drop = list.slice(PRUNE_KEEP);
  log(`보관 폴더 ${list.length}개 — 남김 ${keep.map(x => x.name).join(', ') || '(없음)'}`);
  if (!drop.length) { log('✅ 지울 것 없음'); return 0; }
  log(`${yes ? '지움' : '지울 것(보기만 — 지우려면 --yes)'}: ${drop.map(x => x.name).join(', ')}`);
  if (!yes) return 0;
  for (const d of drop) {
    const full = path.resolve(ROOT, d.name);
    // 저장소 바로 아래 · 이름 규칙 재확인 — 경로가 어긋나면 지우지 않는다
    if (path.dirname(full) !== path.resolve(ROOT) || !re.test(path.basename(full))) { log(`🔴 ${full} — 경로가 이상해 건너뜀`); return 1; }
    fs.rmSync(full, { recursive: true, force: false });
    log(`  지움 ${full}`);
  }
  const left = fs.readdirSync(ROOT).filter(n => re.test(n));
  log(`✅ 남은 보관 폴더: ${left.join(', ')}`);
  return 0;
}

(async () => {
  if (process.argv.includes('--prune')) process.exit(prune(process.argv.includes('--yes')));
  log(`쇼핑앱 운영 반영 ${STAMP}${CHECK_ONLY ? ' (확인만)' : ''} · 브랜드 ${BRAND} · 손님 주소 ${SITE}/${PROF.also.length ? ' (+ ' + PROF.also.join(', ') + ')' : ''} · pm2 ${PROF.pm2} · ${LOCAL} · ${PROF.dir}`);
  if (CHECK_ONLY && !fs.existsSync(P(PROF.dir + '/index.html'))) { log(`🔴 ${PROF.dir} 가 없다 — 아직 한 번도 반영하지 않았다(처음 반영은 --check-only 없이)`); process.exit(1); }
  if (CHECK_ONLY) { const bad = await verify(''); bad.forEach(b => log('🔴 ' + b)); log(bad.length ? '🔴 확인 실패' : '✅ 확인 통과'); process.exit(bad.length ? 1 : 0); }

  // 0. 사전 점검
  // git 은 셸 없이 부른다 — 윈도 셸이 %s 같은 글자를 망가뜨린다(2026-11-12 「0. 커밋」 줄이 빈칸으로 나왔다)
  const dirty = git(['status', '--porcelain']);
  if (dirty.code !== 0) { log('🔴 git status 를 못 읽었다 — 커밋 상태를 셀 수 없으면 반영하지 않는다'); process.exit(1); }
  if (dirty.out.trim()) {
    log('⚠ 작업 폴더에 커밋 안 된 변경이 있다 — 🔴 이 변경들은 이번 배포에 들어가지 않습니다(빌드는 커밋된 HEAD 로 한다):');
    log(dirty.out.trimEnd().split('\n').map(l => '      ' + l).join('\n'));
  }
  const stale = ourWorktrees();
  if (stale.length) log(`⚠ 지난 배포의 worktree 가 남아 있다(중단된 듯) — 확인 후 치울 것: ${stale.join(', ')}`);

  // 0-b. 🔴 금액 일치(2026-11-13 대표님 지시 2) — 같은 장바구니로 장바구니 화면 · 주문서(견적) · 실제 주문 금액이 1원도 다르지 않은가.
  //      백엔드 검사기를 임시 MySQL(127.0.0.1)·실제 서버로 끝까지 돌린다(운영 DB 는 표 구조만 읽는다 · 10초 남짓).
  //      통과하지 않으면 **빌드도 하지 않는다** — 갈라진 채 나가면 손님 결제가 409 「결제 금액이 맞지 않아요」 로 막힌다.
  const parityTool = path.join(ROOT, '..', 'srmart-backend', 'tools', 'check-shop-amount-parity.cjs');
  if (!fs.existsSync(parityTool)) { log(`🔴 금액 일치 검사기가 없다(${parityTool}) — 백엔드가 서버 장바구니보다 옛것이다. 반영하지 않는다`); process.exit(1); }
  log('0-b. 금액 일치 검사(장바구니 = 주문서 = 실제 주문 · 임시 DB)');
  const parity = spawnSync(process.execPath, [parityTool, '--live'], { cwd: path.dirname(path.dirname(parityTool)), encoding: 'utf8' });
  const parityLast = (parity.stdout || '').trim().split('\n').pop();
  log(`   ${parityLast}`);
  if (parity.status !== 0) { log('🔴 금액 일치 검사 실패 — 반영하지 않는다(운영은 그대로)\n' + (parity.stdout || '').split('\n').filter(l => /🔴/.test(l)).join('\n') + (parity.stderr || '').slice(-800)); process.exit(1); }
  if (process.argv.includes('--build-only')) { log('시험 모드(--build-only) — pm2·build 는 안 건드린다'); process.exit(buildOnly()); }
  if (fs.existsSync(P(PROF.next))) { log(`🔴 ${PROF.next} 가 이미 있다 — 무엇인지 확인하고 치운 뒤 다시(이 스크립트는 지우지 않는다)`); process.exit(1); }
  if (fs.existsSync(P(`${PROF.prev}${STAMP}`))) { log(`🔴 ${PROF.prev}${STAMP} 가 이미 있다 — 1분 뒤 다시`); process.exit(1); }
  // 🔴 처음 반영(아람): 운영 폴더도 pm2 앱도 없다 — 보관할 옛 build 가 없으니 되돌릴 곳도 없다(실패하면 멈추고 실패본으로 옮긴다)
  const FIRST = !fs.existsSync(P(PROF.dir));
  const registered = run('pm2', ['describe', PROF.pm2]).code === 0;
  if (FIRST === registered) { log(`🔴 ${PROF.dir} ${FIRST ? '없음' : '있음'} · pm2 ${PROF.pm2} ${registered ? '있음' : '없음'} — 둘이 어긋난다. 사람이 보고 맞춘 뒤 다시`); process.exit(1); }
  if (FIRST && !fs.existsSync(SERVE_MAIN)) { log(`🔴 serve 가 없다(${SERVE_MAIN})`); process.exit(1); }
  if (FIRST) log(`   처음 반영 — ${PROF.dir} 를 새로 만들고 pm2 에 ${PROF.pm2}(127.0.0.1:${PROF.port}) 를 올린다. 🔴 끝나면 pm2 save(재부팅 뒤에도 뜨게)`);
  const head = git(['log', '-1', '--format=%h %s']).out.trim();
  log(`0. 커밋 ${head}`);

  // 1. 빌드 — 커밋된 HEAD 를 깨끗한 폴더로 꺼내서
  log(`1. HEAD 를 꺼내 빌드(${BRAND}) → ${PROF.next}`);
  const b = buildFromHead((dir, res) => {
    log('1-b. 브랜드 화면 검사(운영과 같은 응답 · 읽기만)');
    if (!brandLive(dir, res.wt)) { res.out += '\n🔴 브랜드 화면 검사 실패 — 다른 브랜드 글자·그림이 빌드에 남았다(위 줄)'; return false; }
    log('1-d. 상태 줄 겹침 검사(아이폰 안전 영역 · 띠 있음/없음 · 가짜 자료)');
    if (!safeTop(dir, res.wt)) { res.out += '\n🔴 상태 줄 검사 실패 — 화면 맨 위 글자가 시계·배터리 줄과 겹치거나 띠 아래가 빈다(위 줄)'; return false; }
    const stale = fs.existsSync(P(PROF.dir)) ? swStale(dir, P(PROF.dir)) : [];
    log(`1-c. 서비스워커 판 — 이름 고정 파일 바뀜 ${stale.length}개${stale.length ? ' · 🔴 service-worker.js 는 운영과 같다' : ''}`);
    if (stale.length) { res.out += `\n🔴 ${stale.slice(0, 8).join(' · ')} 가 바뀌었는데 service-worker.js 가 그대로다 — 이미 연 기기에는 옛 파일이 계속 나간다. public/service-worker.js 의 VERSION 을 올리고 커밋한 뒤 다시`; return false; }
    return moveDirSync(dir, P(PROF.next));
  });
  const newMain = b.ok && fs.existsSync(P(PROF.next + '/index.html')) ? mainOf(fs.readFileSync(P(PROF.next + '/index.html'), 'utf8')) : '';
  if (!b.ok || !newMain) { log('🔴 빌드 실패 — 운영은 그대로\n' + b.out.slice(-1500)); process.exit(1); }
  const oldMain = FIRST ? '' : mainOf(fs.readFileSync(P(PROF.dir + '/index.html'), 'utf8'));
  log(`   빌드 ${b.secs.toFixed(0)}초 · 커밋 ${b.hash.slice(0, 8)} (${PROF.next}/BUILD_COMMIT.txt) · worktree 치움 ${b.cleaned ? '✅' : '🔴 실패 — 끝나고 사람이 볼 것'}`);
  log(`   새 번들 ${newMain} (지금 운영 ${oldMain || '없음 — 처음'})`);

  // 2~4. 멈춤 · 보관 · 바꿔 끼우기 · 시작
  const t0 = Date.now();
  log('2. 멈춤'); if (!FIRST) pm2('stop'); else log('   (처음 — 멈출 것 없음)');
  log(`3. ${FIRST ? '' : `${PROF.dir} → ${PROF.prev}${STAMP} 보관 · `}${PROF.next} → ${PROF.dir}`);
  let swapped = false;
  if (FIRST) swapped = await rename(PROF.next, PROF.dir);
  else if (await rename(PROF.dir, `${PROF.prev}${STAMP}`)) {
    if (await rename(PROF.next, PROF.dir)) swapped = true;
    else await rename(`${PROF.prev}${STAMP}`, PROF.dir);
  }
  log('4. 시작');
  if (FIRST && swapped) {
    const r = run('pm2', ['start', SERVE_MAIN, '--name', PROF.pm2, '--interpreter', 'node', '--', '-s', P(PROF.dir).replace(/\\/g, '/'), '-l', `tcp://127.0.0.1:${PROF.port}`]);
    log(`   pm2 start ${PROF.pm2} (serve -s ${PROF.dir} -l tcp://127.0.0.1:${PROF.port}) → 종료코드 ${r.code}`);
  } else if (!FIRST) pm2('start');
  const served = await waitLocal(swapped ? newMain : oldMain);
  log(`   멈춘 시간 ${((Date.now() - t0) / 1000).toFixed(1)}초 · ${LOCAL} → ${served}`);
  const localSame = swapped ? await sameAsBuild(LOCAL) : [];
  for (const x of localSame) log(`   ${LOCAL} ${x.f} ${x.ok ? '= build' : '≠ build'}`);
  if (!swapped) { log(`🔴 바꿔 끼우지 못했다 — 운영은 옛 빌드 그대로${FIRST ? ` (처음: ${PROF.next} 가 남았다)` : ''}`); process.exit(1); }
  log(`   운영 ${PROF.dir}/index.html 시각 ${fs.statSync(P(PROF.dir + '/index.html')).mtime.toLocaleString('ko-KR')}`);
  // 🔴 처음 올린 serve 가 127.0.0.1 에만 열렸는지(이때만 이 스크립트가 주소를 정한다) — 아니면 확인 실패로 친다
  const listenBad = [];
  if (FIRST) {
    const ns = run('netstat', ['-ano'], { shell: false }).out.split('\n').filter(l => /LISTENING/.test(l) && new RegExp(`:${PROF.port}\\s`).test(l)).map(l => l.trim());
    log(`   netstat :${PROF.port} → ${ns.join(' | ') || '(없음)'}`);
    if (!ns.length || ns.some(l => !/^TCP\s+127\.0\.0\.1:/.test(l))) listenBad.push(`${PROF.port} 이 127.0.0.1 에만 열리지 않았다(${ns.join(' | ') || '안 열림'})`);
  }

  // 5. 확인
  log('5. 확인');
  const bad = served === newMain && localSame.every(x => x.ok) ? [...listenBad, ...await verify(newMain)] : [`${LOCAL} 이 새 ${PROF.dir} 를 안 내준다(${served})`];
  if (!bad.length) { log(`✅ 반영 완료 — ${BRAND} · ${newMain} · 커밋 ${b.hash.slice(0, 8)} · 되돌릴 곳 ${FIRST ? '없음(처음 반영)' : PROF.prev + STAMP}${FIRST ? ' · 🔴 pm2 save 를 할 것(재부팅 뒤에도 뜨게)' : ''}${b.cleaned ? "" : " · 🔴 worktree 남음: " + b.wt}`); process.exit(0); }

  // 6. 되돌리기
  bad.forEach(x => log('🔴 ' + x));
  if (FIRST) {
    // 처음 반영이 실패했으면 되돌릴 옛 build 가 없다 — 멈추고 실패본으로 옮긴다(pm2 앱은 멈춘 채 남는다 · nginx 의 그 경로는 502)
    log(`6. 처음 반영 실패 — 멈추고 ${PROF.dir} → ${PROF.failed}${STAMP}`);
    pm2('stop');
    const okF = await rename(PROF.dir, `${PROF.failed}${STAMP}`);
    log(okF ? `🔴 반영 실패 — ${PROF.pm2} 는 멈춤(pm2 목록에 남아 있다). 실패한 빌드는 ${PROF.failed}${STAMP}` : '🔴🔴 실패본으로 옮기지도 못했다 — 사람이 바로 볼 것');
    process.exit(okF ? 1 : 3);
  }
  log(`6. 되돌린다 — ${PROF.dir} → ${PROF.failed}${STAMP} · ${PROF.prev}${STAMP} → ${PROF.dir}`);
  pm2('stop');
  const ok = (await rename(PROF.dir, `${PROF.failed}${STAMP}`)) && (await rename(`${PROF.prev}${STAMP}`, PROF.dir));
  pm2('start');
  const back = await waitLocal(oldMain);
  log(`   ${LOCAL} → ${back}`);
  if (ok && back === oldMain) { log(`🔴 반영 실패 — 옛 번들 ${oldMain} 로 되돌렸다. 실패한 빌드는 ${PROF.failed}${STAMP}`); process.exit(1); }
  log('🔴🔴 되돌리기도 실패 — 지금 운영 상태를 사람이 바로 봐야 한다'); process.exit(3);
})().catch(e => { console.error('🔴 중단', e); process.exit(3); });
