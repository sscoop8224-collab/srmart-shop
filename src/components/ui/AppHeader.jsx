import Icon from './Icon';
import logo from '../../assets/brand/logo_h_ko.png';

// 홈 헤더(P05) — 로고 이미지 · 매장 · AI 상담 · 종(공지) · 로그인 (목업 homebar(), 묶음 1 · 2026-11-12)
// 로고는 SRM 로고 이미지(외부 손글씨 글꼴 안 씀 — F7). AI 상담은 떠 있는 단추 대신 여기서 연다(토큰 문서 4절 7).
// 로그아웃은 헤더에서 뺐다 — 마이 맨 아래(결정 11).
export default function AppHeader({ storeName, onStoreClick, onHome, onAi, onBell, loggedIn, onLogin }) {
  return (
    <header className="app-nav">
      <div className="homebar">
        <img src={logo} alt="에스알마트" onClick={onHome} />
        {storeName && (
          <button type="button" className="store-chip" onClick={onStoreClick} disabled={!onStoreClick}>
            {storeName}{onStoreClick && <Icon name="chevD" size="sm" />}
          </button>
        )}
        <span className="sp" />
        <button type="button" className="icon-btn" aria-label="AI 상담" onClick={onAi}><Icon name="sparkle" /></button>
        <button type="button" className="icon-btn" aria-label="공지" onClick={onBell}><Icon name="bell" /></button>
        {!loggedIn && <button type="button" className="ui-btn sm sec" onClick={onLogin}>로그인</button>}
      </div>
    </header>
  );
}
