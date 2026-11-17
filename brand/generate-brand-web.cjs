// ============================================================================
// 브랜드 앱(화이트라벨) 웹 그림 — 홈 화면 아이콘(PWA) · 파비콘 · 헤더 로고 (2026-11-16 밤샘 · 아람 점검 항목 6)
// ----------------------------------------------------------------------------
// 왜: 아람마트 빌드(REACT_APP_BRAND=aram)가 **글자**는 아람으로 바뀌는데(src/brand.js · scripts/brand-build.cjs)
//     **그림**은 에스알마트 것이 그대로 나갔다 — public/icons·logo192/512·favicon 은 빌드가 그대로 복사하고,
//     헤더·로그인 로고는 src/assets/brand/logo_h_ko.png(SRM) 하나를 import 했다. 글자 검사(brand-build)는 그림을 못 본다.
//
// 에스알마트(srm)는 public/ · src/assets/brand/logo_h_ko.png 그대로 쓴다(공식 확정 사양 — generate-pwa-icons.cjs). 이 도구는 **다른 브랜드**용이다.
//
// 원본: C:/srmart/brand/<id>/ (README 의 쓰는 자리 그대로 · 원본은 고치지 않는다)
//   _01 정사각 아이콘 → brands/<id>/public/icons/icon-<크기>.png · logo192.png · logo512.png · favicon.ico(16·32·48 PNG 묶음)
//   _06 가로 한글 컬러 → src/assets/brand/<id>/logo_h_ko.png (720×240 — 에스알마트 헤더 로고와 같은 크기 · 밝게·어둡게 같이 씀)
// 빌드 뒤(postbuild) scripts/brand-build.cjs 가 brands/<id>/public/ 을 빌드 폴더 위에 덮어쓴다.
//
// 사용(shop 루트): node brand/generate-brand-web.cjs aram
// ============================================================================
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const id = process.argv[2];
if (!id || id === 'srm') { console.error('브랜드 id 를 주세요(srm 은 public/ 을 쓴다): node brand/generate-brand-web.cjs aram'); process.exit(1); }
const ROOT = path.join(__dirname, '..');
const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'brands', id, 'brand.json'), 'utf8'));
const SRC = brand.assets && brand.assets.dir;
if (!SRC || !fs.existsSync(SRC)) { console.error(`원본 폴더가 없다: ${SRC}`); process.exit(1); }
const pick = (n) => { const hit = fs.readdirSync(SRC).find(x => x.startsWith(`${id}_${n}_`)); if (!hit) throw new Error(`원본 없음: ${SRC}/${id}_${n}_*`); return path.join(SRC, hit); };
const ICON = pick('01');
const HEADER = path.join(SRC, (brand.assets && brand.assets.header) || path.basename(pick('06')));

const PUB = path.join(ROOT, 'brands', id, 'public');
const ICON_SIZES = fs.readdirSync(path.join(ROOT, 'public', 'icons')).map(f => (f.match(/^icon-(\d+)\.png$/) || [])[1]).filter(Boolean).map(Number).sort((a, b) => a - b);

/** PNG 여러 장을 ICO 하나로(비스타 이후 ICO 는 PNG 를 그대로 담는다) */
function icoFromPngs(list) {
  const head = Buffer.alloc(6); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(list.length, 4);
  const dir = Buffer.alloc(16 * list.length);
  let off = 6 + dir.length;
  list.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o); dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3); dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8); dir.writeUInt32LE(off, o + 12);
    off += buf.length;
  });
  return Buffer.concat([head, dir, ...list.map(x => x.buf)]);
}

(async () => {
  fs.mkdirSync(path.join(PUB, 'icons'), { recursive: true });
  const out = [];
  const png = (size) => sharp(ICON).resize(size, size, { fit: 'cover' }).png({ compressionLevel: 9 }).toBuffer();
  for (const s of ICON_SIZES) { const f = path.join(PUB, 'icons', `icon-${s}.png`); fs.writeFileSync(f, await png(s)); out.push(f); }
  for (const s of [192, 512]) { const f = path.join(PUB, `logo${s}.png`); fs.writeFileSync(f, await png(s)); out.push(f); }
  const ico = icoFromPngs(await Promise.all([16, 32, 48].map(async size => ({ size, buf: await png(size) }))));
  fs.writeFileSync(path.join(PUB, 'favicon.ico'), ico); out.push(path.join(PUB, 'favicon.ico'));

  const logoDir = path.join(ROOT, 'src', 'assets', 'brand', id);
  fs.mkdirSync(logoDir, { recursive: true });
  const ref = await sharp(path.join(ROOT, 'src', 'assets', 'brand', 'logo_h_ko.png')).metadata();
  const lf = path.join(logoDir, 'logo_h_ko.png');
  fs.writeFileSync(lf, await sharp(HEADER).resize(ref.width, ref.height, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toBuffer());
  out.push(lf);
  for (const f of out) console.log(`  ${path.relative(ROOT, f).split(path.sep).join('/')} ${fs.statSync(f).size}B`);
  console.log(`✅ ${id} 웹 그림 ${out.length}개 — 아이콘 ${ICON_SIZES.join('·')} · logo192/512 · favicon(16·32·48) · 헤더 로고 ${ref.width}×${ref.height}`);
})().catch(e => { console.error('🔴', e.message); process.exit(1); });
