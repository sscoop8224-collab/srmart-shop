function Orders({ orders, goBack }) {
  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>주문내역</h2>
      </div>

      {orders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#adb5bd' }}>
          <span style={{ fontSize: '64px', marginBottom: '16px', opacity: '0.6' }}>📋</span>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#495057', margin: '0 0 6px' }}>주문내역이 없어요!</p>
          <p style={{ fontSize: '13px', color: '#adb5bd', margin: 0 }}>첫 주문을 해보세요</p>
        </div>
      ) : (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order) => (
            <div key={order.id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>

              {/* 주문 헤더 */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 4px', fontFamily: 'monospace' }}>{order.id}</p>
                  <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>{order.date}</p>
                </div>
                <span style={{ background: '#e8faf3', color: '#00a85e', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>결제완료</span>
              </div>

              {/* 상품 목록 */}
              <div style={{ padding: '12px 20px' }}>
                {order.items.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f8f9fa' : 'none' }}>
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '10px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', background: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🛍️</div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#212529', margin: '0 0 3px' }}>{item.name}</p>
                      <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{item.quantity}개</p>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#212529', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* 합계 */}
              <div style={{ padding: '14px 20px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#868e96', fontWeight: '600' }}>총 결제금액</span>
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;