function Orders({ orders }) {
  if (orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
        <p style={{ fontSize: '48px' }}>📋</p>
        <p>주문 내역이 없어요!</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px' }}>📋 주문 내역</h2>
      {orders.map((order) => (
        <div key={order.id} style={{ border: '1px solid #ddd', borderRadius: '8px', marginBottom: '16px', overflow: 'hidden' }}>
          <div style={{ background: '#1a73e8', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>주문번호: {order.id}</span>
            <span style={{ fontSize: '14px' }}>{order.date}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '14px' }}>이미지</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '14px' }}>상품명</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: '14px' }}>수량</th>
                <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '14px' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '10px 16px' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'contain', background: '#f5f5f5', borderRadius: '4px' }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🛍️</div>
                    )}
                  </td>
                  <td style={{ padding: '10px 16px', fontSize: '14px' }}>{item.name}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}개</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontSize: '14px', color: '#1a73e8', fontWeight: 'bold' }}>₩{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', textAlign: 'right', borderTop: '1px solid #ddd', background: '#fafafa' }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>총 합계: ₩{order.totalPrice.toLocaleString()}</span>
            <span style={{ marginLeft: '16px', padding: '4px 12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '4px', fontSize: '13px' }}>결제완료</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Orders;