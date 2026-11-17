#!/usr/bin/env node
// 🔴 시험용 본인확인 창(src/identity/MockVendorForm.jsx)이 운영 빌드에 들어가지 않는지 (2026-11-16 대표 지시 7)
//
// 왜: 그 창은 이름·생년월일·번호를 손으로 넣으면 「본인확인됨」이 되는 시험 도구다. 서버도 시험 서버에서만 그 결과를 받지만
//     (IDENTITY_MOCK_LIVE · 신뢰 경계는 서버), 운영 화면에 그런 창이 보이는 것만으로 손님이 「이렇게 하면 되는구나」로 읽는다.
//     빌드 값 REACT_APP_IDENTITY_MOCK=1 일 때만 번들에 들어가게 짰다(IdentitySheet 의 require 줄). 그 장치가 살아 있는지 본다.
//
//   --pre (prebuild)  ① .env 파일들 — REACT_APP_IDENTITY_MOCK 은 0 만 · .env.production 에 =0 이 있어야 한다
//                       (없으면 CRA 가 process.env 를 통째로 넣어 webpack 이 조건을 못 풀고 시험용 창이 번들에 남는다)
//                     ② MockVendorForm 을 바로 import 하는 파일이 없다 · IdentitySheet 의 조건 require 줄이 그대로다
//                     ④ 셸 값이 1 인데 BUILD_PATH 가 없으면(= 저장소 build/ 에 시험 빌드) 멈춘다
//   (기본 · postbuild) 위 ①② + ③ 빌드 결과(BUILD_PATH 또는 build)의 static/js 에 표지 IDENTITY-MOCK-FORM 이 없다
//                       — 셸 값이 1 이고 BUILD_PATH 가 저장소 밖이면 시험 빌드로 보고 ③ 을 건너뛴다(그렇다고 찍는다)
//   --selftest        검사기가 잡아야 할 것을 잡는지
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const NAME = 'REACT_APP_IDENTITY_MOCK';
const MARK = 'IDENTITY-MOCK-FORM';
const ENV_FILES = ['.env', '.env.local', '.env.production', '.env.production.local'];
const GUARD_LINE = "const MockVendorForm = process.env.REACT_APP_IDENTITY_MOCK === '1' ? require('./MockVendorForm').default : null;";

function envProblems(read) {
  const out = [];
  let prodZero = false;
  for (const f of ENV_FILES) {
    const t = read(f);
    if (t == null) continue;
    for (const line of t.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?REACT_APP_IDENTITY_MOCK\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const v = m[1].replace(/^['"]|['"]$/g, '');
      if (v !== '0') out.push(`${f}: ${NAME}=${v} — 0 만 둘 수 있다(시험 빌드는 셸에서 1 을 준다)`);
      else if (f === '.env.production') prodZero = true;
    }
  }
  if (!prodZero) out.push(`.env.production 에 ${NAME}=0 이 없다 — 없으면 시험용 창이 운영 번들에 남는다`);
  return out;
}

function importProblems(files) {
  const out = [];
  let guard = false;
  for (const [rel, t] of files) {
    const norm = rel.replace(/\\/g, '/');
    if (norm.endsWith('identity/MockVendorForm.jsx')) continue;
    const code = t.replace(/\/\*[\s\S]*?\*\//g, '').split(/\r?\n/).map((l) => l.replace(/^\s*\/\/.*$/, '')).join('\n');
    if (norm.endsWith('identity/IdentitySheet.jsx')) {
      if (t.includes(GUARD_LINE)) guard = true;
      const rest = code.split(GUARD_LINE).join('');
      if (/MockVendorForm['"]/.test(rest)) out.push(`${norm}: 조건 require 줄 밖에서 MockVendorForm 을 불러온다`);
      continue;
    }
    if (/(?:from\s+|require\(\s*|import\(\s*)['"][^'"]*MockVendorForm['"]/.test(code)) out.push(`${norm}: MockVendorForm 을 바로 불러온다 — IdentitySheet 의 조건 require 로만`);
  }
  if (!guard) out.push('src/identity/IdentitySheet.jsx: 조건 require 줄이 없거나 바뀌었다 — 빌드 때 조건이 정해지지 않으면 시험용 창이 빠지지 않는다');
  return out;
}

function bundleProblems(jsFiles) {
  return jsFiles.filter(([, t]) => t.includes(MARK)).map(([f]) => `${f}: 시험용 본인확인 창(${MARK})이 번들에 들어 있다`);
}

function walk(dir, ext, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, ext, acc); } else if (ext.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

function selftest() {
  let fail = 0;
  const t = (ok, msg) => { console.log(`  ${ok ? '✅' : '🔴'} ${msg}`); if (!ok) fail++; };
  const envOf = (m) => (f) => (f in m ? m[f] : null);
  t(envProblems(envOf({ '.env.production': 'REACT_APP_BRAND=srm\r\nREACT_APP_IDENTITY_MOCK=0\r\n' })).length === 0, '.env.production =0 → 통과');
  t(envProblems(envOf({ '.env.production': 'REACT_APP_BRAND=srm\n' })).length === 1, '=0 줄이 없으면 잡는다');
  t(envProblems(envOf({ '.env.production': 'REACT_APP_IDENTITY_MOCK=0', '.env.local': 'REACT_APP_IDENTITY_MOCK=1' })).length === 1, '.env.local 의 =1 을 잡는다');
  t(envProblems(envOf({ '.env.production': "REACT_APP_IDENTITY_MOCK='1'" })).length === 2, ".env.production 의 ='1' 을 잡는다");
  const sheet = `// 설명 MockVendorForm\n${GUARD_LINE}\nexport default 1;`;
  t(importProblems([['src/identity/IdentitySheet.jsx', sheet]]).length === 0, '조건 require 줄만 → 통과');
  t(importProblems([['src/identity/IdentitySheet.jsx', sheet], ['src/pages/X.js', "import M from '../identity/MockVendorForm';"]]).length === 1, '다른 파일의 바로 import 를 잡는다');
  t(importProblems([['src/identity/IdentitySheet.jsx', sheet], ['src/pages/Y.js', "const M = React.lazy(() => import('../identity/MockVendorForm'));"]]).length === 1, '동적 import 도 잡는다');
  t(importProblems([['src/identity/IdentitySheet.jsx', "import MockVendorForm from './MockVendorForm';"]]).length === 2, '조건 줄을 바로 import 로 바꾸면 잡는다');
  t(importProblems([['src/pages/Z.js', '// MockVendorForm 은 시험용이다']]).length === 1, '주석 속 이름은 import 로 안 친다(조건 줄 없음 1건만)');
  t(bundleProblems([['main.js', 'a'], ['x.chunk.js', `"data-testid":"${MARK}"`]]).length === 1, '번들 속 표지를 잡는다');
  t(bundleProblems([['main.js', 'a']]).length === 0, '표지 없으면 통과');
  console.log(fail ? `\n🔴 자가 시험 실패 ${fail}건` : '\n✅ 자가 시험 11/11');
  process.exit(fail ? 1 : 0);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) return selftest();
  const pre = args.includes('--pre');
  const problems = [];
  problems.push(...envProblems((f) => { const p = path.join(ROOT, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; }));
  problems.push(...importProblems(walk(path.join(ROOT, 'src'), ['.js', '.jsx', '.ts', '.tsx']).map((p) => [path.relative(ROOT, p), fs.readFileSync(p, 'utf8')])));

  const shellOn = process.env[NAME] === '1';
  const bp = process.env.BUILD_PATH ? path.resolve(ROOT, process.env.BUILD_PATH) : null;
  const inRepo = bp && (bp === ROOT || bp.startsWith(ROOT + path.sep));
  if (shellOn && (!bp || inRepo)) problems.push(`셸에 ${NAME}=1 인데 BUILD_PATH 가 저장소 안(또는 없음)이다 — 시험 빌드는 저장소 밖 BUILD_PATH 로만`);

  let skipped = '';
  if (!pre) {
    if (shellOn && bp && !inRepo) skipped = `시험 빌드(${NAME}=1 · ${bp}) — 번들 표지 검사는 건너뛴다`;
    else {
      const out = bp || path.join(ROOT, 'build');
      const js = walk(path.join(out, 'static', 'js'), ['.js']);
      if (!js.length) problems.push(`${out}/static/js 에 번들이 없다 — 빌드 결과를 못 읽었으면 통과시키지 않는다`);
      problems.push(...bundleProblems(js.map((p) => [path.relative(out, p), fs.readFileSync(p, 'utf8')])));
    }
  }
  if (problems.length) {
    console.error('🔴 시험용 본인확인 창 검사 — 멈춘다');
    for (const p of problems) console.error('   · ' + p);
    process.exit(1);
  }
  console.log(`✅ 시험용 본인확인 창 검사 통과${pre ? '(빌드 전)' : ''}${skipped ? ' · ' + skipped : ''}`);
}

main();
