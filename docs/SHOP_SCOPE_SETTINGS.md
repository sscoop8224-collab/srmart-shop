# 쇼핑앱 설정의 범위 — 전체 공통 · 브랜드별 · 매장별 (2026-11-13 대표님 지시 8 · 설계와 파일만)

> 쇼핑앱이 브랜드 둘(에스알마트 `srm` · 아람마트 `aram`)로 나뉜다. 회원·백엔드·DB 는 하나다.
> 이 문서는 **설정마다 어느 단계에서 정하는지**와 **아래 단계가 위 단계를 어떻게 이어받는지**를 정한다.
> 마이그레이션(파일만, 적용 안 함): `srmart-backend/migrations/migration_brands_v1.sql` · `migration_device_tokens_app_v1.sql`(되돌리기 파일 포함).
> 관련: `docs/SHOP_WHITELABEL.md`(앱 빌드·패키지·서명) · `docs/SHOP_CART.md`(브랜드별 장바구니).

## 1. 세 단계와 이어받기 규칙

```
전체 공통 (동신)  ──▶  브랜드 (srm · aram)  ──▶  매장 (001 검암 … 004 고촌 …)
```

- **매장 → 브랜드 짝**은 `stores.brand_code` 한 칸이 정한다(`migration_brands_v1.sql`).
  지금은 두 곳에 손으로 적혀 있다: `shopCart.js` 의 `BRAND_STORE_CODES` 와 `brands/<id>/brand.json` 의 `stores`. 표가 생기면 둘 다 표를 읽게 바꾼다.

설정은 성격에 따라 둘 중 하나로 이어받는다.

| 방식 | 규칙 | 해당 |
|---|---|---|
| **덮어쓰기** (값 하나) | **매장에 값이 있으면 매장 값 → 없으면 브랜드 값 → 없으면 전체 값.** 「비어 있음(NULL)」은 「위를 따른다」는 뜻이다. 0·빈 글자는 값이다. | 이름·전화·문구·켜고 끄기·숫자 정책 |
| **합쳐 보이기** (목록) | 화면에는 **전체 + 그 브랜드 + 그 매장** 것을 합쳐서 보여 준다. 줄마다 「어디까지 보이나」 를 단다(전체 / 브랜드 / 매장). | 배너·스플래시 광고·공지·FAQ·이벤트·쿠폰 |

- 🔴 **아래 단계가 위 단계를 「끌」 수는 있어도 「넓힐」 수는 없다.** 예: 전체에서 주류 판매를 끄면 매장이 켜도 꺼진 것이다.
  법·돈에 닿는 것(주류·광고 동의·포인트)은 **위가 막으면 막힌 것**이다. 이 규칙은 표에서 「상한」 으로 표시한다.
- 🔴 **다른 브랜드 것은 절대 안 보인다.** 아람 앱에 에스알마트 배너·푸시·쿠폰이 보이면 안 된다.
  목록 질의는 `brand_code IS NULL OR brand_code = ?` 처럼 **브랜드를 늘 조건에 넣는다.**
- 지금 이미 쓰는 꼴이 두 가지 있고, 둘 다 이 규칙과 같은 뜻이다:
  - 배너·스플래시·공지: `store_id IS NULL` = 전 매장 공용.
  - 주류 판매: `alcohol_sales_settings.store_id = 0` = 전 매장 기본값이고, 매장 줄이 덮어쓴다.

## 2. 설정 표

「지금」 칸은 2026-11-13 운영 DB(앱 계정 읽기)와 코드로 확인한 값이다. 「정할 단계」 는 제안이고, ★ 는 대표님 결정이 필요한 것이다.

### 2-1. 알림

| 설정 | 지금 저장 · 범위 | 정할 단계 | 이어받기 | 바꿀 자리 |
|---|---|---|---|---|
| **푸시 발송 대상(기기)** | `device_tokens` — 매장(`store_id`)만. 🔴 **어느 앱의 토큰인지 칸이 없다** | **브랜드** + 매장 | 브랜드로 반드시 거른다 | `migration_device_tokens_app_v1.sql`(`app_id` · `brand_code`) → `/api/push/register`(`index.js:8754`)가 채운다 · 앱 `pushSetup.js` 가 패키지를 보낸다 · `notifyPrefs.js` 대상 질의에 브랜드 조건 |
| FCM 프로젝트(키) | `.env FCM_SERVICE_ACCOUNT` 하나(`push.js`) | **전체 공통** | — | 한 Firebase 프로젝트에 두 앱(패키지)을 등록하면 키 하나로 둘 다 보낸다. 프로젝트를 나누면 브랜드별 키가 필요하다 ★ |
| 혜택(광고) 알림 동의 | `users.marketing_push` — 회원 | **회원**(브랜드와 무관) | 상한 — 동의 안 하면 어느 브랜드도 못 보낸다 | 그대로. ★ 브랜드마다 따로 받을지(앱이 다르면 동의도 다르게 볼 여지) |
| 주문 알림 동의 | `users.order_notify` — 회원 | 회원 | — | 그대로 |
| 관리자 광고 푸시 | `/api/admin/push/send` — 전체 또는 매장 | 전체 / **브랜드** / 매장 | 고른 범위 | 발송 범위에 「브랜드」 추가 |
| 「담아 둔 상품 할인 중」 알림 | `shop_cart_settings` 한 줄(켜기·보관 기간) · 장바구니는 이미 브랜드별 | 전체 공통(켜기) | 상한 | 보낼 때 그 브랜드 앱 기기로만(위 `brand_code`) |
| 문자 발신 계정 | `integration_configs` — 매장별(0 = 공용) | 매장 → 전체 | 덮어쓰기(이미 그렇다) | 그대로 |
| 문자 문구 머리 「[SR마트]」 | 하드코딩 `notify.js:56` · `integrations/manifest.notify.js:46,50` | **브랜드** | 덮어쓰기 | `brands.name` 으로 |

### 2-2. 화면에 보이는 글(콘텐츠)

| 설정 | 지금 저장 · 범위 | 정할 단계 | 이어받기 | 바꿀 자리 |
|---|---|---|---|---|
| 메인 배너 | `banners.store_id`(NULL = 공용). 운영 4줄 모두 공용 | 전체 / **브랜드** / 매장 | 합쳐 보이기 | `brand_code` 칸 추가 ★ · 시드 문구 「SR Mart에 오신 것을 환영해요!」(`migration_banners_v1.sql:47`) · `App.js:247` |
| 스플래시(시작) 광고 | `splash_ads.store_id` | 브랜드 / 매장 | 합쳐 보이기 | `brand_code` 칸 추가 |
| 네이티브 시작 화면(색·로고) | `capacitor.config.ts` 한 벌 + gradle 브랜드 자원 | **브랜드**(빌드 때 정함) | — | `brand.json` 의 `splashBackground` · 자원(SHOP_WHITELABEL.md) |
| 이벤트 | `events` — 🔴 매장·브랜드 칸 없음(전체 공통) | 전체 / 브랜드 / 매장 | 합쳐 보이기 | `store_id` · `brand_code` 칸 추가. 이어진 행사(`promotions.store_id`)는 이미 매장별 |
| 공지사항 | `shop_notices.store_id`(NULL = 전 매장) | 전체 / 브랜드 / 매장 | 합쳐 보이기 | `brand_code` 칸 추가 |
| FAQ | `shop_faqs` — 칸 없음(전체 공통) | 전체 / **브랜드** | 합쳐 보이기 | `brand_code` 칸 추가(답에 브랜드 이름이 들어가는 줄만 브랜드로) |
| 팝업 | 광고 팝업은 없다(제3자 제공 동의 창만) | — | — | 만들 때 이 표 규칙으로 |

### 2-3. 혜택·돈

| 설정 | 지금 저장 · 범위 | 정할 단계 | 이어받기 | 바꿀 자리 |
|---|---|---|---|---|
| 쿠폰 | `coupons` — 🔴 매장·브랜드 칸 없음(`usable_channel` 온라인/포스만) | 전체 / **브랜드** / 매장 | 합쳐 보이기 + **쓸 때도 검사** | `brand_code` · `store_id` 칸 ★. 🔴 브랜드가 다른 사업자면 「발행처 ≠ 사용처」 정산 문제 — 포스 종이쿠폰과 같은 쟁점(세무사 자문 중) |
| 가입 쿠폰 | `signup_coupon_policies` — 경로(online/pos)마다 한 줄, 전체 공통 | 전체 / **브랜드** ★ | 덮어쓰기 | 회원은 하나라 **두 앱에서 두 번 받으면 안 된다** — 지급 기록(`signup_coupon_grants`)은 회원 단위로 막고, 정책만 브랜드별로 |
| 포인트 정책 | `points_policy` 한 줄 — 「전 매장 동일」 | **전체 공통** | — | 그대로(회원·포인트는 하나). 🔴 정산 원장 문제는 CLAUDE.md 의 미해결 기록 그대로 |
| 행사(온라인 할인) | `promotions.store_id`(NULL = 전 매장) | 매장 → 전체 | 합쳐 보이기(이미 그렇다) | 「전 매장」 이 두 브랜드를 다 뜻하는지 ★ — 필요하면 `brand_code` |
| 배송비 · 무료배송 기준 · 구역 | `stores` · `store_zones` · `store_delivery_settings` · `store_delivery_holidays` — 전부 매장별 | **매장** | 구역 → 매장 기본 → 코드 기본(3,000 / 30,000) | 그대로 |
| 주류 판매 | `alcohol_sales_settings` — 0번 = 전체 기본, 매장 줄이 덮어씀 | 전체 → 매장 | 덮어쓰기 + **상한**(법) | 그대로. 브랜드 단계는 두지 않는다 |
| 장바구니 보관 기간 | `shop_cart_settings` 한 줄 | 전체 공통 | — | 그대로 |

### 2-4. 검색·상담

| 설정 | 지금 저장 · 범위 | 정할 단계 | 이어받기 | 바꿀 자리 |
|---|---|---|---|---|
| 인기 검색어 | `search_logs` — 🔴 매장·브랜드 칸 없음. 최근 7일 전체 집계(`index.js:8044`) | **브랜드** | 그 브랜드 기록만 센다 | `brand_code` 칸(기록 때 앱이 보낸 브랜드) ★. 아람 앱에 에스알마트 손님 검색어가 뜨지 않게 |
| AI 상담 이름 | 하드코딩 — 창 제목 「쇼핑 도우미」(`Chatbot.js:56`) | **브랜드** | 덮어쓰기 | `brands` 에 칸 또는 설정 줄 |
| AI 상담 첫인사 | 하드코딩 「안녕하세요! 에스알마트 AI 상담사예요」(`Chatbot.js:61`) | **브랜드** | 덮어쓰기 | 〃 |
| AI 시스템 프롬프트의 가게 이름 | 하드코딩 「SR마트(동신마켓)」(`index.js:10356`) · 기본값 'SR마트'(`:10304`) · 매장 정보만 `stores` 에서 | 브랜드 + 매장 정보 | 덮어쓰기 | `brands.name` 을 넣는다 |

### 2-5. 브랜드 이름이 박힌 글·사업자 정보

| 설정 | 지금 저장 · 범위 | 정할 단계 | 이어받기 | 바꿀 자리 |
|---|---|---|---|---|
| 앱 안 문구의 브랜드 이름 | 쇼핑앱 `src` 에 「에스알마트」 36줄/19파일 · 「SR Mart」 6 · 「동신마켓」 6 · 「SR마트」 2 | **브랜드** | — | 한 곳(`brand` 설정 — 빌드 때 `brand.json` 을 넣거나 서버 `brands`)에서 읽게 |
| 토스트·안내 문구 | 대부분 브랜드 글자 없음. 매장 이름 앞머리 「에스알마트 」 를 떼는 곳 여럿(`Cart.js:50,116` · `CustomerCenter.jsx:13` · `Login.js:221` · `App.js:264`) | 브랜드 | — | `utils/customerStores.js` 하나로 모은다(이미 아람마트도 뗀다) |
| 주문 완료 화면 | 브랜드 글자 없음(`Receipt.js`) | — | — | 그대로 |
| 주문 내역 · 매장 구매 내역 제목 | 「에스알마트 ${매장}」(`OrderHistory.jsx:150` · `Purchases.jsx:287`) | **매장**의 브랜드 | — | `stores.brand_code` → `brands.name`(고촌점이 「에스알마트 고촌점」 으로 보이는 자리) |
| 영수증 인쇄 | `PrintReceipt.js` — 가짜 주소·전화. 🔴 **아무 데서도 안 쓰는 파일** | — | — | 지우거나 그대로(지시 밖이라 손대지 않았다) |
| 법정 사업자 표시(상호·대표·주소·통신판매번호·개인정보 책임자) | `shop_business_info` 한 줄(`id = 1`) | 전체 → **브랜드** ★ | 덮어쓰기 | 브랜드가 같은 사업자면 그대로, 다르면 브랜드별 줄. 하드코딩도 있다: `HomePage.jsx:230-243` |
| 고객센터 전화 | 화면은 매장 전화(`stores.phone`). 사업자 표시 전화는 `shop_business_info.phone` | 매장 → 브랜드 → 전체 | 덮어쓰기 | `brands.cs_phone`(비면 매장 전화) |
| 개인정보처리방침 | `C:\srmart\homepage\privacy.html` 한 벌. 앱은 `https://dongsinmarket.co.kr/privacy.html` 로 연다(`Login.js:542` — 🔴 도메인이 `.co.kr`, 다른 곳은 `.com`). 고촌점이 「에스알마트」 로 적혀 있다 | 전체(사업자가 하나면) / 브랜드 ★ | — | 대표님 결정 뒤 문서 |
| 이용약관 | 없다(`Login.js:7`) | 전체 / 브랜드 ★ | — | 만들 때 결정 |

### 2-6. 앱 자체(빌드 때 정하는 것)

| 설정 | 지금 | 정할 단계 | 바꿀 자리 |
|---|---|---|---|
| 앱 이름 · 패키지 · 아이콘 · 대표색 | `brands/<id>/brand.json` + `android/app/build.gradle` productFlavors(srm `com.dongsin.srmart` · aram `com.dongsin.arammart`) | **브랜드** | 이미 나뉘었다. `brands` 표가 같은 값을 들고(서버가 앱을 알아볼 때) 🔴 패키지는 플레이스토어에 올리면 못 바꾼다 |
| 웹 주소 · `server.url` | `capacitor.config.ts` 한 벌(`/shop/`) · brand.json `webPath` `/srm` `/aram` | 브랜드 | `capacitor.config.ts` 를 브랜드별로 |
| 앱 설치 안내 | `InstallPrompt.js:102-104` 「에스알마트 앱 설치」 · `public/manifest.json` · `index.html` · `offline.html` · `service-worker.js` · 홈페이지 스토어 링크 빈칸(`homepage/index.html:235-243`) | **브랜드** | 브랜드별 manifest · 문구. 스토어 주소는 등재 뒤에 |
| 앱이 서버에 브랜드 알리기 | 🔴 **안 보낸다**(`X-Shop-Brand` 를 보내는 코드 없음 · `useShopCart.js` 의 `BRAND = 'srm'` 고정) | 브랜드 | `api.js` 가 빌드의 브랜드를 머리글로 보낸다 |

### 2-7. 매장 단계에만 있는 것

| 설정 | 지금 | 비고 |
|---|---|---|
| 쇼핑앱에 매장 보이기 | `stores.customer_visible` | 그대로 |
| 상품 판매·가격·재고 | `store_products` | 그대로 |
| 영업시간 | `stores.operating_hours`(자유 글) | 그대로. 영업 휴무 표는 없다(배송 휴무만) |

## 3. 저장 방법 제안 (파일은 아래 두 개만 준비했다)

1. **`brands` 표 + `stores.brand_code`** — `migration_brands_v1.sql`(준비함).
   - 브랜드 단계의 「값 하나」 설정(이름·앱 이름·패키지·웹 경로·대표색·고객센터 전화)을 이 표가 든다.
   - 🔴 005 승학점 · 006 동신마켓 은 `brand.json` 어디에도 없다. 지금 서버는 둘 다 `srm` 으로 본다. 파일도 그 동작 그대로 채운다 ★.
2. **`device_tokens.app_id` · `brand_code`** — `migration_device_tokens_app_v1.sql`(준비함). 브랜드별 푸시의 전제다.
3. (다음 일 · 파일 없음) **목록형 콘텐츠 표에 `brand_code` 칸**을 단다: `banners` · `splash_ads` · `shop_notices` · `shop_faqs` · `events` · `coupons` · `search_logs`.
   뜻은 「`brand_code` NULL + `store_id` NULL = 전체」, 「`brand_code` 만 = 그 브랜드 전 매장」, 「`store_id` = 그 매장」.
4. (다음 일 · 파일 없음) 브랜드가 늘거나 문구가 많아지면 **설정 한 표**(`shop_settings(scope 'all'|'brand'|'store', scope_key, setting_key, value)`)를 두고
   한 함수(`resolveSetting(key, { brand, store })`)로만 읽는다. 이어받기 규칙이 여러 곳에 흩어지지 않게 하려는 것이다.
   지금은 설정 수가 적어 1번 표 칸으로 충분하다고 본다.

## 4. 대표님이 정할 것 (★)

1. **005 승학점 · 006 동신마켓** 은 어느 브랜드인가(지금 서버는 에스알마트로 본다. 쇼핑앱 `brand.json` 에는 없다).
2. Firebase 프로젝트를 **하나로**(두 앱 등록) 할지 **브랜드별로** 나눌지.
3. 쿠폰·가입 쿠폰·이벤트·배너를 **브랜드별로 따로** 운영할지. 쿠폰은 사업자 간 정산 문제와 같이 정한다.
4. 사업자 표시·개인정보처리방침·약관이 **두 브랜드 같은 사업자**인지.
5. 혜택 알림 동의를 **회원 하나로** 둘지 **브랜드(앱)마다** 받을지.
6. 인기 검색어를 브랜드별로 나눌지.

## 5. 브랜드 표가 생기면 바꿀 하드코딩 자리 (요약)

| 자리 | 지금 값 |
|---|---|
| `srmart-backend/src/services/shopCart.js` | `BRANDS` · `BRAND_STORE_CODES = { aram: ['004'] }` |
| `srmart-shop/src/hooks/useShopCart.js` | `BRAND = 'srm'` |
| `srmart-shop/src/api.js` | `X-Shop-Brand` 를 안 보낸다 |
| `srmart-shop/brands/*/brand.json` | `stores` — DB 와 중복 |
| `srmart-shop/capacitor.config.ts` | appId · appName · `server.url` · 색이 한 벌 |
| `srmart-backend/push.js` · `src/services/notifyPrefs.js` | FCM 하나 · 발송 범위 all/store |
| `srmart-backend/index.js:10304,10356` · `srmart-shop/src/components/Chatbot.js:61` | 「SR마트(동신마켓)」 · 「에스알마트 AI 상담사」 |
| `srmart-backend/notify.js:56` · `integrations/manifest.notify.js` | 「[SR마트]」 |
| 쇼핑앱 화면 | `App.js` · `Login.js` · `HomePage.jsx` · `OrderHistory.jsx` · `Purchases.jsx` · `ThirdPartyConsentModal.jsx` · `InstallPrompt.js` · `AppHeader.jsx` · `Sidebar.jsx` · `About.jsx` |
| `public/` | `index.html` · `manifest.json` · `offline.html` · `service-worker.js` |
| `C:\srmart\homepage\` | `privacy.html`(고촌점 표기 · `.co.kr` 링크) · `index.html` 스토어 링크 빈칸 |
