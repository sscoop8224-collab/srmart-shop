/**
 * 커밋 관문 설치 — `npm install` 때 package.json 의 "prepare" 가 부른다(손으로: npm run prepare).
 *
 * .git/hooks 에 복사해 두면 저장소를 다시 받을 때 사라진다. 그래서 복사하지 않고
 * git 이 **저장소 안의 scripts/hooks 폴더를 관문 폴더로 쓰게** 한다(core.hooksPath).
 * 관문 스크립트가 커밋되어 있으니 받는 순간 같은 관문이 생기고, 고치면 모두에게 같이 바뀐다.
 *
 * 🔴 이 스크립트는 npm install 을 **절대 실패시키지 않는다** — git 이 없거나 저장소가 아닌 곳
 * (압축본 배포 등)에서는 이유만 찍고 넘어간다. 설치가 막히면 사람이 관문을 통째로 끄게 된다.
 */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '../..');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

try {
  let top;
  try { top = git('rev-parse', '--show-toplevel'); } catch (e) { console.log('ℹ 커밋 관문: git 저장소가 아니라 설치하지 않음'); process.exit(0); }
  if (path.resolve(top) !== path.resolve(ROOT)) { console.log(`ℹ 커밋 관문: 저장소 맨 위(${top})가 이 앱 폴더가 아니라 설치하지 않음`); process.exit(0); }
  const hook = path.join(ROOT, 'scripts/hooks/pre-commit');
  if (!fs.existsSync(hook)) { console.log('🔴 커밋 관문: scripts/hooks/pre-commit 이 없다'); process.exit(0); }
  try { fs.chmodSync(hook, 0o755); } catch (e) { /* 윈도는 실행 비트가 없어도 git 이 sh 로 돈다 */ }
  let cur = ''; try { cur = git('config', '--local', '--get', 'core.hooksPath'); } catch (e) { /* 없음 */ }
  if (cur && cur !== 'scripts/hooks') console.log(`⚠ 커밋 관문: core.hooksPath 가 「${cur}」였는데 scripts/hooks 로 바꾼다`);
  git('config', '--local', 'core.hooksPath', 'scripts/hooks');
  const now = git('config', '--local', '--get', 'core.hooksPath');
  console.log(now === 'scripts/hooks' ? '✅ 커밋 관문 설치됨 — core.hooksPath = scripts/hooks (커밋마다 check:progress)' : `🔴 커밋 관문 설치 실패 — core.hooksPath = 「${now}」`);
} catch (e) {
  console.log('🔴 커밋 관문 설치 중 오류(설치는 계속): ' + e.message.split('\n')[0]);
}
process.exit(0);
