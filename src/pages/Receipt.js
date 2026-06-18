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

function Receipt({ order, onClose, onGoHome, earnPoints }) {
  if (!order) return null;

  const status = order.status || '결제완료';
  const statusColor = {
    '결제완료': { bg: '#f0faf5', color: '#00a85e' },
    '배송중': { bg: '#fff3cd', color: '#f0a500' },
    '배송완료': { bg: '#e8f0fe', color: '#1a73e8' },
    '취소': { bg: '#fff0f1', color: '#ff4757' },
  };
  const sc = statusColor[status] || statusColor['결제완료'];

  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onClose} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>주문 영수증</h2>
        </div>
      </div>

      {/* 완료 아이콘 */}
      <div style={{ background: 'white', padding: '36px 20px 28px', textAlign: 'center', borderBottom: '8px solid #f8fffe' }}>
        <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #00c471, #00a85e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(0,196,113,0.3)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 8px' }}>주문이 완료됐어요! 🎉</h2>
        <p style={{ fontSize: '14px', color: '#adb5bd', margin: '0 0 8px' }}>주문해 주셔서 감사해요!</p>
        {earnPoints > 0 && (
          <div style={{ display: 'inline-block', background: '#e8f0fe', color: '#1a73e8', borderRadius: 20, padding: '5px 14px', fontSize: '13px', fontWeight: 700 }}>
            배송 완료 시 {earnPoints.toLocaleString()}P 적립 예정
          </div>
        )}
      </div>

      {/* 주문 정보 */}
      <div style={{ margin: '16px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f0faf5' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fffe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 4px', fontFamily: 'monospace' }}>{order.id}</p>
            <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{order.date}</p>
          </div>
          <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{status}</span>
        </div>

        {/* 상품 목록 */}
        <div style={{ padding: '14px 20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: '#adb5bd', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>주문 상품</p>
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
                <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{item.quantity}개 · ₩{item.price.toLocaleString()}</p>
              </div>
              <p style={{ fontSize: '14px', fontWeight: '800', color: '#1a1a1a', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* 결제 정보 */}
        <div style={{ padding: '16px 20px', background: '#f8fffe', borderTop: '1px solid #f0faf5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#adb5bd' }}>상품 금액</span>
            <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600' }}>₩{order.totalPrice.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', color: '#adb5bd' }}>배송비</span>
            <span style={{ fontSize: '13px', color: '#00c471', fontWeight: '700' }}>무료</span>
          </div>
          <div style={{ height: '1px', background: '#f0faf5', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a' }}>총 결제금액</span>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '16px 20px 36px', background: 'white', borderTop: '1px solid #f0faf5', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', display: 'flex', gap: '12px' }}>
        <button onClick={onClose} style={{ flex: 1, padding: '14px', background: '#f8fffe', color: '#00a85e', border: '1.5px solid #e8faf3', borderRadius: '16px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
          주문내역
        </button>
        <button onClick={onGoHome} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
          쇼핑 계속하기
        </button>
      </div>
    </div>
  );
}

export default Receipt;