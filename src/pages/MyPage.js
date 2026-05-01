function MyPage({ user, orders, wishlist, goToPage, onLogout }) {
  const menuItems = [
    { icon: '📋', label: '주문내역', sub: orders.length + '건', page: 'orders' },
    { icon: '❤️', label: '찜 목록', sub: wishlist.length + '개', page: 'wishlist' },
    { icon: '📢', label: '공지사항', sub: '', page: 'notice' },
  ];

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 프로필 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #00c471, #00a85e)', padding: '40px 20px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: '2px solid rgba(255,255,255,0.4)' }}>👤</div>
          <div>
            <p style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 0 4px' }}>{user?.name}님</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: 0 }}>{user?.email}</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ margin: '-28px 16px 0', background: 'white', borderRadius: '20px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', padding: '16px', cursor: 'pointer' }} onClick={() => goToPage('orders')}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#00c471', margin: '0 0 4px' }}>{orders.length}</p>
          <p style={{ fontSize: '12px', color: '#868e96', margin: 0, fontWeight: '600' }}>주문내역</p>
        </div>
        <div style={{ textAlign: 'center', padding: '16px', cursor: 'pointer', borderLeft: '1px solid #f1f3f5' }} onClick={() => goToPage('wishlist')}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#ff4757', margin: '0 0 4px' }}>{wishlist.length}</p>
          <p style={{ fontSize: '12px', color: '#868e96', margin: 0, fontWeight: '600' }}>찜 목록</p>
        </div>
      </div>

      {/* 메뉴 */}
      <div style={{ margin: '16px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {menuItems.map((menu, index) => (
          <div
            key={menu.label}
            onClick={() => goToPage(menu.page)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: index < menuItems.length - 1 ? '1px solid #f8f9fa' : 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: '#f8f9fa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{menu.icon}</div>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#212529' }}>{menu.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {menu.sub && <span style={{ fontSize: '13px', color: '#00c471', fontWeight: '700' }}>{menu.sub}</span>}
              <span style={{ color: '#adb5bd', fontSize: '18px' }}>›</span>
            </div>
          </div>
        ))}
      </div>

      {/* 로그아웃 */}
      <div style={{ margin: '0 16px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', background: '#fff0f1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🚪</div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#ff4757' }}>로그아웃</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#dee2e6' }}>© 2026 Dongsin Market. All rights reserved.</p>
    </div>
  );
}

export default MyPage;