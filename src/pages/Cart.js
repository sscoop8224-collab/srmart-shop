import { useState, useEffect } from 'react';

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

function Cart({ cart, setCart, onPayment, onHome, goBack, coupons, appliedCoupon, setAppliedCoupon, user }) {
  const [couponInput, setCouponInput] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [address, setAddress] = useState({ name: '', phone: '', address: '', detail: '' });

  // ✅ 회원 정보에서 기본 주소 자동 불러오기
  const defaultAddress = {
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    detail: user?.addressDetail || '',
  };
  const hasDefaultAddress = defaultAddress.address && defaultAddress.address.trim() !== '';

  // ✅ 배송지 초기값 설정
  useEffect(() => {
    if (hasDefaultAddress) {
      setAddress(defaultAddress);
      setUseDefaultAddress(true);
    } else {
      setUseDefaultAddress(false);
    }
  }, [user]);

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
    if (!coupon) { alert('유효하지 않은 쿠폰 코드예요!'); return; }
    setAppliedCoupon(coupon);
    alert(coupon.description + ' 적용됐어요! 😊');
    setCouponInput('');
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponInput(''); };

  // ✅ 다른 주소로 변경할 때
  const handleSwitchAddress = (useDefault) => {
    setUseDefaultAddress(useDefault);
    if (useDefault) {
      setAddress(defaultAddress);
    } else {
      setAddress({ name: '', phone: '', address: '', detail: '' });
    }
  };

  const currentAddress = useDefaultAddress ? defaultAddress : address;
  const isAddressComplete = currentAddress.name && currentAddress.phone && currentAddress.address;

  const inputStyle = {
    padding: '11px 14px', borderRadius: '12px', border: '1.5px solid #e8faf3',
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    background: '#f8fffe', width: '100%', boxSizing: 'border-box'
  };

  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '180px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a85e' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>장바구니</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: '#adb5bd', fontWeight: '600' }}>{cart.length}개 상품</span>
          {cart.length > 0 && (
            <button onClick={() => { if (window.confirm('장바구니를 비울까요?')) setCart([]); }}
              style={{ fontSize: '12px', color: '#ff4757', background: '#fff0f1', border: 'none', borderRadius: '20px', padding: '5px 12px', cursor: 'pointer', fontWeight: '700' }}>
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div style={{ width: '80px', height: '80px', background: '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px', color: '#1a1a1a' }}>장바구니가 비어있어요!</p>
          <p style={{ fontSize: '13px', color: '#adb5bd', margin: '0 0 24px' }}>상품을 담아보세요</p>
          <button onClick={onHome} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
            쇼핑 계속하기
          </button>
        </div>
      ) : (
        <>
          {/* 상품 목록 */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ background: 'white', borderRadius: '18px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f0faf5' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={item.image || getCategoryImage(item.large)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: '#00c471', margin: '0 0 3px', fontWeight: '700' }}>{item.large}</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: '#fff0f1', border: 'none', cursor: 'pointer', color: '#ff4757', fontSize: '12px', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>삭제</button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fffe', border: '1px solid #e8faf3', borderRadius: '20px', padding: '4px 8px' }}>
                    <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '24px', height: '24px', background: 'white', border: '1.5px solid #e8faf3', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', fontWeight: 'bold' }}>-</button>
                    <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '20px', textAlign: 'center', color: '#1a1a1a' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 쿠폰 */}
          <div style={{ margin: '0 16px 10px', background: 'white', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              쿠폰 코드
            </p>
            {appliedCoupon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0faf5', borderRadius: '12px', padding: '12px 14px', border: '1px solid #e8faf3' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#00a85e', margin: '0 0 2px' }}>{appliedCoupon.code}</p>
                  <p style={{ fontSize: '12px', color: '#00a85e', margin: 0 }}>{appliedCoupon.description}</p>
                </div>
                <button onClick={handleRemoveCoupon} style={{ background: '#fff0f1', border: 'none', cursor: 'pointer', color: '#ff4757', fontSize: '12px', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>제거</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="쿠폰 코드 입력" style={{ ...inputStyle, flex: 1 }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }} />
                <button onClick={handleApplyCoupon} style={{ padding: '11px 16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>적용</button>
              </div>
            )}
          </div>

          {/* ✅ 배송지 */}
          <div style={{ margin: '0 16px 10px', background: 'white', borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                배송지
              </p>
              <button onClick={() => setShowAddress(!showAddress)} style={{ padding: '6px 14px', background: '#f0faf5', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#00a85e' }}>
                {showAddress ? '접기' : '변경'}
              </button>
            </div>

            {/* ✅ 기본 주소가 있으면 탭 선택 */}
            {hasDefaultAddress && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button
                  onClick={() => handleSwitchAddress(true)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: useDefaultAddress ? '2px solid #00c471' : '1.5px solid #e8faf3', background: useDefaultAddress ? '#f0faf5' : 'white', color: useDefaultAddress ? '#00a85e' : '#adb5bd', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  기본 주소
                </button>
                <button
                  onClick={() => handleSwitchAddress(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: !useDefaultAddress ? '2px solid #00c471' : '1.5px solid #e8faf3', background: !useDefaultAddress ? '#f0faf5' : 'white', color: !useDefaultAddress ? '#00a85e' : '#adb5bd', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  다른 주소
                </button>
              </div>
            )}

            {/* ✅ 기본 주소 표시 */}
            {useDefaultAddress && hasDefaultAddress && (
              <div style={{ background: '#f0faf5', borderRadius: '12px', padding: '12px 14px', border: '1px solid #e8faf3' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#00a85e', margin: '0 0 4px' }}>✅ 기본 배송지</p>
                <p style={{ fontSize: '13px', color: '#1a1a1a', margin: '0 0 2px', fontWeight: '600' }}>{defaultAddress.name} · {defaultAddress.phone}</p>
                <p style={{ fontSize: '13px', color: '#495057', margin: 0 }}>{defaultAddress.address} {defaultAddress.detail}</p>
              </div>
            )}

            {/* ✅ 다른 주소 입력 폼 */}
            {(!useDefaultAddress || !hasDefaultAddress) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="받는 분 이름" style={inputStyle} />
                <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="연락처 (010-0000-0000)" type="tel" style={inputStyle} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={address.address} readOnly placeholder="주소 검색" style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                    onClick={() => {
                      if (window.daum) {
                        new window.daum.Postcode({
                          oncomplete: (data) => setAddress((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress, detail: '' }))
                        }).open();
                      } else {
                        alert('주소 검색 서비스를 불러오는 중이에요. 직접 입력해주세요.');
                        setAddress((prev) => ({ ...prev, address: '' }));
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (window.daum) {
                        new window.daum.Postcode({
                          oncomplete: (data) => setAddress((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress, detail: '' }))
                        }).open();
                      }
                    }}
                    style={{ padding: '11px 14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    주소 찾기
                  </button>
                </div>
                <input value={address.detail} onChange={(e) => setAddress({ ...address, detail: e.target.value })} placeholder="상세 주소 (동/호수 등)" style={inputStyle} />
                {address.name && address.phone && address.address && (
                  <div style={{ background: '#f0faf5', borderRadius: '12px', padding: '12px 14px', border: '1px solid #e8faf3' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', margin: '0 0 4px' }}>✅ 배송지 입력 완료</p>
                    <p style={{ fontSize: '12px', color: '#495057', margin: 0 }}>{address.name} · {address.phone}</p>
                    <p style={{ fontSize: '12px', color: '#495057', margin: 0 }}>{address.address} {address.detail}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 결제 영역 */}
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: 'white', padding: '16px 20px 36px', borderTop: '1px solid #f0faf5', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: '#adb5bd' }}>상품 금액</span>
              <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '600' }}>₩{totalPrice.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#00a85e' }}>쿠폰 할인</span>
                <span style={{ fontSize: '13px', color: '#00a85e', fontWeight: '700' }}>-₩{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', paddingTop: '10px', borderTop: '1px solid #f0faf5' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a' }}>총 결제금액</span>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#00c471' }}>₩{finalPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={() => {
                if (!isAddressComplete) {
                  alert('배송지 정보를 입력해주세요! 📦');
                  return;
                }
                onPayment(finalPrice);
              }}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 20px rgba(0,196,113,0.35)', letterSpacing: '-0.3px' }}>
              카카오페이로 결제하기 💳
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;