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

function AdminOrders({ orders, setOrders, goBack, onPrint }) {
  const [filterStatus, setFilterStatus] = useState('전체');
  const statusList = ['전체', '결제완료', '배송중', '배송완료', '취소'];

  const statusColor = {
    '결제완료': { bg: '#f0faf5', color: '#00a85e' },
    '배송중': { bg: '#fff3cd', color: '#f0a500' },
    '배송완료': { bg: '#e8f0fe', color: '#1a73e8' },
    '취소': { bg: '#fff0f1', color: '#ff4757' },
  };

  const filteredOrders = orders.filter((o) =>
    filterStatus === '전체' ? true : (o.status || '결제완료') === filterStatus
  );

  const updateStatus = (orderId, newStatus) => {
    setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a85e' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>주문 관리</h2>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#adb5bd', fontWeight: '600' }}>{filteredOrders.length}건</span>
      </div>

      {/* 상태 필터 */}
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #f0faf5', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {statusList.map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)}
            style={{ padding: '7px 16px', background: filterStatus === status ? '#1a1a1a' : 'white', color: filterStatus === status ? 'white' : '#adb5bd', border: filterStatus === status ? 'none' : '1.5px solid #e8faf3', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
            {status}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div style={{ width: '80px', height: '80px', background: '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>주문이 없어요!</p>
          <p style={{ fontSize: '13px', color: '#adb5bd', margin: 0 }}>다른 상태를 확인해보세요</p>
        </div>
      ) : (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredOrders.map((order) => {
            const status = order.status || '결제완료';
            const sc = statusColor[status] || statusColor['결제완료'];
            return (
              <div key={order.id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f0faf5' }}>

                {/* 주문 헤더 */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f8fffe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 3px', fontFamily: 'monospace' }}>{order.id}</p>
                    <p style={{ fontSize: '12px', color: '#adb5bd', margin: '0 0 3px' }}>{order.date}</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a1a', margin: 0 }}>{order.userId}</p>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status}</span>
                </div>

                {/* 상품 목록 */}
                <div style={{ padding: '12px 18px' }}>
                  {order.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f8fffe' : 'none' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                        <img src={item.image || getCategoryImage(item.large)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 2px' }}>{item.name}</p>
                        <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{item.quantity}개 · ₩{item.price.toLocaleString()}</p>
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* 합계 */}
                <div style={{ padding: '12px 18px', background: '#f8fffe', borderTop: '1px solid #f0faf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#adb5bd', fontWeight: '600' }}>총 결제금액</span>
                  <span style={{ fontSize: '17px', fontWeight: '900', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
                </div>

                {/* 상태 변경 */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid #f0faf5' }}>
                  {['결제완료', '배송중', '배송완료', '취소'].map((s) => (
                    <button key={s} onClick={() => updateStatus(order.id, s)}
                      style={{ padding: '6px 12px', background: status === s ? sc.bg : 'white', color: status === s ? sc.color : '#adb5bd', border: status === s ? `1.5px solid ${sc.color}` : '1.5px solid #e8faf3', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {s}
                    </button>
                  ))}
                  <button onClick={() => onPrint(order)} style={{ padding: '6px 12px', background: '#1a1a1a', color: 'white', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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