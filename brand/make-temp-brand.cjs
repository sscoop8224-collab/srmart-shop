// ============================================================================
// 임시 브랜드 로고·아이콘 — 진짜 로고가 오기 전까지만 (2026-11-13 대표님 지시 7 · 화이트라벨)
// ----------------------------------------------------------------------------
// C:\srmart\brand\<id>\ 에 로고·아이콘이 **없을 때만** 브랜드 이름 글자로 만든다. 그림마다 주황 「임시」 표시를 박는다 —
// 임시본이 모르게 마켓·매장에 나가지 않게(진짜 로고가 오면 이 파일들을 바꾸고 아래 README 의 「임시」 줄을 지운다).
//
//   node brand/make-temp-brand.cjs aram 아람마트 [--force]
//
// 만드는 것(C:\srmart\brand\<id>\):
//   logo_h_ko.png       가로 로고 720×240 — 밝은 바탕용(진한 초록 글자)
//   logo_h_ko_dark.png  가로 로고 720×240 — 어두운 바탕용(밝은 초록 글자)
//   logo_master.png     정사각 1254×1254 투명 — 흰 글자(아이콘·스플래시 파생 원본. srm-logo-master.png 와 같은 자리)
//   icon_1024.png       앱 아이콘 1024 — 브랜드 초록 바탕 + 흰 글자(마켓 등록용 미리보기)
//   README.md           임시라는 것 · 만든 날 · 다시 만드는 명령
// 대표색은 대표님이 정하기 전까지 지금 초록(#00c471 바탕 · #00864a 글자)을 쓴다.
// 글꼴은 윈도 기본 「맑은 고딕」 굵게 — 외부 글꼴을 내려받지 않는다.
// ============================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const [id, name] = process.argv.slice(2);
const FORCE = process.argv.includes('--force');
if (!id || !name || !/^[a-z0-9-]+$/.test(id)) { console.error('사용: node brand/make-temp-brand.cjs <id> <브랜드 이름> [--force]'); process.exit(1); }
const OUT = path.join('C:/srmart/brand', id);
const FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
const esc = s => s.replace(/[<&>]/g, c => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;' }[c]));
const TAG = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect width="92" height="40" rx="20" fill="#ff9500"/><text x="46" y="28" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="22" fill="#fff">임시</text></g>`;

const logo = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="240">
  <text x="20" y="160" font-family="${FONT}" font-weight="800" font-size="128" letter-spacing="-4" fill="${color}">${esc(name)}</text>
  ${TAG(600, 24, 1.1)}</svg>`;
const master = () => `<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254">
  <text x="627" y="600" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="330" letter-spacing="-10" fill="#fff">${esc(name.slice(0, 2))}</text>
  <text x="627" y="930" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="330" letter-spacing="-10" fill="#fff">${esc(name.slice(2) || ' ')}</text>
  ${TAG(535, 990, 2)}</svg>`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const real = ['logo_h_ko.png', 'logo_master.png'].filter(f => fs.existsSync(path.join(OUT, f)));
  const readme = path.join(OUT, 'README.md');
  const isTemp = fs.existsSync(readme) && /임시/.test(fs.readFileSync(readme, 'utf8'));
  if (real.length && !isTemp && !FORCE) { console.log(`✅ ${OUT} 에 로고가 이미 있다(${real.join(', ')}) — 임시본을 만들지 않는다`); return; }
  await sharp(Buffer.from(logo('#00864a'))).png().toFile(path.join(OUT, 'logo_h_ko.png'));
  await sharp(Buffer.from(logo('#30d98b'))).png().toFile(path.join(OUT, 'logo_h_ko_dark.png'));
  await sharp(Buffer.from(master())).png().toFile(path.join(OUT, 'logo_master.png'));
  const m = await sharp(path.join(OUT, 'logo_master.png')).resize(Math.round(1024 * 0.8)).toBuffer();
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 196, b: 113, alpha: 1 } } })
    .composite([{ input: m, gravity: 'center' }]).png().toFile(path.join(OUT, 'icon_1024.png'));
  fs.writeFileSync(readme, `# ${name} (${id}) — 🔸 임시 로고·아이콘\n\n` +
    `만든 날 ${new Date().toISOString().slice(0, 10)} · \`node C:\\srmart\\srmart-shop\\brand\\make-temp-brand.cjs ${id} ${name}\`\n\n` +
    '진짜 로고가 오기 전까지 쓰는 **임시본**이다 — 그림마다 주황 「임시」 표시가 박혀 있다. 마켓 등록 전에 반드시 바꾼다.\n\n' +
    '| 파일 | 무엇 |\n|---|---|\n| logo_h_ko.png | 가로 로고(밝은 바탕) 720×240 |\n| logo_h_ko_dark.png | 가로 로고(어두운 바탕) |\n' +
    '| logo_master.png | 정사각 투명 흰 글자 — 아이콘·스플래시 파생 원본 |\n| icon_1024.png | 앱 아이콘 미리보기(초록 바탕) |\n\n' +
    '진짜 로고로 바꾸려면: 같은 이름으로 덮어쓰고 이 README 의 「임시」 를 지운다 → `node scripts/brand/sync-brand-assets.cjs ' + id + '` 로 앱에 다시 넣는다.\n');
  console.log(`✅ 임시 로고·아이콘 → ${OUT}`);
})().catch(e => { console.error('🔴', e.message); process.exit(1); });
