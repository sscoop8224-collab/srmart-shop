function Cart({ cart, setCart, onPayment, onHome }) {
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

  if (cart.length === 0) {
    return (
      <main style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: '800', color: '#212529' }}>🛒 장바구니</h2>
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#adb5bd' }}>
          <p style={{ fontSize: '52px', margin: '0 0 16px' }}>🛒</p>
          <p style={{ fontSize: '15px', margin: '0 0 24px', fontWeight: '500' }}>장바구니가 비어있어요!</p>
          <button onClick={onHome} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', fontWeight: '700' }}>
            쇼핑 계속하기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>🛒 장바구니</h2>
      </div>

      {/* 상품 목록 카드형 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {cart.map((item) => (
          <div key={item.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e9ecef', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

            {/* 이미지 */}
            {item.image ? (
              <img src={item.image} alt={item.name} style={{ width: '64px', height: '64px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '10px', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '64px', height: '64px', background: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>🛍️</div>
            )}

            {/* 상품 정보 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: '700', fontSize: '14px', color: '#212529', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
              <p style={{ fontWeight: '800', fontSize: '15px', color: '#00c471', margin: '0 0 10px' }}>₩{(item.price * item.quantity).toLocaleString()}</p>

              {/* 수량 조절 + 삭제 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8f9fa', borderRadius: '8px', padding: '4px 8px' }}>
                  <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '28px', height: '28px', background: 'white', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', color: '#495057', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                  <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '700', fontSize: '14px' }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '28px', height: '28px', background: 'white', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', color: '#495057', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: '#fff0f1', color: '#ff4757', border: '1px solid #ffd0d4', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 결제 영역 */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e9ecef', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '15px', color: '#868e96', fontWeight: '500' }}>총 결제금액</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#212529' }}>₩{totalPrice.toLocaleString()}</span>
        </div>
        <button onClick={onPayment} style={{ width: '100%', padding: '15px', background: '#FFCD00', color: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', letterSpacing: '-0.3px' }}>
          카카오페이로 결제하기 💳
        </button>
      </div>
    </main>
  );
}

export default Cart;