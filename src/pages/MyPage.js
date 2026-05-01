function MyPage({ user, orders, wishlist, goToPage, onLogout }) {
  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f3f5' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>👤 마이페이지</h2>
      </div>

      {/* 프로필 */}
      <div style={{ padding: '24px 20px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>👤</div>
        <div>
          <p style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px' }}>{user?.name}님</p>
          <p style={{ fontSize: '13px', opacity: '0.85', margin: 0 }}>{user?.email}</p>
        </div>
      </div>

      {/* 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#f1f3f5', margin: '0 0 8px' }}>
        <div style={{ background: 'white', padding: '20px', textAlign: 'center', cursor: 'pointer' }} onClick={() => goToPage('orders')}>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#00c471', margin: '0 0 4px' }}>{orders.length}</p>
          <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>주문내역</p>
        </div>
        <div style={{ background: 'white', padding: '20px', textAlign: 'center', cursor: 'pointer' }} onClick={() => goToPage('wishlist')}>
          <p style={{ fontSize: '24px', fontWeight: '800', color: '#ff4757', margin: '0 0 4px' }}>{wishlist.length}</p>
          <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>찜 목록</p>
        </div>
      </div>

      <div style={{ height: '8px', background: '#f1f3f5' }} />

      {/* 메뉴 목록 */}
      <div style={{ background: 'white' }}>
        {[
          { icon: '📋', label: '주문내역', page: 'orders' },
          { icon: '❤️', label: '찜 목록', page: 'wishlist' },
          { icon: '📢', label: '공지사항', page: 'notice' },
        ].map((menu) => (
          <div
            key={menu.label}
            onClick={() => goToPage(menu.page)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f1f3f5', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>{menu.icon}</span>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#212529' }}>{menu.label}</span>
            </div>
            <span style={{ color: '#adb5bd', fontSize: '18px' }}>›</span>
          </div>
        ))}
      </div>

      <div style={{ height: '8px', background: '#f1f3f5' }} />

      {/* 로그아웃 */}
      <div style={{ background: 'white' }}>
        <div
          onClick={onLogout}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🚪</span>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#ff4757' }}>로그아웃</span>
          </div>
          <span style={{ color: '#adb5bd', fontSize: '18px' }}>›</span>
        </div>
      </div>
    </div>
  );
}

export default MyPage;