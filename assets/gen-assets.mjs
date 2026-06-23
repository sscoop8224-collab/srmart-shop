import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svg = path.join(__dirname, 'srm-logo.svg');

// 1) 원본 SVG → 컬러 PNG (넓게 래스터화)
const colorBuf = await sharp(svg, { density: 300 })
  .resize({ width: 1500, height: 1500, fit: 'inside' })
  .png()
  .toBuffer();

// 2) 흰색 실루엣: 원본 알파채널을 마스크로 써서 흰색으로 채움
const { width: cw, height: ch } = await sharp(colorBuf).metadata();
const whiteSilhouette = await sharp({
  create: { width: cw, height: ch, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
})
  .composite([{ input: colorBuf, blend: 'dest-in' }])
  .png()
  .toBuffer();

// 3) splash.png (2732×2732, 녹색 배경 + 흰 실루엣 가운데)
async function makeSplash(outPath) {
  const bg = await sharp({
    create: { width: 2732, height: 2732, channels: 4, background: { r: 0, g: 196, b: 113, alpha: 1 } }
  })
    .composite([{
      input: whiteSilhouette,
      gravity: 'centre',
    }])
    .png()
    .toFile(outPath);
  console.log('✓', outPath, bg);
}

await makeSplash(path.join(__dirname, 'splash.png'));
await makeSplash(path.join(__dirname, 'splash-dark.png'));

// 4) icon-foreground.png (1024×1024, 투명배경 + 컬러 로고 660px)
const iconFg = await sharp(svg, { density: 300 })
  .resize({ width: 660, height: 660, fit: 'inside' })
  .png()
  .toBuffer();

const fgOut = await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
})
  .composite([{ input: iconFg, gravity: 'centre' }])
  .png()
  .toFile(path.join(__dirname, 'icon-foreground.png'));
console.log('✓ icon-foreground.png', fgOut);

// 5) icon-background.png (1024×1024, 흰색)
const bgOut = await sharp({
  create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
})
  .png()
  .toFile(path.join(__dirname, 'icon-background.png'));
console.log('✓ icon-background.png', bgOut);

console.log('\n모든 소스 이미지 생성 완료.');
