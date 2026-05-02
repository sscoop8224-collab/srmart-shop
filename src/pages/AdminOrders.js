import { useState } from 'react';

function AdminOrders({ orders, setOrders, goBack }) {
  const [filterStatus, setFilterStatus] = useState('전체');

  const statusList = ['전체', '결제완료', '배송중', '배송완료', '취소'];

  const statusColor = {
    '결제완료': { bg: '#e8faf3', color: '#00a85e' },
    '배송중': { bg: '#fff3cd', color: '#f0a500' },
    '배송완료': { bg: '#e8f0fe', color: '#1a73e8' },
    '취소': { bg: '#fff0f1', color: '#ff4757' },
  };

  const filteredOrders = orders.filter((o) =>
    filterStatus === '전체' ? true : (o.status || '결제완료') === filterStatus
  );

  const updateStatus = (orderId, newStatus) => {
    setOrders(orders.map((o) =>
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>주문 관리</h2>
      </div>

      {/* 상태 필터 */}
      <div style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid #f1f3f5', display: 'flex', gap: '8px', overflowX: 'auto' }}>
        {statusList.map((status) => (
          <button key={status} onClick={() => setFilterStatus(status)} style={{ padding: '7px 16px', background: filterStatus === status ? '#212529' : 'white', color: filterStatus === status ? 'white' : '#868e96', border: filterStatus === status ? 'none' : '1.5px solid #e9ecef', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
            {status}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#adb5bd' }}>
          <span style={{ fontSize: '64px', marginBottom: '16px', opacity: '0.6' }}>📋</span>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#495057', margin: '0 0 6px' }}>주문이 없어요!</p>
        </div>
      ) : (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredOrders.map((order) => {
            const status = order.status || '결제완료';
            const sc = statusColor[status];
            return (
              <div key={order.id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

                {/* 주문 헤더 */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 4px', fontFamily: 'monospace' }}>{order.id}</p>
                    <p style={{ fontSize: '13px', color: '#868e96', margin: '0 0 4px' }}>{order.date}</p>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#212529', margin: 0 }}>고객: {order.userId}</p>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status}</span>
                </div>

                {/* 상품 목록 */}
                <div style={{ padding: '12px 20px' }}>
                  {order.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f8f9fa' : 'none' }}>
                      <div style={{ width: '40px', height: '40px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🛍️</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: '#212529', margin: '0 0 2px' }}>{item.name}</p>
                        <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{item.quantity}개 · ₩{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 합계 */}
                <div style={{ padding: '12px 20px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#868e96', fontWeight: '600' }}>총 결제금액</span>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
                </div>

                {/* 상태 변경 버튼 */}
                <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['결제완료', '배송중', '배송완료', '취소'].map((s) => (
                    <button key={s} onClick={() => updateStatus(order.id, s)} style={{ padding: '7px 14px', background: status === s ? statusColor[s].bg : 'white', color: status === s ? statusColor[s].color : '#868e96', border: status === s ? `1.5px solid ${statusColor[s].color}` : '1.5px solid #e9ecef', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {s}
                    </button>
                  ))}
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