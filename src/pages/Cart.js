import { useState } from 'react';

function Cart({ cart, setCart, onPayment, onHome, goBack, coupons, appliedCoupon, setAppliedCoupon }) {
  const [couponInput, setCouponInput] = useState('');
  const [address, setAddress] = useState({ name: '', phone: '', address: '', detail: '' });
  const [showAddress, setShowAddress] = useState(false);

  const updateQuantity = (id, delta) => {
    setCart(cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.floor(totalPrice * appliedCoupon.discount / 100)
      : appliedCoupon.discount
    : 0;

  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const handleApplyCoupon = () => {
    const coupon = coupons.find((c) => c.code === couponInput.toUpperCase() && c.isActive);
    if (!coupon) {
      alert('유효하지 않은 쿠폰 코드예요!');
      return;
    }
    setAppliedCoupon(coupon);
    alert(coupon.description + ' 적용됐어요! 😊');
    setCouponInput('');
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '160px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>장바구니</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#868e96' }}>{cart.length}개 상품</span>
          {cart.length > 0 && (
            <button onClick={() => { if (window.confirm('장바구니를 비울까요?')) setCart([]); }} style={{ fontSize: '12px', color: '#ff4757', background: '#fff0f1', border: 'none', borderRadius: '20px', padding: '5px 12px', cursor: 'pointer', fontWeight: '700' }}>전체 삭제</button>
          )}
        </div>
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
                {item.image ? (
                  <img src={item.image} alt={item.name} style={{ width: '72px', height: '72px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '12px', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '72px', height: '72px', background: '#f8f9fa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🛍️</div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 3px' }}>{item.large}</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#212529', margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
                </div>
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

          {/* 쿠폰 입력 */}
          <div style={{ margin: '0 16px 12px', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#212529', margin: '0 0 12px' }}>🎟️ 쿠폰 코드</p>
            {appliedCoupon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#e8faf3', borderRadius: '10px', padding: '10px 14px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#00a85e', margin: '0 0 2px' }}>{appliedCoupon.code}</p>
                  <p style={{ fontSize: '12px', color: '#00a85e', margin: 0 }}>{appliedCoupon.description}</p>
                </div>
                <button onClick={handleRemoveCoupon} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ff4757', fontSize: '16px', padding: 0 }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="쿠폰 코드 입력"
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                />
                <button onClick={handleApplyCoupon} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>적용</button>
              </div>
            )}
          </div>

          {/* 배송지 입력 */}
          <div style={{ margin: '0 16px 12px', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAddress ? '12px' : 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#212529', margin: 0 }}>🚚 배송지 입력</p>
              <button onClick={() => setShowAddress(!showAddress)} style={{ padding: '6px 12px', background: '#f1f3f5', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#495057' }}>
                {showAddress ? '접기' : '입력하기'}
              </button>
            </div>
            {showAddress && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="받는 분 이름" style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
                <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="연락처 (010-0000-0000)" type="tel" style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
                <input value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} placeholder="주소" style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
                <input value={address.detail} onChange={(e) => setAddress({ ...address, detail: e.target.value })} placeholder="상세 주소 (동/호수 등)" style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
                {address.name && address.phone && address.address && (
                  <div style={{ background: '#e8faf3', borderRadius: '10px', padding: '10px 14px' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', margin: '0 0 4px' }}>✅ 배송지 입력 완료</p>
                    <p style={{ fontSize: '12px', color: '#495057', margin: 0 }}>{address.name} · {address.phone}</p>
                    <p style={{ fontSize: '12px', color: '#495057', margin: 0 }}>{address.address} {address.detail}</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* 결제 영역 */}
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'white', padding: '16px 20px 32px', borderTop: '1px solid #f1f3f5', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#868e96' }}>상품 금액</span>
              <span style={{ fontSize: '13px', color: '#212529', fontWeight: '600' }}>₩{totalPrice.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#00a85e' }}>쿠폰 할인</span>
                <span style={{ fontSize: '13px', color: '#00a85e', fontWeight: '700' }}>-₩{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#212529' }}>총 결제금액</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#212529' }}>₩{finalPrice.toLocaleString()}</span>
            </div>
            <button onClick={() => onPayment(finalPrice)} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              카카오페이로 결제하기 💳
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;