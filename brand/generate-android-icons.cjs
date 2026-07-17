// ============================================================================
// 안드로이드 네이티브 아이콘/스플래시 생성 — 공식 확정 사양 (변경 금지)
// ----------------------------------------------------------------------------
// 원본: brand/srm-logo-master.png (1254×1254, 유일한 파생 원본, 무변형).
// 모든 리소스는 마스터에서 sharp 다운스케일로만 생성(재창작·색치환·서체변형 금지).
// PWA 스크립트(generate-pwa-icons.cjs)와 동일 원칙.
//
//  1) 런처 아이콘(공식 사양: #00c471 통짜 + 원본 로고):
//     · adaptive foreground = 로고 65%(108dp 세이프존 내), 투명 배경
//     · adaptive background  = 솔리드 #00c471 풀블리드
//     · 레거시(API<26) ic_launcher = 초록 사각 + 로고 65%, ic_launcher_round = 초록 원 + 로고 65%
//  2) 스플래시 아이콘(windowSplashScreenAnimatedIcon):
//     · 투명 배경 + 원본 로고 85%(여백 최소화). 배경 초록은 windowSplashScreenBackground가 전체화면 제공.
//     · 기존 splash_icon.png는 초록 사각이 구워져 슬롯 내 로고가 작아 보였음 → 투명+85%로 확대.
//
// 사용(shop 루트): node brand/generate-android-icons.cjs
// 스플래시 비율 조정(기기에서 원형 클립 시): node brand/generate-android-icons.cjs 0.75
// ============================================================================
const sharp = require('sharp');
const path = require('path');

const MASTER = path.join(__dirname, 'srm-logo-master.png');
const RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const GREEN = { r: 0, g: 196, b: 113, alpha: 1 };            // #00c471 런처 통짜 바탕
const LAUNCHER_LOGOP = 0.65;                                 // 런처 로고 폭 = 아이콘 65%(세이프존)
const SPLASH_LOGOP = Number(process.argv[2]) || 0.85;       // 스플래시 로고 폭 = 캔버스 85%(인자로 조정 가능)

// 밀도 배수
const DENS = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

async function logoBuf(box) {
  return sharp(MASTER).resize(box, box, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
}
async function circleMask(size) {
  const svg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`;
  return Buffer.from(svg);
}

// 로고를 배경 위 중앙에 지정 비율로 합성. round=true면 원형 마스크.
async function iconOnGreen(size, logoP, outPath, round) {
  const L = Math.round(size * logoP), off = Math.round((size - L) / 2);
  const logo = await logoBuf(L);
  let img = sharp({ create: { width: size, height: size, channels: 4, background: GREEN } })
    .composite([{ input: logo, top: off, left: off }]);
  let buf = await img.png().toBuffer();
  if (round) buf = await sharp(buf).composite([{ input: await circleMask(size), blend: 'dest-in' }]).png().toBuffer();
  await sharp(buf).toFile(outPath);
}

// 투명 배경 + 로고 지정 비율(adaptive foreground / splash icon 공용).
async function logoOnTransparent(size, logoP, outPath) {
  const L = Math.round(size * logoP), off = Math.round((size - L) / 2);
  const logo = await logoBuf(L);
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: logo, top: off, left: off }]).png().toFile(outPath);
}

// 솔리드 초록 사각(adaptive background).
async function solidGreen(size, outPath) {
  await sharp({ create: { width: size, height: size, channels: 4, background: GREEN } }).png().toFile(outPath);
}

(async () => {
  const meta = await sharp(MASTER).metadata();
  console.log(`마스터 ${meta.width}x${meta.height} · 런처 로고 ${LAUNCHER_LOGOP * 100}% · 스플래시 로고 ${SPLASH_LOGOP * 100}%`);

  for (const [d, m] of Object.entries(DENS)) {
    const dir = path.join(RES, 'mipmap-' + d);
    const base = Math.round(48 * m);   // 레거시 런처 base 48dp
    const adap = Math.round(108 * m);  // adaptive 레이어 108dp
    // adaptive
    await logoOnTransparent(adap, LAUNCHER_LOGOP, path.join(dir, 'ic_launcher_foreground.png'));
    await solidGreen(adap, path.join(dir, 'ic_launcher_background.png'));
    // legacy square + round
    await iconOnGreen(base, LAUNCHER_LOGOP, path.join(dir, 'ic_launcher.png'), false);
    await iconOnGreen(base, LAUNCHER_LOGOP, path.join(dir, 'ic_launcher_round.png'), true);
    console.log(`  launcher ${d}: fg/bg ${adap}px, base/round ${base}px`);
  }

  // 스플래시 아이콘(288dp) 전 밀도 + drawable 폴백
  const splash = { mdpi: 288, hdpi: 432, xhdpi: 576, xxhdpi: 864, xxxhdpi: 1152 };
  for (const [d, sz] of Object.entries(splash)) {
    await logoOnTransparent(sz, SPLASH_LOGOP, path.join(RES, 'drawable-' + d, 'splash_icon.png'));
    console.log(`  splash ${d}: ${sz}px`);
  }
  await logoOnTransparent(960, SPLASH_LOGOP, path.join(RES, 'drawable', 'splash_icon.png'));

  console.log('네이티브 아이콘/스플래시 생성 완료 (공식 사양: 그린 통짜 런처 + 투명 스플래시).');
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
