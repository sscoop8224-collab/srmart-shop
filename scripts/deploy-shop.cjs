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
 *     ⑷ 확인하는 동안 nginx 기록에 시험 브라우저(HeadlessChrome)의 /api 요청이 0줄인지(가짜 응답만 썼는지)
 *  6. 하나라도 실패하면: 멈춤 → build 를 build_failed_<시각> 로 · build_prev_<시각> 를 build 로 → 시작 → 옛 번들인지 확인
 *
 * 🔴 백엔드·어드민은 건드리지 않는다. nginx 도 안 건드린다. 반영 흐름은 아무것도 지우지 않는다
 *    (보관 폴더 정리는 따로: --prune 으로 보고 --prune --yes 로 최근 2개만 남긴다 — 아래 prune()).
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
// 🔴 번들 이름만 보면 「화면 번들은 같고 service-worker.js 만 바뀐」 배포에서 바꿔 끼웠는지 못 가린다(2026-11-12).
//    그래서 build 폴더의 index.html·service-worker.js 와 **실제로 내려오는 것**의 해시를 맞춘다.
const md5 = t => require('crypto').createHash('md5').update(t).digest('hex').slice(0, 12);
async function sameAsBuild(base) {
  const out = [];
  for (const f of ['index.html', 'service-worker.js']) {
    const want = md5(fs.readFileSync(P('build/' + f)));
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
    const env = { ...process.env, REPO_DIR_SHOP: wt }; delete env.BUILD_PATH;
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
  const r = buildFromHead((dir) => {
    const js = path.join(dir, mainOfPath(dir));
    log(`   산출물 index.html ${fs.statSync(path.join(dir, 'index.html')).size}B · main ${fs.statSync(js).size}B · BUILD_COMMIT.txt ${fs.existsSync(path.join(dir, 'BUILD_COMMIT.txt')) ? '있음' : '없음'}`);
    if (out) { fs.cpSync(dir, out, { recursive: true }); log(`   복사 → ${out}`); }
  });
  log(`   빌드 ${r.secs.toFixed(0)}초 · 번들 ${r.main || '(없음)'} · 커밋 ${r.hash.slice(0, 8)} ${r.subj}`);
  if (!r.ok) log('🔴 빌드 실패\n' + r.out.slice(-1500));
  log(`   worktree 치움 ${r.cleaned ? '✅' : '🔴 실패'} · build_next ${fs.existsSync(P('build_next')) ? '🔴 있음' : '없음'} · node_modules ${fs.existsSync(P('node_modules/react-scripts/package.json')) ? '멀쩡' : '🔴 이상'}`);
  return r.ok && r.cleaned ? 0 : 1;
}
const mainOfPath = dir => mainOf(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'));

const nginxLines = () => { try { return fs.readFileSync(NGINX_LOG, 'utf8').split('\n').length; } catch (e) { return -1; } };

async function verify(expectMain) {
  const bad = [];
  const L0 = nginxLines();
  for (const x of await sameAsBuild(SITE)) {
    log(`   손님 주소 ${x.f} ${x.ok ? '= build' : '≠ build'} (${x.got})`);
    if (!x.ok) bad.push(`손님 주소의 ${x.f} 가 build 와 다르다(${x.got} ≠ ${x.want})`);
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
    const lines = fs.readFileSync(NGINX_LOG, 'utf8').split('\n').slice(L0 - 1);
    const hits = lines.filter(l => /HeadlessChrome/.test(l) && /"[A-Z]+ \/api/.test(l));
    log(`   nginx: 확인 중 새 줄 ${lines.length}개 · 시험 브라우저의 /api ${hits.length}줄`);
    if (hits.length) bad.push(`시험 브라우저가 실서버 /api 를 ${hits.length}번 불렀다: ${hits.slice(0, 2).map(l => (l.match(/"[A-Z]+ [^ ]+/) || [''])[0]).join(', ')}`);
  } else log('   ⚠ nginx 기록을 못 읽었다 — /api 0줄 확인은 사람이 한다');
  return bad;
}

/**
 * 보관 폴더 정리 — 본 흐름과 따로 부른다. 본 흐름(반영)은 여전히 아무것도 지우지 않는다.
 *
 *   node scripts/deploy-shop.cjs --prune          # 무엇을 지울지 보여 주기만
 *   node scripts/deploy-shop.cjs --prune --yes    # 최근 2개(build_prev_*)만 남기고 지운다
 *
 * 🔴 지우는 것은 이름이 정확히 build_prev_YYYYMMDD 또는 build_prev_YYYYMMDD_HHMM 인 폴더뿐이다.
 *    운영 build · build_next · build_failed_* 는 건드리지 않는다(실패본은 원인을 보기 전까지 사람이 판단).
 *    지울 때는 저장소 안의 그 폴더 전체 경로를 하나씩 집어서 지운다(* 를 쓰지 않는다 — CLAUDE.md).
 */
const PRUNE_KEEP = 2;
function prune(yes) {
  const re = /^build_prev_(\d{8})(?:_(\d{4}))?$/;
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
  log(`쇼핑앱 운영 반영 ${STAMP}${CHECK_ONLY ? ' (확인만)' : ''} · 손님 주소 ${SITE}/`);
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
  if (process.argv.includes('--build-only')) { log('시험 모드(--build-only) — pm2·build 는 안 건드린다'); process.exit(buildOnly()); }
  if (fs.existsSync(P('build_next'))) { log('🔴 build_next 가 이미 있다 — 무엇인지 확인하고 치운 뒤 다시(이 스크립트는 지우지 않는다)'); process.exit(1); }
  if (fs.existsSync(P(`build_prev_${STAMP}`))) { log(`🔴 build_prev_${STAMP} 가 이미 있다 — 1분 뒤 다시`); process.exit(1); }
  const head = git(['log', '-1', '--format=%h %s']).out.trim();
  log(`0. 커밋 ${head}`);

  // 1. 빌드 — 커밋된 HEAD 를 깨끗한 폴더로 꺼내서
  log('1. HEAD 를 꺼내 빌드 → build_next');
  const b = buildFromHead(dir => moveDirSync(dir, P('build_next')));
  const newMain = b.ok && fs.existsSync(P('build_next/index.html')) ? mainOf(fs.readFileSync(P('build_next/index.html'), 'utf8')) : '';
  if (!b.ok || !newMain) { log('🔴 빌드 실패 — 운영은 그대로\n' + b.out.slice(-1500)); process.exit(1); }
  const oldMain = mainOf(fs.readFileSync(P('build/index.html'), 'utf8'));
  log(`   빌드 ${b.secs.toFixed(0)}초 · 커밋 ${b.hash.slice(0, 8)} (build_next/BUILD_COMMIT.txt) · worktree 치움 ${b.cleaned ? '✅' : '🔴 실패 — 끝나고 사람이 볼 것'}`);
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
  const localSame = swapped ? await sameAsBuild('http://127.0.0.1:3000') : [];
  for (const x of localSame) log(`   127.0.0.1:3000 ${x.f} ${x.ok ? '= build' : '≠ build'}`);
  if (!swapped) { log('🔴 바꿔 끼우지 못했다 — 운영은 옛 빌드 그대로'); process.exit(1); }
  log(`   운영 build/index.html 시각 ${fs.statSync(P('build/index.html')).mtime.toLocaleString('ko-KR')}`);

  // 5. 확인
  log('5. 확인');
  const bad = served === newMain && localSame.every(x => x.ok) ? await verify(newMain) : [`127.0.0.1:3000 이 새 build 를 안 내준다(${served})`];
  if (!bad.length) { log(`✅ 반영 완료 — ${newMain} · 커밋 ${b.hash.slice(0, 8)} · 되돌릴 곳 build_prev_${STAMP}${b.cleaned ? "" : " · 🔴 worktree 남음: " + b.wt}`); process.exit(0); }

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
