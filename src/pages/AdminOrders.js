import { useState } from 'react';

function AdminOrders({ orders, goBack }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('전체');

  const statusList = ['전체', '결제완료', '배송준비', '배송중', '배송완료', '취소'];

  const [orderStatus, setOrderStatus] = useState(
    orders.reduce((acc, order) => {
      acc[order.id] = '결제완료';
      return acc;
    }, {})
  );

  const handleStatusChange = (orderId, status) => {
    setOrderStatus((prev) => ({ ...prev, [orderId]: status }));
  };

  const filteredOrders = orders.filter((order) => {
    const matchSearch = order.id.includes(search) ||
      order.items.some((item) => item.name.includes(search));
    const matchStatus = statusFilter === '전체' || (orderStatus[order.id] || '결제완료') === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColor = (status) => {
    if (status === '결제완료') return { bg: '#e3f2fd', color: '#1565c0' };
    if (status === '배송준비') return { bg: '#fff3e0', color: '#e65100' };
    if (status === '배송중') return { bg: '#e8f5e9', color: '#2e7d32' };
    if (status === '배송완료') return { bg: '#f3e5f5', color: '#6a1b9a' };
    if (status === '취소') return { bg: '#ffebee', color: '#c62828' };
    return { bg: '#f1f3f5', color: '#868e96' };
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div style={{ padding: '24px', maxWidth: '100%' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, color: '#212529', fontSize: '20px', fontWeight: '800' }}>📋 주문 관리</h2>
      </div>

      {/* 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: '전체 주문', value: orders.length + '건', color: '#e3f2fd', text: '#1565c0' },
          { label: '총 매출', value: '₩' + totalRevenue.toLocaleString(), color: '#e8f5e9', text: '#00a85e' },
          { label: '오늘 주문', value: orders.filter((o) => new Date(o.date).toDateString() === new Date().toDateString()).length + '건', color: '#fff3e0', text: '#e65100' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.color, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#868e96', margin: '0 0 4px', fontWeight: '600' }}>{stat.label}</p>
            <p style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: stat.text }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 상태 필터 */}
      <div style={{ overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
          {statusList.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{ padding: '6px 14px', background: statusFilter === s ? '#00c471' : 'white', color: statusFilter === s ? 'white' : '#868e96', border: '1px solid #dee2e6', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 */}
      <div style={{ marginBottom: '16px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="주문번호 또는 상품명으로 검색"
          style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* 주문 목록 */}
      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#adb5bd' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px' }}>📋</p>
          <p>주문이 없어요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredOrders.map((order) => (
            <div key={order.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e9ecef', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

              {/* 주문 헤더 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#adb5bd', margin: '0 0 4px', fontFamily: 'monospace' }}>{order.id}</p>
                  <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>{order.date}</p>
                </div>
                <span style={{ background: statusColor(orderStatus[order.id] || '결제완료').bg, color: statusColor(orderStatus[order.id] || '결제완료').color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                  {orderStatus[order.id] || '결제완료'}
                </span>
              </div>

              {/* 상품 목록 */}
              <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '12px', marginBottom: '12px' }}>
                {order.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} style={{ width: '36px', height: '36px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '6px' }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', background: '#f8f9fa', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🛍️</div>
                      )}
                      <span style={{ fontSize: '13px', color: '#495057' }}>{item.name} x{item.quantity}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#212529' }}>₩{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* 합계 + 상태 변경 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f3f5', paddingTop: '12px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
                <select
                  value={orderStatus[order.id] || '결제완료'}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: '8px', border: '1.5px solid #dee2e6', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white' }}
                >
                  {statusList.filter((s) => s !== '전체').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;