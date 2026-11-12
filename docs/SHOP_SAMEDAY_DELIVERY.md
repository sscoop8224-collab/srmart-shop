# 당일 배송 시간 설정 — 설계 초안 (2026-11-12)

> 상태: **설계·초안만.** 마이그레이션은 적용하지 않았고 백엔드·어드민 코드는 손대지 않았다.
> 적용은 대표님 승인 뒤 — CLAUDE.md 「SCHEMA-CHANGE RULE」·「배포 순서 규칙」 그대로(적용 → 곧바로 재시작, 영업시간 외).
> 조사는 전부 **읽기만** 했다(`SHOW CREATE TABLE`, 코드 읽기). 쓰기 호출은 하나도 없다.

## 0. 왜

쇼핑앱 회사 소개에 「주문 후 당일 배송」이 **고정 문구**로 박혀 있다(`src/pages/HomePage.jsx:24` FEATURES).
실제로 당일에 가는지는 매장·요일·시각에 따라 다른데 문구는 늘 같다 — 오후 9시에 주문한 손님도 「당일 배송」을 본다.
그래서 **매장마다 마감 시각을 어드민에서 정하고, 문구는 그 값에서 서버가 만든다.**

## 1. 지금 있는 것 (읽기만 해서 확인)

| 자리 | 있는 것 | 이 기능에 쓸 수 있나 |
|---|---|---|
| `stores` | `base_delivery_fee` · `free_delivery_min` · `operating_hours varchar(50)` · `phone` · `zipcode` | 배송비만 있다. **배송 시각·마감 칸은 없다.** `operating_hours` 는 자유 글자(「09:00~22:00」)라 계산에 못 쓴다 |
| `store_zones` | 매장별 배송 가능 동·우편번호(`/api/delivery/check`) | 「어느 매장이 배송하나」는 여기서 정한다 — 그대로 둔다 |
| `pos_store_settings` | POS 계산대 설정 40여 칸(PIN·반품·상품권…) | **넣지 않는다** — POS 전용 표다. 쇼핑앱 배송 칸을 섞으면 POS 설정 화면·검사기가 같이 흔들린다 |
| `orders` | 주문 시각·매장 | 「이 주문이 당일 약속으로 받은 주문인가」를 남길 칸이 없다 |

어드민 화면: `srmart-admin/src/pages/Stores.js`(매장 정보) · `DeliveryZones.js`(배송 구역) · `PosStoreSettings.js`(POS 설정).

## 2. 표 — 새 표 `store_delivery_settings` (매장당 한 줄)

| 칸 | 형 | 뜻 |
|---|---|---|
| `store_id` | int PK, FK `stores.id` | 매장 |
| `sameday_enabled` | tinyint(1) 기본 0 | 이 매장이 당일 배송을 하나. **0 이면 문구 자체를 안 낸다**(「배송 안내」 일반 문구) |
| `delivery_start_time` | time | 당일 배송 **출발** 시각(예: 16:00). 문구 「오늘 오후 4시 출발」 |
| `order_cutoff_time` | time | 당일 배송 **주문 마감**(예: 15:00). 이 시각 **전** 주문 = 오늘 도착 |
| `closed_on` | date NULL | 「오늘 당일 배송 쉼」 스위치. **켜면 그날 날짜가 들어간다** — 날짜가 지나면 저절로 풀린다 |
| `closed_reason` | varchar(60) NULL | 쉬는 까닭(어드민 기록용 · 손님 화면엔 안 낸다) |
| `updated_by` / `updated_at` | | 누가 언제 |

🔴 **「오늘 쉼」을 켜고 끄는 불(0/1)로 두지 않는다.** 불로 두면 다음 날 끄는 걸 잊는 순간 **며칠씩 「내일 배송」이 뜬다**
— 그런데 화면은 멀쩡해서 아무도 모른다. 날짜로 두면 자정에 저절로 풀린다(시재 영업일을 시각으로 자동 전환하지 않는 POS 규약과는 다른 일이다 — 이건 손님 안내 문구라서 자동으로 풀리는 쪽이 안전하다).

정기 휴무(매주 ○요일)는 이번 지시에 없어서 **안 넣었다.** 필요하면 `closed_weekdays varchar(20)`(예 `"7"`)를 같은 표에 더한다.

## 3. 문구 규칙 — 서버가 계산해 내려 준다

화면마다 따로 계산하면 홈과 장바구니가 서로 다른 말을 한다(같은 뿌리의 사고가 이 저장소에 여러 번 있었다 — 판정은 한 곳에).
기준 시각은 **서버 KST.** 손님 휴대폰 시계를 믿지 않는다.

| 조건 | `mode` | 문구(손님 화면) |
|---|---|---|
| `sameday_enabled = 0` 또는 설정 줄 없음 | `off` | (당일 배송 줄을 그리지 않는다) |
| `closed_on = 오늘` | `closed` | **내일 배송** · 오늘은 당일 배송을 쉬어요 |
| 지금 < `order_cutoff_time` | `today` | **오후 3시까지 주문하면 오늘 도착** · 오늘 오후 4시 출발 |
| 지금 ≥ `order_cutoff_time` | `tomorrow` | **내일 배송** · 오늘 주문 마감(오후 3시)이 지났어요 |

- 시각 표기: 12시간제 한국어 — `15:00` → 「오후 3시」, `15:30` → 「오후 3시 30분」, `12:00` → 「낮 12시」, `09:00` → 「오전 9시」.
- 「내일」이 쉬는 날인지는 **보지 않는다**(쉼 스위치는 오늘만). 그래서 문구를 「내일 **도착**」이 아니라 「내일 **배송**」으로 둔다 — 약속을 덜 한다.
- 화면에 띄운 뒤 마감이 지나면? 장바구니는 열릴 때·결제 직전에 다시 받는다. **결제 순간에는 서버가 다시 계산**해 주문에 남긴다(4절 `orders.delivery_promise`).

## 4. API

| 메서드·경로 | 권한 | 쓰기 | 하는 일 |
|---|---|---|---|
| `GET /api/stores/:id/delivery-promise` | 없음(손님) | **없음** | `{ mode, cutoff:'15:00', start:'16:00', label, sub }` — 위 표의 문구까지 서버가 만들어 준다. `Cache-Control: no-store` |
| `GET /api/admin/stores/:id/delivery-settings` | admin | 없음 | 설정 한 줄 + 지금 손님에게 보이는 문구 미리보기 |
| `PUT /api/admin/stores/:id/delivery-settings` | admin | `store_delivery_settings` UPSERT · `audit_logs` 1줄 | 사용 여부·출발·마감. 시각 형식 검사(`HH:MM`) |
| `PUT /api/admin/stores/:id/delivery-closed-today` | admin | 같음 | `{ closed: true/false, reason }` — true 면 `closed_on = CURDATE()` |

- 🔴 **매장 격리**: store_manager 는 **자기 매장만** — 핸들러마다 `if (req.user.role === 'store_manager' && Number(req.params.id) !== req.user.store_id) return 403` 를 직접 적는다(걸러 주는 미들웨어는 없다 — CLAUDE.md).
- 손님 쪽 매장 결정은 지금 홈과 같다(로그인 = 회원 매장, 아니면 `guestStoreId`).
- 주문: `POST /api/orders` 가 주문 INSERT 때 그 순간의 `mode` 를 `orders.delivery_promise` 에 남긴다(손님이 14:59 에 결제했으면 「오늘」 약속이 남는다 — 나중에 「당일이라더니」 문의를 가릴 근거).
- `requiredSchema.js` 에 새 표·칸을 같이 적는다(CLAUDE.md 규칙).

## 5. 어드민 화면 — 매장 관리 › 「배송 설정」 탭 (Stores.js 안)

```
┌ 왕길점 · 배송 설정 ────────────────────────────────────┐
│ 당일 배송            [● 사용]                           │
│ 주문 마감 시각        [ 15:00 ▾ ]   이 시각 전 주문 = 오늘 도착 │
│ 배송 출발 시각        [ 16:00 ▾ ]                          │
│                                                          │
│ ┌ 오늘(11월 12일) 당일 배송 쉼 ──────────── [ ○ 끔 ] ┐ │
│ │ 켜면 오늘만 「내일 배송」으로 바뀌고, 자정에 저절로 풀려요 │ │
│ └──────────────────────────────────────────┘ │
│ 손님에게 지금 보이는 문구:                                │
│   🚚 오후 3시까지 주문하면 오늘 도착 · 오늘 오후 4시 출발      │
│                                         [ 저장 ]         │
└──────────────────────────────────────────────────┘
```

- 「오늘 쉼」은 **저장 버튼 없이 바로** 적용(급할 때 쓰는 스위치) — 켜고 끌 때 확인창 한 번.
- 마감 > 출발이면(예 마감 17:00 · 출발 16:00) **막지 않고 경고**: 「마감 뒤에 출발 시각이 와야 오늘 도착이 지켜져요」.
- owner 는 매장을 고르고, store_manager 는 자기 매장만 보인다.

## 6. 쇼핑앱 화면 (목업 — 지시 2)

| 화면 | 자리 | 상태 |
|---|---|---|
| P05 홈 | 검색창 아래 한 줄 | 로그인 안 함(오늘 도착) · 마감 후 · 오늘 쉼 |
| S04 상품 상세 | 가격 아래 | 낱개·박스(오늘 도착) · 마감 후 · 오늘 쉼 |
| S08 장바구니 | 목록 위 | 오늘 도착 · 마감 후 · 오늘 쉼 |
| S40 회사 소개 | 「빠른 배송」 줄 | 쿠폰 켬·오늘 도착 · 가입 쿠폰 꺼짐·마감 후 · 오늘 쉼 |

## 7. 마이그레이션 초안 (적용 안 함)

파일 이름(만들 때): `srmart-backend/migrations/migration_store_delivery_settings_v1.sql`

```sql
-- 당일 배송 시간 설정 (2026-11-12 초안 — 승인 전, 적용 안 함)
-- 적용(cmd에서 실행): mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart < C:\srmart\srmart-backend\migrations\migration_store_delivery_settings_v1.sql
CREATE TABLE IF NOT EXISTS store_delivery_settings (
  store_id            INT NOT NULL,
  sameday_enabled     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 이면 손님 화면에 당일 배송 문구를 안 낸다',
  delivery_start_time TIME NULL COMMENT '당일 배송 출발 시각',
  order_cutoff_time   TIME NULL COMMENT '이 시각 전 주문 = 오늘 도착',
  closed_on           DATE NULL COMMENT '오늘 당일 배송 쉼 — 그날 날짜. 날짜가 지나면 저절로 풀린다',
  closed_reason       VARCHAR(60) NULL,
  updated_by          INT NULL,
  updated_at          TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (store_id),
  CONSTRAINT fk_sds_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT fk_sds_user  FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 주문이 받은 약속(결제 순간 서버 계산) — NULL = 이 기능 전 주문
ALTER TABLE orders ADD COLUMN delivery_promise VARCHAR(10) NULL COMMENT 'today|tomorrow|closed|off — 결제 순간의 당일 배송 약속';

-- 🔴 줄은 넣지 않는다: 설정 줄이 없으면 「off」(문구 없음)다. 매장이 어드민에서 켜야 문구가 나온다
--    — 아무도 정하지 않은 마감 시각을 손님에게 약속하지 않기 위해서다.
```

확인(같이 드림 · cmd에서 실행):
```
mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart -e "SHOW COLUMNS FROM store_delivery_settings; SHOW COLUMNS FROM orders LIKE 'delivery_promise';"
```

되돌리기: `DROP TABLE store_delivery_settings; ALTER TABLE orders DROP COLUMN delivery_promise;` — 코드부터가 아니라 **DB 복원 → 코드 → 재시작** 순서(CLAUDE.md).

---

## 부록 — 매장안내·이벤트·고객센터 화면(S44~S46)에 필요한 데이터 (지시 6, 읽기만 해서 확인)

| 화면 | 필요한 것 | 지금 백엔드 | 판정 |
|---|---|---|---|
| S44 매장안내 | 매장 이름 | `GET /api/stores` → `id, code, name, address, base_delivery_fee, free_delivery_min, staff_no_band` | 있음 |
| | 주소 | 같음(`address`) | 있음 |
| | **전화** | DB `stores.phone` 에는 있다(6곳 모두 채워짐) — **공개 API 가 안 내려 준다** | 🔴 API 에 없음 |
| | **영업시간** | DB `stores.operating_hours` 에 있다(6곳 모두) — 공개 API 에 없음 · 자유 글자 | 🔴 API 에 없음 |
| | 우편번호 | DB `stores.zipcode` 있음 — 공개 API 에 없음 | 🔴 API 에 없음 |
| | 지도 열기 | 좌표 칸 없음 — **주소로 지도 앱 검색**하면 되므로 좌표는 필요 없다 | 없어도 됨 |
| | 손님에게 보일 매장 고르기 | 활성 매장 6곳(**동신마켓 id 15 포함**) — 「손님 화면에 낼 매장」 칸이 없다 | 🔴 없음(확인 필요) |
| | 짧은 이름 | `display_name` — 3곳만 채워짐(고촌·승학·동신마켓은 NULL) · 공개 API 에 없음 | 🔴 API 에 없음 |
| S45 이벤트 | 행사 목록(제목·기간·사진) | `GET /api/events/active` — `events` 표(title·description·start/end·image_url) · **지금 0건** | 있음(비어 있음) |
| | **행사 → 행사상품 연결** | `events` 에 상품·행사(promotions)를 잇는 칸이 **없다** | 🔴 없음 |
| | 행사가(실제 할인) | `promotions`(매장별 행사 엔진) — **손님용 공개 API 없음**(어드민 `/api/admin/promotions` 뿐) | 🔴 API 에 없음 |
| | 지금 앱의 「행사상품」 필터 | `App.js:484` 가 events 응답의 `products`·`event_type`·`discount_value` 를 읽는데 **그런 칸이 없다 → 늘 0개** | 🔴 결함(고치지 않음) |
| S46 고객센터 | 내 매장 전화 | 위 S44 와 같음 | 🔴 API 에 없음 |
| | AI 상담 | `POST /api/chatbot` | 있음 |
| | **자주 묻는 질문** | 표·API **없음** | 🔴 없음 |
| (공지사항 칩) | 공지 목록 | 쇼핑앱 `Notice.js` 는 **화면 안 메모리**에만 쓴다(`setNotices` — 서버 저장 없음) · 손님용 공지 API 없음(광고판 공지 `signage_notices` 는 어드민 전용) | 🔴 없음 |
