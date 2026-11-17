#!/usr/bin/env node
// ============================================================================
// 🔴 앱 ID(패키지 이름)는 brands/<id>/brand.json 의 appId **한 곳**에서만 바꾼다 (2026-11-16 밤샘 · 지시 5)
// ----------------------------------------------------------------------------
//   node scripts/brand-ids.cjs            # 대조만(--check) — prebuild 가 부른다. 어긋나면 종료코드 1
//   node scripts/brand-ids.cjs --write    # brand.json 값으로 아래 자리를 고쳐 쓴다(무엇을 바꿨는지 찍는다)
//   node scripts/brand-ids.cjs --selftest # 임시 폴더에 사본을 만들어 어긋남을 심고 잡는지 본다
//
// 왜: 같은 패키지 이름이 **일곱 곳**에 손으로 적혀 있었다 — build.gradle productFlavors · strings.xml(브랜드마다) ·
//     capacitor.config.ts · src/brand.js(브랜드마다) · 백엔드 src/services/brands.js(+ DB brands 표). 맞춰 주는 것이 없어서
//     한 곳만 바꾸면 앱은 빌드되는데 **푸시 등록·브랜드 판정·최소 버전 확인이 조용히 다른 앱으로** 간다.
//     🔴 패키지 이름은 플레이스토어에 한 번 올리면 못 바꾼다 — ID 체계는 대표님 결정 대기(2026-11-16). 바꾸게 되면 여기 한 번.
//
// 무엇을 보나(브랜드마다):
//   ① android/app/build.gradle  productFlavors { <id> { applicationId "…" } }
//   ② strings.xml  package_name · custom_url_scheme  (srm = main/res · 그 밖 = src/<id>/res)
//   ③ src/brand.js  appId (삼항식의 그 브랜드 쪽)
//   ④ capacitor.config.ts  appId — 기본 브랜드(srm)만(아람은 scripts/cap-brand-config.cjs 가 brand.json 에서 만든다)
//   ⑤ Firebase  android/app/src/<id>/google-services.json 이 **있으면** 그 안 package_name 에 appId 가 있어야 한다
//      (없으면 푸시 없이 빌드된다 — build.gradle 끝 · 경고만)
//   ⑥ 백엔드 src/services/brands.js 의 app_id — 옆 백엔드 저장소를 찾으면(REPO_DIR_BACKEND 또는 ../srmart-backend). 못 찾으면 「못 봄」
//      (--write 는 백엔드를 고치지 않는다 — 다른 창 · 재시작 · DB brands 표가 얽힌다. 어긋나면 찍기만)
//   🔴 Java 자리(namespace · MainActivity 의 package com.dongsin.srmart)는 **앱 ID 가 아니다** — 두 브랜드가 같이 쓴다. 보지 않는다.
// ============================================================================
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

function run(ROOT, { write = false, backendDir } = {}) {
  const P = (...a) => path.join(ROOT, ...a);
  const ids = fs.readdirSync(P('brands')).filter(d => fs.existsSync(P('brands', d, 'brand.json')));
  const brands = ids.map(id => ({ id, ...JSON.parse(fs.readFileSync(P('brands', id, 'brand.json'), 'utf8')) }));
  const bad = [], fixed = [], notes = [];
  const edit = (rel, fn) => {
    const f = P(rel);
    if (!fs.existsSync(f)) { bad.push(`${rel} 없음`); return; }
    const s = fs.readFileSync(f, 'utf8');
    const t = fn(s, rel);
    if (t !== s && write) { fs.writeFileSync(f, t); fixed.push(rel); }
  };
  const want = (rel, label, got, exp) => {
    if (got == null) { bad.push(`${rel} — ${label} 자리를 못 찾았다`); return false; }
    if (got !== exp) { bad.push(`${rel} — ${label} 「${got}」 ≠ brand.json 「${exp}」`); return false; }
    return true;
  };
  for (const b of brands) {
    if (!/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(b.appId || '')) { bad.push(`brands/${b.id}/brand.json — appId 모양이 이상하다 「${b.appId}」`); continue; }
    // ① gradle
    edit('android/app/build.gradle', (s, rel) => {
      const re = new RegExp(`(\\n\\s*${b.id}\\s*\\{[^}]*?applicationId\\s+")([^"]+)(")`);
      const m = s.match(re);
      want(rel, `productFlavors ${b.id} applicationId`, m && m[2], b.appId);
      return m ? s.replace(re, `$1${b.appId}$3`) : s;
    });
    // ② strings.xml
    const xml = b.id === 'srm' ? 'android/app/src/main/res/values/strings.xml' : `android/app/src/${b.id}/res/values/strings.xml`;
    edit(xml, (s, rel) => {
      let t = s;
      for (const name of ['package_name', 'custom_url_scheme']) {
        const re = new RegExp(`(<string name="${name}">)([^<]*)(</string>)`);
        const m = t.match(re);
        want(rel, name, m && m[2], b.appId);
        if (m) t = t.replace(re, `$1${b.appId}$3`);
      }
      return t;
    });
    // ③ src/brand.js — 그 브랜드 블록(code: '<id>') 안의 appId
    edit('src/brand.js', (s, rel) => {
      const re = new RegExp(`(code:\\s*'${b.id}',[\\s\\S]*?appId:\\s*')([^']+)(')`);
      const m = s.match(re);
      want(rel, `${b.id} appId`, m && m[2], b.appId);
      return m ? s.replace(re, `$1${b.appId}$3`) : s;
    });
    // ④ capacitor.config.ts — 기본(srm)만
    if (b.id === 'srm') {
      edit('capacitor.config.ts', (s, rel) => {
        const re = /(appId:\s*')([^']+)(')/;
        const m = s.match(re);
        want(rel, 'appId', m && m[2], b.appId);
        return m ? s.replace(re, `$1${b.appId}$3`) : s;
      });
    }
    // ⑤ Firebase
    const gs = P('android', 'app', 'src', b.id, 'google-services.json');
    if (fs.existsSync(gs)) {
      let pk = [];
      try { pk = (JSON.parse(fs.readFileSync(gs, 'utf8')).client || []).map(c => c.client_info && c.client_info.android_client_info && c.client_info.android_client_info.package_name).filter(Boolean); } catch (e) { bad.push(`android/app/src/${b.id}/google-services.json — JSON 을 못 읽었다`); }
      if (pk.length && !pk.includes(b.appId)) bad.push(`android/app/src/${b.id}/google-services.json — 안의 package_name [${pk.join(', ')}] 에 ${b.appId} 가 없다(다른 앱 파일) — 빌드가 「No matching client」 로 멈춘다`);
      else if (pk.length) notes.push(`${b.id} Firebase 파일 있음(${b.appId})`);
    } else notes.push(`${b.id} Firebase 파일 없음 — 푸시 없이 빌드(android/app/src/${b.id}/google-services.json)`);
  }
  // ⑥ 백엔드
  if (backendDir && fs.existsSync(path.join(backendDir, 'src/services/brands.js'))) {
    const s = fs.readFileSync(path.join(backendDir, 'src/services/brands.js'), 'utf8');
    for (const b of brands) {
      const m = s.match(new RegExp(`\\b${b.id}:\\s*Object\\.freeze\\(\\{[^}]*app_id:\\s*'([^']+)'`));
      want(`(백엔드) src/services/brands.js`, `${b.id} app_id`, m && m[1], b.appId);
    }
    notes.push(`백엔드 대조함(${backendDir}) — DB brands 표는 이 도구가 안 본다(migration_brands_v1)`);
  } else notes.push('백엔드 src/services/brands.js 못 봄(옆 저장소 없음) — 서버 쪽 app_id 는 대조 안 함');
  return { brands, bad, fixed, notes };
}

function backendGuess(ROOT) {
  const c = [process.env.REPO_DIR_BACKEND, path.join(ROOT, '..', 'srmart-backend')].filter(Boolean);
  return c.find(d => fs.existsSync(path.join(d, 'src/services/brands.js')));
}

if (require.main === module) {
  const ROOT = path.join(__dirname, '..');
  if (process.argv.includes('--selftest')) {
    // 사본에 어긋남을 하나씩 심어 잡는지 본다 — 저장소는 건드리지 않는다
    const files = ['android/app/build.gradle', 'android/app/src/main/res/values/strings.xml', 'android/app/src/aram/res/values/strings.xml', 'src/brand.js', 'capacitor.config.ts', 'brands/srm/brand.json', 'brands/aram/brand.json'];
    const cases = [
      ['정상 사본은 통과', null, 0],
      ['gradle 의 aram applicationId 를 틀리게', ['android/app/build.gradle', 'applicationId "com.dongsin.arammart"', 'applicationId "com.dongsin.aram"'], 1],
      ['aram strings.xml package_name 을 틀리게', ['android/app/src/aram/res/values/strings.xml', '<string name="package_name">com.dongsin.arammart</string>', '<string name="package_name">com.dongshin.arammart</string>'], 1],
      ['src/brand.js 의 srm appId 를 틀리게', ['src/brand.js', "appId: 'com.dongsin.srmart'", "appId: 'com.dongsin.srm'"], 1],
      ['capacitor.config.ts appId 를 틀리게', ['capacitor.config.ts', "appId: 'com.dongsin.srmart'", "appId: 'com.dongshin.srmart'"], 1],
      ['다른 앱의 Firebase 파일을 넣으면', ['android/app/src/aram/google-services.json', null, JSON.stringify({ client: [{ client_info: { android_client_info: { package_name: 'com.dongsin.srmart' } } }] })], 1],
    ];
    let ok = 0;
    for (const [why, mut, wantBad] of cases) {
      const T = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-ids-st-'));
      for (const f of files) { fs.mkdirSync(path.dirname(path.join(T, f)), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), path.join(T, f)); }
      if (mut) {
        const f = path.join(T, mut[0]);
        if (mut[1] === null) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, mut[2]); } else {
          const s = fs.readFileSync(f, 'utf8');
          if (!s.includes(mut[1])) { console.error(`🔴 자가 시험 「${why}」 — 심을 자리를 못 찾았다(${mut[1]})`); process.exit(1); }
          fs.writeFileSync(f, s.replace(mut[1], mut[2]));
        }
      }
      const r = run(T, {});
      const caught = r.bad.length > 0;
      // --write 로 고친 뒤에는 다시 통과해야 한다(Firebase 파일은 고치지 않으므로 그 사례는 빼고)
      let healed = true;
      if (caught && mut && mut[1] !== null) { run(T, { write: true }); healed = run(T, {}).bad.length === 0; }
      if ((wantBad ? caught : !caught) && healed) ok++; else console.error(`🔴 자가 시험 실패 — ${why} (어긋남 ${r.bad.length} · 고친 뒤 ${healed ? '통과' : '여전히 어긋남'})`);
      fs.rmSync(T, { recursive: true, force: true });
    }
    console.log(`${ok === cases.length ? '✅' : '🔴'} brand-ids 자가 시험 ${ok}/${cases.length}`);
    process.exit(ok === cases.length ? 0 : 1);
  }
  const write = process.argv.includes('--write');
  const r = run(ROOT, { write, backendDir: backendGuess(ROOT) });
  if (write) {
    console.log(r.fixed.length ? `✏ brand.json 값으로 고쳐 썼다: ${r.fixed.join(' · ')}` : '고칠 것 없음');
    const again = run(ROOT, { backendDir: backendGuess(ROOT) });
    for (const x of again.bad) console.log('  🔴 ' + x);
    process.exit(again.bad.length ? 1 : 0);
  }
  for (const n of r.notes) console.log('  · ' + n);
  if (r.bad.length) {
    console.error(`🔴 앱 ID 가 brand.json 과 어긋난다 ${r.bad.length}곳 — brands/<id>/brand.json 이 원본이다. 맞추려면: node scripts/brand-ids.cjs --write`);
    for (const x of r.bad) console.error('  🔴 ' + x);
    process.exit(1);
  }
  console.log(`✅ 앱 ID ${r.brands.map(b => `${b.id}=${b.appId}`).join(' · ')} — brand.json 과 모든 자리가 같다`);
}

module.exports = { run };
