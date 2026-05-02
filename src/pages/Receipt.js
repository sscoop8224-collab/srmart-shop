function Receipt({ order, onClose, onGoHome }) {
  if (!order) return null;

  const status = order.status || '결제완료';
  const statusColor = {
    '결제완료': { bg: '#e8faf3', color: '#00a85e' },
    '배송중': { bg: '#fff3cd', color: '#f0a500' },
    '배송완료': { bg: '#e8f0fe', color: '#1a73e8' },
    '취소': { bg: '#fff0f1', color: '#ff4757' },
  };
  const sc = statusColor[status];

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '100px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onClose} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>주문 영수증</h2>
        </div>
      </div>

      {/* 완료 아이콘 */}
      <div style={{ background: 'white', padding: '32px 20px', textAlign: 'center', borderBottom: '8px solid #f8f9fa' }}>
        <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #00c471, #00a85e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '32px' }}>✓</div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#212529', margin: '0 0 8px' }}>주문이 완료됐어요! 🎉</h2>
        <p style={{ fontSize: '14px', color: '#868e96', margin: 0 }}>주문해 주셔서 감사해요!</p>
      </div>

      {/* 주문 정보 */}
      <div style={{ margin: '16px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 4px', fontFamily: 'monospace' }}>{order.id}</p>
            <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>{order.date}</p>
          </div>
          <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status}</span>
        </div>

        {/* 상품 목록 */}
        <div style={{ padding: '12px 20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#495057', margin: '0 0 12px' }}>주문 상품</p>
          {order.items.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f8f9fa' : 'none' }}>
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '10px', flexShrink: 0 }} />
              ) : (
                <div style={{ width: '48px', height: '48px', background: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🛍️</div>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#212529', margin: '0 0 3px' }}>{item.name}</p>
                <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{item.quantity}개 · ₩{item.price.toLocaleString()}</p>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '800', color: '#212529', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* 결제 정보 */}
        <div style={{ padding: '16px 20px', background: '#f8f9fa', borderTop: '1px solid #f1f3f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#868e96' }}>상품 금액</span>
            <span style={{ fontSize: '13px', color: '#212529', fontWeight: '600' }}>₩{order.totalPrice.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#868e96' }}>배송비</span>
            <span style={{ fontSize: '13px', color: '#00c471', fontWeight: '600' }}>무료</span>
          </div>
          <div style={{ height: '1px', background: '#e9ecef', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#212529' }}>총 결제금액</span>
            <span style={{ fontSize: '20px', fontWeight: '900', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '16px 20px 32px', background: 'white', borderTop: '1px solid #f1f3f5', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', display: 'flex', gap: '12px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '14px', background: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
          주문내역
        </button>
        <button onClick={onGoHome} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' }}>
          쇼핑 계속하기
        </button>
      </div>
    </div>
  );
}

export default Receipt;