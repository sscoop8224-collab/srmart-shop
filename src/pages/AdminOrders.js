import { useState } from 'react';

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

function AdminOrders({ orders, setOrders, goBack, onPrint, darkMode }) {
  const [filterStatus, setFilterStatus] = useState('전체');
  const statusList = ['전체', '결제완료', '배송중', '배송완료', '취소'];

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';

  const statusColor = {
    '결제완료': { bg: darkMode ? '#1e2e24' : '#f0faf5', color: '#00a85e' },
    '배송중': { bg: darkMode ? '#2a2010' : '#fff3cd', color: '#f0a500' },
    '배송완료': { bg: darkMode ? '#1a2030' : '#e8f0fe', color: '#1a73e8' },
    '취소': { bg: darkMode ? '#2a1010' : '#fff0f1', color: '#ff4757' },
  };

  const filteredOrders = orders.filter((o) =>
    filterStatus === '전체' ? true : (o.status || '결제완료') === filterStatus
  );

  const updateStatus = (orderId, newStatus) => {
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: headerBg, borderBottom: `1px solid ${borderColor}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '38px', height: '38px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#f0f0f0' : '#1a1a1a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: textColor }}>주문 관리</h2>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: subTextColor, fontWeight: '600' }}>{filteredOrders.length}건</span>
      </div>

      {/* 상태 필터 */}
      <div style={{ padding: '12px 16px', background: headerBg, borderBottom: `1px solid ${borderColor}`, display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {statusList.map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)}
            style={{ padding: '7px 16px', background: filterStatus === status ? (darkMode ? '#f0f0f0' : '#1a1a1a') : cardBg, color: filterStatus === status ? (darkMode ? '#1a1a1a' : 'white') : subTextColor, border: filterStatus === status ? 'none' : `1.5px solid ${borderColor}`, borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
            {status}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div style={{ width: '80px', height: '80px', background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: textColor, margin: '0 0 6px' }}>주문이 없어요!</p>
          <p style={{ fontSize: '13px', color: subTextColor, margin: 0 }}>다른 상태를 확인해보세요</p>
        </div>
      ) : (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredOrders.map((order) => {
            const status = order.status || '결제완료';
            const sc = statusColor[status] || statusColor['결제완료'];
            return (
              <div key={order.id} style={{ background: cardBg, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: `1px solid ${borderColor}` }}>
                <div style={{ padding: '14px 18px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: subTextColor, margin: '0 0 3px', fontFamily: 'monospace' }}>{order.id}</p>
                    <p style={{ fontSize: '12px', color: subTextColor, margin: '0 0 3px' }}>{order.date}</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: textColor, margin: 0 }}>{order.userId}</p>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status}</span>
                </div>

                <div style={{ padding: '12px 18px' }}>
                  {order.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: index < order.items.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={item.image || getCategoryImage(item.large)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: textColor, margin: '0 0 2px' }}>{item.name}</p>
                        <p style={{ fontSize: '12px', color: subTextColor, margin: 0 }}>{item.quantity}개 · ₩{item.price.toLocaleString()}</p>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '12px 18px', background: darkMode ? '#1e1e1e' : '#f8fffe', borderTop: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: subTextColor, fontWeight: '600' }}>총 결제금액</span>
                  <span style={{ fontSize: '17px', fontWeight: '900', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
                </div>

                <div style={{ padding: '12px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: `1px solid ${borderColor}` }}>
                  {['결제완료', '배송중', '배송완료', '취소'].map((s) => (
                    <button key={s} onClick={() => updateStatus(order.id, s)}
                      style={{ padding: '6px 12px', background: status === s ? sc.bg : cardBg, color: status === s ? sc.color : subTextColor, border: status === s ? `1.5px solid ${sc.color}` : `1.5px solid ${borderColor}`, borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {s}
                    </button>
                  ))}
                  <button onClick={() => onPrint(order)} style={{ padding: '6px 12px', background: darkMode ? '#f0f0f0' : '#1a1a1a', color: darkMode ? '#1a1a1a' : 'white', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#1a1a1a' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                    </svg>
                    영수증 출력
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
