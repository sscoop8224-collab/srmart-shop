#!/usr/bin/env node
/**
 * worktree 정리 — node_modules junction 이 든 작업 가지 폴더를 **표적을 건드리지 않고** 치운다 (2026-11-15 대표님 지시 4)
 *
 *   node scripts/worktree-cleanup.cjs <폴더> [<폴더> …]          # 보기만(무엇을 할지 찍는다)
 *   node scripts/worktree-cleanup.cjs <폴더> … --yes               # 한다
 *   node scripts/worktree-cleanup.cjs --selftest                   # 임시 폴더(%TEMP%)에서 전 과정 시험
 *
 * 순서(폴더마다)
 *   ① 폴더가 C:\srmart\worktrees\ 바로 아래인지 · 저장소 본체(.git 이 폴더)가 아닌지 본다 — 아니면 손대지 않는다
 *   ② 폴더 안의 링크(junction·symlink)를 전부 찾는다(링크 안으로는 들어가지 않는다)
 *   ③ 링크만 푼다: `fsutil reparsepoint delete <링크>` — 링크가 빈 폴더로 바뀐다. 표적(원본 node_modules)은 그대로.
 *      다시 세어 링크가 하나라도 남으면 **멈춘다**(④⑤ 를 하지 않는다)
 *   ④ git 에 등록된 worktree 면 `git -C <본체> worktree remove --force <폴더>` → `git worktree prune`
 *   ⑤ 그래도 폴더가 남으면(빈 폴더 · ignore 된 파일) **E:\backups\worktrees-done\<이름>-<시각>** 으로 옮긴다
 *      — 옮기기 직전에 링크가 0 개인지 한 번 더 센다
 *
 * 🔴 왜 이 순서인가 — 2026-11-15 시험 폴더(C:\srmart\_hooktest-1115)에서 실측:
 *   · `git worktree remove`(·--force) 는 junction 을 따라가지도 지우지도 않는다 — 종료코드 0 인데 폴더와 링크가 **남는다**
 *     (2026-11-14 의 admin-brand · backend-brand · shop-brand 가 그렇게 남았다)
 *   · 🔴 링크가 남은 폴더를 PowerShell `Move-Item` 으로 C: → E: 옮기면 **표적의 내용이 지워진다**
 *     (드라이브가 다르면 복사 + 원본 삭제인데, 삭제가 junction 을 따라 들어간다). 진짜 worktree 였다면
 *     C:\srmart\srmart-*\node_modules 가 통째로 비었다.
 *   · Git Bash `mv` 는 표적을 지우지 않지만 링크 안의 내용을 **통째로 복사**한다(node_modules 수백 MB)
 *   · 링크를 먼저 풀면 `git worktree remove` 가 폴더까지 깨끗이 지우고, 옮겨도 빈 폴더만 간다.
 * 🔴 이 스크립트는 링크를 푸는 것 말고는 **아무것도 지우지 않는다**(지우는 것은 git 자신의 worktree remove ·
 *    남은 것은 E:\backups 로 옮김 — 전역 삭제 훅 규칙과 같다).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const WT_ROOT = 'C:\\srmart\\worktrees';
const DONE_ROOT = 'E:\\backups\\worktrees-done';
const log = (...a) => console.log(...a);
const stamp = () => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`; };
const sameDir = (a, b) => path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

/** 링크인가 — lstat 의 symlink, 또는 realpath 가 자기 자신이 아닌 것(junction) */
function isLink(p) {
  let st; try { st = fs.lstatSync(p); } catch (e) { return false; }
  if (st.isSymbolicLink()) return true;
  if (!st.isDirectory()) return false;
  try { return !sameDir(fs.realpathSync.native(p), p); } catch (e) { return true; }   // 끊긴 링크
}
/** 폴더 안의 링크 전부 — 링크 안으로는 들어가지 않는다 */
function findLinks(dir, acc = []) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (isLink(p)) { acc.push(p); continue; }
    if (e.isDirectory()) findLinks(p, acc);
  }
  return acc;
}
function unlinkLink(p) {
  const r = spawnSync('fsutil', ['reparsepoint', 'delete', p], { encoding: 'utf8' });
  return r.status === 0 && !isLink(p);
}
/** 이 폴더를 worktree 로 가진 본체 저장소 — .git 파일의 gitdir: <본체>/.git/worktrees/<이름> */
function mainRepoOf(dir) {
  try {
    const g = fs.readFileSync(path.join(dir, '.git'), 'utf8').match(/gitdir:\s*(.+)/);
    if (!g) return null;
    const gd = path.resolve(dir, g[1].trim());
    const m = gd.replace(/\\/g, '/').match(/^(.*)\/\.git\/worktrees\/[^/]+$/);
    return m ? path.resolve(m[1]) : null;
  } catch (e) { return null; }
}

/** 한 폴더 — { ok, steps[] }. root/doneRoot 는 자가 시험이 바꾼다 */
function cleanOne(dir, { yes, root = WT_ROOT, doneRoot = DONE_ROOT }) {
  const steps = []; const say = s => { steps.push(s); log('   ' + s); };
  const full = path.resolve(dir);
  log(`■ ${full}`);
  // ①
  if (!sameDir(path.dirname(full), root)) { say(`🔴 ${root} 바로 아래가 아니다 — 손대지 않는다`); return { ok: false, steps }; }
  if (!fs.existsSync(full)) { say('없음 — 할 것 없음'); return { ok: true, steps }; }
  try { if (fs.statSync(path.join(full, '.git')).isDirectory()) { say('🔴 저장소 본체(.git 이 폴더)다 — 손대지 않는다'); return { ok: false, steps }; } } catch (e) { /* .git 없음 · 파일 — worktree 이거나 남은 폴더 */ }
  // ②
  const links = findLinks(full);
  say(`링크 ${links.length}개${links.length ? ': ' + links.map(l => path.relative(full, l) + ' → ' + (() => { try { return fs.realpathSync.native(l); } catch (e) { return '(끊김)'; } })()).join(' · ') : ''}`);
  const repo = mainRepoOf(full);
  say(repo ? `git worktree — 본체 ${repo}` : 'git 에 묶이지 않은 폴더(남은 것)');
  if (!yes) { say(`(보기만) 할 일: 링크 ${links.length}개 풀기 → ${repo ? 'git worktree remove --force → ' : ''}남으면 ${doneRoot}\\${path.basename(full)}-<시각> 으로 옮김`); return { ok: true, steps }; }
  // ③
  for (const l of links) { if (!unlinkLink(l)) { say(`🔴 링크를 못 풀었다 ${l} — 여기서 멈춘다(옮기면 표적이 지워질 수 있다)`); return { ok: false, steps }; } }
  const left = findLinks(full);
  if (left.length) { say(`🔴 링크가 ${left.length}개 남았다 — 멈춘다: ${left.join(' · ')}`); return { ok: false, steps }; }
  if (links.length) say(`링크 ${links.length}개 풀었다(표적은 그대로)`);
  // ④
  if (repo) {
    const r = spawnSync('git', ['-C', repo, 'worktree', 'remove', '--force', full], { encoding: 'utf8' });
    say(`git worktree remove --force → 종료코드 ${r.status}${r.status ? ' ' + (r.stderr || '').trim().slice(0, 200) : ''}`);
    spawnSync('git', ['-C', repo, 'worktree', 'prune'], { encoding: 'utf8' });
  }
  // ⑤
  if (fs.existsSync(full)) {
    if (findLinks(full).length) { say('🔴 옮기기 직전에 링크가 다시 보인다 — 멈춘다'); return { ok: false, steps }; }
    // 🔴 두 번째 감지 — 위 판정(node)이 junction 을 놓치면 Move-Item 이 표적을 비운다. 다른 도구(cmd dir /AL)로 한 번 더 센다
    const d2 = spawnSync('cmd', ['/d', '/c', 'dir', '/AL', '/S', '/B', full], { encoding: 'utf8' });
    const d2lines = (d2.stdout || '').split(/\r?\n/).filter(Boolean);
    if (d2lines.length) { say(`🔴 cmd dir /AL 이 링크 ${d2lines.length}개를 본다 — 멈춘다: ${d2lines.slice(0, 3).join(' · ')}`); return { ok: false, steps }; }
    // 🔴 남은 것은 거의 비어 있어야 한다 — 파일이 많으면(진짜 node_modules 를 따라 들어간 것일 수 있다) 사람이 본다
    let n = 0; (function count(p) { for (const e of fs.readdirSync(p, { withFileTypes: true })) { if (++n > 500) return; if (e.isDirectory()) count(path.join(p, e.name)); } })(full);
    if (n > 500) { say(`🔴 남은 것이 500개를 넘는다 — 옮기지 않는다(사람이 본다)`); return { ok: false, steps }; }
    fs.mkdirSync(doneRoot, { recursive: true });
    const dest = path.join(doneRoot, `${path.basename(full)}-${stamp()}`);
    try { fs.renameSync(full, dest); } catch (e) {
      if (e.code !== 'EXDEV') { say(`🔴 옮기지 못했다(${e.code}) — 사람이 본다`); return { ok: false, steps }; }
      // 다른 드라이브(C: → E:) — 링크가 0 개인 것을 위에서 확인했으니 Move-Item(복사 + 원본 치움)이 표적에 닿지 않는다
      const r = spawnSync('powershell', ['-NoProfile', '-Command', 'Move-Item -LiteralPath $env:WTC_SRC -Destination $env:WTC_DEST -ErrorAction Stop'],
        { encoding: 'utf8', env: { ...process.env, WTC_SRC: full, WTC_DEST: dest } });
      if (r.status !== 0 || fs.existsSync(full)) { say(`🔴 다른 드라이브로 옮기지 못했다(종료코드 ${r.status}) ${(r.stderr || '').trim().slice(0, 200)} — 사람이 본다`); return { ok: false, steps }; }
    }
    say(`남은 것을 옮겼다 → ${dest}`);
  } else say('폴더가 사라졌다(git 이 지웠다)');
  return { ok: !fs.existsSync(full), steps };
}

function selftest() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'wtclean-'));
  const root = path.join(base, 'worktrees');
  // 옮길 곳 — 실제처럼 다른 드라이브(E:)가 있으면 거기로(Move-Item 갈래를 시험한다). 없으면 같은 드라이브
  const done = fs.existsSync('E:\\backups') ? path.join('E:\\backups\\worktrees-done-selftest', path.basename(base)) : path.join(base, 'done');
  const target = path.join(base, 'target'); fs.mkdirSync(path.join(target, 'pkg'), { recursive: true });
  fs.writeFileSync(path.join(target, 'sentinel.txt'), 'keep'); fs.writeFileSync(path.join(target, 'pkg', 'i.js'), '1');
  const repo = path.join(base, 'repo'); fs.mkdirSync(repo); fs.mkdirSync(root);
  const g = (...a) => spawnSync('git', a, { cwd: repo, encoding: 'utf8' });
  g('init', '-q', '-b', 'main'); fs.writeFileSync(path.join(repo, '.gitignore'), 'node_modules\n'); fs.writeFileSync(path.join(repo, 'a.txt'), 'a');
  g('add', '.'); g('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'i');
  const wt = path.join(root, 'wt-a'); g('worktree', 'add', '-q', '--detach', wt, 'main');
  fs.symlinkSync(target, path.join(wt, 'node_modules'), 'junction');
  const left = path.join(root, 'left-b'); fs.mkdirSync(left); fs.symlinkSync(target, path.join(left, 'node_modules'), 'junction');
  const outside = path.join(base, 'outside'); fs.mkdirSync(outside);
  const cases = [];
  const want = (n, ok) => { cases.push([n, ok]); log(`  ${ok ? '✅' : '🔴'} 자가 시험: ${n}`); };
  want('보기만 — 아무것도 안 바뀐다', cleanOne(wt, { yes: false, root, doneRoot: done }).ok && isLink(path.join(wt, 'node_modules')));
  want('worktree 밖 폴더는 손대지 않는다', !cleanOne(outside, { yes: true, root, doneRoot: done }).ok && fs.existsSync(outside));
  want('본체 저장소는 손대지 않는다', !cleanOne(repo, { yes: true, root: base, doneRoot: done }).ok && fs.existsSync(path.join(repo, 'a.txt')));
  want('worktree — 링크 풀고 git 이 지운다', cleanOne(wt, { yes: true, root, doneRoot: done }).ok && !fs.existsSync(wt));
  want('남은 폴더 — 링크 풀고 옮긴다', cleanOne(left, { yes: true, root, doneRoot: done }).ok && !fs.existsSync(left));
  want('🔴 표적은 그대로', fs.readFileSync(path.join(target, 'sentinel.txt'), 'utf8') === 'keep' && fs.existsSync(path.join(target, 'pkg', 'i.js')));
  want('git 에 worktree 가 안 남았다', !g('worktree', 'list').stdout.includes('wt-a'));
  const bad = cases.filter(c => !c[1]).length;
  log(bad ? `🔴 자가 시험 실패 ${bad}/${cases.length} — 시험 폴더 ${base}` : `✅ 자가 시험 ${cases.length}/${cases.length} (시험 폴더 ${base})`);
  return bad ? 1 : 0;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) process.exit(selftest());
  const yes = args.includes('--yes');
  const dirs = args.filter(a => !a.startsWith('--'));
  if (!dirs.length) { log('쓰는 법: node scripts/worktree-cleanup.cjs <C:\\srmart\\worktrees\\이름> … [--yes]'); process.exit(1); }
  let bad = 0;
  for (const d of dirs) if (!cleanOne(d, { yes }).ok) bad++;
  process.exit(bad ? 1 : 0);
}
module.exports = { cleanOne, findLinks, isLink };
