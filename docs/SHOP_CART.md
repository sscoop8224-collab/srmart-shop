# 쇼핑앱 서버 장바구니 (2026-11-13 대표님 지시)

> 마이그레이션 `srmart-backend/migrations/migration_shop_cart_v1.sql` 머리말이 가리키는 설계 문서다.
> 서비스 `srmart-backend/src/services/shopCart.js` · 입구 `src/routes/shopCart.js` · 설정 입구 `src/routes/shopCartSettings.js`
> · 앱 `src/hooks/useShopCart.js` · 화면 `src/pages/Cart.js`(목업 S08A).

## 0. 한 줄 요약

- **회원**: 장바구니는 **서버(회원 계정)** 에 있다. 기기를 바꾸거나 앱을 다시 깔아도, 다른 폰으로 로그인해도 같은 장바구니가 보인다.
- **비회원**: 이 기기(`localStorage`)에만 둔다. 로그인하는 순간 서버로 **합친다**.
- **금액**: 장바구니에는 가격을 저장하지 않는다. 장바구니 화면·주문서·실제 주문 모두 **서버가 지금 매장 기준으로 다시 계산한 값**만 쓴다.
  이 셋이 1원도 다르지 않은지는 `srmart-backend/tools/check-shop-amount-parity.cjs --live` 가 실제 서버로 확인한다(아래 §6).

## 1. 저장 구조

| 표 | 한 줄의 뜻 | 열쇠 |
|---|---|---|
| `shop_carts` | 회원·브랜드마다 장바구니 하나. `updated_at` = **마지막으로 바꾼 때** | `(user_id, brand)` |
| `shop_cart_items` | 담은 줄 | `id` · 고유 `(user_id, brand, product_id, unit_type)` |
| `shop_cart_settings` | 설정 한 줄(id 1): 보관 기간 · 할인 알림 켜기 | `id = 1` |
| `shop_cart_purge_log` | 매일 정리가 **몇 개**를 지웠나(누구 것인지는 남기지 않는다) | `id` |
| `shop_cart_push_log` | 「오늘 할인 중」 알림 원장 — 회원당 하루 한 번 | `(user_id, sent_on)` |

### 줄 (`shop_cart_items`)

- **같은 상품이어도 포장 단위가 다르면 다른 줄이다.** `unit_type` 은 `unit`(낱개) · `box`(박스 = 입수만큼) · `weight`(무게, 100g 단위).
  예전 앱은 상품 번호로만 묶어서 박스와 낱개가 한 줄로 섞였다.
- `quantity`: 낱개·박스 수, **1~99**. 무게 상품은 언제나 1이고 `grams` 가 양이다(100g 단위, 한 줄 최대 20kg).
- 장바구니 하나에 **최대 100줄**.
- `store_id` = 담은 매장(기록일 뿐). **금액은 지금 매장 기준**이다. 매장을 바꾸면 새 매장 값으로 다시 매겨진다.
- `added_unit_price` = 담을 때(또는 마지막으로 고칠 때) 한 개 값. 🔴 **금액 계산에 쓰지 않는다** —
  「가격이 바뀌었어요」 표시에만 쓴다.

### 브랜드 (`brand`)

- `srm` 에스알마트 · `aram` 아람마트. 두 브랜드 앱은 **장바구니를 따로** 쓴다. 회원(포인트·주문)은 하나다.
- 서버는 `X-Shop-Brand` 머리글을 읽는다. 안 보냈으면 그 회원 매장의 브랜드를 따른다.
  ✅ 2026-11-16 확인: 지금 앱은 **보낸다**(`src/api.js` 요청 가로채기가 `X-Shop-Brand = BRAND.code` — 빌드의 브랜드). ~~아직 보내지 않는다~~(옛 기록).
- 🔴 매장 → 브랜드 짝은 브랜드 표(`migration_brands_v1`)가 생기기 전까지 **두 곳에 손으로** 적혀 있다:
  `shopCart.js` 의 `BRAND_STORE_CODES` 와 쇼핑앱 `brands/<id>/brand.json` 의 `stores`. **한쪽만 바꾸면 그 매장 손님의 장바구니가
  「이 앱의 매장 상품이 아니에요」 로 통째로 잠긴다.** 브랜드 표가 생기면 `BRAND_STORE_CODES` 를 지운다(`docs/SHOP_SCOPE_SETTINGS.md`).

### 줄마다 다시 확인 (`evaluateLines`)

장바구니를 보여 줄 때마다 서버가 줄마다 다시 판정한다. 막히면 `ok: false` 와 이유를 싣는다:
판매 중단 상품 · 이 매장에 없음 · 다른 브랜드 매장 · 주류 비판매 매장 · 19세 본인확인 전 주류 · 판매 중지 · 품절 · 재고 부족(남은 수량).

- 🔴 **행사(묶음·교차 할인)는 살 수 있는 줄끼리만** 매긴다. 재고가 모자란 줄까지 넣어 매기면 주문에서는 안 주는 교차 할인이
  장바구니에만 보인다 — 2026-11-13 실제로 그 모양(143원)이 잡혀 고쳤다(`704fcb5`).
- 「상품 금액」은 행사 전 금액이고, 그 바로 아래에 「행사 할인 −○원」 줄이 장바구니 바 · 주문서 · 주문 완료에 같은 값으로 보인다.

## 2. 입구

| 입구 | 누가 | 하는 일 |
|---|---|---|
| `GET /api/shop/cart` | 회원 | 내 장바구니 + 줄마다 다시 확인한 결과 + 합계 |
| `POST /api/shop/cart/preview` | 누구나 | 비회원 기기 줄을 같은 규칙으로 판정만(**DB 에 쓰지 않는다**) |
| `PUT /api/shop/cart/lines` | 회원 | 담기(`mode: 'add'`, 더하기) · 수량 바꾸기(`mode: 'set'`) |
| `DELETE /api/shop/cart/lines/:id` | 회원 | 한 줄 빼기 — 🔴 언제나 `user_id · brand` 로 묶어 지운다(줄 번호만으로 지우지 않는다) |
| `DELETE /api/shop/cart` | 회원 | 비우기 |
| `POST /api/shop/cart/merge` | 회원 | 비회원 기기 줄을 합치기(§3) |
| `GET·PUT /api/admin/shop-cart-settings` | 대표(owner) | 보관 기간 · 할인 알림 켜기 · 현황(장바구니·줄 수, 최근 정리 10회) |

주문서와 바로 주문은 `POST /api/shop/quote`(견적)로 금액을 받는다. 견적에 실은 줄·쿠폰·배송지와 **주문에 싣는 줄·쿠폰·배송지가 같다**
(`useCheckoutFlow.buildOrderExtras`). 견적 전·실패·살 수 없는 줄·배송 불가·쿠폰 오류면 결제 단추가 잠긴다.

## 3. 비회원 → 로그인 합치기

- 비회원 줄은 `localStorage` 의 **`srm_cart_v1:srm`**(브랜드마다 다른 키)에 둔다. 화면용 이름·사진(`snapshot`)은 기기에만 있고 서버로 보내지 않는다.
- 로그인하는 순간 한 번 `POST /api/shop/cart/merge` 를 부른다:
  - **같은 상품·같은 포장 단위는 수량을 더한다**(무게는 g 을 더한다).
  - 상한(**99개 · 20kg**)을 넘으면 상한으로 자르고 `clamped` 로 센다.
  - 서버 장바구니가 100줄이면 넘치는 새 줄은 버리고 `dropped` 로 센다. 모양이 틀린 줄은 `invalid`.
  - 응답의 `merged: { added, summed, clamped, dropped, invalid }` 로 앱이 「장바구니에 ○개를 합쳤어요」 를 알린다.
- 🔴 **기기 줄은 합치기가 성공한 뒤에만 비운다.** 실패하면 그대로 두고 다음 로그인 때 다시 합친다(손님이 담은 것을 잃지 않는 쪽).
- 로그아웃하면 화면에서만 지운다. 서버 장바구니는 남는다.

## 4. 90일 정리

- 매일 **04:20** 작업 `shop-cart-purge`(`index.js` 의 cron → `jobRunner`)가 `purgeExpired` 를 부른다.
- **마지막으로 바꾼 뒤**(`shop_carts.updated_at`) 보관 기간이 지난 장바구니를 지운다. 줄은 FK `CASCADE` 로 같이 지워진다.
  - 담기·수량·빼기·비우기 전부 「바꾼 것」 이다. 줄 하나를 빼도 시계가 다시 간다.
  - 보기만 하면 시계가 안 간다.
- 보관 기간: `shop_cart_settings.retention_days`, 기본 **90일**, **7~365일**. 대표가 어드민 「장바구니 설정」 화면(`srmart-admin/src/pages/ShopCart.js`)에서 바꾼다. 표 값이 범위 밖이면 90으로 읽는다.
- 🔴 실행마다 `shop_cart_purge_log` 에 한 줄을 남긴다 — **0개를 지웠어도** 남긴다. 「돌았다」 가 기록에 있어야 「안 돌았다」 를 안다.
- 다시 돌려도 같은 결과다(이미 지운 것은 조건에서 빠진다).
- 회원을 지우면 그 회원 장바구니도 FK `CASCADE` 로 지워진다.

## 5. 「담아 둔 상품이 오늘 할인 중이에요」 알림

매일 **10:00** 작업 `shop-cart-sale-push` 가 `salePush` 를 부른다. 보내는 조건은 **전부** 맞아야 한다:

1. 설정 `sale_push_enabled = 1` — 🔴 **기본은 꺼짐(0)**. 대표가 어드민에서 켠다.
2. 푸시 연동이 준비돼 있다(`push.isReady()`).
3. 🔴 회원이 **혜택(광고성) 알림에 동의**했다(`users.marketing_push = 1`) · 탈퇴하지 않았다.
   기기는 `notifyPrefs.marketingTokensQuery` 로만 읽는다(정보통신망법 제50조). 제목에 「(광고)」 가 붙는다.
4. 장바구니에 **지금 살 수 있고(`ok`) 할인 금액이 있는** 줄이 있다 — 장바구니 화면과 같은 `evaluateLines` 를 **손님 권한**으로 돌린다
   (본인확인 전 주류는 할인이어도 안 알린다).
5. 🔴 **회원당 하루 한 번.** 브랜드 장바구니가 둘이어도 한 번이다. `shop_cart_push_log (user_id, sent_on)` 을 **먼저** `INSERT IGNORE` 하고
   이긴 쪽만 보낸다 — 보내다 죽으면 그날은 안 보낸다(두 번 보내는 것보다 낫다).

한 번에 보는 회원은 최대 2,000명(`SALE_PUSH_BATCH`). 넘치면 다음 날로 넘어간다. 실제로 나간 기기 수는 `sent_count` 에 적는다.

## 6. 금액 일치 검사

- `srmart-backend/tools/check-shop-amount-parity.cjs`
  - 빠른 모드(DB 없이): 자가 시험 2건 + 장바구니 판정 대 주문 쪽 계산 비교.
  - `--live`: 임시 MySQL(127.0.0.1 · 임시 DB `srmart_parity`)에 운영 스키마와 미적용 마이그레이션을 올리고 임시 백엔드를 띄운다.
    같은 장바구니로 **장바구니 화면 = 견적(주문서) = 실제 주문(`orders`/`order_items`)** 을 네 장면으로 맞춘다:
    행사 + 재고 부족 · 보유 쿠폰 + 무료 배송 · 박스/낱개 + 코드 쿠폰 · 비회원 미리보기 = 견적.
- 백엔드 재시작 관문(`scripts/restart-backend.ps1`)이 빠른 모드를 돌린다.
- 🔴 쇼핑앱 반영(`scripts/deploy-shop.cjs` 0-b)이 `--live` 를 돌린다. **실패하면 빌드도 하지 않는다.**

## 7. 적용 순서

1. 백업 → `migration_shop_cart_v1.sql` 적용 → 확인(`SHOW TABLES LIKE 'shop_cart%';` → 5개 · `SELECT retention_days, sale_push_enabled FROM shop_cart_settings;` → `90 · 0`).
2. `src/schema/requiredSchema.js` 에 장바구니 표 다섯 줄을 **이때** 넣는다.
   🔴 적용 전에 넣으면 모든 창의 재시작이 막힌다(2026-11-13 실제로 그랬다 → `de70ad1` 에서 뺐다).
   `tools/check-shop-cart.cjs` ⑦ 은 「다섯 줄이 전부 있거나 전부 없다」 를 본다.
3. `restart-backend.ps1` → `deploy-admin.cjs` → `deploy-shop.cjs`(화면이 부르는 서버가 먼저 올라가 있어야 한다).

## 8. 되돌리기

🔴 **순서: 코드 먼저 → 표.** 코드가 남은 채 표를 지우면 장바구니 입구가 500 이 된다.

1. 쇼핑앱을 서버 장바구니 전 커밋으로 되돌려 `deploy-shop.cjs` 로 반영한다(앱이 장바구니 입구를 안 부르게).
2. 백엔드에서 서버 장바구니 입구·작업을 되돌리고, `requiredSchema.js` 에서 장바구니 다섯 줄을 뺀다 → `restart-backend.ps1`.
3. 🔴 **회원이 담아 둔 장바구니가 전부 사라진다**(되살릴 곳이 없다). 그러니 지우기 전에 `E:\backups\` 에 백업한다.
4. `rollback_shop_cart_v1.sql` 을 적용한다(`DROP TABLE` 다섯 개 — 알림 원장 → 정리 기록 → 설정 → 줄 → 머리 순).
5. 확인: `SHOW TABLES LIKE 'shop_cart%';` → 0줄.

표만 남기고 기능을 끄고 싶을 때는 되돌리지 않아도 된다. 할인 알림은 설정에서 끄면 되고(기본 꺼짐), 정리는 보관 기간을 365일로 늘리면 거의 멈춘다.

## 9. 관련 커밋 (백엔드)

`f49d154` 마이그레이션 파일 · `c5a69c4` 서비스·입구 · `c4d6239` 설정·정리·알림 작업 · `a1dbf91` 검사기 ·
`f43b785` 입수 싣기 · `de70ad1` 필수 스키마에서 빼기 · `704fcb5` 행사를 살 수 있는 줄끼리 + 금액 일치 검사기 · `89f1f83` 검사기 dbGuard
