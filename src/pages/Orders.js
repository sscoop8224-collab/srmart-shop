const getCategoryImage = (large) => {
  switch(large) {
    case '식품': return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80';
    case '음료': return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&q=80';
    case '생활용품': return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&q=80';
    case '간식/과자': return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&q=80';
    case '주류': return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';
  }
};

const statusStyle = (status) => {
  switch(status) {
    case '배송중': return { bg: '#fff3cd', color: '#f0a500' };
    case '배송완료': return { bg: '#e8f0fe', color: '#1a73e8' };
    case '취소': return { bg: '#fff0f1', color: '#ff4757' };
    default: return { bg: '#f0faf5', color: '#00a85e' };
  }
};

function Orders({ orders, goBack }) {
  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px 20px', background: 'white',
        borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10
      }}>
        <button onClick={goBack} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>주문내역</h2>
      </div>

      {orders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div style={{ width: '80px', height: '80px', background: '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>주문내역이 없어요!</p>
          <p style={{ fontSize: '13px', color: '#adb5bd', margin: 0 }}>첫 주문을 해보세요</p>
        </div>
      ) : (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order) => {
            const sc = statusStyle(order.status);
            return (
              <div key={order.id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f0faf5' }}>

                {/* 주문 헤더 */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f8fffe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 3px', fontFamily: 'monospace' }}>{order.id}</p>
                    <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{order.date}</p>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                    {order.status || '결제완료'}
                  </span>
                </div>

                {/* 상품 목록 */}
                <div style={{ padding: '12px 18px' }}>
                  {order.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f8fffe' : 'none' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          src={item.image || getCategoryImage(item.large)}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 3px' }}>{item.name}</p>
                        <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{item.quantity}개</p>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: '800', color: '#1a1a1a', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* 합계 */}
                <div style={{ padding: '14px 18px', background: '#f8fffe', borderTop: '1px solid #f0faf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#adb5bd', fontWeight: '600' }}>총 결제금액</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;