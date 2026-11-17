# 작업 가지(worktree) 정리 — 삭제 훅과 junction (2026-11-15 대표님 지시 4)

## 한 줄

**`node C:\srmart\tools\worktree-cleanup.cjs <C:\srmart\worktrees\이름> --yes`** 로만 치운다 — 세 창 공용 도구(루트 저장소, 2026-11-16 지시 2 로 옮김).
이 저장소의 `scripts/worktree-cleanup.cjs` 는 그 도구로 인자만 넘기는 전달 파일이다.
링크(node_modules junction)를 **먼저** 풀고 → `git worktree remove` → 남은 것은 `E:\backups\worktrees-done\` 로 옮긴다.

🔴 **링크가 남은 폴더를 `Move-Item` 으로 E: 에 옮기지 마라 — 진짜 `node_modules` 가 비워진다**(아래 실측 D1).

## 왜 — 실측 (시험 폴더 `C:\srmart\_hooktest-1115`, 표적은 스크래치의 `sentinel.txt`)

작업 가지마다 `node_modules` 를 원본(`C:\srmart\srmart-*\node_modules`)에 거는 **junction** 을 둔다(설치 없이 빌드·검사하려고).
그 링크가 정리 때 어떻게 다뤄지는지 하나씩 돌려 봤다.

| | 한 일 | 전역 삭제 훅 | 결과 | 표적(원본 자리) |
|---|---|---|---|---|
| A | `git worktree remove <폴더>` (링크는 `.gitignore`) | 통과 | 종료코드 **0** · 추적 파일·`.work-lock` 은 지움 · **링크와 폴더가 남음** | 그대로 |
| B | `git worktree remove --force <폴더>` | 통과 | A 와 같음 | 그대로 |
| C | `fsutil reparsepoint delete <폴더>\node_modules` → `git worktree remove` | 통과 | 링크가 빈 폴더가 되고 · **폴더까지 깨끗이 사라짐** | 그대로 |
| D1 | 🔴 링크가 남은 채 PowerShell `Move-Item <폴더> E:\backups\…` | 통과 | 링크 안의 **내용을 E: 로 복사**한 뒤 원본을 치우면서 **링크를 따라 들어가 지움** | 🔴 **비워짐** |
| D2 | 링크가 남은 채 Git Bash `mv <폴더> E:/backups/…` | 통과 | 링크 안의 내용을 **통째로 복사**(node_modules 면 수백 MB) · 원본 링크만 풂 | 그대로 |
| E | `fsutil` 로 링크를 푼 뒤 `Move-Item` → E: | 통과 | 빈 폴더만 옮겨짐 | 그대로 |
| F | `node scripts/deploy-shop.cjs --prune --yes` (지울 보관 폴더 안에 링크를 일부러 넣음) | 통과 | 오래된 `build_prev_*` 하나만 지움 · `build`·`build_failed_*` 는 그대로 · 링크는 따라가지 않음 | 그대로 |
| G | `node scripts/deploy-admin.cjs --prune --yes` (같은 시험) | 통과 | F 와 같음 | 그대로 |

- **2026-11-14 에 `admin-brand`·`backend-brand`·`shop-brand` 가 남은 까닭이 A 다** — 지운 줄 알았는데 링크와 폴더가 남았다(종료코드 0).
- 🔴 **D1 이 가장 위험하다.** 남은 폴더를 「지우지 말고 E:\backups 로 옮긴다」 규칙대로 `Move-Item` 하면, 드라이브가 달라 복사+원본 치우기가 되고
  그 치우기가 junction 을 따라 들어간다. 진짜 가지였다면 `C:\srmart\srmart-admin\node_modules` 가 비었고 — **pm2 가 돌리는 어드민·쇼핑앱 serve,
  백엔드가 그 자리를 쓴다.**
- 전역 삭제 훅(`~/.claude/hooks/block-delete.cjs`)은 **명령 글자만** 본다. 그래서 위 모든 경우가 통과한다 — `git worktree remove`·`--prune` 은
  삭제 낱말이 없고, 그 안의 지우기는 git·node 안에서 돈다. `Move-Item` 은 옮기기라 막을 이유가 없다(D1 은 폴더 안을 봐야만 안다).
  - 링크만 푸는 명령: `cmd /c rmdir <링크>` 는 **막힌다**(C:\srmart 안 삭제) · `fsutil reparsepoint delete <링크>` 는 **통과**(관리자 권한 불필요, 실측).

## 정리 스크립트 — `C:\srmart\tools\worktree-cleanup.cjs` (세 창 공용)

```
node C:\srmart\tools\worktree-cleanup.cjs C:\srmart\worktrees\shop-1115              (보기만)
node C:\srmart\tools\worktree-cleanup.cjs C:\srmart\worktrees\shop-1115 --yes        (한다)
node C:\srmart\tools\worktree-cleanup.cjs --selftest                                 (%TEMP% 에서 전 과정 · E: 로 옮기는 갈래까지)
```

폴더마다:

1. `C:\srmart\worktrees\` **바로 아래**인지 · 저장소 본체(`.git` 이 폴더)가 아닌지 — 아니면 손대지 않는다
2. 안의 링크를 전부 찾는다(링크 안으로는 들어가지 않는다)
3. 링크만 푼다(`fsutil reparsepoint delete`) → 다시 세어 **하나라도 남으면 멈춘다**
4. git 에 등록된 가지면 `git worktree remove --force` → `git worktree prune`
5. 그래도 남으면 `E:\backups\worktrees-done\<이름>-<시각>` 으로 옮긴다 — 옮기기 직전에
   ⑴ 링크 다시 세기 ⑵ **다른 도구로 한 번 더**(`cmd dir /AL /S`) ⑶ 남은 항목이 500개를 넘으면 멈춤(진짜 node_modules 를 따라 들어간 것일 수 있다)

이 스크립트는 링크를 푸는 것 말고는 **아무것도 지우지 않는다** — 폴더를 지우는 것은 git 자신의 `worktree remove`, 남은 것은 옮김.

### 2026-11-15 에 이걸로 치운 것

| 폴더 | 결과 |
|---|---|
| `admin-brand` · `backend-brand` · `shop-brand` (2026-11-14 남은 것) | 링크 풀고 → `E:\backups\worktrees-done\*-brand-20261115_1835xx` |
| `backend-1115-base` (오늘 검사기 기준 비교용) | 링크 풀고 → git 이 지움 |
| 전후 `node_modules` 항목 수 | admin 919 · backend 293 · shop 1059 — **같음** |

시험 폴더 `C:\srmart\_hooktest-1115` 는 링크가 없는 것을 두 방법으로 확인한 뒤 `E:\backups\hooktest-1115\` 로 옮겼다
(⚠ `.git` 같은 **숨김 폴더**가 있으면 다른 드라이브로의 `Move-Item` 이 반쯤 하다 멈춘다 — 숨김 속성을 풀고 다시 옮겼다).

## 배포 스크립트의 정리(F·G)는 이미 맞다

`deploy-shop.cjs`·`deploy-admin.cjs` 는 HEAD 를 꺼낸 임시 가지(`_deploy_wt-*`)를 치울 때 **링크부터 풀고**(`unlinkJunction`,
링크가 아니면 손대지 않음) `git worktree remove --force` 를 부른다 — 위 C 와 같은 순서다. `--prune` 은 이름 규칙에 맞는
`build_prev_*` 만 지우고, 그 안에 링크가 있어도 따라가지 않는다(F·G 실측).

## 대표님 판단 거리

- 전역 삭제 훅이 **D1(링크가 든 폴더를 다른 드라이브로 `Move-Item`/`mv`)** 을 막게 할지 — 훅이 명령의 원본 폴더 안을 한 번 들여다보면 된다.
  훅 원본은 `C:\srmart\dongsin-brand\hooks\block-delete.cjs`(전역판과 같이 고친다)라 이 창에서는 손대지 않았다.
  - **2026-11-16 (지시 2)**: 보강판을 파일로만 만들었다 — `C:\srmart\tools\hooks\block-delete-v2.cjs`(자가 시험 40/40).
    ⑴ `mv`·`move`·`Move-Item`·`robocopy /MOV(E)` 의 **원본 폴더 안을 세어** 링크가 있으면 막는다(못 다 세면 막는다 · 변수·`*`·`cd` 섞임도 막는다)
    ⑵ `git worktree remove`(·`-C`·`--force`)를 막는다 — 정리는 위 도구로만.
    **전역 설정에는 아직 걸지 않았다**(대표님 결정 대기). 거는 법은 루트 `CLAUDE.md` 「작업 가지 정리」 문단.
