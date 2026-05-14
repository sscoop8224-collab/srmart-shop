const NAV = [
  { section: '메인' },
  { page: 'adminPC', icon: 'ti-layout-dashboard', label: '대시보드' },
  { section: '운영' },
  { page: 'adminPC_orders', icon: 'ti-shopping-cart', label: '주문 관리' },
  { page: 'adminPC_products', icon: 'ti-package', label: '상품 관리' },
  { page: 'adminPC_inventory', icon: 'ti-stack-2', label: '재고 관리' },
  { page: 'adminPC_purchase', icon: 'ti-truck-delivery', label: '검수 매입' },
  { section: '고객' },
  { page: 'adminPC_members', icon: 'ti-users', label: '회원 관리' },
  { page: 'adminPC_reviews', icon: 'ti-message-circle', label: '리뷰 관리' },
  { section: '마케팅' },
  { page: 'adminPC_banners', icon: 'ti-photo', label: '배너 관리' },
  { page: 'adminPC_coupons', icon: 'ti-tag', label: '쿠폰 관리' },
  { section: '정산' },
  { page: 'adminPC_stats', icon: 'ti-chart-bar', label: '매출 통계' },
  { page: 'adminPC_settlement', icon: 'ti-credit-card', label: '카카오페이 정산' },
  { section: '설정' },
  { page: 'adminPC_settings', icon: 'ti-settings', label: '기본 설정' },
  { section: '' },
  { page: 'home', icon: 'ti-shopping-bag', label: '쇼핑몰 보기' },
];

const getColors = (dark) => ({
  sidebarBg:     dark ? '#1a1a1a' : '#ffffff',
  border:        dark ? '#2e2e2e' : '#eeeeee',
  logoSub:       dark ? '#888888' : '#888888',
  sectionText:   dark ? '#666666' : '#aaaaaa',
  navText:       dark ? '#bbbbbb' : '#666666',
  navActiveBg:   dark ? '#1a3a2a' : '#e6f9f1',
  navActiveText: '#009a58',
  navActiveBorder: '#00c471',
  adminName:     dark ? '#f0f0f0' : '#333333',
  adminRole:     dark ? '#888888' : '#aaaaaa',
  avatarBg:      dark ? '#1a3a2a' : '#e6f9f1',
  backBtn:       dark ? '#252525' : '#f5f5f3',
  backBtnText:   dark ? '#bbbbbb' : '#555555',
  backBtnBorder: dark ? '#2e2e2e' : '#e0e0e0',
});

export default function Sidebar({ currentPage, setPage, dark }) {
  const c = getColors(dark);

  return (
    <div style={{
      width: 220,
      background: c.sidebarBg,
      borderRight: `1px solid ${c.border}`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      height: '100vh',
      transition: 'background 0.2s',
    }}>
      <div style={{
        paddingLeft: 20, paddingRight: 20,
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: 16,
        borderBottom: `1px solid ${c.border}`,
      }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#00c471', letterSpacing: '-0.3px' }}>에스알마트</div>
        <div style={{ fontSize: 11, color: c.logoSub, marginTop: 2 }}>관리자 시스템</div>
      </div>

      <nav style={{ padding: '12px 0', flex: 1, overflowY: 'auto' }}>
        {NAV.map((item, i) => {
          if (item.section !== undefined) {
            if (!item.section) return <div key={i} style={{ height: 1, background: c.border, margin: '8px 0' }} />;
            return (
              <div key={i} style={{ fontSize: 10, color: c.sectionText, padding: '8px 20px 4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {item.section}
              </div>
            );
          }
          const isActive = currentPage === item.page;
          const isShop = item.page === 'home';
          return (
            <div
              key={item.page}
              onClick={() => setPage(item.page)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', fontSize: 13, cursor: 'pointer',
                borderLeft: `2px solid ${isActive ? '#00c471' : 'transparent'}`,
                background: isActive ? c.navActiveBg : 'transparent',
                color: isActive ? c.navActiveText : isShop ? '#6c5ce7' : c.navText,
                fontWeight: isActive ? 600 : isShop ? 500 : 400,
                transition: 'background 0.1s',
              }}
            >
              <i className={`ti ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
              {item.label}
              {isShop && <span style={{ marginLeft: 'auto', fontSize: 10, background: '#ede9fe', color: '#6c5ce7', padding: '1px 6px', borderRadius: 6 }}>앱</span>}
            </div>
          );
        })}
      </nav>

      <div style={{
        padding: '12px 20px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        borderTop: `1px solid ${c.border}`,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div onClick={() => setPage('adminHome')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: `1px solid ${c.backBtnBorder}`, background: c.backBtn, cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 15, color: c.backBtnText, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: c.backBtnText, fontWeight: 500 }}>앱으로 돌아가기</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: c.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#009a58', flexShrink: 0 }}>관</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.adminName }}>관리자</div>
            <div style={{ fontSize: 10, color: c.adminRole }}>슈퍼 어드민</div>
          </div>
        </div>
      </div>
    </div>
  );
}
