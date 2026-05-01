function Cart({ cart, setCart, onPayment, onHome, goBack }) {
  const updateQuantity = (id, delta) => {
    setCart(cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div style={{ paddingBottom: '120px', background: '#f8f9fa', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>장바구니</h2>
        </div>
        <span style={{ fontSize: '13px', color: '#868e96' }}>{cart.length}개 상품</span>
      </div>

      {cart.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#adb5bd' }}>
          <span style={{ fontSize: '64px', marginBottom: '16px' }}>🛒</span>
          <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#495057' }}>장바구니가 비어있어요!</p>
          <p style={{ fontSize: '13px', color: '#adb5bd', margin: '0 0 24px' }}>상품을 담아보세요</p>
          <button onClick={onHome} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '700' }}>쇼핑 계속하기</button>
        </div>
      ) : (
        <>
          {/* 상품 목록 */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ background: 'white', borderRadius: '16px', padding: '16px', display: 'flex', gap: '14px', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* 이미지 */}
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: '72px', height: '72px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '12px', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '72px', height: '72px', background: '#f8f9fa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🛍️</div>
                )}

                {/* 상품 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 3px' }}>{item.large}</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#212529', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
                </div>

                {/* 수량 + 삭제 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '16px', padding: 0 }}>✕</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8f9fa', borderRadius: '20px', padding: '4px 8px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '24px', height: '24px', background: 'white', border: '1px solid #e9ecef', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', fontWeight: 'bold' }}>-</button>
                    <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 결제 영역 */}
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'white', padding: '16px 20px 32px', borderTop: '1px solid #f1f3f5', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', color: '#868e96' }}>총 결제금액</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#212529' }}>₩{totalPrice.toLocaleString()}</span>
            </div>
            <button onClick={onPayment} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              카카오페이로 결제하기 💳
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;