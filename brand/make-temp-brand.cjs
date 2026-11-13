// ============================================================================
// 임시 브랜드 로고·아이콘 — 정식 로고가 오기 전까지만 (2026-11-13 화이트라벨 · 샵체인 새 브랜드용)
// ----------------------------------------------------------------------------
// C:\srmart\brand\<id>\ 에 정식 로고가 **없을 때만** 브랜드 이름 글자로 만든다. 파일 이름은 정식 로고와
// **같은 9종 규격**(<id>_01 … <id>_09)이라, 정식 파일이 오면 같은 이름으로 덮어쓰기만 하면 된다
// (아람마트가 그 예 — 2026-11-13 정식 aram_01~09 로 바뀌었다). 그림마다 주황 「임시」 표시를 박는다 —
// 임시본이 모르게 마켓·매장에 나가지 않게. 정식 파일이 오면 README 의 「임시」 줄도 지운다.
//
//   node brand/make-temp-brand.cjs <id> <브랜드 이름> [--bg #00c471] [--force] [--out <폴더>]
//
// 만드는 것(C:\srmart\brand\<id>\) — 정식 9종과 같은 이름·같은 크기:
//   <id>_01_icon_square_1024.png       앱 아이콘(바탕색 + 흰 글자)
//   <id>_02_icon_background_1024.png   안드로이드 적응형 아이콘 바탕(바탕색 한 장)
//   <id>_03_icon_foreground_1024.png   적응형 아이콘 앞 그림(투명 + 흰 글자, 가운데 66% 안전 영역)
//   <id>_04_mono_black_1024.png        단색 검정(알림·테마 아이콘)
//   <id>_05_mono_white_1024.png        단색 흰색
//   <id>_06_horizontal_ko_color.png    가로 한글 컬러 2172×724 — 헤더
//   <id>_07_horizontal_en_color.png    가로 영문 컬러 — 영문 이름 없으면 한글을 그대로 쓴다
//   <id>_08_horizontal_ko_mono.png     가로 한글 단색(검정)
//   <id>_09_horizontal_en_mono.png     가로 영문 단색(검정)
//   README.md                          임시라는 것 · 만든 날 · 다시 만드는 명령
// 글꼴은 윈도 기본 「맑은 고딕」 굵게 — 외부 글꼴을 내려받지 않는다.
// ============================================================================
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const [id, name] = process.argv.slice(2);
const FORCE = process.argv.includes('--force');
const BG = arg('--bg', '#00c471');
if (!id || !name || !/^[a-z0-9-]+$/.test(id) || !/^#[0-9a-fA-F]{6}$/.test(BG)) { console.error('사용: node brand/make-temp-brand.cjs <id> <브랜드 이름> [--bg #RRGGBB] [--force]'); process.exit(1); }
const OUT = arg('--out', path.join('C:/srmart/brand', id));   // --out 은 시험용(스크래치 폴더)
const FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
const esc = s => s.replace(/[<&>]/g, c => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;' }[c]));
const TAG = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect width="92" height="40" rx="20" fill="#ff9500"/><text x="46" y="28" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="22" fill="#fff">임시</text></g>`;
const F = n => path.join(OUT, `${id}_${n}.png`);

const horiz = (color) => `<svg xmlns="http://www.w3.org/2000/svg" width="2172" height="724">
  <text x="60" y="480" font-family="${FONT}" font-weight="800" font-size="380" letter-spacing="-12" fill="${color}">${esc(name)}</text>
  ${TAG(1800, 70, 3.3)}</svg>`;
// 정사각 — 글자 두 줄을 가운데 66% 안에(적응형 아이콘이 원·둥근 네모로 잘려도 남게)
const square = (color, bg) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
  ${bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''}
  <text x="512" y="490" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="230" letter-spacing="-8" fill="${color}">${esc(name.slice(0, 2))}</text>
  <text x="512" y="720" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="230" letter-spacing="-8" fill="${color}">${esc(name.slice(2) || ' ')}</text>
  ${TAG(420, 770, 2)}</svg>`;
const png = (svg, n) => sharp(Buffer.from(svg)).png().toFile(F(n));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const readme = path.join(OUT, 'README.md');
  // 🔴 로고 파일이 하나라도 있으면 --force 없이는 손대지 않는다. README 의 「임시」 글자로 판단하지 않는다 —
  //    2026-11-13 정식 aram_01~09 를 받은 뒤 README 만 옛 임시 설명으로 남아 있어서 이 도구가 정식 파일을 덮어썼다
  //    (목업에 복사해 둔 같은 바이트로 되살렸다). 파일이 있으면 정식인지 임시인지는 사람이 판단한다.
  const have = fs.readdirSync(OUT).filter(f => f.startsWith(`${id}_0`) && f.endsWith('.png'));
  if (have.length && !FORCE) { console.log(`✅ ${OUT} 에 로고 파일이 이미 있다(${have.length}개) — 손대지 않는다. 임시본으로 다시 만들려면 --force`); return; }
  await png(square('#fff', BG), '01_icon_square_1024');
  await sharp({ create: { width: 1024, height: 1024, channels: 3, background: BG } }).png().toFile(F('02_icon_background_1024'));
  await png(square('#fff'), '03_icon_foreground_1024');
  await png(square('#000'), '04_mono_black_1024');
  await png(square('#fff'), '05_mono_white_1024');
  await png(horiz(BG), '06_horizontal_ko_color');
  await png(horiz(BG), '07_horizontal_en_color');
  await png(horiz('#000'), '08_horizontal_ko_mono');
  await png(horiz('#000'), '09_horizontal_en_mono');
  fs.writeFileSync(readme, `# ${name} (${id}) — 🔸 임시 로고·아이콘\n\n` +
    `만든 날 ${new Date().toISOString().slice(0, 10)} · \`node C:\\srmart\\srmart-shop\\brand\\make-temp-brand.cjs ${id} ${name} --bg ${BG}\`\n\n` +
    '정식 로고가 오기 전까지 쓰는 **임시본**이다 — 그림마다 주황 「임시」 표시가 박혀 있다. 마켓 등록 전에 반드시 바꾼다.\n\n' +
    `파일 이름은 정식 9종 규격(${id}_01 … ${id}_09)과 같다. 정식 파일을 같은 이름으로 덮어쓰고 이 README 를 정식 설명으로 바꾼다.\n`);
  console.log(`✅ 임시 로고·아이콘 9종 → ${OUT}`);
})().catch(e => { console.error('🔴', e.message); process.exit(1); });
