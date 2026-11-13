// 앱이 통째로 뜨는지 — CRA 처음 만든 「learn react」 예시를 바꿨다(2026-11-13 16항목 14).
// 서버는 부르지 않는다: api 가 못 받아도(시험 환경엔 서버가 없다) 홈 헤더와 검색 줄은 그려져야 한다 —
// 서버가 잠깐 안 붙는 날 손님 화면이 하얗게 비면 안 되기 때문이다.
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './AuthContext';
import { StoreProvider } from './StoreContext';

test('서버 없이도 홈 헤더·검색창·AI 상담 단추가 뜬다(헤더에는 AI 단추가 없다)', async () => {
  render(<AuthProvider><StoreProvider><App /></StoreProvider></AuthProvider>);
  expect(await screen.findByRole('button', { name: '상품 검색' }, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'AI 상담' })).toBeInTheDocument();
  expect(document.querySelector('.homebar')).not.toBeNull();   // 헤더가 실제로 있어야 아래 「없다」가 뜻이 있다
  expect(document.querySelector('.homebar [aria-label="AI 상담"]')).toBeNull();
});
