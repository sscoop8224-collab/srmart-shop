# 가입 쿠폰 — 설계 초안 (2026-11-12)

> 상태: **설계·초안만.** 마이그레이션은 적용하지 않았고 백엔드·어드민 코드는 손대지 않았다.
> 조사는 **읽기만** 했다(`SHOW CREATE TABLE`, `SELECT COUNT(*)`, 코드 읽기).
> 적용은 대표님 승인 뒤 — 스키마와 코드가 같이 바뀌므로 「배포 순서 규칙」(적용 → 곧바로 재시작, 영업시간 외).

## 0. 왜

쇼핑앱 회사 소개에 「🎁 신규회원 10% 할인 쿠폰 증정」이 **고정 문구**로 있다(`src/pages/HomePage.jsx:185`).
그런데 가입할 때 쿠폰을 주는 코드는 **어디에도 없다**(`POST /api/register` 는 `users` 한 줄만 넣고 끝난다 — `index.js:1809~1893`).
**약속은 있는데 지급이 없다.** 그래서 ⑴ 어드민에서 켜고 끄고 조건을 정하고 ⑵ 가입 순간 자동 지급하고
⑶ 문구는 그 설정에서 만든다 — 꺼져 있으면 문구도 사라진다.

## 1. 지금 있는 것 (읽기만 해서 확인)

| 자리 | 구조 | 이 기능에 쓸 점 · 걸리는 점 |
|---|---|---|
| `coupons` (2줄) | `code` UNIQUE · `discount_type enum(percent,fixed)` · `discount` · `max_discount` · `min_purchase_amount` · `total_count`/`used_count` · `per_user_limit` · `valid_from`/`valid_until`(**모두에게 같은 날짜**) · `is_active` | 할인 조건을 담는 **틀**로 그대로 쓴다. 다만 기한이 「날짜 하나」뿐이라 「가입 후 30일」을 못 담는다 |
| `user_coupons` (0줄) | `user_id` · `coupon_id` · `received_at` · `used_at` · `expires_at` · **UNIQUE(user_id, coupon_id)** | 지갑. `expires_at` 이 **사람마다** 있다 → 「가입 후 30일」을 여기에 넣는다 |
| `coupon_usage` | 사용 기록(주문 번호·할인액) | 그대로 |
| 주문 `POST /api/orders` (`index.js:4885~4940`) | **지갑에 있는지**(user_coupons) · 미사용 · `coupons.valid_until` · 최소금액 검사 후 사용 처리 | 🔴 **`user_coupons.expires_at` 은 안 본다** — 사람마다 다른 기한이 지금은 무시된다. 이 기능 때 같이 고쳐야 한다(백엔드 수정 — 이번엔 안 함) |
| `POST /api/coupons/apply` | **코드만** 보고 할인액을 계산(지갑 확인 없음) | 미리보기용이라 실제 할인은 주문에서 지갑으로 막힌다. 다만 가입 쿠폰 코드를 누가 알면 「할인됩니다」까지는 뜬다 → 가입 쿠폰 틀은 **추측하기 어려운 코드**로 만든다 |
| `POST /api/coupons/check` | 로그인 없이 코드로 쿠폰 줄 전체를 돌려준다 | 같은 이유 — 별건으로 보고만(고치지 않음) |
| 가입 `POST /api/register` | **휴대폰 인증 토큰 필수**(`phone_verify`·`signup`) · 트랜잭션 없음 | 휴대폰이 **인증된 값**이라 중복 방지 열쇠로 믿을 수 있다 |
| 🔴 **카카오 가입** | `social_accounts` 표는 있다(`provider`·`provider_user_id`) — **가입·로그인 API 는 아직 없다**(탈퇴 핸들러 주석: 「B-2 에서 붙는다」) | 카카오 가입을 만들 때 **같은 지급 함수**를 부르게 한다(아래 3절) |
| 탈퇴 `DELETE /api/users/me` (`index.js:8329`) | 행을 지우지 않고 **이름·전화·이메일을 지운다**(`phone=NULL`) · `social_accounts` 줄 삭제 | 🔴 **탈퇴하면 전화번호가 사라져서** 다시 가입했을 때 「전에 받은 사람」인지 `users` 로는 알 수 없다 → 따로 남겨야 한다(4절) |

## 2. 설정 — 새 표 `signup_coupon_settings` (한 줄) + `coupons` 틀 한 줄

할인 조건(율·금액·최소 주문금액·최대 할인)은 **`coupons` 의 한 줄**(틀)에 둔다 — 주문의 할인 계산이 이미 그 칸을 읽으므로 새 계산을 만들지 않는다.
켜기/끄기와 「가입 후 며칠」만 설정 표에 둔다.

| 칸 | 뜻 |
|---|---|
| `id` = 1 | 한 줄뿐(전 매장 공통 정책) |
| `enabled` | 켜기/끄기. **꺼지면 지급도 문구도 멈춘다.** 이미 받은 쿠폰은 기한까지 그대로 쓸 수 있다 |
| `coupon_id` | 틀(`coupons.id`). 어드민이 할인값을 바꾸면 **이 틀 줄을 고친다** |
| `valid_days` | 가입 후 며칠(예 30). 지급 때 `user_coupons.expires_at = 지급 시각 + valid_days` |
| `updated_by` / `updated_at` | |

틀 줄의 값: `code = 'SIGNUP-' + 무작위 10자`(추측 어렵게) · `name = '신규회원 가입 쿠폰'` · `per_user_limit = 1` · `valid_from/valid_until = NULL`(기한은 사람마다) · `target_type = '전체'`.

🔴 **할인값을 바꿀 때 틀 줄을 고치면 이미 받은 사람의 쿠폰도 같이 바뀐다**(지갑은 틀을 가리킬 뿐이다). 그래서 어드민의 「할인 조건 바꾸기」는
**새 틀 줄을 만들고 `coupon_id` 를 옮긴다** — 이미 받은 쿠폰은 받은 조건 그대로 남는다(손님이 받은 약속이 사후에 바뀌지 않게).

## 3. 지급 — 가입 순간, 일반·카카오 같은 함수 하나

```
grantSignupCoupon(conn, { userId, phone, kakaoId, storeId })
  1) 설정을 읽는다 — enabled=0 이면 끝 (지급 안 함, 오류 아님)
  2) 중복 방지 열쇠를 만든다 — phone_key = HMAC(키, 정규화한 전화), kakao_key = HMAC(키, 'kakao:' + provider_user_id)
  3) signup_coupon_grants 에 INSERT — UNIQUE 에 걸리면 「이미 받은 사람」 → 지급 안 하고 끝
  4) user_coupons INSERT (expires_at = NOW() + valid_days)
  5) 3)·4) 는 한 트랜잭션
```

- **가입은 막지 않는다.** 쿠폰 지급이 실패해도(설정 없음·DB 오류) 가입은 성공으로 끝낸다 — POS 영수증 쿠폰이 매출 확정 **뒤에** 따로 도는 것과 같은 선택이다.
  실패는 `console.error` + `audit_logs` 에 남긴다(조용히 넘어가지 않는다).
- 응답에 `signup_coupon: { granted: true, name, label, expires_at }` 를 실어 **가입 완료 화면**(목업 P04 「가입 완료」)이 그대로 그린다.
  `granted: false` 면 쿠폰 칸이 없다(이유는 손님에게 말하지 않는다 — 「이미 받으셨어요」는 재가입 사실을 드러낸다).
- 일반 가입: `POST /api/register` 의 `INSERT INTO users` 뒤에서 부른다.
- 카카오 가입: **아직 없는** 카카오 가입 API 를 만들 때 같은 함수를 부른다. 🔴 카카오 가입에도 **휴대폰 인증을 받는다** — 안 받으면 카카오 계정을
  새로 만들어 무한히 받을 수 있다(카카오 열쇠만으로는 막지 못한다). 휴대폰 인증 전 카카오 회원은 인증을 마칠 때 지급한다.
- POS(매장)에서 만드는 회원은 이번 범위가 아니다(지시: 일반·카카오) — 매장 가입에도 줄지는 따로 정할 일.

## 4. 탈퇴 후 재가입으로 여러 번 받기 막기

**열쇠는 「인증된 휴대폰 번호」**, 보조 열쇠는 카카오 회원번호. 둘 다 **원문이 아니라 HMAC** 으로만 남긴다.

| 표 `signup_coupon_grants` | 뜻 |
|---|---|
| `phone_key char(64)` **UNIQUE** | HMAC-SHA256(서버 키, 숫자만 남긴 전화번호) — 원래 번호로 되돌릴 수 없다 |
| `kakao_key char(64)` NULL **UNIQUE** | 카카오 가입일 때만 |
| `user_id` | 받은 회원(탈퇴해도 행은 남는다 — 탈퇴는 `users` 를 지우지 않는다) |
| `user_coupon_id` · `coupon_id` | 무엇을 줬나 |
| `store_id` | **가입 매장** — 매장마다 사업자가 달라 「누가 준 쿠폰인가」를 남긴다(POS 쿠폰의 발행처 기록과 같은 이유) |
| `granted_at` | |

- **탈퇴해도 이 표는 지우지 않는다** — 지우면 재가입으로 다시 받는다. 그 대신 전화번호 **원문은 남기지 않는다**(탈퇴가 `users.phone` 을 지우는 취지를 지킨다).
- 서버 키는 `.env` 의 새 값 `SIGNUP_KEY_SECRET`(64-hex). 🔴 **잃어버리면** 새 키로 만든 열쇠가 옛 열쇠와 달라져 **재가입자가 다시 받는다**
  — `AI_ENC_KEY` 와 같은 취급(백업 대상, 값은 문서에 적지 않는다). `check-env.js` 필수 목록에 더한다.
- 번호를 바꾼 사람은 다시 받을 수 있다 — 막을 방법이 없고(새 번호는 새 사람과 구분이 안 된다) 그걸로 충분하다고 본다.
- 🔴 **확인 필요(법무·개인정보)**: 탈퇴 뒤에도 전화번호 HMAC 을 남기는 것을 개인정보 처리방침에 「부정 이용 방지 목적, ○년 보관」으로 적어야 하는지,
  보관 기간을 얼마로 할지(예: 1년 뒤 삭제 — 그 뒤 재가입은 다시 받는다).
- 🔴 **확인 필요(세무)**: 가입 매장이 쿠폰을 「준」 것으로 볼지, 온라인(동신마켓)이 줄지 — 쓰는 곳은 주문 매장이라 매장 간 정산이 생길 수 있다
  (CLAUDE.md 의 POS 쿠폰·포인트 정산 원장과 같은 질문). 그래서 `store_id` 를 남긴다.

## 5. API

| 메서드·경로 | 권한 | 쓰기 | 하는 일 |
|---|---|---|---|
| `GET /api/signup-coupon` | 없음(손님) | **없음** | `{ enabled, label:'신규회원 10% 할인 쿠폰', sub:'2만 원 이상 주문 · 가입 후 30일' }` — **꺼져 있으면 `{ enabled:false }` 만**. 문구는 서버가 만든다 |
| `GET /api/admin/signup-coupon` | **owner** | 없음 | 설정 + 틀 + 지금까지 지급 수 · 사용 수 |
| `PUT /api/admin/signup-coupon` | **owner** | 설정·틀(조건이 바뀌면 새 틀) · `audit_logs` | `{ enabled, discount_type, discount, max_discount, min_purchase_amount, valid_days }` 검사(율 1~90 · 금액 > 0 · 일수 1~365) |
| `POST /api/register` (고침) | — | 위 3절 | 응답에 `signup_coupon` |
| `POST /api/orders` (고침) | — | — | `user_coupons.expires_at` 이 지났으면 「유효기간이 지난 쿠폰이에요!」 — **지금은 이 검사가 없다** |

전 매장 공통 정책이라 **owner 만** 바꾼다(store_manager 가 바꾸면 다른 매장 손님의 쿠폰이 바뀐다).

문구 규칙: `percent` → 「신규회원 10% 할인 쿠폰」 · `fixed` → 「신규회원 3,000원 할인 쿠폰」.
보조 줄: 최소 주문금액이 있으면 「2만 원 이상 주문」(만 원 단위면 「○만 원」, 아니면 「12,500원」) + 「가입 후 30일」.
`max_discount` 가 있으면 「최대 5,000원」을 덧붙인다.

## 6. 어드민 화면 — 쿠폰 관리(Coupons.js) › 「가입 쿠폰」 탭 (owner)

```
┌ 가입 쿠폰 ──────────────────────────────────────────┐
│ 가입 쿠폰 주기          [● 켬]   일반 가입·카카오 가입 모두 가입 즉시 지급 │
│ 할인                   (● 율 ○ 금액)  [ 10 ] %   최대 [ 5,000 ] 원    │
│ 최소 주문금액           [ 20,000 ] 원                              │
│ 유효기간               가입 후 [ 30 ] 일                            │
│ 손님에게 보이는 문구:   🎁 신규회원 10% 할인 쿠폰 · 2만 원 이상 주문 · 가입 후 30일 │
│ 지금까지 지급 128장 · 사용 41장                                     │
│ ⚠ 조건을 바꾸면 이미 받은 쿠폰은 받은 조건 그대로 남아요               │
│                                                 [ 저장 ]          │
└──────────────────────────────────────────────────┘
```

## 7. 쇼핑앱 화면 (목업 — 지시 4)

| 화면 | 켬 | 꺼짐 |
|---|---|---|
| P05 홈(로그인 안 함) | 검색 아래 쿠폰 띠 + 「가입하기」 | 띠 없음(「가입 쿠폰 꺼짐」 상태) |
| S40 회사 소개 | 쿠폰 띠 | 띠 없음 |
| S34 알림 | 「쿠폰이 적용됐어요 · 신규회원 10% 할인 쿠폰」 | 적용된 **다른 쿠폰 이름**(예시) |
| P04 가입 완료 | 지급된 쿠폰 카드 + 기한 | 쿠폰 칸 없음 |

## 8. 마이그레이션 초안 (적용 안 함)

파일 이름(만들 때): `srmart-backend/migrations/migration_signup_coupon_v1.sql`

```sql
-- 가입 쿠폰 (2026-11-12 초안 — 승인 전, 적용 안 함)
-- 적용(cmd에서 실행): mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart < C:\srmart\srmart-backend\migrations\migration_signup_coupon_v1.sql
CREATE TABLE IF NOT EXISTS signup_coupon_settings (
  id          TINYINT NOT NULL DEFAULT 1,
  enabled     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 이면 지급도 손님 문구도 없다',
  coupon_id   INT NULL COMMENT '지금 지급하는 틀(coupons.id). 조건을 바꾸면 새 틀로 옮긴다',
  valid_days  SMALLINT NOT NULL DEFAULT 30 COMMENT '가입 후 며칠 — user_coupons.expires_at 로 들어간다',
  updated_by  INT NULL,
  updated_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_scs_one CHECK (id = 1),
  CONSTRAINT fk_scs_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id),
  CONSTRAINT fk_scs_user   FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS signup_coupon_grants (
  id              INT NOT NULL AUTO_INCREMENT,
  phone_key       CHAR(64) NOT NULL COMMENT 'HMAC-SHA256(SIGNUP_KEY_SECRET, 숫자만 남긴 전화) — 원문 아님',
  kakao_key       CHAR(64) NULL COMMENT 'HMAC(키, kakao:회원번호) — 카카오 가입일 때만',
  user_id         INT NOT NULL,
  coupon_id       INT NOT NULL,
  user_coupon_id  INT NULL,
  store_id        INT NULL COMMENT '가입 매장 — 누가 준 쿠폰인가(매장마다 사업자가 다르다)',
  granted_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_scg_phone (phone_key),
  UNIQUE KEY uq_scg_kakao (kakao_key),
  KEY idx_scg_user (user_id),
  CONSTRAINT fk_scg_user   FOREIGN KEY (user_id) REFERENCES users (id),
  CONSTRAINT fk_scg_coupon FOREIGN KEY (coupon_id) REFERENCES coupons (id),
  CONSTRAINT fk_scg_store  FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='가입 쿠폰 지급 원장 — 탈퇴해도 지우지 않는다(재가입 중복 지급 방지)';

INSERT IGNORE INTO signup_coupon_settings (id, enabled, coupon_id, valid_days) VALUES (1, 0, NULL, 30);
-- 🔴 틀(coupons) 줄은 여기서 만들지 않는다 — 어드민에서 처음 켤 때 서버가 추측 어려운 코드로 만든다.
--    enabled=0 으로 시작한다: 할인값을 아무도 정하지 않은 쿠폰이 가입자에게 나가면 안 된다.
```

확인(같이 드림 · cmd에서 실행):
```
mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart -e "SHOW TABLES LIKE 'signup_coupon%'; SELECT id, enabled, coupon_id, valid_days FROM signup_coupon_settings;"
```

같이 해야 하는 것(코드 — 이번엔 안 함): `requiredSchema.js` 에 두 표 · `.env` `SIGNUP_KEY_SECRET` + `check-env.js` · 주문의 `expires_at` 검사 · 가입 응답 ·
쇼핑앱 문구를 `GET /api/signup-coupon` 에서 받기(`HomePage.jsx:185` 고정 문구 삭제).
