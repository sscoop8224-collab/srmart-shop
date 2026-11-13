// Git Bash(MSYS) 경로 변환 막기 — 검사·배포 스크립트 맨 위에서 require 한다 (2026-11-13 대표님 지시 6)
//
// 왜: Git Bash 는 `/` 로 시작하는 인자를 윈도 경로로 바꿔 넘긴다. `--prefix /shop` 이 node 에는
//     `C:/Program Files/Git/shop` 으로 들어가서, 서비스워커 검사가 엉뚱한 주소를 보고 「검사 못 함」 이 됐다(2026-11-13).
//     /srm · /aram 도 같다. 이 변환은 **node 가 뜨기 전에** 바깥 셸이 하므로 스크립트가 끌 수는 없다 — 대신
//     ⑴ 바뀌어 들어온 주소 인자를 원래대로 되돌리고(urlPathArg) ⑵ 이 스크립트가 띄우는 자식에게는 변환을 끈다(환경 변수).
// 사람이 `MSYS_NO_PATHCONV=1` 을 손으로 붙이지 않아도 된다. cmd·PowerShell 에서는 아무 일도 안 한다.

// ⑵ 자식 프로세스(이 스크립트가 bash 를 거쳐 부르는 것)는 변환하지 않게
process.env.MSYS_NO_PATHCONV = '1';
process.env.MSYS2_ARG_CONV_EXCL = '*';

// Git 설치 폴더 아래로 바뀐 모양: C:/Program Files/Git/shop · C:\Program Files\Git\srm\ · D:/Git/aram
const CONVERTED = /^[A-Za-z]:[\\/](?:[^\\/]+[\\/])*?Git[\\/](.*)$/i;

/**
 * 주소의 경로(/shop · /srm · /aram)를 받는 인자를 되돌린다. 바뀐 게 아니면 그대로 준다.
 * @param {string} v 인자 값
 * @param {string} name 인자 이름(알림에 쓴다)
 */
function urlPathArg(v, name = '') {
  if (typeof v !== 'string') return v;
  const m = CONVERTED.exec(v);
  if (!m) return v;
  const fixed = '/' + m[1].replace(/\\/g, '/');
  console.log(`ℹ Git Bash 가 ${name || '인자'} 「${fixed}」 를 「${v}」 로 바꿔 넘겼다 — 「${fixed}」 로 되돌렸다`);
  return fixed;
}

module.exports = { urlPathArg, CONVERTED };

// 자가 시험: node scripts/lib/msys-path.cjs --self-test
if (require.main === module && process.argv.includes('--self-test')) {
  const cases = [
    ['C:/Program Files/Git/shop', '/shop'], ['C:\\Program Files\\Git\\srm', '/srm'], ['D:/Git/aram', '/aram'],
    ['C:/Program Files/Git/srm/sub', '/srm/sub'], ['/shop', '/shop'], ['http://127.0.0.1:5313/shop', 'http://127.0.0.1:5313/shop'],
    ['C:/srmart/srmart-shop/build', 'C:/srmart/srmart-shop/build'],
  ];
  let bad = 0;
  for (const [i, o] of cases) { const r = urlPathArg(i, 'test'); if (r !== o) { bad++; console.log(`🔴 ${i} → ${r} (기대 ${o})`); } }
  console.log(bad ? `🔴 자가 시험 ${bad}건 실패` : `✅ 자가 시험 ${cases.length}건 통과`);
  process.exit(bad ? 1 : 0);
}
