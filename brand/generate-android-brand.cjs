// ============================================================================
// 브랜드 앱(화이트라벨) 안드로이드 아이콘·스플래시 — app/src/<브랜드>/res 에 만든다 (2026-11-13)
// ----------------------------------------------------------------------------
// 에스알마트(srm)는 main/res 그대로 쓴다(공식 확정 사양 — generate-android-icons.cjs). 이 도구는 **다른 브랜드**용이다.
//
// 🔴 main/res 에 있는 그림을 **같은 이름·같은 크기**로 전부 다시 만든다. 하나라도 빠지면 그 칸(예: drawable-port-hdpi/splash.png)은
//    main 의 에스알마트 그림이 그대로 이긴다 — 안드로이드는 이름·조건이 같은 그림만 브랜드 쪽으로 덮어쓴다.
//
// 원본: C:/srmart/brand/<id>/<id>_01~03 (README 의 쓰는 자리 그대로 · 원본은 고치지 않는다)
//   ic_launcher            ← _01 (정사각 아이콘)        ic_launcher_round ← _01 + 원 모양
//   ic_launcher_background ← _02 (바탕 한 장)           ic_launcher_foreground ← _03 (앞 그림, 투명)
//   splash_icon            ← _03 (안드로이드 12+ 스플래시 가운데 그림 · 바탕은 colors.xml 의 splashBackground)
//   splash                 ← splashBackground 한 색 + _03 을 짧은 변의 95%(여백 포함 · 로고 약 60%) 로 가운데(안드로이드 11 이하 스플래시)
//
// 사용(shop 루트): node brand/generate-android-brand.cjs aram
// ============================================================================
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const id = process.argv[2];
if (!id || id === 'srm') { console.error('브랜드 id 를 주세요(srm 은 main/res 를 쓴다): node brand/generate-android-brand.cjs aram'); process.exit(1); }
const ROOT = path.join(__dirname, '..');
const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'brands', id, 'brand.json'), 'utf8'));
const SRC = brand.assets && brand.assets.dir;
const MAIN = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');
const OUT = path.join(ROOT, 'android', 'app', 'src', id, 'res');
const pick = n => { const f = path.join(SRC, `${id}_${n}`); const hit = fs.readdirSync(SRC).find(x => x.startsWith(`${id}_${n}_`)); if (!hit) throw new Error(`원본 없음: ${f}*`); return path.join(SRC, hit); };
const ICON = pick('01'), BG = pick('02'), FG = pick('03');
const hex = (brand.colors && brand.colors.splashBackground) || '#000000';
const bgColor = { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16), alpha: 1 };

const fit = (src, w, h) => sharp(src).resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const circle = s => Buffer.from(`<svg width="${s}" height="${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="#fff"/></svg>`);

async function make(name, w, h) {
  if (name === 'ic_launcher.png') return fit(ICON, w, h);
  if (name === 'ic_launcher_round.png') return sharp(await fit(ICON, w, h)).composite([{ input: circle(w), blend: 'dest-in' }]).png().toBuffer();
  if (name === 'ic_launcher_background.png') return fit(BG, w, h);
  if (name === 'ic_launcher_foreground.png' || name === 'splash_icon.png') return fit(FG, w, h);
  if (name === 'splash.png') {
    const s = Math.round(Math.min(w, h) * 0.95);   // _03 은 적응형 앞 그림이라 둘레에 여백이 이미 있다 — 0.95 면 로고가 짧은 변의 약 60%(에스알마트 splash 와 비슷)
    return sharp({ create: { width: w, height: h, channels: 4, background: bgColor } })
      .composite([{ input: await fit(FG, s, s), left: Math.round((w - s) / 2), top: Math.round((h - s) / 2) }]).png().toBuffer();
  }
  return null;   // splash_logo_white 등 — 쓰지 않는 그림은 만들지 않는다
}

(async () => {
  let n = 0;
  const skipped = [];
  for (const dir of fs.readdirSync(MAIN).filter(d => /^(drawable|mipmap)/.test(d))) {
    for (const f of fs.readdirSync(path.join(MAIN, dir)).filter(x => x.endsWith('.png'))) {
      const { width, height } = await sharp(path.join(MAIN, dir, f)).metadata();
      const buf = await make(f, width, height);
      if (!buf) { skipped.push(`${dir}/${f}`); continue; }
      fs.mkdirSync(path.join(OUT, dir), { recursive: true });
      fs.writeFileSync(path.join(OUT, dir, f), buf);
      n++;
    }
  }
  console.log(`✅ ${brand.name}(${id}) — 그림 ${n}장을 ${path.relative(ROOT, OUT)} 에 만들었다 · 바탕 ${hex}`);
  if (skipped.length) console.log(`ℹ 만들지 않은 그림(쓰지 않음): ${skipped.join(', ')}`);
})().catch(e => { console.error('🔴', e.message); process.exit(1); });
