/**
 * 쇼핑앱 화면 규칙 검사 — 묶음 1(2026-11-12 밤 지시 3).
 *
 * ① 브라우저 기본 창 0건 — window.confirm / window.alert / window.prompt 와 맨 alert( · prompt( 호출.
 *    확인·안내는 DialogContext 의 confirm()/notify() 하나(목업 S34). 토큰 문서 4절 2.
 *    (맨 confirm( 은 막지 않는다 — useDialog() 의 confirm 이 그 이름이다.)
 *
 * ② 색 직접 쓰기 — 「늘지 않게」 막는다(톱니바퀴 방식).
 *    - 색 값(#abc · #aabbcc · rgb()/rgba()/hsl() · 따옴표 안 'white'/'black')은 src/styles/tokens.css 에만 둔다.
 *    - 지금 남아 있는 옛 화면의 개수는 scripts/ui-color-baseline.json 에 파일별로 적혀 있다. **그보다 늘면 실패**.
 *      줄면 통과하고 「기준을 낮추라」고 알린다(--update 로 낮춘다 — 🔴 늘리는 데는 쓰지 않는다).
 *    - 기준에 없는 새 파일은 0 이어야 한다. STRICT 목록(묶음에서 목업대로 옮긴 파일)도 0 이어야 한다.
 *
 * 쓰는 법:  node scripts/check-ui-rules.cjs            (빌드 전 · 커밋 전에 돈다)
 *           node scripts/check-ui-rules.cjs --update   (색을 줄인 뒤 기준을 낮출 때만)
 *           node scripts/check-ui-rules.cjs --selftest (검사기 자신이 잡아야 할 것을 잡는지)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const BASELINE = path.join(__dirname, 'ui-color-baseline.json');
const TOKENS = 'src/styles/tokens.css';   // 색 값이 있어도 되는 유일한 곳

// 목업대로 옮긴 파일 — 색 직접 쓰기 0 이어야 한다(묶음이 끝날 때마다 여기에 더한다)
const STRICT = [
  'src/styles/ui.css',
  'src/components/ui/Icon.jsx',
  'src/components/ui/TabBar.jsx',
  'src/components/ui/AppHeader.jsx',
  'src/components/ConfirmModal.jsx',
  'src/DialogContext.jsx',
  'src/ThemeContext.jsx',
  'src/pages/Offline.js',
  // 묶음 2 — 홈·검색
  'src/styles/shop.css',
  'src/pages/Home.jsx',
  'src/pages/Search.js',
  'src/components/StoreSelectionModal.jsx',
  'src/pages/ProductDetail.js',
  'src/pages/Cart.js',
  'src/pages/QuickOrder.js',
  'src/components/checkout/CheckoutParts.jsx',
  'src/pages/Receipt.js',
  'src/pages/OrderHistory.jsx',   // 묶음 4
  'src/pages/MyPage.js',         // 묶음 5
  'src/pages/Wishlist.js',       // 묶음 5
  'src/pages/About.jsx',         // 묶음 5
  'src/pages/Login.js',          // 묶음 5 — 로그인·가입 3단계
  'src/pages/FindAccount.js',    // 묶음 5
  'src/components/ForcePasswordChangeModal.jsx', // 묶음 5 — S31
  'src/components/ThirdPartyConsentModal.jsx',   // 묶음 5 — S32
];

// 주석을 지운다 — 설명 글에 쓴 「window.alert 금지」·「#00c471」 같은 글자를 세지 않게(줄 수는 지킨다)
function stripComments(s, css) {
  s = s.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (!css) s = s.replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  return s;
}

const NATIVE = [
  { re: /\bwindow\s*\.\s*(confirm|alert|prompt)\s*\(/g, what: (m) => m[0].replace(/\s+/g, '') },
  { re: /(^|[^\w.$])(alert|prompt)\s*\(/g, what: (m) => m[2] + '(' },
];
function findNative(src) {
  const s = stripComments(src, false);
  const out = [];
  for (const { re, what } of NATIVE) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s))) out.push({ line: s.slice(0, m.index).split('\n').length, what: what(m) });
  }
  return out;
}

const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(|(['"`])(?:white|black)\1/g;
function countColors(src, css) {
  const s = stripComments(src, css)
    // CSS 의 #id 선택자·JS 의 '#root' 같은 것은 색이 아니다 — 16진 글자만으로 된 3·4·6·8자리만 센다(위 정규식)
    .replace(/url\([^)]*\)/g, '');
  const m = s.match(COLOR);
  return m ? m.length : 0;
}

function listFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else if (/\.(js|jsx|css)$/.test(e.name) && !/\.test\.js$|setupTests\.js$/.test(e.name)) out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function scan() {
  const native = [];
  const colors = {};
  for (const f of listFiles(SRC)) {
    const r = rel(f);
    const src = fs.readFileSync(f, 'utf8');
    const css = f.endsWith('.css');
    if (!css) for (const n of findNative(src)) native.push({ file: r, ...n });
    if (r === TOKENS) continue;
    const c = countColors(src, css);
    if (c) colors[r] = c;
  }
  return { native, colors };
}

function judge({ native, colors }, baseline) {
  const bad = [];
  const lower = [];
  for (const n of native) bad.push(`① ${n.file}:${n.line} — ${n.what} (브라우저 기본 창 금지 → useDialog() 의 confirm/notify)`);
  for (const f of STRICT) if (colors[f]) bad.push(`② ${f} — 색 직접 쓰기 ${colors[f]}곳 (목업대로 옮긴 파일은 0 — tokens.css 이름을 쓴다)`);
  for (const [f, c] of Object.entries(colors)) {
    if (STRICT.includes(f)) continue;
    const b = baseline[f];
    if (b === undefined) bad.push(`② ${f} — 새 파일인데 색 직접 쓰기 ${c}곳 (새 파일은 0 — tokens.css 이름을 쓴다)`);
    else if (c > b) bad.push(`② ${f} — 색 직접 쓰기 ${b} → ${c} 로 늘었다`);
    else if (c < b) lower.push(`${f} ${b} → ${c}`);
  }
  for (const f of Object.keys(baseline)) if (!colors[f] && baseline[f] > 0) lower.push(`${f} ${baseline[f]} → 0`);
  return { bad, lower };
}

function selftest(quiet = false) {
  const cases = [
    ['window.confirm 를 잡는다', () => findNative("if (window.confirm('지울까요?')) go();").length === 1],
    ['맨 alert( 를 잡는다', () => findNative("  alert('저장됐어요');").length === 1],
    ['useDialog 의 confirm( 은 막지 않는다', () => findNative("const ok = await confirm({ message: 'x' });").length === 0],
    ['주석 속 window.alert 는 세지 않는다', () => findNative("// window.alert 금지\n/* alert( */").length === 0],
    ['notify(·obj.alert( 는 막지 않는다', () => findNative("notify('x'); api.alert(1);").length === 0],
    ['#색·rgba·white 를 센다', () => countColors("a{color:#00c471;background:rgba(0,0,0,.5)} x = 'white';", false) === 3],
    ['주석 속 #색은 세지 않는다', () => countColors('/* #00c471 */ .a{color:var(--brand)}', true) === 0],
    ['기준보다 늘면 실패', () => judge({ native: [], colors: { 'src/a.js': 3 } }, { 'src/a.js': 2 }).bad.length === 1],
    ['기준에 없는 새 파일이 색을 쓰면 실패', () => judge({ native: [], colors: { 'src/new.js': 1 } }, {}).bad.length === 1],
    ['STRICT 파일은 1곳도 실패', () => judge({ native: [], colors: { [STRICT[0]]: 1 } }, { [STRICT[0]]: 5 }).bad.length === 1],
    ['줄면 통과 + 낮추라고 알린다', () => { const r = judge({ native: [], colors: { 'src/a.js': 1 } }, { 'src/a.js': 2 }); return r.bad.length === 0 && r.lower.length === 1; }],
  ];
  let fail = 0;
  for (const [name, fn] of cases) {
    let ok = false;
    try { ok = fn(); } catch (e) { ok = false; }
    if (!quiet || !ok) console.log(`${ok ? '✅' : '🔴'} 자가 시험: ${name}`);
    if (!ok) fail++;
  }
  return fail;
}

const args = process.argv.slice(2);
if (args.includes('--selftest')) process.exit(selftest() ? 1 : 0);

const st = selftest(true);   // 평소엔 실패만 찍는다
if (st) { console.log(`🔴 검사기 자가 시험 ${st}건 실패 — 검사 결과를 믿을 수 없어 멈춘다`); process.exit(1); }

const res = scan();
let baseline = {};
try { baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).files || {}; } catch (e) { /* 없음 — 아래에서 알린다 */ }

if (args.includes('--update')) {
  const raised = Object.entries(res.colors).filter(([f, c]) => baseline[f] !== undefined && c > baseline[f]);
  if (raised.length && !args.includes('--first')) {
    console.log('🔴 --update 는 기준을 낮출 때만 쓴다. 늘어난 파일:');
    for (const [f, c] of raised) console.log(`   ${f} ${baseline[f]} → ${c}`);
    process.exit(1);
  }
  const files = {};
  for (const [f, c] of Object.entries(res.colors).sort()) if (!STRICT.includes(f)) files[f] = c;
  const total = Object.values(files).reduce((a, b) => a + b, 0);
  fs.writeFileSync(BASELINE, JSON.stringify({ note: '색 직접 쓰기 남은 개수(파일별) — 늘면 scripts/check-ui-rules.cjs 가 막는다. 줄였을 때만 --update 로 낮춘다.', updated: new Date().toISOString().slice(0, 10), total, files }, null, 2) + '\n');
  console.log(`✅ 기준을 적었다 — 파일 ${Object.keys(files).length}개 · 합계 ${total}곳`);
  process.exit(0);
}

const { bad, lower } = judge(res, baseline);
const total = Object.entries(res.colors).reduce((a, [, c]) => a + c, 0);
console.log(`ℹ 브라우저 기본 창 ${res.native.length}건 · 색 직접 쓰기 합계 ${total}곳(tokens.css 제외)`);
if (lower.length) {
  console.log(`ℹ 줄어든 파일 ${lower.length}개 — 기준을 낮추세요(node scripts/check-ui-rules.cjs --update):`);
  for (const l of lower.slice(0, 20)) console.log(`   ${l}`);
}
if (bad.length) {
  for (const b of bad) console.log(`🔴 ${b}`);
  console.log(`🔴 화면 규칙 위반 ${bad.length}건 — 고친 뒤 다시`);
  process.exit(1);
}
console.log('✅ 화면 규칙 통과');
