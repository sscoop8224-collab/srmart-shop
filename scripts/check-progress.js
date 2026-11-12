#!/usr/bin/env node
/**
 * 쇼핑앱 디자인 재정비 진행표 검사 — `npm run check:progress`
 *
 * docs/SHOP_PROGRESS.md 의 표를 읽어서:
 *   ① SHOP_SCREENS.md 의 화면ID(S01~)가 진행표에 전부 있는가(화면이 사라지지 않게)
 *   ② 「상태」가 완료 인 줄은
 *      - docs/shots/compare/<ID>_light.png · <ID>_dark.png (목업|앱 비교 사진) 이 있는가
 *      - docs/shots/compare/<ID>_tland_light.png · <ID>_tland_dark.png (**태블릿 가로** 비교 사진, 2026-11-12 블록 B)
 *        — 태블릿 가로(1180×820)는 격자 5~6열·상세 좌우 배치·가운데 대화창으로 모양이 가장 많이 바뀌는 크기라
 *        폰 사진만으로 「완료」를 말할 수 없다
 *      - docs/shots/app/<ID>_light.png · <ID>_dark.png (고친 뒤 앱 사진) 이 있는가
 *      - 그 앱 사진이 docs/shots/before/ 의 같은 이름 사진과 sha256 이 **다른가**
 * 하나라도 어기면 종료코드 1 — 로컬 pre-commit 관문(scripts/hooks/pre-commit)이 커밋을 막는다.
 *
 *   node scripts/check-progress.js              검사
 *   node scripts/check-progress.js --self-test  검사기 자신이 잡아야 할 것을 잡는지 시험
 *   node scripts/check-progress.js --root <폴더>  다른 폴더를 검사(자가 시험용)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

function check(root) {
  const problems = [];
  const read = (rel) => { try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch (e) { problems.push(`${rel} 를 읽지 못했다`); return ''; } };
  const screensMd = read('docs/SHOP_SCREENS.md');
  const progressMd = read('docs/SHOP_PROGRESS.md');
  if (problems.length) return { problems, done: 0, rows: 0 };

  const screenIds = [...screensMd.matchAll(/^\|\s*\*\*(S\d{2})\*\*\s*\|/gm)].map(m => m[1]);
  if (!screenIds.length) problems.push('SHOP_SCREENS.md 에서 화면ID(| **S01** |)를 하나도 못 찾았다 — 표 모양이 바뀌었나?');

  // 진행표: 머리줄에서 칸 위치를 찾는다(칸 순서가 바뀌어도 맞게)
  const lines = progressMd.split(/\r?\n/);
  const hi = lines.findIndex(l => /^\|\s*화면ID\s*\|/.test(l) && l.includes('상태'));
  if (hi < 0) { problems.push('SHOP_PROGRESS.md 에 「| 화면ID | … | 상태 |」 머리줄이 없다'); return { problems, done: 0, rows: 0 }; }
  const cells = l => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  const head = cells(lines[hi]);
  const col = { id: head.indexOf('화면ID'), st: head.indexOf('상태') };
  const rows = [];
  for (let i = hi + 2; i < lines.length && lines[i].trim().startsWith('|'); i++) {
    const c = cells(lines[i]);
    rows.push({ id: c[col.id], st: c[col.st] || '', line: i + 1 });
  }
  const seen = new Map();
  for (const r of rows) {
    if (seen.has(r.id)) problems.push(`${r.id} 가 진행표에 두 번 있다(${seen.get(r.id)}줄·${r.line}줄)`);
    seen.set(r.id, r.line);
  }
  for (const id of screenIds) if (!seen.has(id)) problems.push(`${id} 가 진행표에 없다 — 화면이 빠지면 안 된다`);

  const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
  let done = 0;
  for (const r of rows) {
    if (r.st.replace(/[*`]/g, '') !== '완료') continue;
    done++;
    for (const t of ['light', 'dark']) {
      const cmp = path.join(root, 'docs/shots/compare', `${r.id}_${t}.png`);
      const app = path.join(root, 'docs/shots/app', `${r.id}_${t}.png`);
      const before = path.join(root, 'docs/shots/before', `${r.id}_${t}.png`);
      if (!fs.existsSync(cmp)) problems.push(`${r.id} 「완료」인데 비교 사진이 없다: docs/shots/compare/${r.id}_${t}.png`);
      if (!fs.existsSync(path.join(root, 'docs/shots/compare', `${r.id}_tland_${t}.png`))) problems.push(`${r.id} 「완료」인데 태블릿 가로 비교 사진이 없다: docs/shots/compare/${r.id}_tland_${t}.png`);
      if (!fs.existsSync(app)) { problems.push(`${r.id} 「완료」인데 앱 사진이 없다: docs/shots/app/${r.id}_${t}.png`); continue; }
      if (fs.existsSync(before) && sha(app) === sha(before)) problems.push(`${r.id} 앱 사진(${t})이 고치기 전 사진과 똑같다 — 옛 사진이다`);
    }
  }
  return { problems, done, rows: rows.length, screens: screenIds.length };
}

function selfTest() {
  // 일부러 틀린 저장소를 만들어 검사기가 잡는지 본다. 잡아야 할 것을 못 잡으면 검사기가 없는 것과 같다.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-progress-'));
  const w = (rel, data) => { fs.mkdirSync(path.dirname(path.join(tmp, rel)), { recursive: true }); fs.writeFileSync(path.join(tmp, rel), data); };
  w('docs/SHOP_SCREENS.md', '| 화면ID |\n|---|\n| **S01** | 홈 |\n| **S02** | 상세 |\n| **S03** | 찜 |\n');
  const prog = (s1, s2, s3) => `| 화면ID | 이름 | 목업 반영 | 앱 반영 | 비교사진 밝게 | 비교사진 어둡게 | 상태 |\n|---|---|---|---|---|---|---|\n| S01 | 홈 | ✅ | | | | ${s1} |\n| S02 | 상세 | ✅ | | | | ${s2} |\n${s3 === null ? '' : `| S03 | 찜 | ✅ | | | | ${s3} |\n`}`;
  const cases = [];
  const run = (name, expectFail, mustMatch) => { const r = check(tmp); const failed = r.problems.length > 0; const hit = !mustMatch || r.problems.some(p => p.includes(mustMatch)); cases.push({ name, ok: failed === expectFail && hit, got: r.problems }); };

  w('docs/SHOP_PROGRESS.md', prog('목업', '목업', '목업'));
  run('완료 없음 → 통과', false);
  w('docs/SHOP_PROGRESS.md', prog('목업', '목업', null));
  run('화면 하나 빠짐 → 실패', true, 'S03 가 진행표에 없다');
  w('docs/SHOP_PROGRESS.md', prog('완료', '목업', '목업'));
  run('완료인데 사진 없음 → 실패', true, '비교 사진이 없다');
  w('docs/shots/before/S01_light.png', 'OLD-L'); w('docs/shots/before/S01_dark.png', 'OLD-D');
  w('docs/shots/compare/S01_light.png', 'C'); w('docs/shots/compare/S01_dark.png', 'C');
  w('docs/shots/app/S01_light.png', 'OLD-L'); w('docs/shots/app/S01_dark.png', 'NEW-D');
  run('앱 사진이 before 와 같음 → 실패', true, '고치기 전 사진과 똑같다');
  w('docs/shots/app/S01_light.png', 'NEW-L');
  run('태블릿 가로 비교 사진 없음 → 실패', true, '태블릿 가로 비교 사진이 없다');
  w('docs/shots/compare/S01_tland_light.png', 'TL');
  run('태블릿 가로 밝게만 있고 어둡게 없음 → 실패', true, 'S01_tland_dark.png');
  w('docs/shots/compare/S01_tland_dark.png', 'TD');
  run('비교(폰·태블릿 가로)·앱 사진 있고 바뀜 → 통과', false);
  w('docs/SHOP_PROGRESS.md', prog('**완료**', '완료', '목업'));
  run('굵게 쓴 완료도 완료로 본다 / 사진 없는 S02 → 실패', true, 'S02 「완료」인데');

  fs.rmSync(tmp, { recursive: true, force: true });   // 방금 만든 임시 폴더 하나만 지운다
  let bad = 0;
  for (const c of cases) { console.log(`${c.ok ? '✅' : '🔴'} ${c.name}${c.ok ? '' : '  → ' + JSON.stringify(c.got)}`); if (!c.ok) bad++; }
  console.log(bad ? `🔴 자가 시험 ${bad}건 실패` : `✅ 자가 시험 ${cases.length}건 통과`);
  return bad === 0;
}

if (require.main === module) {
  if (process.argv.includes('--self-test')) process.exit(selfTest() ? 0 : 1);
  const ri = process.argv.indexOf('--root');
  const root = ri > 0 ? path.resolve(process.argv[ri + 1]) : path.join(__dirname, '..');
  const r = check(root);
  if (r.problems.length) {
    console.error('🔴 check:progress 실패 — docs/SHOP_PROGRESS.md');
    for (const p of r.problems) console.error('   · ' + p);
    process.exit(1);
  }
  console.log(`✅ check:progress — 화면 ${r.screens}개 전부 진행표에 있음 · 진행표 ${r.rows}줄 · 「완료」 ${r.done}줄 사진 확인`);
}

module.exports = { check };
