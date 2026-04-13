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
      <main style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '24px', color: '#1b5e20' }}>🛒 장바구니</h2>
        <div style={{ textAlign: 'center', padding: '80px', color: '#888', background: 'white', borderRadius: '16px', border: '1px solid #e0e0e0' }}>
          <p style={{ fontSize: '56px', margin: '0 0 16px' }}>🛒</p>
          <p style={{ fontSize: '16px', margin: '0 0 24px' }}>장바구니가 비어있어요!</p>
          <button onClick={onHome} style={{ padding: '12px 28px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
            쇼핑 계속하기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#1b5e20' }}>🛒 장바구니</h2>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#2e7d32', color: 'white' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>이미지</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>상품명</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>수량</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>금액</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>삭제</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '14px 16px' }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name} style={{ width: '52px', height: '52px', objectFit: 'contain', background: '#f5f5f5', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '52px', height: '52px', background: '#f1f8e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛍️</div>
                  )}
                </td>
                <td style={{ padding: '14px 16px', fontWeight: '500' }}>{item.name}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '30px', height: '30px', background: '#f1f8e9', border: '1px solid #c8e6c9', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', color: '#2e7d32', fontWeight: 'bold' }}>-</button>
                    <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '30px', height: '30px', background: '#f1f8e9', border: '1px solid #c8e6c9', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', color: '#2e7d32', fontWeight: 'bold' }}>+</button>
                  </div>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#2e7d32', fontWeight: 'bold', fontSize: '16px' }}>₩{(item.price * item.quantity).toLocaleString()}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: '#e53935', color: 'white', border: 'none', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '13px' }}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '20px 24px', textAlign: 'right' }}>
        <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 16px', color: '#1b5e20' }}>총 합계: ₩{totalPrice.toLocaleString()}</p>
        <button onClick={onPayment} style={{ padding: '14px 36px', background: '#FFCD00', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' }}>
          카카오페이로 결제하기
        </button>
      </div>
    </main>
  );
}

export default Cart;