# 2026-11-18 낮 반영 순서서 — 쇼핑앱 묶음 `shop-day-1118`(백엔드·어드민) + `shop-next-1118-pink`(쇼핑앱)

> 🔸 **2026-11-18 낮 확정판** — 대표 결정: 가입 문구는 **뺀 판**(`-pink`) · 세 저장소 모두 **지금 main 기준으로 맞춘** 가지 · 백엔드는 시험 도구 비밀번호 무작위 포함.
>    합치기: 백엔드 = **포스 창** · 어드민 = **어드민 창** · 쇼핑앱 = 쇼핑앱 창(대표 「재시작 끝」 뒤).

> 2026-11-18 밤샘 지시 2 · 쇼핑앱 창. 🔴 **대표님 승인 뒤 · 영업시간 밖**에만 한다.
> 예행 결과는 `C:\srmart\reports\20261118-morning-shop.md` 「1. 예행」.

## 0. 무엇이 올라가나

| 저장소 | 가지 · 끝 커밋 | 들어가는 것 |
|---|---|---|
| 백엔드 | `shop-day-1118` `f4da6af` (= `shop-next-1118` + main `ea278df` + 시험 도구 비밀번호 무작위 `560e054`) | 픽업 기한 응답 · 시작 광고 범위(전체/브랜드/매장) · 🔴 로그인 기록에 기기 · 최근 본 상품 지우기 · 주문 목록에 품목 · 시험 도구 비밀번호·PIN 무작위 · **SQL 1개** |
| 어드민 | `shop-day-1118` `8fc0d76` (= `shop-next-1118` + main `85068d8` + 글자색 한 줄) | 시작 광고 화면 범위 고르기 |
| 쇼핑앱 | `shop-next-1118-pink` (가입 문구 **뺀 판** · main `fc89c0d6` 합침) | 낮 가지 전부 · 정리(글꼴 woff2 · 안 쓰는 파일) · 아람 진한 분홍 A · 촬영·시험 도구 비밀번호 무작위 |

- 🔴 백엔드는 **SQL 을 적용하기 전에는 재시작 관문(기동 시험)에서 멈춘다**(`requiredSchema` 의 `splash_ads` 줄 — 의도).
- 🔴 백엔드 가지는 **SQL 적용이 끝난 뒤에** main 에 합친다(CLAUDE.md 「DB 마이그레이션이 필요한 백엔드 커밋은 운영 적용 뒤에만 main 에」).
- 화면이 부르는 서버가 먼저: **SQL → 백엔드 합치기·재시작 → 어드민 → 쇼핑앱(에스알마트 → 아람)**.

## 1. 대표님 — SQL (cmd 에서 실행)

**1-0. SQL 파일이 있는 폴더가 맞는 가지인지** — `shop-day-1118` 한 줄이 나와야 한다.
```
git -C C:\srmart\worktrees\backend-1115 branch --show-current
```
- 다른 이름이 나오면 **멈추고** Claude 에게 알려 주세요(그 폴더의 파일이 다른 가지 것이다).

**1-1. 백업** — 비밀번호를 묻습니다 · 이 줄만 붙여 넣으세요.
```
mysqldump -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 --single-transaction srmart > E:\backups\srmart_manual_20261118_splash.sql
```
- 나와야 할 것: **아무 글자도 안 나오고** 다음 줄로 돌아온다. 오류 줄이 나오면 멈춘다.

**1-2. 백업 파일 크기** — 약 2.2MB(11-17 백업 2,247,947 바이트)여야 한다. 0 바이트거나 수 KB 면 실패.
```
dir E:\backups\srmart_manual_20261118_splash.sql
```

**1-3. 적용** — 비밀번호를 묻습니다 · 이 줄만 · 🔴 **한 번만**(두 번째는 `ERROR 1060 Duplicate column name 'brand_code'` 로 멈춘다 — 그때는 이미 적용된 것이니 1-4 로).
```
mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart < C:\srmart\worktrees\backend-1115\migrations\migration_splash_ads_scope_v1.sql
```
- 나와야 할 것(끝에 찍힘):
  - `step_name` 줄 「적용 뒤 — splash_ads 의 brand_code · store_id 두 줄」
  - `column_name` 두 줄 `brand_code` · `store_id`
  - 광고 범위 표 한 줄 `(전체)  0  1  1` (지금 시작 광고 1개 · 범위 전체 · 켜짐)

**1-4. 확인** — 비밀번호를 묻습니다 · 이 줄만. `brand_code | varchar(16) | YES | MUL | NULL` 한 줄이 나와야 적용된 것.
```
mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart -e "SHOW COLUMNS FROM splash_ads LIKE 'brand_code';"
```

## 2. Claude — 합치기 (대표님 「SQL 적용 끝」 뒤)

1. 백엔드(**포스 창**): `C:\srmart\srmart-backend` 가 깨끗하고 `.work-lock` 이 없는지 본다 → `git merge --no-ff shop-day-1118` (가지가 main `ea278df` 를 이미 품었다 — 충돌 0 이어야 한다).
2. 어드민(**어드민 창**): `C:\srmart\srmart-admin` 에서 `git merge --no-ff shop-day-1118` (main `85068d8` 를 품었다 — 충돌 0).
3. 쇼핑앱(쇼핑앱 창 · 대표 「재시작 끝」 뒤): `C:\srmart\srmart-shop` 에서 `git merge --no-ff shop-next-1118-pink` (main `fc89c0d6` 를 품었다 — 충돌 0).
- 🔴 그 사이 main 이 또 움직였으면(다른 창 합치기) 충돌이 날 수 있다 — 그때는 합치지 말고 가지 주인 창에 알린다.
- 🔴 **백엔드 push** 는 이 묶음으로도 바로 풀리지 않는다 — 관문이 옛 커밋(`39b6bbb` · `78cbde6`)의 그 줄을 그대로 본다. 저녁 보고 「백엔드 push」 참고.
- 합친 커밋 해시를 보고에 적는다.

## 3. 포스 창 — 백엔드 재시작 (PowerShell)
```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\srmart\srmart-backend\scripts\restart-backend.ps1
```
- 나와야 할 것: [0/4] 쪽지·미커밋 없음 → eslint → 기동 시험(필요 표 **빠짐 0** — SQL 이 없으면 여기서 `표 splash_ads 컬럼 없음: brand_code` 로 멈춘다) → 재시작 → 헬스 200.
- 🔴 멈추면 **재시작하지 않은 것**이다(운영은 옛 코드로 그대로 돈다). 출력 맨 끝 줄을 Claude 에게 주세요.

## 4. 배포 (cmd · 한 줄씩 · 앞 줄이 「반영 완료」로 끝난 뒤 다음 줄)
```
node C:\srmart\srmart-admin\scripts\deploy-admin.cjs
```
```
node C:\srmart\srmart-shop\scripts\deploy-shop.cjs
```
```
node C:\srmart\srmart-shop\scripts\deploy-shop.cjs --brand aram
```
- 나와야 할 것: 각 줄 끝이 `✅ 반영 완료 — <브랜드> · static/js/main.<해시>.js · 커밋 <합친 커밋> · 되돌릴 곳 build_prev_…`.
- 종료코드 1 = 실패했고 **스스로 옛 build 로 되돌렸다**. 3 = 되돌리기도 실패 — 🔴 바로 Claude 를 부르세요.

## 5. 반영 뒤 확인
| # | 누가 | 무엇 | 나와야 할 것 |
|---|---|---|---|
| 5-1 | 대표님 cmd | `curl -s https://dongsinmarket.co.kr/api/health` | `{"ok":true,…}` |
| 5-2 | 대표님 폰 | 쇼핑앱에서 **본인 계정으로 로그인** → 마이 › 로그인 기록 | 맨 위 「Android 앱 · …」 (🔴 틀린 비밀번호로 확인하지 않는다 — 잠긴다) |
| 5-3 | 대표님 cmd(비밀번호 · 이 줄만) | 아래 명령 | 맨 위 줄 `success 1` · `ua_saved 1` (11-17 까지는 0) |
| 5-4 | 대표님 폰 | 주문내역 | 주문 카드에 앞 두 품목 + 「외 N건」 |
| 5-5 | 대표님 어드민 | 시작 광고 화면 | 「전체 / 브랜드 / 매장」 고르기가 보인다 → 지금 광고를 「에스알마트」로(추천 · 정할 것) |
| 5-6 | Claude | 운영 공개 주소 /srm · /aram 브랜드 확인(운영과 같은 응답 · 읽기 · API 상한 40) | 아람의 빌드 몫 다른 브랜드 0 · 아람 단추·탭이 분홍 |
```
mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart -e "SELECT id, attempted_at, success, user_agent IS NOT NULL AS ua_saved FROM login_attempts ORDER BY id DESC LIMIT 3;"
```

## 6. 되돌리기 (문제 났을 때 — 🔴 순서가 반대다: 화면 → 서버 → DB)
| 무엇이 | 어떻게 |
|---|---|
| 쇼핑앱 화면만 이상 | Claude: 쇼핑앱 main 의 합친 커밋을 `git revert -m 1 <합친 커밋>` → `deploy-shop.cjs` → `deploy-shop.cjs --brand aram` (커밋된 코드로 다시 빌드 — 무엇이 도는지 기록에 남는다) |
| 어드민 시작 광고 화면 | Claude: 어드민 main `git revert -m 1 <합친 커밋>` → `deploy-admin.cjs` |
| 🔴 로그인이 안 됨 · 서버 오류 | Claude: 백엔드 main `git revert -m 1 <합친 커밋>` → 포스 창 재시작. **SQL 은 남겨 둬도 된다** — 옛 코드는 `splash_ads.brand_code` 를 읽지 않는다 |
| 칸까지 지워야 할 때(드묾) | 백엔드를 되돌려 재시작한 **뒤에만** — 대표님 cmd(비밀번호 · 이 줄만): `mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart < C:\srmart\srmart-backend\migrations\rollback_splash_ads_scope_v1.sql` (되돌린 뒤라 이 파일이 main 에 없으면 가지 폴더 `C:\srmart\worktrees\backend-1115\migrations\` 의 같은 파일) |
| 그래도 안 되면 | 1-1 백업으로 DB 복원은 **마지막 수단**(그 뒤의 주문·매출이 사라진다) — 대표님 판단 |
