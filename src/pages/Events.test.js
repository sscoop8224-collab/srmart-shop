// 이벤트(S45) 확인 — 묶음 6.
//
// 이 화면에서 틀리면 손해가 큰 것:
//   · 행사 상품은 **그 이벤트에 연결된 것만** 서버에 묻는다(event_id) — 다른 행사가 섞이면 손님이 엉뚱한 값을 본다.
//   · 값은 **서버가 낸 행사가**(promo_price) 그대로 — 화면에서 다시 계산하지 않는다(계산대와 달라진다).
//   · 지금 매장에서 안 파는 상품은 빼고 **몇 개 뺐는지** 말한다.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Events from './Events';

jest.mock('../api', () => ({ __esModule: true, getActiveEvents: jest.fn(), getActivePromotions: jest.fn(), imgUrl: (p) => p }));
const api = require('../api');

const EVENTS = [{ id: 2, title: '음료 20% 할인', description: '시원한 음료를 20% 싸게', start_date: '2026-11-09T15:00:00.000Z', end_date: '2026-11-20T14:59:59.000Z', image_url: null }];
const PRODUCTS = [{ id: 102, name: '코카콜라', spec: '1.5L', large: '음료', price: 3200 }];

beforeEach(() => {
  jest.clearAllMocks();
  api.getActiveEvents.mockResolvedValue({ data: EVENTS });
  api.getActivePromotions.mockResolvedValue({ data: [{ id: 42, label: '20%', products: [{ product_id: 102, promo_price: 2560 }, { product_id: 999, promo_price: 1000 }] }] });
});

test('목록 → 상세: 그 이벤트로만 묻고, 서버 행사가 그대로 · 안 파는 상품은 개수를 말한다', async () => {
  render(<Events storeId={11} products={PRODUCTS} goBack={jest.fn()} goToHome={jest.fn()} onProductClick={jest.fn()} onAddToCart={jest.fn()} onToggleWish={jest.fn()} />);
  expect(await screen.findByText('음료 20% 할인')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /행사 상품 보기/ }));
  await waitFor(() => expect(api.getActivePromotions).toHaveBeenCalledWith(11, 2));
  expect(await screen.findByText('2,560원')).toBeInTheDocument();
  expect(screen.getByText('20%', { selector: '.pill' })).toBeInTheDocument();
  expect(screen.getByText('지금 매장에서 팔지 않는 상품 1개는 빼고 보여 드려요.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /이벤트/ }));
  expect(await screen.findByRole('button', { name: /행사 상품 보기/ })).toBeInTheDocument();
});

test('연결된 행사가 없으면 그렇게 말한다 · 이벤트가 없으면 빈 화면', async () => {
  api.getActivePromotions.mockResolvedValueOnce({ data: [] });
  const { unmount } = render(<Events storeId={11} products={PRODUCTS} goBack={jest.fn()} goToHome={jest.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: /행사 상품 보기/ }));
  expect(await screen.findByText('이 이벤트에 연결된 행사 상품이 없어요')).toBeInTheDocument();
  unmount();
  api.getActiveEvents.mockResolvedValueOnce({ data: [] });
  render(<Events storeId={11} products={PRODUCTS} goBack={jest.fn()} goToHome={jest.fn()} />);
  expect(await screen.findByText('진행 중인 이벤트가 없어요')).toBeInTheDocument();
});
