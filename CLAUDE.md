🔴 모든 답변·보고·요약은 한국어로 쓴다. 영어로 쓰지 않는다(코드·명령어·파일 이름·커밋 해시는 그대로).

이 저장소(에스알마트 쇼핑앱)의 작업 규칙은 상위 `C:\srmart\CLAUDE.md` 를 따른다.

🔴 **운영 반영은 `deploy-shop.cjs` · `deploy-admin.cjs` 로만 한다 (2026-11-13 대표님 지시).**
**작업 폴더에서 `npm run build` 로 운영 `build/` 에 직접 빌드하지 않는다** — 대표님께 드리는 명령·아침 보고의
「대표님이 아침에 할 일」 틀에도 `npm run build` 를 적지 않는다.

```
node C:\srmart\srmart-shop\scripts\deploy-shop.cjs
node C:\srmart\srmart-admin\scripts\deploy-admin.cjs
```

- **왜**: 작업 폴더에는 다른 창의 미커밋 줄이 섞여 있다. `npm run build` 는 그것까지 운영에 내보내고, 그 코드는
  어느 커밋에도 없어 **무엇이 도는지 기록으로 알 수 없다**. 두 스크립트는 **커밋된 HEAD 를 따로 꺼내** 빌드하고
  (`BUILD_COMMIT.txt`), 바꿔 끼운 뒤 운영 주소에서 확인하고, **실패하면 스스로 옛 build 로 되돌린다.**
  🔴 **2026-11-13 아침에 실제로 틀렸다** — 밤샘 보고(`reports/20261113-morning-shop.md`) ①에
  `npm --prefix C:\srmart\srmart-shop run build` 를 적어 드렸다.
- **확인·시험 빌드**는 운영 `build/` 가 아닌 곳으로: `BUILD_PATH=<스크래치 폴더>` 또는 `deploy-*.cjs --build-only --out <저장소 밖>`.
- **백엔드와 같이 바뀌면 순서**: `restart-backend.ps1` → `deploy-admin.cjs` → `deploy-shop.cjs`(화면이 부르는 서버가 먼저 올라가 있어야 한다).
- 보고에는 build 시각 대신 **스크립트의 결과 줄(새 번들 이름 · `BUILD_COMMIT` · 확인 통과)** 을 적는다.

