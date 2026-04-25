function AdminHome({ setPage, products, orders, users, goBack }) {
  const stats = [
    { label: '전체 상품', value: products.length + '개', icon: '📦', color: '#e8f5e9', border: '#c8e6c9', text: '#2e7d32' },
    { label: '전체 주문', value: orders.length + '건', icon: '📋', color: '#e3f2fd', border: '#bbdefb', text: '#1565c0' },
    { label: '전체 회원', value: users.length + '명', icon: '👥', color: '#fff3e0', border: '#ffe0b2', text: '#e65100' },
    { label: '오늘 매출', value: '₩' + orders.filter((o) => new Date(o.date).toDateString() === new Date().toDateString()).reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString(), icon: '💰', color: '#fce4ec', border: '#f8bbd0', text: '#880e4f' },
  ];

  const menus = [
    { icon: '📦', label: '상품 관리', desc: '상품 등록/수정/삭제', page: 'admin' },
    { icon: '📂', label: '카테고리 관리', desc: '카테고리 설정', page: 'admin' },
    { icon: '👥', label: '회원 관리', desc: '회원 조회/관리', page: 'members' },
    { icon: '📋', label: '주문 관리', desc: '전체 주문 내역', page: 'adminOrders' },
    { icon: '✏️', label: '문구 관리', desc: '메시지 설정', page: 'admin' },
    { icon: '🛒', label: '쇼핑몰 보기', desc: '고객 화면 미리보기', page: 'home' },
  ];

  return (
    <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 24px', color: '#212529', fontSize: '20px', fontWeight: '800' }}>⚙️ 관리자 대시보드</h2>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ background: stat.color, border: '1px solid ' + stat.border, borderRadius: '12px', padding: '8px 4px', textAlign: 'center' }}>
            <p style={{ fontSize: '28px', margin: '0 0 8px' }}>{stat.icon}</p>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px' }}>{stat.label}</p>
            <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: stat.text }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 빠른 메뉴 */}
      <h3 style={{ marginBottom: '16px', color: '#212529', fontSize: '16px', fontWeight: '700' }}>빠른 메뉴</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {menus.map((menu) => (
          <div
            key={menu.label}
            onClick={() => setPage(menu.page)}
            style={{
              background: 'white',
              border: '1px solid #e9ecef',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = '#00c471'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e9ecef'; }}
          >
            <span style={{ fontSize: '28px', lineHeight: '1' }}>{menu.icon}</span>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#212529', margin: 0, wordBreak: 'keep-all' }}>{menu.label}</p>
            <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0, wordBreak: 'keep-all' }}>{menu.desc}</p>
          </div>
        ))}
      </div>

      {/* 최근 주문 */}
      <h3 style={{ marginBottom: '16px', color: '#212529', fontSize: '16px', fontWeight: '700' }}>최근 주문 내역</h3>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#adb5bd', background: 'white', borderRadius: '12px', border: '1px solid #e9ecef' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📋</p>
          <p>아직 주문이 없어요!</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e9ecef', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#00c471', color: 'white' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>주문번호</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>주문일시</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px' }}>상품</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: '#adb5bd' }}>{order.id}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>{order.date}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>{order.items[0].name} {order.items.length > 1 ? '외 ' + (order.items.length - 1) + '건' : ''}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', color: '#00c471', fontWeight: '700' }}>₩{order.totalPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default AdminHome;