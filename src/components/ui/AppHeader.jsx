import Icon from './Icon';
import { BRAND } from '../../brand';

// 홈 헤더(P05) — 로고 이미지 · 매장 · 종(공지) · 로그인 (목업 homebar(), 묶음 1 · 2026-11-12)
// 로고는 SRM 로고 이미지(외부 손글씨 글꼴 안 씀 — F7). AI 상담은 헤더에서 뺐다 — 홈 검색창 오른쪽 단추(2026-11-13 B안 · ③ 로봇).
// 로그아웃은 헤더에서 뺐다 — 마이 맨 아래(결정 11).
// 종 위 빨간 점(bellDot) — 마지막으로 본 공지보다 새 공지가 있을 때(utils/noticeSeen.js · 2026-11-17 낮 지시 5)
export default function AppHeader({ storeName, onStoreClick, onHome, onBell, bellDot, loggedIn, onLogin }) {
  return (
    <header className="app-nav">
      <div className="homebar">
        <img src={BRAND.logo} alt={BRAND.name} onClick={onHome} />
        {storeName && (
          <button type="button" className="store-chip" onClick={onStoreClick} disabled={!onStoreClick}>
            {storeName}{onStoreClick && <Icon name="chevD" size="sm" />}
          </button>
        )}
        <span className="sp" />
        <button type="button" className="icon-btn" aria-label={bellDot ? '공지 — 새 공지 있음' : '공지'} onClick={onBell}><Icon name="bell" />{bellDot && <span className="dot" aria-hidden="true" />}</button>
        {!loggedIn && <button type="button" className="ui-btn sm sec" onClick={onLogin}>로그인</button>}
      </div>
    </header>
  );
}
