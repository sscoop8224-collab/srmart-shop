// 홈 검색창 오른쪽 AI 상담 단추(③ 로봇) · 처음 안내 말풍선 — 2026-11-13 B안.
//
// 이 자리에서 틀리면 손해가 큰 것:
//   · 단추는 글자 없이 아이콘만이라, 화면 읽기 이름 「AI 상담」 이 없으면 시각장애 손님에게 이 기능이 없다.
//   · 처음 안내는 닫거나 단추를 한 번 누르면 **다시 안 뜬다** — 매번 뜨면 검색 줄 아래 배송 줄을 늘 가린다.
//   · 저장이 막힌 기기(localStorage 가 던짐)에서도 홈이 깨지지 않는다.
import { fireEvent, render, screen } from '@testing-library/react';
import Home from './Home';

// CRA 는 시험마다 jest.fn 을 비운다(resetMocks) — 서버 흉내는 그냥 함수로 둔다
jest.mock('../api', () => ({
  __esModule: true,
  getDeliveryPromise: () => Promise.resolve({ mode: 'off' }),
  getSignupCoupon: () => Promise.resolve({ enabled: false }),
  getBusinessInfo: () => Promise.resolve({}),
  imgUrl: (x) => x,
}));

const base = {
  user: { id: 1 }, storeId: 11, storeShort: '왕길점', banners: [], categories: [],
  filterLarge: '전체', filterMedium: '전체', filterSmall: '전체', onLarge: jest.fn(), onMedium: jest.fn(), onSmall: jest.fn(),
  list: [], loading: false, error: null, onRetry: jest.fn(), sortOrder: 'default', setSortOrder: jest.fn(),
  wishlist: [], onWish: jest.fn(), onAdd: jest.fn(), onOpen: jest.fn(), onSearch: jest.fn(), onSignup: jest.fn(),
  fallbackImage: () => '',
};
const TIP = '궁금한 건 AI에게 물어보세요';

beforeEach(() => { localStorage.clear(); jest.restoreAllMocks(); });

test('단추는 이름 「AI 상담」 · 누르면 상담을 열고 처음 안내는 다시 안 뜬다', () => {
  const onAi = jest.fn();
  const { unmount } = render(<Home {...base} onAi={onAi} />);
  expect(screen.getByText(TIP)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'AI 상담' }));
  expect(onAi).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(TIP)).toBeNull();
  unmount();
  render(<Home {...base} onAi={onAi} />);
  expect(screen.queryByText(TIP)).toBeNull();
});

test('✕ 로 닫아도 다시 안 뜬다 · 상담은 열지 않는다', () => {
  const onAi = jest.fn();
  const { unmount } = render(<Home {...base} onAi={onAi} />);
  fireEvent.click(screen.getByRole('button', { name: '안내 닫기' }));
  expect(screen.queryByText(TIP)).toBeNull();
  expect(onAi).not.toHaveBeenCalled();
  unmount();
  render(<Home {...base} onAi={onAi} />);
  expect(screen.queryByText(TIP)).toBeNull();
});

test('저장이 막힌 기기에서도 홈이 그려지고 닫힌다', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  render(<Home {...base} onAi={jest.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: '안내 닫기' }));
  expect(screen.queryByText(TIP)).toBeNull();
});

test('상담을 열 수 없는 곳(onAi 없음)에는 단추도 안내도 없다', () => {
  render(<Home {...base} />);
  expect(screen.queryByRole('button', { name: 'AI 상담' })).toBeNull();
  expect(screen.queryByText(TIP)).toBeNull();
});
