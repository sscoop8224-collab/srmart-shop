# 쇼핑앱 주류 — 설계 (2026-11-12 대표님 지시 블록 4)

> 서버: `srmart-backend` 커밋 `3ca0728`·`4bc82c9`(로컬) · 어드민 `1f158cf`(로컬) · 마이그레이션 `migration_identity_alcohol_v1.sql` **적용 대기**
> 목업: S51~S53 · 판정은 서버 `src/services/alcohol.js` **한 곳**

## 규칙

1. **주류는 매장 픽업으로만** 판다(받을 때 신분증 확인). 전통주는 설정으로 배송을 열 수 있다(기본 닫힘).
2. **매장별 「주류 판매」** — 전 매장 기본 + 매장별 덮어쓰기(「기본을 따름」). **처음엔 전 매장 미판매.**
   어드민 「쇼핑앱 주류 판매」(대표만)에서 바꾼다. 바꿀 때마다 `audit_logs`.
3. 상품이 주류인지는 `products.alcohol_type`(주류 아님·일반 주류·전통주) — 어드민 상품 화면 「주류 분류」.
   🔴 옛 `is_adult`(19세미만 표시)와 **다른 칸이다** — 주류 판정은 `alcohol_type` 만 본다.

## 손님 화면 (서버가 정한다)

| 상황 | 목록·검색 응답 |
|---|---|
| 미판매 매장 | 주류가 **아예 없다** |
| 비회원 · 본인확인 안 함 · 19세 미만 | 보이되 **가격이 `null`**, `alcohol_locked: true`, 「19세 이상 본인확인 필요」 |
| 본인확인한 19세 이상 | 가격 · `pickup_only: true` · 「매장 픽업 · 받으실 때 신분증을 확인해요」 |

- 🔴 **가격을 응답에서 지운다** — 화면에서 숨기기만 하면 응답에 그대로 보인다. 행사가(`promo_price`)도 같이 지운다.
- 19세 판정은 **본인확인한 생년월일**(KST 만 나이). 스스로 고른 값은 안 본다.
- 직원 역할(대표·점장·본부·계산원)은 거르지 않는다 — 매장 화면에서 주류가 사라지면 안 된다.

### 🔴 상품을 내보내는 손님 입구는 **전부** 같은 판정을 거친다 (2026-11-12 지시 4)

판정 함수는 하나 — `srmart-backend/src/services/alcohol.js` 의 `gateForRequest(q, req, storeId, rows)`
(index.js 의 `alcoholGateFor` 는 그것을 부르기만 한다). 거치는 입구 11곳:

| 입구 | 무엇 |
|---|---|
| `GET /api/products` · `/api/products/active` | 상품 목록 |
| `GET /api/search` · `/api/search/suggest` | 검색 · 자동완성(이름만이어도 미판매 매장이면 안 떠오른다) |
| `GET /api/products/:id/related` · `/frequently-bought-together` | 연관 · 함께 산 상품 |
| `GET /api/recommendations` | 장바구니·홈 추천(두 갈래 모두) |
| `GET /api/users/me/wishlist` · `/recent-views` | 찜 · 최근 본 |
| `GET /api/promotions/active` | 행사 상품(행사가까지 잠금) |
| `POST /api/chatbot` | AI 상담 — 미판매면 빼고, 미확인이면 「19세 이상 본인확인 후 가격 안내」 로만 AI 에게 넘긴다 |

- 검사기 `srmart-backend/tools/check-identity-alcohol.cjs` ⑧ 이 **상품 표를 읽는 손님 입구를 전부 찾아**
  판정을 안 거치면(한 갈래만 빠져도) 실패한다. 판정이 필요 없는 입구(주문 — `checkOrder` 로 따로 판정 ·
  내 구매 내역 · 내가 쓴 리뷰)는 **이유를 적은 면제 목록**에 있다.
- 🟠 **손님 토큰으로 닿는 POS 입구 3곳** — `GET /api/pos/products/search` · `/api/pos/presets` · `/api/pos/keymap`
  은 `authMiddleware` 만 걸려 있어 손님 토큰으로도 상품·가격이 읽힌다. 주류 판정이 아니라 **직원 전용
  관문(`posStaffOnly`)이 빠진 자리**라 이번에 고치지 않았다(포스 쪽 결정). 검사기가 실행할 때마다 🟠 로 보인다.
  ✅ **닫혔다** — 백엔드 `bfe167c` 「손님 토큰으로 열리던 POS 입구 3개를 직원 전용으로 닫는다」(2026-11-16 확인: `index.js` 의 `/api/pos/products/search` 에 `posStaffOnly`).

## 주문 (돈이 바뀌는 자리)

서버가 결제 전에 **다시** 본다(화면 잠금은 신뢰 경계가 아니다).

| 응답 | 언제 |
|---|---|
| 400 `ALCOHOL_NOT_SOLD` | 미판매 매장에 주류 주문 |
| 403 `ALCOHOL_ADULT_REQUIRED` | 본인확인한 19세 이상이 아님 |
| 409 `SPLIT_REQUIRED` + `groups: {delivery, pickup}` | 배송 상품과 주류가 섞임 — 화면이 나눠 결제로 보낸다 |
| 409 `PICKUP_REQUIRED` | 주류만 담고 배송을 고름 |
| 400 `PICKUP_NOT_AVAILABLE` | 주류 없는 주문을 픽업으로 |

픽업 주문(`fulfillment: 'pickup'`): 배송 권역·배송비를 건너뛰고 **배송비 0**, 배송 약속 `NULL`,
`orders.fulfillment_type='pickup'` · `pickup_store_id` · `pickup_deadline` 저장.

### 나눠 결제 — 결제 한 번, 주문 두 건 (2026-11-12 지시 2)

`POST /api/orders/checkout` `{ orders: [배송 주문, 픽업 주문], final_amount }`

- **두 건만** 받는다 — 배송 1 + 픽업 1(아니면 400 `CHECKOUT_SHAPE`). 주문 번호는 서로 달라야 한다.
- 서버가 결제 묶음 번호 `payment_group_id`(`PG…`)를 만들어 **두 주문에 같이** 적는다.
- **한 트랜잭션** — 둘 중 하나라도 실패하면 둘 다 안 생긴다.
- 금액은 주문마다 서버가 다시 계산하고(단건 주문과 같은 `placeOrderInTx`), **두 합계**를 화면의
  `final_amount` 와 맞춘다. 다르면 409 `AMOUNT_MISMATCH`.
- 쿠폰·포인트는 **주문마다** 붙는다(`coupon_id`·`use_points` 를 주문 안에). 계산은 늘 배송 주문 먼저.
- 취소·환불은 **주문별**이다 — 기존 취소 길을 그대로 탄다. 픽업만 기한이 지나 취소돼도 배송 주문은 남는다.
- 🔴 카드 결제 취소(PG)는 아직 없다(결제 연동 휴면) — 상태·재고·포인트만 되돌린다.

### 픽업 기한 (2026-11-12 지시 3)

- 기한 = **결제일 + N일 23:59:59**. N 은 어드민 「쇼핑앱 주류 판매」 → 「픽업 보관 기한」(기본 **3일**, 1~14).
  바꾼 값은 그 뒤 주문부터.
- **하루 전 알림**(남은 24시간 이하, 매시 15분) — 한 번만(`pickup_reminded_at`). 주문·배송 알림을 끈 손님은 안 보낸다.
- **기한이 지나면 자동 취소**(매시 45분) — 상태 「취소」 · 재고 복구 · 포인트 환불 · 상태 이력 · `audit_logs`
  (`ORDER_PICKUP_EXPIRED_CANCEL`, `by: system:pickup-expiry`).
- 매장 직원이 어드민 주문 상세 → 「수령 확인」(신분증 확인 뒤) → 상태 「배송완료」 + `picked_up_at`.
  **수령 확인한 주문은 알림·자동 취소 둘 다에서 빠진다.**
- 판단은 `srmart-backend/src/services/pickupOrders.js` 한 곳. 다시 돌려도 같은 결과(취소는 UPDATE 를 이긴 쪽만 환불).

## 아직 안 한 것

- POS 픽업 수령 흐름 → `srmart-backend/docs/HANDOFF_POS_ALCOHOL_PICKUP.md`(지금은 어드민 주문 상세의 「수령 확인」).
- 쇼핑앱 장바구니의 나눠 결제 화면 — 서버 입구(`/api/orders/checkout`)는 있다.

## 🔴 확인 필요 (법 · 세무)

- 일반 주류의 통신판매 금지와 「스마트오더 + 매장 대면 수령」 허용 범위 — 국세청 고시 확인.
- 전통주 통신판매 예외의 범위(배송을 열어도 되는 품목).
- 미성년 판매 책임 — 픽업 때 신분증 확인 기록을 남길지.
