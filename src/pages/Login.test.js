// 로그인(S27) · 회원가입 3단계(P04) 확인 — 묶음 5.
//
// 이 화면에서 틀리면 손해가 큰 것:
//   · **가입에 싣는 값** — 화면을 세 단계로 나눠도 서버에 가는 값(동의 셋 · 매장 · 우편번호 · 생년월일)은 그대로여야 한다.
//   · **필수 동의 없이 가입되지 않는다** — 서버도 막지만, 화면이 먼저 막아야 손님이 왜 안 되는지 안다.
//   · **가입 쿠폰** — 서버가 「지급했다」 할 때만 완료 화면에 쿠폰이 보인다.
//   · **휴대폰 확인(2026-11-16 지시 7)** — 서버가 켠 쪽의 표를 싣는다: 문자 인증이면 verificationToken, 본인확인이면 identityToken
//     (+ 이름·생년월일은 확인된 값). 둘 다 꺼져 있으면 예전과 같다.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Login from './Login';

jest.mock('../api', () => ({
  __esModule: true,
  getStores: jest.fn(),
  register: jest.fn(),
  getCoverage: jest.fn(),
  sendSignupCode: jest.fn(),
  verifySignupCode: jest.fn(),
}));
// 본인확인 켬/꺼짐 — 서버 GET /identity/status 대신. 시트는 업체 창 없이 바로 결과를 돌려준다(흐름은 identityClient 시험·서버 시험이 본다)
let mockIdLive = false;
jest.mock('../identity/useIdentityLive', () => ({ __esModule: true, default: () => [mockIdLive, jest.fn()] }));
jest.mock('../identity/IdentitySheet', () => {
  const actual = jest.requireActual('../identity/IdentitySheet');
  const { useEffect } = jest.requireActual('react');
  return { __esModule: true, ...actual, default: function FakeSheet({ onDone }) { useEffect(() => { onDone({ token: 'idt-1', name: '홍확인', birthdate: '1988-03-04', phone_masked: '010-****-5678', adult: true }); }, [onDone]); return null; } };
});
const mockNotify = jest.fn();
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: mockNotify, confirm: jest.fn() }) }));
jest.mock('../utils/customerStores', () => ({ branchList: () => '검암점·왕길점' }));
const api = require('../api');

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockIdLive = false;
  api.sendSignupCode.mockResolvedValue({ data: { enabled: false } });   // 지금 운영 — 문자 인증 꺼짐
  api.getStores.mockResolvedValue({ data: [{ id: 11, name: '에스알마트 왕길점' }, { id: 1, name: '에스알마트 검암점' }] });
  api.getCoverage.mockResolvedValue({ data: { stores: [{ store_id: 11, store_name: '에스알마트 왕길점' }], recommended: { store_id: 11, store_name: '에스알마트 왕길점' } } });
  window.daum = { Postcode: function Postcode(o) { this.open = () => o.oncomplete({ roadAddress: '인천 서구 왕길로 123', zonecode: '22689', bname: '왕길동' }); } };
});

test('로그인 — 빈 칸은 칸 아래에 바로 알리고, 서버 오류는 비밀번호 칸 아래에', async () => {
  const onLogin = jest.fn().mockRejectedValue({ response: { data: { error: '아이디 또는 비밀번호가 틀려요!' } } });
  render(<Login onLogin={onLogin} />);
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  expect(screen.getByText('아이디를 입력해주세요.')).toBeInTheDocument();
  expect(onLogin).not.toHaveBeenCalled();
  fireEvent.change(screen.getByPlaceholderText('아이디를 입력해 주세요'), { target: { value: 'guest_demo' } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력해 주세요'), { target: { value: 'pw' } });
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  expect(await screen.findByText('아이디 또는 비밀번호가 틀려요!')).toBeInTheDocument();
  expect(onLogin).toHaveBeenCalledWith({ username: 'guest_demo', password: 'pw' });
});

async function toStep2({ email = 'kim@example.com' } = {}) {
  render(<Login onLogin={jest.fn().mockResolvedValue()} initialMode="signup" />);
  await waitFor(() => expect(api.getStores).toHaveBeenCalled());
  fireEvent.change(screen.getByPlaceholderText('이름을 입력해 주세요'), { target: { value: '김손님' } });
  fireEvent.click(screen.getByRole('button', { name: '주소 찾기' }));
  // 주소를 넣으면 배송 매장을 가입 매장으로 정한다
  expect(await screen.findByText(/이 배송해요 · 가입 매장으로 정할게요/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByText('계정 만들기')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('아이디를 입력해 주세요'), { target: { value: 'kimson' } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력해 주세요'), { target: { value: 'abc' } });
  if (email !== null) fireEvent.change(screen.getByPlaceholderText('예) name@example.com'), { target: { value: email } });
}

async function toStep3(opt) {
  await toStep2(opt);
  fireEvent.change(screen.getByPlaceholderText('010-0000-0000'), { target: { value: '010-1234-5678' } });
  fireEvent.change(document.querySelector('input[type=date]'), { target: { value: '1990-05-12' } });
  // 서버 규칙(6자 · 2종)에 못 미치면 넘어가지 않는다
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByText('비밀번호는 6자 이상이어야 해요!')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력해 주세요'), { target: { value: 'abcd1234' } });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(await screen.findByRole('heading', { name: '동의' })).toBeInTheDocument();
}

test('가입 — 이메일은 선택: 비워 두면 그대로 가입하고, 빈 값을 보낸다(서버가 NULL 로 넣는다)', async () => {
  api.register.mockResolvedValue({ data: { signup_coupon: { granted: false } } });
  await toStep3({ email: null });
  fireEvent.click(screen.getByLabelText(/전체 동의/));
  fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
  await screen.findByText('가입을 환영해요, 김손님님!');
  expect(api.register.mock.calls[0][0].email).toBe('');
});

test('가입 — 이메일을 넣었으면 모양을 본다(틀리면 2단계에 머문다)', async () => {
  await toStep2({ email: 'kim@' });
  expect(screen.getByText('이메일 (선택)')).toBeInTheDocument();
  expect(screen.getByText('넣으시면 이메일로도 로그인할 수 있어요. 비워 두셔도 가입돼요.')).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText('010-0000-0000'), { target: { value: '010-1234-5678' } });
  fireEvent.change(document.querySelector('input[type=date]'), { target: { value: '1990-05-12' } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력해 주세요'), { target: { value: 'abcd1234' } });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(screen.getByText('이메일 모양이 맞지 않아요. 비워 두셔도 가입할 수 있어요.')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: '동의' })).toBeNull();
});

test('가입 — 필수 동의 없이는 가입하지 않는다', async () => {
  await toStep3();
  fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
  expect(screen.getByText('개인정보 수집·이용에 동의해주세요.')).toBeInTheDocument();
  expect(api.register).not.toHaveBeenCalled();
});

test('가입 — 서버에 가는 값은 예전 한 화면과 같고, 쿠폰은 지급됐을 때만 보인다', async () => {
  api.register.mockResolvedValue({ data: { signup_coupon: { granted: true, label: '신규회원 10% 할인 쿠폰', sub: '2만 원 이상 주문' } } });
  await toStep3();
  fireEvent.click(screen.getByLabelText(/개인정보 수집·이용 동의/));
  fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
  expect(await screen.findByText('가입을 환영해요, 김손님님!')).toBeInTheDocument();
  expect(api.register).toHaveBeenCalledWith(expect.objectContaining({
    name: '김손님', username: 'kimson', email: 'kim@example.com', password: 'abcd1234', phone: '010-1234-5678',
    address: '인천 서구 왕길로 123', addressDetail: '', birth: '1990-05-12',
    privacyConsent: true, thirdPartyConsent: false, marketing_push: false, isAdult: true,
    store_id: 11, zipcode: '22689', dong_name: '왕길동',
  }));
  expect(screen.getByText('신규회원 10% 할인 쿠폰')).toBeInTheDocument();
  expect(screen.getByText('왕길점')).toBeInTheDocument();
});

test('가입 완료 — 쿠폰을 안 줬으면 쿠폰 칸이 없다', async () => {
  api.register.mockResolvedValue({ data: { signup_coupon: { granted: false } } });
  await toStep3();
  fireEvent.click(screen.getByLabelText(/전체 동의/));
  fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
  expect(await screen.findByText('가입을 환영해요, 김손님님!')).toBeInTheDocument();
  expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ privacyConsent: true, thirdPartyConsent: true, marketing_push: true }));
  expect(screen.queryByText(/할인 쿠폰/)).toBeNull();
  expect(screen.getByText(/혜택 알림 수신에 동의하셨어요/)).toBeInTheDocument();
});

test('가입 — 문자 인증이 꺼져 있으면 묻기만 하고 넘어간다(표 없음)', async () => {
  api.register.mockResolvedValue({ data: { signup_coupon: { granted: false } } });
  await toStep3();
  expect(api.sendSignupCode).toHaveBeenCalledWith('010-1234-5678', 11);
  fireEvent.click(screen.getByLabelText(/전체 동의/));
  fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
  await screen.findByText('가입을 환영해요, 김손님님!');
  const sent = api.register.mock.calls[0][0];
  expect(sent.verificationToken).toBeUndefined();
  expect(sent.identityToken).toBeUndefined();
});

test('가입 — 문자 인증이 켜져 있으면 인증번호를 확인해야 넘어가고, 그 표를 싣는다', async () => {
  api.sendSignupCode.mockResolvedValue({ data: { enabled: true, sent: true } });
  api.verifySignupCode.mockResolvedValue({ data: { verificationToken: 'vt-1' } });
  api.register.mockResolvedValue({ data: { signup_coupon: { granted: false } } });
  await toStep2();
  fireEvent.change(screen.getByPlaceholderText('010-0000-0000'), { target: { value: '010-1234-5678' } });
  fireEvent.change(document.querySelector('input[type=date]'), { target: { value: '1990-05-12' } });
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력해 주세요'), { target: { value: 'abcd1234' } });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  const code = await screen.findByPlaceholderText('인증번호 6자리');
  expect(screen.queryByRole('heading', { name: '동의' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(await screen.findByText('인증번호를 확인해 주세요.')).toBeInTheDocument();
  fireEvent.change(code, { target: { value: '123456' } });
  fireEvent.click(screen.getByRole('button', { name: '확인' }));
  expect(await screen.findByText('휴대폰 인증을 마쳤어요')).toBeInTheDocument();
  expect(api.verifySignupCode).toHaveBeenCalledWith('010-1234-5678', '123456');
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(await screen.findByRole('heading', { name: '동의' })).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/전체 동의/));
  fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
  await screen.findByText('가입을 환영해요, 김손님님!');
  expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ verificationToken: 'vt-1', phone: '010-1234-5678' }));
});

test('가입 — 본인확인이 켜져 있으면 번호·생년월일 칸 대신 본인확인, 확인된 이름·생년월일과 표를 싣는다', async () => {
  mockIdLive = true;
  api.register.mockResolvedValue({ data: { signup_coupon: { granted: false } } });
  await toStep2();
  expect(screen.queryByPlaceholderText('010-0000-0000')).toBeNull();
  expect(document.querySelector('input[type=date]')).toBeNull();
  fireEvent.change(screen.getByPlaceholderText('비밀번호를 입력해 주세요'), { target: { value: 'abcd1234' } });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(await screen.findByText('휴대폰 본인확인을 해 주세요.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '휴대폰 본인확인' }));
  expect(await screen.findByText('본인확인을 마쳤어요')).toBeInTheDocument();
  expect(screen.getByText('010-****-5678')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  expect(await screen.findByRole('heading', { name: '동의' })).toBeInTheDocument();
  expect(api.sendSignupCode).not.toHaveBeenCalled();
  fireEvent.click(screen.getByLabelText(/전체 동의/));
  fireEvent.click(screen.getByRole('button', { name: '가입하기' }));
  expect(await screen.findByText('가입을 환영해요, 홍확인님!')).toBeInTheDocument();
  expect(api.register).toHaveBeenCalledWith(expect.objectContaining({ identityToken: 'idt-1', name: '홍확인', birth: '1988-03-04', phone: '', isAdult: true }));
});

test('가입 3단계 — 동의 줄 「보기」는 전문 시트(S49)만 열고 체크는 그대로 · 문안은 자리표시', async () => {
  await toStep3();
  const privacyBox = screen.getByLabelText(/개인정보 수집·이용 동의/);
  expect(privacyBox).not.toBeChecked();
  fireEvent.click(screen.getAllByRole('button', { name: '보기' })[0]);
  const sheet = screen.getByTestId('terms:privacy');
  expect(sheet).toHaveTextContent('문안 확정 전이에요');
  expect(sheet).toHaveTextContent('수집 항목');
  expect(privacyBox).not.toBeChecked();
  fireEvent.click(screen.getByRole('button', { name: '확인' }));
  expect(screen.queryByTestId('terms:privacy')).toBeNull();
  expect(screen.getAllByRole('button', { name: '보기' })).toHaveLength(3);
});
