#!/usr/bin/env node
/**
 * 안드로이드 브랜드(flavor)별 「앱이 여는 웹 주소」 — 2026-11-15 대표님 지시(아람 웹 경로 1)
 *
 *   npx cap sync android && node scripts/cap-brand-config.cjs      # 브랜드별 사본을 쓴다
 *   node scripts/cap-brand-config.cjs --check                       # 쓰지 않고 맞는지만 본다(종료코드 1 = 어긋남)
 *
 * 왜: Capacitor 는 앱 안의 assets/capacitor.config.json 하나만 읽는다. `npx cap sync` 는 그 파일을 main 자리
 *     (android/app/src/main/assets/) 에만 쓰므로 **두 브랜드 APK 가 같은 주소를 연다** — 아람 앱이 에스알마트 웹을 연다.
 *     그래서 sync 가 쓴 main 파일을 그대로 두고, server.url 만 바꾼 사본을 flavor 자리
 *     (android/app/src/<srm|aram>/assets/capacitor.config.json) 에 쓴다. 안드로이드 빌드는 같은 이름의 자산이면
 *     **flavor 쪽이 main 을 덮는다** — 그래서 assembleSrm* 는 /srm/ 을, assembleAram* 는 /aram/ 을 연다.
 *
 *   · 주소의 원본은 brands/<id>/brand.json 의 url 하나다(여기에 주소를 적지 않는다).
 *   · 사본은 생성물이라 git 에 넣지 않는다(android/.gitignore). APK 를 찍기 직전에 sync → 이 스크립트 순서로 돈다.
 *   · 🔴 sync 를 다시 하면 main 파일(플러그인 목록 등)이 바뀐다 — 그때마다 이 스크립트를 다시 돌려 사본을 맞춘다.
 *     --check 가 「main 과 url 말고 다른 데가 다르다」도 잡는다(옛 사본이 남아 플러그인 설정이 어긋나는 것).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MAIN = path.join(ROOT, 'android/app/src/main/assets/capacitor.config.json');
const CHECK = process.argv.includes('--check');

function brands() {
  const dir = path.join(ROOT, 'brands');
  return fs.readdirSync(dir).filter(id => fs.existsSync(path.join(dir, id, 'brand.json')))
    .map(id => ({ id, ...JSON.parse(fs.readFileSync(path.join(dir, id, 'brand.json'), 'utf8')) }));
}
const flavorFile = id => path.join(ROOT, `android/app/src/${id}/assets/capacitor.config.json`);

/** main 설정에서 server.url 만 바꾼 것 */
function forBrand(mainCfg, url) {
  const c = JSON.parse(JSON.stringify(mainCfg));
  c.server = { ...(c.server || {}), url };
  return c;
}

/** 브랜드 주소가 규칙에 맞나 — https · www.dongsinmarket.com · /<webPath>/ 로 끝 */
function urlProblem(b) {
  if (!/^https:\/\/www\.dongsinmarket\.com\/[a-z]+\/$/.test(b.url || '')) return `brands/${b.id}/brand.json url 「${b.url}」 이 https://www.dongsinmarket.com/<경로>/ 꼴이 아니다`;
  if (new URL(b.url).pathname !== `${b.webPath}/`) return `brands/${b.id}/brand.json 의 url 경로(${new URL(b.url).pathname})와 webPath(${b.webPath}) 가 다르다`;
  return '';
}

function main() {
  const list = brands();
  const bad = list.map(urlProblem).filter(Boolean);
  if (bad.length) { bad.forEach(x => console.error('🔴 ' + x)); process.exit(1); }
  if (!fs.existsSync(MAIN)) {
    // sync 를 한 번도 안 한 폴더(웹만 고치는 작업 폴더) — 쓸 것도 볼 것도 없다
    console.log(`… ${path.relative(ROOT, MAIN)} 가 없다(npx cap sync android 전) — 브랜드 사본을 볼 것이 없다`);
    process.exit(0);
  }
  const mainCfg = JSON.parse(fs.readFileSync(MAIN, 'utf8'));
  const problems = [];
  for (const b of list) {
    const want = JSON.stringify(forBrand(mainCfg, b.url), null, '\t') + '\n';
    const f = flavorFile(b.id);
    if (CHECK) {
      if (!fs.existsSync(f)) { problems.push(`${b.id}: ${path.relative(ROOT, f)} 가 없다 — 이대로 찍으면 main 주소(${mainCfg.server && mainCfg.server.url})를 연다`); continue; }
      const got = fs.readFileSync(f, 'utf8');
      if (got !== want) problems.push(`${b.id}: ${path.relative(ROOT, f)} 가 main + url(${b.url}) 과 다르다 — sync 뒤 이 스크립트를 다시 돌릴 것`);
      continue;
    }
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, want);
    console.log(`  ${b.id} → ${path.relative(ROOT, f)} (server.url ${b.url})`);
  }
  if (problems.length) { problems.forEach(x => console.error('🔴 ' + x)); process.exit(1); }
  console.log(`✅ 브랜드별 앱 주소 ${CHECK ? '확인' : '씀'} — ${list.map(b => `${b.id} ${b.url}`).join(' · ')}`);
}

module.exports = { brands, forBrand, urlProblem };
if (require.main === module) main();
