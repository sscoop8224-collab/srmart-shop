import Icon from './Icon';

// 하단 탭바 — 홈 · 검색 · 장바구니 · 주문내역 · 마이 (결정 6 · 목업 tabbar(), 묶음 1 · 2026-11-12)
// 찜은 마이 안(「찜한 상품」 줄)으로 갔다. 폰·태블릿·PC 모두 이 탭바 하나(태블릿 상단 메뉴 없앰 — F9).
// 떠 있는 검색 단추는 없앴다(떠 있는 단추 금지 — 토큰 문서 4절 7).
const TABS = [
  { key: 'home', icon: 'home', label: '홈', pages: ['home'] },
  { key: 'search', icon: 'search', label: '검색', pages: ['search'] },
  { key: 'cart', icon: 'cart', label: '장바구니', pages: ['cart'], login: true },
  { key: 'orders', icon: 'receipt', label: '주문내역', pages: ['orders', 'purchases', 'receipt'], login: true },
  // 마이는 로그인 안 해도 연다(S47 — 로그인·회원가입 단추가 있는 마이) · 묶음 5
  { key: 'mypage', icon: 'user', label: '마이', pages: ['mypage', 'wishlist', 'notificationSettings', 'about', 'notice'] },
];

export default function TabBar({ page, cartCount = 0, loggedIn, onGo, onNeedLogin }) {
  return (
    <nav className="tabbar" aria-label="아래 메뉴">
      <div className="in">
        {TABS.map((t) => {
          const on = t.pages.includes(page);
          return (
            <button
              key={t.key}
              type="button"
              className={'tab' + (on ? ' on' : '')}
              aria-current={on ? 'page' : undefined}
              onClick={() => (t.login && !loggedIn ? onNeedLogin(t.key) : onGo(t.key))}
            >
              <Icon name={t.icon} />
              <span>{t.label}</span>
              {t.key === 'cart' && cartCount > 0 && <span className="bdg">{cartCount}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
