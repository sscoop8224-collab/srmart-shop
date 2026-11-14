#!/usr/bin/env node
// 🔴 브랜드 이름을 코드에 박지 않는다 (2026-11-14 대표님 지시 10) — prebuild
//
//   화면에 나오는 브랜드 이름(「에스알마트」 · 「SR마트」 · 「SR Mart」 · 「아람마트」)은 src/brand.js 한 곳에서만 읽는다.
//   코드에 직접 적으면 아람마트 앱에 「에스알마트」 가 그대로 나간다 — 오류도 안 나고 화면도 멀쩡해 보인다.
//   주석은 세지 않는다(번들에 안 남는다). 시험 파일(*.test.js)도 세지 않는다.
//   번들까지 실제로 0 인지는 빌드 뒤 scripts/brand-build.cjs 가 다시 센다(이 검사는 싸고 빠른 첫 관문).
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const WORDS = ['에스알마트', 'SR마트', 'SR Mart', '아람마트'];
const ALLOW = new Set(['src/brand.js']);

/** 주석을 뺀 코드 줄에서 브랜드 글자를 찾는다 → [{ line, word, text }] */
function scan(src) {
  const out = [];
  let inBlock = false;
  src.replace(/\r\n/g, '\n').split('\n').forEach((raw, i) => {
    let t = raw;
    if (inBlock) { const e = t.indexOf('*/'); if (e < 0) return; t = t.slice(e + 2); inBlock = false; }
    t = t.replace(/\{\/\*.*?\*\/\}/g, '').replace(/\/\*.*?\*\//g, '');
    const b = t.indexOf('/*'); if (b >= 0) { t = t.slice(0, b); inBlock = true; }
    if (/^\s*\/\//.test(t)) return;
    t = t.replace(/(^|[^:'"`])\/\/.*$/, '$1');   // 줄 끝 주석(주소 https:// 는 남긴다)
    for (const w of WORDS) if (t.includes(w)) out.push({ line: i + 1, word: w, text: raw.trim().slice(0, 90) });
  });
  return out;
}

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(js|jsx|ts|tsx)$/.test(e.name) && !/\.test\./.test(e.name)) acc.push(p);
  }
  return acc;
}

// 자가 시험 — 박힌 글자는 잡고, 주석은 안 잡는다
const st = [
  [scan("const a = '에스알마트';"), 1],
  [scan('<b>SR마트</b>'), 1],
  [scan('// 에스알마트 주석'), 0],
  [scan('/* 아람마트\n 여러 줄 */ const x = 1;'), 0],
  [scan("const u = 'https://x'; // SR Mart"), 0],
  [scan('{/* 에스알마트 */}<div/>'), 0],
];
const stBad = st.filter(([got, want]) => got.length !== want);
if (stBad.length) { console.error('🔴 check-brand-strings 자가 시험 실패 —', JSON.stringify(stBad)); process.exit(1); }

const hits = [];
for (const f of walk(SRC)) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (ALLOW.has(rel)) continue;
  for (const h of scan(fs.readFileSync(f, 'utf8'))) hits.push(`${rel}:${h.line} 「${h.word}」 ${h.text}`);
}
if (hits.length) {
  console.error(`🔴 브랜드 이름이 코드에 박혀 있다 ${hits.length}곳 — src/brand.js 의 BRAND.name 등으로 바꿀 것`);
  for (const h of hits) console.error('   ' + h);
  process.exit(1);
}
console.log(`✅ 브랜드 글자 — src 에 박힌 곳 0 (자가 시험 ${st.length}건)`);
