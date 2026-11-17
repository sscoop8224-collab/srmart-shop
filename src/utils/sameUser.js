// 같은 회원인가 — 회원 번호가 있으면 번호로, 없으면 이메일로(둘 다 있을 때만) 본다 (2026-11-17 가입 이메일 선택)
//   예전엔 `u.email === user.email` 로 봤다. 이메일 없는 회원이 생기면 null === null 이 참이 되어
//   남의 기록(성인 여부·마이페이지 값)을 내 것으로 집을 수 있다.
export function sameUser(a, b) {
  if (!a || !b) return false;
  if (a.id != null && b.id != null) return String(a.id) === String(b.id);
  return !!a.email && !!b.email && a.email === b.email;
}

// 결제 서버에 넘기는 손님 구분 값 — 이메일 · 없으면 uid:<번호>(백엔드 주문 열쇠와 같은 규칙 · src/services/orderOwner.js)
export function payerKey(user) {
  if (!user) return null;
  if (user.email) return user.email;
  return user.id != null ? `uid:${user.id}` : (user.username || null);
}
