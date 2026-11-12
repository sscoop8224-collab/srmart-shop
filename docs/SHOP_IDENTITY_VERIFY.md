# 쇼핑앱 휴대폰 본인확인 — 설계 (2026-11-12 대표님 지시 블록 4)

> 서버: `srmart-backend` 커밋 `3ca0728`(로컬 · push 전) · 마이그레이션 `migration_identity_alcohol_v1.sql` **적용 대기**
> 목업: S48(업체 창) · 가입 2단계 · 마이 「본인확인 하기」 · 아이디 찾기 · 비밀번호 재설정(S29) · 번호 변경(S21)

## 무엇을 하나

휴대폰 본인확인(통신사 인증) 하나로 다섯 가지를 한다.

| 목적(`purpose`) | 어디서 | 결과 |
|---|---|---|
| `signup` | 가입 2단계 | 이름·생년월일·번호를 **확인된 값**으로 넣는다. 가입 쿠폰은 이 가입에만 |
| `find_id` | 아이디 찾기 | 그 사람의 아이디를 **가려서** 보여 준다(`srm***01`) |
| `reset_password` | 비밀번호 재설정 | 아이디 + 본인확인이 같은 사람이면 재설정 표를 준다 |
| `verify_member` | 마이 「본인확인 하기」 | 기존 회원의 이름·생일·번호를 확인된 값으로 바꾼다 |
| `phone_change` | 번호 변경 | 본인확인한 번호로만 바꾼다(손으로 친 번호는 받지 않는다) |

확인 결과는 **15분 안에 한 번**, **그 목적에만** 쓴다 — 가입용 확인으로 남의 비밀번호를 바꾸지 못하게.

## 무엇을 남기나 (이것만)

이름 · 생년월일 · 인증된 번호 · 인증 일시(`users.identity_verified_at`) · **CI 의 HMAC**(`users.ci_hash`)

- 🔴 **CI 원문 · 주민등록번호 · 신분증 사진은 받지도 남기지도 않는다.** CI 는 업체 응답에서 받는 즉시
  `IDENTITY_CI_SECRET` 으로 HMAC 하고 원문은 버린다(`src/services/identity/index.js` 밖으로 안 나간다).
- `ci_hash` 의 쓰임: 아이디 찾기 · 같은 사람 판정 · 가입 쿠폰 같은 사람 1회(`signup_coupon_grants.ci_key`).
- 탈퇴하면 `ci_hash`·`identity_verified_at` 도 지운다. 가입 쿠폰 원장의 `ci_key` 는 다른 열쇠와 같이 1년 뒤 지운다.

## 「연동 켬」 — 전환 스위치는 하나

`identity.status().live` 가 참일 때만 본인확인 길이 열리고, 그때 **옛 문자 인증 가입·재설정이 닫힌다**
(`send-code`·`verify-code` 가 `USE_IDENTITY` 로 돌려준다).

live 조건: **진짜 업체 어댑터 + 그 업체 열쇠 전부 + `IDENTITY_CI_SECRET`(64자리 hex)**

- `IDENTITY_PROVIDER=mock` 은 **운영에서 절대 켜지지 않는다** — 아무 이름이나 「확인됨」 이 되는 시험용이라.
  127.0.0.1 임시 서버의 실행 줄에 `IDENTITY_MOCK_LIVE=1` 을 줄 때만 켜진다(`.env` 에 넣지 않는다).
- `vendor` 자리는 **구조만** 있다(`notImplemented`) — 계약 업체가 정해지면 그 업체 이름으로 어댑터를 만든다.

### 계약 뒤 `.env` 에 넣을 이름 (값은 문서에 적지 않는다)

| 이름 | 무엇 |
|---|---|
| `IDENTITY_PROVIDER` | 업체 어댑터 이름 |
| `IDENTITY_CI_SECRET` | 64자리 hex — 🔴 **잃으면 기존 회원과 같은 사람인지 못 가린다.** `BACKUP_CREDENTIALS` 에 같이 둔다 |
| `IDENTITY_SITE_CODE` · `IDENTITY_SITE_PASSWORD` · `IDENTITY_ENC_KEY` · `IDENTITY_RETURN_URL` | 업체 열쇠(NICE 계열 기준 — 업체에 따라 바뀐다) |

## 회원 정보 고치기의 바뀐 점

- 🔴 **회원이 스스로 「성인」 을 고를 수 없다.** 예전엔 `PUT /api/users/:id` 가 손님이 보낸 `is_adult` 를
  그대로 저장했다(옛 결함). 성인 여부는 본인확인한 생년월일로만 정한다.
- 본인확인한 회원은 이름을 스스로 못 바꾼다. 연동 켬이면 번호도 본인확인으로만 바꾼다(`PHONE_NEEDS_IDENTITY`).
- 관리자 수정은 예전 그대로.

## 연동이 꺼져 있는 동안

가입·재설정은 **옛 문자 인증** 그대로이고, 아이디 찾기는 「준비 중」. 가입 쿠폰은 **나가지 않는다**
(「지급 가능」 판정이 `verify_off` — 홈·가입 화면도 쿠폰을 약속하지 않는다).

## 🔴 확인 필요

- CI(HMAC) 보관 기간 — 지금은 회원인 동안 + 가입 쿠폰 원장 1년. 개인정보 처리방침 문안에 넣을 것.
- 업체 선정(NICE·KCB·PASS 등)과 요금.

## 검사

`srmart-backend/tools/check-identity-alcohol.cjs`(자가 시험 8건) — mock 이 운영에서 안 켜지는지 · 한 번만 · 목적 고정 ·
CI 가 응답에 안 섞이는지 · 회원 스스로 성인 못 고르는지. 재시작 관문(`restart-backend.ps1`)에 들어 있다.
