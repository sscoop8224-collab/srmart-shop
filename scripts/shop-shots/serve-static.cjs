#!/usr/bin/env node
/**
 * 정적 미리보기 서버 — 쇼핑앱 build/ 또는 목업 폴더를 **127.0.0.1 에만** 띄운다.
 *
 *   node -r <listen-guard.cjs> scripts/shop-shots/serve-static.cjs <폴더> <포트> [--uploads D:/srmart_uploads]
 *
 * 왜 따로 두나: 운영 pm2(:3000 serve)는 건드리지 않고 사진만 찍으려는 것이다.
 * - /api 는 **응답하지 않는다(404).** 사진 도구가 Playwright 에서 가짜 응답으로 막는다 —
 *   운영 백엔드를 부르면 검색 기록(search_logs)·로그인 기록이 쌓인다(CLAUDE.md 2026-11-04).
 * - /uploads 는 읽기만 한다(GET). 상품 사진을 실제와 같게 보이려는 것.
 * - 🔴 주소는 127.0.0.1 고정. 0.0.0.0 으로 열면 이 PC 는 공인 IP 라 곧 인터넷이다.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3] || 5311);
const upIdx = process.argv.indexOf('--uploads');
const uploads = upIdx > 0 ? path.resolve(process.argv[upIdx + 1]) : null;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.otf': 'font/otf', '.woff2': 'font/woff2',
  '.map': 'application/json', '.txt': 'text/plain; charset=utf-8',
};

function send(res, file) {
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}

// 경로가 기준 폴더 밖으로 나가지 못하게 한다(../ 막기).
function inside(base, rel) {
  const p = path.resolve(base, '.' + rel);
  return p === base || p.startsWith(base + path.sep) ? p : null;
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url.startsWith('/api')) { res.writeHead(404); res.end('api is mocked by the shot tool'); return; }
  if (url.startsWith('/uploads/') && uploads) {
    const f = inside(uploads, url.slice('/uploads'.length));
    return f ? send(res, f) : (res.writeHead(403), res.end());
  }
  const f = inside(root, url);
  if (!f) { res.writeHead(403); res.end(); return; }
  fs.stat(f, (err, st) => {
    if (!err && st.isFile()) return send(res, f);
    if (!err && st.isDirectory() && fs.existsSync(path.join(f, 'index.html'))) return send(res, path.join(f, 'index.html'));
    send(res, path.join(root, 'index.html'));            // SPA 폴백
  });
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} at http://127.0.0.1:${port}`));
