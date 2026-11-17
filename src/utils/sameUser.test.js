import { sameUser, payerKey } from './sameUser';

test('같은 회원 — 번호가 있으면 번호로, 이메일 없는 두 사람은 다른 사람', () => {
  expect(sameUser({ id: 3, email: null }, { id: 3, email: null })).toBe(true);
  expect(sameUser({ id: 3, email: null }, { id: 4, email: null })).toBe(false);
  expect(sameUser({ email: null }, { email: null })).toBe(false);   // 예전 u.email === user.email 은 여기서 true 였다
  expect(sameUser({ email: 'a@b.kr' }, { id: 9, email: 'a@b.kr' })).toBe(true);
  expect(sameUser(null, { id: 1 })).toBe(false);
});

test('결제 손님 구분 값 — 이메일 · 없으면 uid:<번호>', () => {
  expect(payerKey({ id: 7, email: 'a@b.kr' })).toBe('a@b.kr');
  expect(payerKey({ id: 7, email: null })).toBe('uid:7');
  expect(payerKey(null)).toBe(null);
});
