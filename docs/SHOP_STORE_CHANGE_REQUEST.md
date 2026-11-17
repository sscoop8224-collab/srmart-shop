# 회원 매장 변경 요청 — 설계안 (2026-11-16 밤샘 · 남은 개발 #17)

> **설계만 있다. 코드·표는 만들지 않았다**(새 표가 필요해 마이그레이션 승인 대상이다).
> 대표님 결정 거리가 먼저 풀려야 한다 — 맨 아래 「결정 거리」.

> **2026-11-16 낮 진행(대표 지시 6 — 안 B 로 간다)** — 가지 `shop-night-1116`, 합치지 않음.
> - 서버: 백엔드 `0ea97e6` `src/routes/storeChangeRequests.js` — 아래 「안 B」 입구 다섯 개. 표가 없으면 **503 「준비 중」**.
>   동작 시험 `tools/test-store-change-live.cjs` 41/41(임시 MySQL).
> - 표 SQL: 백엔드 `docs/pending-sql/migration_store_change_requests_v1.sql`(+ 되돌리기) — 🔴 **적용 대기**(대표 승인).
> - 화면: 목업 `5e693ff` S44 회원 상태 5개 + 사진 `C:\srmart\reports\shots-20261116-shop\S44-store-change\`. 앱·어드민 화면은 아직.
> - 결정 거리 2·3·4 는 **추천안을 가정으로** 넣었다(대표만 승인 · 같은 브랜드만 · 횟수 제한 없음) — 바꾸려면 서버 한 파일.

## 지금 모습 (2026-11-16 확인)

| 자리 | 지금 | 근거 |
|---|---|---|
| 손님 앱 | **회원은 매장을 못 바꾼다.** 점포 선택·매장안내의 「이 매장으로」는 비회원과 대표(미리보기)만 | `src/App.js` 의 `storeInfo` 줄 · `src/pages/StoreInfo.jsx` 머리 주석 |
| 서버 | 대표 전용 `PATCH /api/users/:id/store` 하나 — 고객센터 경유(전화 받고 대표가 바꿈) | 백엔드 `index.js` 「회원 가입점포 이전」 |
| 어드민 | 그 입구를 부르는 화면이 **없다**(회원 상세에 「매장 이전」 없음) | 어드민 `src/api/index.js` · `Members.js` |
| 손님 요청 → 승인 흐름 | **없다** | 세 저장소 전수(storeChange·변경 요청·단골 등) |

2026-11-16 밤에 서버 입구만 보강했다(백엔드 가지 `shop-night-1116` `acb36fb`): 없는 회원 404 · 감사 기록 `MEMBER_STORE_CHANGE` ·
브랜드가 바뀌면 `brand_changed`. 동작 시험 16/16(임시 MySQL).

## 왜 「그냥 바꾸게」 하면 안 되나 — 매장이 정하는 것들

회원의 `users.store_id` 는 화면 한 칸이 아니라 **여러 장부의 열쇠**다.

| 매장이 정하는 것 | 바꾸면 무슨 일이 나나 |
|---|---|
| 주문 매장 · 가격 · 재고 | 주문은 토큰이 아니라 **DB 의 store_id** 를 읽는다(11-13 결정 1). 장바구니 가격이 바로 바뀐다 |
| 배송 권역 · 배송비 · 당일배송 | 새 매장 권역 밖 주소면 배송이 안 된다 |
| 쿠폰 | 매장 한정 쿠폰은 새 매장에서 못 쓴다 · 가입 쿠폰 **발행처**(`signup_coupon_grants.store_id`)는 그대로여야 한다(사업자간 정산 근거) |
| 포인트 | 지금 포인트는 매장 구분이 없다(루트 CLAUDE.md 「포인트 정산 원장 없음」 — 세무 자문 중). 매장을 옮겨도 그대로 따라간다 |
| 브랜드 | 에스알마트 매장 → 아람마트 매장이면 **손님이 쓰는 앱이 달라진다**(아람 앱에서만 그 매장이 보임) |
| 진행 중 주문 · 픽업 | 픽업 주문은 원래 매장에서 찾아야 한다 |

## 안

### 안 A — 지금처럼 고객센터 경유 + 어드민 화면만 더한다 (가장 작다 · 표 없음)

- 어드민 회원 상세에 「매장 이전」(대표만): 새 매장 고르기 → 확인창(위 표의 영향 요약 · `brand_changed` 면 빨간 줄) → `PATCH /api/users/:id/store`.
- 손님 앱은 그대로(매장안내에 「매장을 바꾸려면 고객센터로」 한 줄 — 화면 변경이라 목업 먼저).
- **마이그레이션 없음.** 기록은 `audit_logs`(이미 남는다).

### 안 B — 앱에서 요청 → 어드민에서 승인 (추천 · 표 하나)

1. 손님: 매장안내(S44)에서 다른 매장의 「이 매장으로 바꾸기 요청」 → 사유(선택: 이사 · 가까운 매장 · 기타) → 요청됨 안내.
   진행 중 주문(배송 전·픽업 미수령)이 있으면 요청을 받지 않는다(서버가 판정).
2. 어드민: 「매장 변경 요청」 목록(대표 · 받는 매장 점장은 보기만?) → 승인/거절(사유) → 승인이면 같은 트랜잭션에서 `users.store_id` 변경 + 감사 기록.
3. 손님 알림: 승인·거절을 푸시/공지로(푸시는 Firebase 등록 뒤).

표 초안(🔴 만들지 않았다 — 승인 뒤 `migrations/` 에):

```sql
CREATE TABLE store_change_requests (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  from_store_id INT NULL,
  to_store_id   INT NOT NULL,
  reason        VARCHAR(30) NULL,          -- move · nearer · other
  memo          VARCHAR(200) NULL,         -- guardText
  status        VARCHAR(12) NOT NULL DEFAULT 'pending',   -- pending · approved · rejected · canceled
  decided_by    INT NULL,
  decided_at    DATETIME NULL,
  decide_memo   VARCHAR(200) NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_scr_status (status, created_at),
  KEY idx_scr_user (user_id, status)
);
```

- 한 회원의 `pending` 은 하나만(서버가 판정 — 두 번 누르면 앞 요청을 돌려준다).
- 지우지 않는다 — 취소·거절도 줄로 남긴다(공지·FAQ 와 같은 원칙).
- 서버 입구: `POST /api/me/store-change-requests` · `GET /api/me/store-change-requests` · `PUT …/:id/cancel` (손님) /
  `GET /api/admin/store-change-requests` · `PUT …/:id/decide` (대표).

### 안 C — 앱에서 바로 바꾸기 (추천하지 않음)

위 표의 영향이 손님 손에서 **확인 없이** 일어난다. 특히 브랜드가 바뀌면 손님이 쓰던 앱에서 매장이 사라진다.

## 결정 거리 (대표님)

1. 안 A · B · C 중 무엇으로 갈지 — 추천 **B**(손님이 요청할 길이 생기고, 판단은 사람이 한다). 급하면 **A 먼저**(표 없이 오늘이라도 된다).
2. 받는 매장 **점장**도 승인할 수 있나 — 추천: **대표만**(가입 쿠폰·정산이 얽힌다). 점장은 목록 보기만.
3. 다른 브랜드로의 변경(에스알마트 ↔ 아람마트)을 받을지 — 추천: 받지 않는다(요청 화면에 같은 브랜드 매장만). 대표 어드민에서는 막지 않는다(지금 입구처럼 `brand_changed` 로 보이기만).
4. 바꿀 수 있는 횟수 제한(예: 30일에 한 번) — 추천: 처음엔 두지 않고 기록만 본다.
