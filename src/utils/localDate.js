// 🔴 **날짜는 한국 시간으로 만든다** (2026-10-23 대표님 판단 ③)
//
// ── 무엇이 있었나 ────────────────────────────────────────────────────────
//
// 세 곳이 `new Date().toISOString()` 을 날짜로 잘라 쓰고 있었다. `toISOString()` 은
// **UTC** 라, 한국 시간 **오전 9시 전**에는 **하루 전 날짜**가 나온다.
//
//     KST 2026-10-23 08:30  →  toISOString()  →  '2026-10-22T23:30:00.000Z'  →  '2026-10-22'
//
// | 어디 | 틀리면 |
// |---|---|
// | `EventManager` 「행사 즉시 종료」 | 종료일이 **어제**로 들어간다 — 기록상 어제 끝난 행사가 된다 |
// | `Login` 생년월일 입력 상한(`max`) | 오전 9시 전에는 **오늘 태어난 아기**를 못 넣는다(사소하지만 같은 결함) |
// | `SalesManagement` 조회 기간 | "오늘" 을 조회해도 **어제까지**만 나온다 — 숫자가 비어 보인다 |
//
// 🔴 **어드민에서 열 곳이 같은 모양이었다**(2026-10-23) — 그래서 거기엔 빌드 전에
//    막는 검사기를 붙였다(`srmart-admin/tools/check-local-date.cjs`). 쇼핑앱은 자리가
//    셋뿐이라 공용 함수로 모으는 것으로 둔다.

/** 두 자리로 — 1 → '01'. */
const p2 = (n) => String(n).padStart(2, '0');

/**
 * 그 `Date` 의 **로컬(KST) 연·월·일**을 `YYYY-MM-DD` 로.
 *
 * 🔴 `toISOString().slice(0,10)` 을 쓰지 마라 — 위 머리말의 이유다.
 */
export function ymdLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/**
 * 오늘(로컬) `YYYY-MM-DD`. `plusDays` 로 앞뒤 날짜도 만든다.
 *
 * 🔴 `setDate` 로 더한다 — `+ 86400000` 은 서머타임이 있는 지역에서 틀린다.
 *    한국은 서머타임이 없지만, 그 사실에 기대는 코드를 새로 만들지 않는다.
 */
export function todayYmd(plusDays = 0) {
  const d = new Date();
  if (plusDays) d.setDate(d.getDate() + plusDays);
  return ymdLocal(d);
}
