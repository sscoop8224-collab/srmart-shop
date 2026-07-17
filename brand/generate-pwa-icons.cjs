// ============================================================================
// PWA/앱 아이콘 생성 — 공식 확정 사양 (변경 금지)
// ----------------------------------------------------------------------------
// 사양: #00c471 그린 통짜 바탕 + 원본 srm-logo(무변형) 직접 배치, 중간층(흰 판) 없음.
//   · 배경: 솔리드 #00c471
//   · 로고: brand/srm-logo-master.png 를 무변형으로 폭 65% 중앙 배치(재창작·색치환·서체변형 금지)
//   · maskable: 로고 65%가 안전영역 내
// 기준 커밋: 8c8ba30e (srmart-shop). 이 스크립트는 그 아이콘을 원본에서 그대로 재현한다.
//
// 사용(shop 루트에서): node brand/generate-pwa-icons.cjs
//   → public/icons/icon-<size>.png (72~512) + public/logo192.png + public/logo512.png 생성.
// 사이즈 추가가 필요하면 아래 SIZES 에만 추가(로고 재창작 금지, 이 스크립트로만 파생).
// ============================================================================
const sharp = require('sharp');
const path = require('path');

const MASTER = path.join(__dirname, 'srm-logo-master.png');   // 마스터 로고(원본, 무변형)
const OUT = path.join(__dirname, '..', 'public');
const GREEN = { r: 0, g: 196, b: 113, alpha: 1 };             // #00c471 통짜 바탕
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const LOGOP = 0.65;                                           // 로고 폭 = 아이콘의 65%

async function makeIcon(size, outPath) {
  const L = Math.round(size * LOGOP), off = Math.round((size - L) / 2);
  const logo = await sharp(MASTER).resize(L, L, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: GREEN } })
    .composite([{ input: logo, top: off, left: off }]).png().toFile(outPath);
}

(async () => {
  for (const s of SIZES) await makeIcon(s, path.join(OUT, 'icons', `icon-${s}.png`));
  await makeIcon(192, path.join(OUT, 'logo192.png'));
  await makeIcon(512, path.join(OUT, 'logo512.png'));
  console.log('PWA 아이콘 생성 완료 (공식 사양: 그린 통짜 + 원본 로고 65%).');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
