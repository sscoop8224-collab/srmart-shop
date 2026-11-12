// 공지사항(S26) 확인 — 묶음 5 · F2.
//
// 이 화면에서 틀리면 손해가 큰 것:
//   · **서버에서 읽는다** — 예전 화면은 앱 메모리에만 들고 있어 손님에게 늘 빈 화면이었다.
//   · **관리자 등록이 서버로 간다** — 예전엔 그 기기 화면에만 생겼다가 사라졌다.
//   · **손님에게는 등록·숨기기 단추가 없다.**
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Notice from './Notice';

jest.mock('../api', () => ({
  __esModule: true,
  getShopNotices: jest.fn(),
  createShopNotice: jest.fn(),
  hideShopNotice: jest.fn(),
}));
const mockConfirm = jest.fn();
jest.mock('../DialogContext', () => ({ useDialog: () => ({ notify: jest.fn(), confirm: mockConfirm }) }));
const api = require('../api');

const ROWS = [
  { id: 2, store_id: null, title: '추석 연휴 배송 안내', body: '11월 15일은 배송이 하루 늦어질 수 있어요.', is_pinned: 1, created_at: '2026-11-01 09:00' },
  { id: 1, store_id: 11, title: '왕길점 영업시간 변경', body: '밤 10시까지 영업해요.', is_pinned: 0, created_at: '2026-10-20 10:00' },
];

beforeEach(() => {
  jest.clearAllMocks();
  api.getShopNotices.mockResolvedValue({ data: ROWS });
  api.createShopNotice.mockResolvedValue({ data: { id: 3 } });
  api.hideShopNotice.mockResolvedValue({ data: {} });
});

test('손님 — 지금 매장으로 서버에서 읽고, 누르면 펼친다. 등록·숨기기는 없다', async () => {
  render(<Notice storeId={11} isAdmin={false} goBack={jest.fn()} />);
  expect(await screen.findByText('추석 연휴 배송 안내')).toBeInTheDocument();
  expect(api.getShopNotices).toHaveBeenCalledWith(11);
  expect(screen.getByText('2026.11.01')).toBeInTheDocument();
  expect(screen.queryByText('11월 15일은 배송이 하루 늦어질 수 있어요.')).toBeNull();
  fireEvent.click(screen.getByText('추석 연휴 배송 안내'));
  expect(screen.getByText('11월 15일은 배송이 하루 늦어질 수 있어요.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '+ 등록' })).toBeNull();
  expect(screen.queryByRole('button', { name: '숨기기' })).toBeNull();
});

test('비어 있으면 빈 화면, 못 불러오면 다시 시도', async () => {
  api.getShopNotices.mockResolvedValueOnce({ data: [] });
  const { unmount } = render(<Notice storeId={11} goBack={jest.fn()} />);
  expect(await screen.findByText('등록된 공지사항이 없어요')).toBeInTheDocument();
  unmount();
  api.getShopNotices.mockRejectedValueOnce(new Error('net'));
  render(<Notice storeId={11} goBack={jest.fn()} />);
  expect(await screen.findByText('공지사항을 불러오지 못했어요')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  expect(await screen.findByText('추석 연휴 배송 안내')).toBeInTheDocument();
});

test('관리자 — 등록은 서버로 가고 목록을 다시 읽는다 · 숨기기는 묻고 나서', async () => {
  render(<Notice storeId={11} isAdmin goBack={jest.fn()} />);
  await screen.findByText('추석 연휴 배송 안내');
  fireEvent.click(screen.getByRole('button', { name: '+ 등록' }));
  fireEvent.change(screen.getByLabelText('제목'), { target: { value: '새 공지' } });
  fireEvent.change(screen.getByLabelText('내용'), { target: { value: '내용입니다' } });
  fireEvent.click(screen.getByRole('button', { name: '등록' }));
  await waitFor(() => expect(api.createShopNotice).toHaveBeenCalledWith({ title: '새 공지', body: '내용입니다' }));
  await waitFor(() => expect(api.getShopNotices).toHaveBeenCalledTimes(2));

  fireEvent.click(screen.getByText('왕길점 영업시간 변경'));
  mockConfirm.mockResolvedValueOnce(false);
  fireEvent.click(screen.getByRole('button', { name: '숨기기' }));
  await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
  expect(api.hideShopNotice).not.toHaveBeenCalled();
  mockConfirm.mockResolvedValueOnce(true);
  fireEvent.click(screen.getByRole('button', { name: '숨기기' }));
  await waitFor(() => expect(api.hideShopNotice).toHaveBeenCalledWith(1));
});
