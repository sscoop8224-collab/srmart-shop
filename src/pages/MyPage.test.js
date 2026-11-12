// 마이(P02) 화면 확인 — 묶음 5.
//
// 이 화면에서 틀리면 손해가 큰 것:
//   · **쿠폰 수** — 예전 통계 칸은 서버에 없는 주소(/coupons/my)를 불러 늘 0장이었다. 지금은 `/users/me/coupons` 하나만 센다.
//   · **로그인 안 한 손님** — 예전엔 마이 자체가 없었다. 로그인·회원가입 단추가 있어야 한다.
//   · **로그인 이력의 IP** — 화면에 통째로 내지 않는다(앞 두 마디만).
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MyPage from './MyPage';

jest.mock('../api', () => {
  const get = jest.fn();
  return {
    __esModule: true,
    default: { get, put: jest.fn() },
    getMyPoints: jest.fn(),
    getMyActiveCoupons: jest.fn(),
    deleteAccount: jest.fn(),
    SITE: 'https://example.invalid',
  };
});
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: jest.fn(), confirm: jest.fn() }) }));
jest.mock('../ThemeContext', () => ({ useTheme: () => ({ themeMode: 'auto', setThemeMode: jest.fn() }) }));
jest.mock('../AuthContext', () => ({ useAuth: () => ({ login: jest.fn() }) }));
jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
const api = require('../api');

const USER = { id: 7, name: '김손님', username: 'guest_demo', email: 'demo@example.com', membership_tier: '단골' };

beforeEach(() => {
  api.getMyPoints.mockResolvedValue({ data: { points: 3820, expiring_soon: 500 } });
  api.getMyActiveCoupons.mockResolvedValue({ data: [
    { id: 1, coupon_name: '신규회원 10% 할인', discount_type: 'percent', discount: 10, min_purchase_amount: 20000, valid_until: '2099-12-31', code: 'WELCOME10', used_at: null },
    { id: 2, coupon_name: '배송비 3,000원 할인', discount_type: 'amount', discount: 3000, min_purchase_amount: 0, valid_until: '2099-11-30', code: 'SHIP3000', used_at: null },
    { id: 3, coupon_name: '가을맞이 2,000원', discount_type: 'amount', discount: 2000, min_purchase_amount: 15000, valid_until: '2026-10-31', code: 'FALL2000', used_at: '2026-10-02T10:00:00' },
  ] });
  api.default.get.mockResolvedValue({ data: [
    { ip: '211.234.10.20', success: 1, created_at: '2026-11-11T09:12:00' },
    { ip: '::ffff:118.235.1.2', success: 0, created_at: '2026-11-09T08:44:00' },
  ] });
});

test('로그인 안 한 손님 — 로그인·회원가입 단추와 공지·회사 소개, 로그아웃은 없다', () => {
  const onLogin = jest.fn();
  render(<MyPage user={null} goToPage={jest.fn()} onLogin={onLogin} onSignup={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '로그인' }));
  expect(onLogin).toHaveBeenCalled();
  expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
  expect(screen.getByText('공지사항')).toBeInTheDocument();
  expect(screen.getByText('회사 소개·사업자 정보')).toBeInTheDocument();
  expect(screen.queryByText('로그아웃')).toBeNull();
  expect(api.getMyActiveCoupons).not.toHaveBeenCalled();
});

test('로그인함 — 주문내역은 한 줄, 쿠폰은 쓸 수 있는 것만 센다(2장), 사라질 포인트 안내', async () => {
  render(<MyPage user={USER} orders={[{}, {}, {}]} wishlist={[{ id: 1 }, { id: 2 }]} goToPage={jest.fn()} onLogout={jest.fn()} />);
  expect(screen.getAllByText('주문내역')).toHaveLength(1);
  expect(screen.queryByText('구매 내역')).toBeNull();
  await waitFor(() => expect(screen.getAllByText('2장').length).toBeGreaterThan(0));
  expect(screen.getByText('3,820P')).toBeInTheDocument();
  expect(screen.getByText('30일 안에 500P가 사라져요')).toBeInTheDocument();
  // 쿠폰 시트 — 사용 가능 2 / 사용 완료 1
  fireEvent.click(screen.getByText('내 쿠폰'));
  expect(screen.getByRole('tab', { name: '사용 가능 2' })).toBeInTheDocument();
  expect(screen.getByText('신규회원 10% 할인')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: '사용 완료 1' }));
  expect(screen.getByText('가을맞이 2,000원')).toBeInTheDocument();
});

test('로그인 이력 — IP 는 앞 두 마디만 보인다', async () => {
  render(<MyPage user={USER} goToPage={jest.fn()} onLogout={jest.fn()} />);
  fireEvent.click(screen.getByText('로그인 이력'));
  expect(await screen.findByText('211.234.*.*')).toBeInTheDocument();
  expect(screen.getByText('118.235.*.*')).toBeInTheDocument();
  expect(screen.queryByText(/211\.234\.10\.20/)).toBeNull();
  expect(screen.getByText('실패')).toBeInTheDocument();
});

test('로그아웃 줄은 확인을 묻는 쪽(onLogout 인자 없음)으로 부른다', () => {
  const onLogout = jest.fn();
  render(<MyPage user={USER} goToPage={jest.fn()} onLogout={onLogout} />);
  fireEvent.click(screen.getByText('로그아웃'));
  expect(onLogout).toHaveBeenCalledWith();
});
