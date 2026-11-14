#!/usr/bin/env node
'use strict';
// 매장 POP 용 쇼핑앱 QR — 브랜드마다 (2026-11-14 대표님 지시 11)
//
//   담는 주소: https://www.dongsinmarket.com/app?b=<브랜드>  — 🔴 고정. 바꾸면 매장에 붙인 POP 를 전부 다시 찍어야 한다.
//   만드는 것(이 폴더에):
//     qr-<브랜드>.png   1200px QR(검정 · 흰 바탕) — 안내 화면(index.html)의 PC 칸과 인쇄용
//     qr-<브랜드>.svg   같은 QR(벡터 — 크게 뽑을 때)
//     pop-<브랜드>.svg  A5 세로 POP(브랜드 이름 · 「쇼핑앱 받기」 · QR · 주소) — 인쇄소·프린터로
//
//   qrcode 라이브러리는 이 저장소에 없다(앱 번들에 들어갈 이유가 없다). 받은 자리를 넘긴다:
//     node landing/app/make-qr.cjs <qrcode 모듈 폴더>
//   예: npm install qrcode@1.5.4 --prefix <임시 폴더>  →  node landing/app/make-qr.cjs <임시 폴더>/node_modules/qrcode
//
//   🔴 QR 모듈은 검정으로 둔다 — 브랜드 색 모듈은 휴대폰마다 읽히는 정도가 달라 매장에서 「안 찍혀요」가 된다.
//   오류 정정 M · 여백 4칸(규격 최소).

const fs = require('fs');
const path = require('path');

const modPath = process.argv[2];
if (!modPath) { console.error('🔴 qrcode 모듈 폴더를 넘겨 주세요 — 위 주석 참고'); process.exit(1); }
const QR = require(path.resolve(modPath));

const BASE = 'https://www.dongsinmarket.com/app?b=';
const BRANDS = [
  { code: 'srm', name: '에스알마트', color: '#00c471' },
  { code: 'aram', name: '아람마트', color: '#DB102E' },
];
const OUT = __dirname;
const opts = { errorCorrectionLevel: 'M', margin: 4, color: { dark: '#000000', light: '#ffffff' } };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** QR 행렬 → path 하나(칸마다 사각형) */
function qrPath(url) {
  const q = QR.create(url, { errorCorrectionLevel: 'M' });
  const n = q.modules.size;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return { d, n };
}

(async () => {
  for (const b of BRANDS) {
    const url = BASE + b.code;
    await QR.toFile(path.join(OUT, `qr-${b.code}.png`), url, { ...opts, width: 1200, type: 'png' });
    fs.writeFileSync(path.join(OUT, `qr-${b.code}.svg`), await QR.toString(url, { ...opts, type: 'svg' }));

    // A5 세로(148×210mm) POP — 글씨는 시스템 한글 글꼴로 그린다(인쇄 전 화면으로 한 번 본다)
    const { d, n } = qrPath(url);
    const qrSize = 96, qrX = (148 - qrSize) / 2, qrY = 62, m = 4;   // mm · 여백 4칸 포함
    const scale = qrSize / (n + m * 2);
    const pop = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="148mm" height="210mm" viewBox="0 0 148 210">
  <rect width="148" height="210" fill="#ffffff"/>
  <rect width="148" height="10" fill="${b.color}"/>
  <g font-family="'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif" text-anchor="middle">
    <text x="74" y="34" font-size="15" font-weight="800" fill="${b.color}">${esc(b.name)}</text>
    <text x="74" y="50" font-size="10" font-weight="700" fill="#191f28">쇼핑앱 받기</text>
    <text x="74" y="172" font-size="6" fill="#191f28">휴대폰 카메라로 찍어 주세요</text>
    <text x="74" y="180" font-size="4.6" fill="#4e5968">안드로이드는 플레이스토어로,</text>
    <text x="74" y="186" font-size="4.6" fill="#4e5968">아이폰은 홈 화면에 추가하는 안내로 이어져요</text>
    <text x="74" y="196" font-size="4.2" fill="#8b95a1">${esc(url.replace('https://', ''))}</text>
    <text x="74" y="203" font-size="3.6" fill="#8b95a1">동신마켓</text>
  </g>
  <rect x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" fill="#ffffff"/>
  <path transform="translate(${qrX + m * scale} ${qrY + m * scale}) scale(${scale})" d="${d}" fill="#000000" shape-rendering="crispEdges"/>
</svg>
`;
    fs.writeFileSync(path.join(OUT, `pop-${b.code}.svg`), pop);
    console.log(`✅ ${b.name} — ${url} · QR ${n}칸`);
  }
})().catch(e => { console.error('🔴', e); process.exit(1); });
