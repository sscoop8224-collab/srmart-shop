function AdminHome({ setPage, products, orders, users, goBack }) {
  const todaySales = orders
    .filter((o) => new Date(o.date).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingOrders = orders.filter((o) => !o.status || o.status === '결제완료').length;
  const soldOutProducts = products.filter((p) => p.isSoldOut).length;

  const stats = [
    { label: '전체 상품', value: products.length + '개', icon: '📦', bg: '#e8faf3', color: '#00a85e' },
    { label: '전체 주문', value: orders.length + '건', icon: '📋', bg: '#e8f0fe', color: '#1a73e8' },
    { label: '전체 회원', value: users.length + '명', icon: '👥', bg: '#fff3e0', color: '#e65100' },
    { label: '오늘 매출', value: '₩' + todaySales.toLocaleString(), icon: '💰', bg: '#fce4ec', color: '#c62828' },
  ];

  const alerts = [
    pendingOrders > 0 && { icon: '🔔', text: `미처리 주문 ${pendingOrders}건이 있어요!`, color: '#fff3cd', textColor: '#856404', page: 'adminOrders' },
    soldOutProducts > 0 && { icon: '⚠️', text: `품절 상품 ${soldOutProducts}개가 있어요!`, color: '#fff0f1', textColor: '#c62828', page: 'admin' },
  ].filter(Boolean);

  const menus = [
    { icon: '📦', label: '상품 관리', desc: '상품 등록/수정/삭제', page: 'admin' },
    { icon: '📂', label: '카테고리 관리', desc: '카테고리 설정', page: 'admin' },
    { icon: '👥', label: '회원 관리', desc: '회원 조회/관리', page: 'members' },
    { icon: '📋', label: '주문 관리', desc: '전체 주문 내역', page: 'adminOrders' },
    { icon: '🖼️', label: '배너 관리', desc: '배너 등록/삭제', page: 'bannerManager' },
    { icon: '🎟️', label: '쿠폰 관리', desc: '쿠폰 등록/관리', page: 'couponManager' },
    { icon: '📊', label: '매출 통계', desc: '매출 분석', page: 'salesStats' },
    { icon: '✏️', label: '문구 관리', desc: '메시지 설정', page: 'admin' },
    { icon: '🛒', label: '쇼핑몰 보기', desc: '고객 화면 미리보기', page: 'home' },
  ];

  const statusColor = {
    '결제완료': { bg: '#e8faf3', color: '#00a85e' },
    '배송중': { bg: '#fff3cd', color: '#f0a500' },
    '배송완료': { bg: '#e8f0fe', color: '#1a73e8' },
    '취소': { bg: '#fff0f1', color: '#ff4757' },
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #00c471, #00a85e)', padding: '24px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <h2 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '800' }}>⚙️ 관리자 대시보드</h2>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>에스알마트 관리 시스템</p>
      </div>

      {/* 통계 카드 */}
      <div style={{ margin: '-20px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', position: 'relative', zIndex: 2 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', background: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <p style={{ fontSize: '11px', color: '#868e96', margin: '0 0 3px', fontWeight: '600' }}>{stat.label}</p>
              <p style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: stat.color }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 알림 */}
      {alerts.length > 0 && (
        <div style={{ margin: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map((alert, index) => (
            <div key={index} onClick={() => setPage(alert.page)} style={{ background: alert.color, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span style={{ fontSize: '18px' }}>{alert.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: alert.textColor }}>{alert.text}</span>
              <span style={{ marginLeft: 'auto', color: alert.textColor, fontSize: '16px' }}>›</span>
            </div>
          ))}
        </div>
      )}

      {/* 빠른 메뉴 */}
      <div style={{ margin: '16px 16px 0' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 12px' }}>빠른 메뉴</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {menus.map((menu) => (
            <div key={menu.label} onClick={() => setPage(menu.page)} style={{ background: 'white', borderRadius: '14px', padding: '14px 10px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f3f5' }}>
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>{menu.icon}</span>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#212529', margin: '0 0 3px', wordBreak: 'keep-all' }}>{menu.label}</p>
              <p style={{ fontSize: '10px', color: '#adb5bd', margin: 0, wordBreak: 'keep-all' }}>{menu.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 주문 */}
      <div style={{ margin: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p style={{ fontSize: '15px', fontWeight: '800', color: '#212529', margin: 0 }}>최근 주문 내역</p>
          <button onClick={() => setPage('adminOrders')} style={{ fontSize: '13px', color: '#00c471', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>전체보기 →</button>
        </div>
        {orders.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', color: '#adb5bd', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px', opacity: '0.6' }}>📋</span>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#495057', margin: '0 0 6px' }}>아직 주문이 없어요!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.slice(0, 5).map((order) => {
              const status = order.status || '결제완료';
              const sc = statusColor[status] || statusColor['결제완료'];
              return (
                <div key={order.id} onClick={() => setPage('adminOrders')} style={{ background: 'white', borderRadius: '14px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <p style={{ fontSize: '11px', color: '#adb5bd', margin: 0, fontFamily: 'monospace' }}>{order.id.slice(-8)}</p>
                    <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#212529', margin: 0 }}>
                      {order.items[0].name} {order.items.length > 1 ? '외 ' + (order.items.length - 1) + '건' : ''}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{order.totalPrice.toLocaleString()}</p>
                  </div>
                  <p style={{ fontSize: '11px', color: '#adb5bd', margin: '4px 0 0' }}>{order.date}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminHome;