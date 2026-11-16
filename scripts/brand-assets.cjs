// 브랜드 그림 목록 — 「다른 브랜드의 그림」 바이트(md5)를 모은다 (2026-11-17 밤샘 지시 1·2)
//
//   운영 /aram/ 에 에스알마트 로고·아이콘이 나갔다(2026-11-16 반영분). 글자 검사는 통과했고 그림은 아무도 안 봤다.
//   그림은 이름이 바뀌어 들어간다(CRA 가 static/media/<이름>.<해시>.png 로 옮긴다) — 그래서 **이름이 아니라 바이트**로 본다.
//
//   쓰는 곳: scripts/brand-build.cjs(빌드 폴더 전체 대조) · scripts/shop-shots/check-brand-live.cjs(화면이 실제로 받은 그림 대조)
//
//   다른 브랜드 그림의 자리
//     srm(에스알마트) : public/ 의 그림 전부(아이콘·파비콘·srm-logo*) · src/assets/brand/*.png(최상위) · brand/srm-logo-master.png
//     그 밖(aram 등)  : brands/<id>/public/ 의 그림 전부 · src/assets/brand/<id>/*.png
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const IMG = /\.(png|jpe?g|webp|gif|svg|ico)$/i;
const BRANDS = fs.readdirSync(path.join(ROOT, 'brands')).filter((d) => fs.existsSync(path.join(ROOT, 'brands', d, 'brand.json')));

const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else acc.push(p);
  }
  return acc;
}

/** 그 브랜드의 그림 파일 목록(저장소 기준) */
function brandImageFiles(id) {
  const files = [];
  if (id === 'srm') {
    files.push(...walk(path.join(ROOT, 'public')).filter((f) => IMG.test(f)));
    const top = path.join(ROOT, 'src', 'assets', 'brand');
    if (fs.existsSync(top)) files.push(...fs.readdirSync(top).map((f) => path.join(top, f)).filter((f) => fs.statSync(f).isFile() && IMG.test(f)));
    const master = path.join(ROOT, 'brand', 'srm-logo-master.png');
    if (fs.existsSync(master)) files.push(master);
  } else {
    files.push(...walk(path.join(ROOT, 'brands', id, 'public')).filter((f) => IMG.test(f)));
    files.push(...walk(path.join(ROOT, 'src', 'assets', 'brand', id)).filter((f) => IMG.test(f)));
  }
  return files;
}

/**
 * 이 브랜드(me)에 나오면 안 되는 그림 → Map(md5 → 원본 상대경로)
 *   🔴 두 브랜드가 **같은 바이트**를 쓰는 그림은 빼지 않는다(그건 브랜드 그림이 아니다) — 지금은 없다.
 */
function foreignImages(me) {
  const mine = new Set(brandImageFiles(me).map((f) => md5(fs.readFileSync(f))));
  const out = new Map();
  for (const id of BRANDS) {
    if (id === me) continue;
    for (const f of brandImageFiles(id)) {
      const h = md5(fs.readFileSync(f));
      if (!mine.has(h)) out.set(h, `${id}:${path.relative(ROOT, f).replace(/\\/g, '/')}`);
    }
  }
  return out;
}

module.exports = { BRANDS, IMG, md5, walk, brandImageFiles, foreignImages };

if (require.main === module) {
  const me = process.argv[2] || 'aram';
  const m = foreignImages(me);
  console.log(`${me} 에 나오면 안 되는 그림 ${m.size}장`);
  for (const [h, f] of m) console.log(`  ${h.slice(0, 10)}  ${f}`);
}
