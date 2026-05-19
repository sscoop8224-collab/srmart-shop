function AdminHome({ setPage, products, orders, users, goBack, darkMode }) {
  const todaySales = orders
    .filter((o) => new Date(o.date).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingOrders = orders.filter((o) => !o.status || o.status === '결제완료').length;
  const soldOutProducts = products.filter((p) => p.isSoldOut).length;

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';

  const stats = [
    { label: '전체 상품', value: products.length + '개', color: '#00a85e', bg: darkMode ? '#1e2e24' : '#e8faf3',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
    { label: '전체 주문', value: orders.length + '건', color: '#1a73e8', bg: darkMode ? '#1a2030' : '#e8f0fe',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: '전체 회원', value: users.length + '명', color: '#e65100', bg: darkMode ? '#2a1e10' : '#fff3e0',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: '오늘 매출', value: '₩' + todaySales.toLocaleString(), color: '#c62828', bg: darkMode ? '#2a1010' : '#fce4ec',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  ];

  const menus = [
    { label: '상품 관리', desc: '상품 등록/수정/삭제', page: 'admin',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
    { label: '재고 관리', desc: '재고 실사/입고', page: 'simpleInventory',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
    { label: '회원 관리', desc: '회원 조회/관리', page: 'members',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: '주문 관리', desc: '전체 주문 내역', page: 'adminOrders',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { label: '검수 매입', desc: '납품/거래처/반품', page: 'simplePurchase',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg> },
    { label: '배너 관리', desc: '배너 등록/삭제', page: 'bannerManager',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { label: '쿠폰 관리', desc: '쿠폰 등록/관리', page: 'couponManager',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
    { label: '매출 통계', desc: '매출 분석', page: 'salesStats',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { label: 'PC 관리자', desc: '통합 관리 시스템', page: 'adminPC',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { label: '행사 관리', desc: '행사 등록/관리', page: 'eventManager',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/><line x1="12" y1="12" x2="20" y2="4"/></svg> },
    { label: '쇼핑몰 보기', desc: '고객 화면 미리보기', page: 'home',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
  ];

  const statusColor = {
    '결제완료': { bg: darkMode ? '#1e2e24' : '#e8faf3', color: '#00a85e' },
    '배송중': { bg: darkMode ? '#2a2010' : '#fff3cd', color: '#f0a500' },
    '배송완료': { bg: darkMode ? '#1a2030' : '#e8f0fe', color: '#1a73e8' },
    '취소': { bg: darkMode ? '#2a1010' : '#fff0f1', color: '#ff4757' },
  };

  const alerts = [
    pendingOrders > 0 && { icon: '🔔', text: `미처리 주문 ${pendingOrders}건이 있어요!`, color: darkMode ? '#2a2010' : '#fff3cd', textColor: '#856404', page: 'adminOrders' },
    soldOutProducts > 0 && { icon: '⚠️', text: `품절 상품 ${soldOutProducts}개가 있어요!`, color: darkMode ? '#2a1010' : '#fff0f1', textColor: '#c62828', page: 'adminPC_inventory' },
  ].filter(Boolean);

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #00c471, #00a85e)', padding: '24px 20px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-30px', left: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <h2 style={{ margin: 0, color: 'white', fontSize: '20px', fontWeight: '800', position: 'relative', zIndex: 1 }}>관리자 대시보드</h2>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '13px', position: 'relative', zIndex: 1 }}>에스알마트 관리 시스템</p>
      </div>

      {/* 통계 카드 */}
      <div style={{ margin: '-24px 16px 0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', position: 'relative', zIndex: 2 }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ background: cardBg, borderRadius: '18px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '12px', border: `1px solid ${borderColor}` }}>
            <div style={{ width: '46px', height: '46px', background: stat.bg, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ fontSize: '11px', color: subTextColor, margin: '0 0 3px', fontWeight: '600' }}>{stat.label}</p>
              <p style={{ fontSize: '17px', fontWeight: '900', margin: 0, color: stat.color }}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 알림 */}
      {alerts.length > 0 && (
        <div style={{ margin: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map((alert, index) => (
            <div key={index} onClick={() => setPage(alert.page)}
              style={{ background: alert.color, borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <span style={{ fontSize: '18px' }}>{alert.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: alert.textColor }}>{alert.text}</span>
              <span style={{ marginLeft: 'auto', color: alert.textColor, fontSize: '16px' }}>›</span>
            </div>
          ))}
        </div>
      )}

      {/* 빠른 메뉴 */}
      <div style={{ margin: '16px 16px 0' }}>
        <p style={{ fontSize: '15px', fontWeight: '800', color: textColor, margin: '0 0 12px' }}>빠른 메뉴</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {menus.map((menu) => (
            <div key={menu.label} onClick={() => setPage(menu.page)}
              style={{ background: cardBg, borderRadius: '16px', padding: '16px 10px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
              <div style={{ width: '44px', height: '44px', background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                {menu.icon}
              </div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: textColor, margin: '0 0 3px', wordBreak: 'keep-all' }}>{menu.label}</p>
              <p style={{ fontSize: '10px', color: subTextColor, margin: 0, wordBreak: 'keep-all' }}>{menu.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 주문 */}
      <div style={{ margin: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p style={{ fontSize: '15px', fontWeight: '800', color: textColor, margin: 0 }}>최근 주문 내역</p>
          <button onClick={() => setPage('adminOrders')} style={{ fontSize: '13px', color: '#00c471', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer' }}>전체보기 →</button>
        </div>
        {orders.length === 0 ? (
          <div style={{ background: cardBg, borderRadius: '16px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: `1px solid ${borderColor}` }}>
            <p style={{ fontSize: '15px', fontWeight: '600', color: subTextColor, margin: 0 }}>아직 주문이 없어요!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.slice(0, 5).map((order) => {
              const status = order.status || '결제완료';
              const sc = statusColor[status] || statusColor['결제완료'];
              return (
                <div key={order.id} onClick={() => setPage('adminOrders')}
                  style={{ background: cardBg, borderRadius: '16px', padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', border: `1px solid ${borderColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <p style={{ fontSize: '11px', color: subTextColor, margin: 0, fontFamily: 'monospace' }}>{order.id.slice(-8)}</p>
                    <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: textColor, margin: 0 }}>
                      {order.items[0].name} {order.items.length > 1 ? '외 ' + (order.items.length - 1) + '건' : ''}
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{order.totalPrice.toLocaleString()}</p>
                  </div>
                  <p style={{ fontSize: '11px', color: subTextColor, margin: '4px 0 0' }}>{order.date}</p>
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
