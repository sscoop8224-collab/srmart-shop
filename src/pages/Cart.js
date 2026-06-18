import { useState, useEffect } from 'react';
import { matchZipcode, getMyPoints } from '../api';
import { useStore } from '../StoreContext';

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

function Cart({ cart, setCart, onPayment, onHome, goBack, coupons, appliedCoupon, setAppliedCoupon, user, darkMode }) {
  const { currentStore } = useStore();
  const [couponInput, setCouponInput] = useState('');
  const [showAddress, setShowAddress] = useState(false);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [address, setAddress] = useState({ name: '', phone: '', address: '', detail: '' });
  const [zipcode, setZipcode] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [matchingZipcode, setMatchingZipcode] = useState(false);
  const [myPoints, setMyPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(0);

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';
  const fixedBg = darkMode ? '#1a1a1a' : 'white';

  const defaultAddress = {
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    detail: user?.addressDetail || '',
  };
  const hasDefaultAddress = defaultAddress.address && defaultAddress.address.trim() !== '';

  useEffect(() => {
    if (hasDefaultAddress) {
      setAddress(defaultAddress);
      setUseDefaultAddress(true);
      if (user?.zipcode) {
        setZipcode(user.zipcode);
        checkZipcodeValue(user.zipcode);
      }
    } else {
      setUseDefaultAddress(false);
    }
  }, [user]);

  const updateQuantity = (id, delta) => {
    setCart(cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    ));
  };

  const updateGrams = (id, delta) => {
    setCart(cart.map((item) =>
      item.id === id ? { ...item, grams: Math.max(100, (item.grams || 100) + delta) } : item
    ));
  };

  const removeFromCart = (id) => setCart(cart.filter((item) => item.id !== id));

  const getItemPrice = (item) => {
    if (item.pricing_type === 'weight') return (item.unit_price || item.price) * (item.grams || 100) / 100;
    return item.price * item.quantity;
  };

  useEffect(() => {
    if (user) getMyPoints().then(r => setMyPoints(r.data?.points || 0)).catch(() => {});
  }, [user]);

  const totalPrice = cart.reduce((sum, item) => sum + getItemPrice(item), 0);

  const discountAmount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Math.floor(totalPrice * appliedCoupon.discount / 100)
      : appliedCoupon.discount
    : 0;

  const baseDeliveryFeeRule = currentStore?.base_delivery_fee ?? 0;
  const freeDeliveryMin = currentStore?.free_delivery_min ?? 0;
  const extraDeliveryFee = deliveryInfo?.deliveryFee ?? 0;
  const baseFee = (freeDeliveryMin > 0 && totalPrice >= freeDeliveryMin) ? 0 : baseDeliveryFeeRule;
  const totalDeliveryFee = baseFee + extraDeliveryFee;

  const clampedUsePoints = Math.min(usePoints, myPoints, totalPrice - discountAmount + totalDeliveryFee);
  const finalPrice = Math.max(0, totalPrice - discountAmount + totalDeliveryFee - clampedUsePoints);

  const checkZipcodeValue = async (zip) => {
    if (!zip || zip.length < 3) return;
    setMatchingZipcode(true);
    try {
      const res = await matchZipcode(zip);
      if (res.data.matched) {
        setDeliveryInfo({ zoneName: res.data.zone.zone_name, deliveryFee: res.data.delivery_fee });
      } else {
        setDeliveryInfo({ error: res.data.message || '배송 불가 지역이에요' });
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setDeliveryInfo({ error: '로그인이 필요해요' });
      } else if (err.response?.status === 400) {
        setDeliveryInfo({ error: err.response.data.error });
      } else {
        setDeliveryInfo({ error: '주소 확인 중 오류가 발생했어요' });
      }
    } finally {
      setMatchingZipcode(false);
    }
  };

  const handleZipcodeCheck = () => checkZipcodeValue(zipcode);

  const handleApplyCoupon = async () => {
    if (!couponInput) { alert('쿠폰 코드를 입력해주세요!'); return; }
    try {
      const API = (await import('../api')).default;
      const res = await API.post('/coupons/check', { code: couponInput.toUpperCase() });
      const coupon = res.data;
      if (coupon.min_order_amount > 0 && totalPrice < coupon.min_order_amount) {
        alert(`최소 주문금액 ₩${coupon.min_order_amount.toLocaleString()} 이상이어야 해요!`);
        return;
      }
      setAppliedCoupon(coupon);
      alert((coupon.description || coupon.code) + ' 쿠폰이 적용됐어요! 😊');
      setCouponInput('');
    } catch (err) {
      alert(err.response?.data?.error || '유효하지 않은 쿠폰 코드예요!');
    }
  };

  const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponInput(''); };

  const handleSwitchAddress = (useDefault) => {
    setUseDefaultAddress(useDefault);
    setZipcode('');
    setDeliveryInfo(null);
    if (useDefault) {
      setAddress(defaultAddress);
      if (user?.zipcode) {
        setZipcode(user.zipcode);
        checkZipcodeValue(user.zipcode);
      }
    } else {
      setAddress({ name: '', phone: '', address: '', detail: '' });
    }
  };

  const currentAddress = useDefaultAddress ? defaultAddress : address;
  const isAddressComplete = currentAddress.name && currentAddress.phone && currentAddress.address;

  const inputStyle = {
    padding: '11px 14px', borderRadius: '12px', border: `1.5px solid ${inputBorder}`,
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    background: inputBg, width: '100%', boxSizing: 'border-box',
    color: textColor
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '180px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: headerBg, borderBottom: `1px solid ${borderColor}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '38px', height: '38px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#f0f0f0' : '#1a1a1a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: textColor }}>장바구니</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: subTextColor, fontWeight: '600' }}>{cart.length}개 상품</span>
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
          <div style={{ width: '80px', height: '80px', background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px', color: textColor }}>장바구니가 비어있어요!</p>
          <p style={{ fontSize: '13px', color: subTextColor, margin: '0 0 24px' }}>상품을 담아보세요</p>
          <button onClick={onHome} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '15px', fontWeight: '700', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
            쇼핑 계속하기
          </button>
        </div>
      ) : (
        <>
          {/* 상품 목록 */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ background: cardBg, borderRadius: '18px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${borderColor}` }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={item.image || getCategoryImage(item.large)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '11px', color: '#00c471', margin: '0 0 3px', fontWeight: '700' }}>{item.large}</p>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: textColor, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  {item.purchase_type === 'box' && (
                    <p style={{ fontSize: '10px', color: '#e17055', margin: '0 0 2px', fontWeight: '700' }}>박스 구매</p>
                  )}
                  {item.pricing_type === 'weight' && (
                    <p style={{ fontSize: '10px', color: subTextColor, margin: '0 0 2px' }}>{item.grams || 100}g</p>
                  )}
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{getItemPrice(item).toLocaleString()}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button onClick={() => removeFromCart(item.id)} style={{ background: '#fff0f1', border: 'none', cursor: 'pointer', color: '#ff4757', fontSize: '12px', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>삭제</button>
                  {item.pricing_type === 'weight' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: darkMode ? '#1a1a1a' : '#f8fffe', border: `1px solid ${inputBorder}`, borderRadius: '20px', padding: '4px 8px' }}>
                      <button onClick={() => updateGrams(item.id, -100)} style={{ width: '24px', height: '24px', background: darkMode ? '#2e2e2e' : 'white', border: `1.5px solid ${inputBorder}`, borderRadius: '50%', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor, fontWeight: 'bold' }}>-</button>
                      <span style={{ fontSize: '12px', fontWeight: '700', minWidth: '36px', textAlign: 'center', color: textColor }}>{item.grams || 100}g</span>
                      <button onClick={() => updateGrams(item.id, 100)} style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>+</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: darkMode ? '#1a1a1a' : '#f8fffe', border: `1px solid ${inputBorder}`, borderRadius: '20px', padding: '4px 8px' }}>
                      <button onClick={() => updateQuantity(item.id, -1)} style={{ width: '24px', height: '24px', background: darkMode ? '#2e2e2e' : 'white', border: `1.5px solid ${inputBorder}`, borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textColor, fontWeight: 'bold' }}>-</button>
                      <span style={{ fontSize: '14px', fontWeight: '700', minWidth: '20px', textAlign: 'center', color: textColor }}>
                        {item.purchase_type === 'box' ? `${item.quantity}박스` : item.quantity}
                      </span>
                      <button onClick={() => updateQuantity(item.id, 1)} style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>+</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 쿠폰 */}
          <div style={{ margin: '0 16px 10px', background: cardBg, borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: textColor, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              쿠폰 코드
            </p>
            {appliedCoupon ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '12px', padding: '12px 14px', border: `1px solid ${inputBorder}` }}>
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

          {/* 배송지 */}
          <div style={{ margin: '0 16px 10px', background: cardBg, borderRadius: '18px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: textColor, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                배송지
              </p>
              <button onClick={() => setShowAddress(!showAddress)} style={{ padding: '6px 14px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#00a85e' }}>
                {showAddress ? '접기' : '변경'}
              </button>
            </div>

            {hasDefaultAddress && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button onClick={() => handleSwitchAddress(true)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: useDefaultAddress ? '2px solid #00c471' : `1.5px solid ${inputBorder}`, background: useDefaultAddress ? (darkMode ? '#2e2e2e' : '#f0faf5') : cardBg, color: useDefaultAddress ? '#00a85e' : subTextColor, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  기본 주소
                </button>
                <button onClick={() => handleSwitchAddress(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: !useDefaultAddress ? '2px solid #00c471' : `1.5px solid ${inputBorder}`, background: !useDefaultAddress ? (darkMode ? '#2e2e2e' : '#f0faf5') : cardBg, color: !useDefaultAddress ? '#00a85e' : subTextColor, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                  다른 주소
                </button>
              </div>
            )}

            {useDefaultAddress && hasDefaultAddress && (
              <div style={{ background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '12px', padding: '12px 14px', border: `1px solid ${inputBorder}` }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#00a85e', margin: '0 0 4px' }}>✅ 기본 배송지</p>
                <p style={{ fontSize: '13px', color: textColor, margin: '0 0 2px', fontWeight: '600' }}>{defaultAddress.name} · {defaultAddress.phone}</p>
                <p style={{ fontSize: '13px', color: darkMode ? '#c0c0c0' : '#495057', margin: 0 }}>{defaultAddress.address} {defaultAddress.detail}</p>
              </div>
            )}

            {(!useDefaultAddress || !hasDefaultAddress) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="받는 분 이름" style={inputStyle} />
                <input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="연락처 (010-0000-0000)" type="tel" style={inputStyle} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={address.address} readOnly placeholder="주소 검색" style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                    onClick={() => {
                      if (window.daum) {
                        new window.daum.Postcode({
                          oncomplete: (data) => { setAddress((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress, detail: '' })); if (data.zonecode) { setZipcode(data.zonecode); setDeliveryInfo(null); } }
                        }).open();
                      } else {
                        alert('주소 검색 서비스를 불러오는 중이에요. 직접 입력해주세요.');
                      }
                    }}
                  />
                  <button onClick={() => { if (window.daum) { new window.daum.Postcode({ oncomplete: (data) => { setAddress((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress, detail: '' })); if (data.zonecode) { setZipcode(data.zonecode); setDeliveryInfo(null); } } }).open(); } }}
                    style={{ padding: '11px 14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                    주소 찾기
                  </button>
                </div>
                <input value={address.detail} onChange={(e) => setAddress({ ...address, detail: e.target.value })} placeholder="상세 주소 (동/호수 등)" style={inputStyle} />
                {address.name && address.phone && address.address && (
                  <div style={{ background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '12px', padding: '12px 14px', border: `1px solid ${inputBorder}` }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', margin: '0 0 4px' }}>✅ 배송지 입력 완료</p>
                    <p style={{ fontSize: '12px', color: darkMode ? '#c0c0c0' : '#495057', margin: 0 }}>{address.name} · {address.phone}</p>
                    <p style={{ fontSize: '12px', color: darkMode ? '#c0c0c0' : '#495057', margin: 0 }}>{address.address} {address.detail}</p>
                  </div>
                )}
              </div>
            )}

            {/* 우편번호 + 배송 구역 확인 */}
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: textColor, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                우편번호 (배송지역 확인)
              </p>
              <input
                type="text"
                value={zipcode}
                onChange={(e) => { setZipcode(e.target.value.replace(/[^0-9]/g, '').slice(0, 5)); setDeliveryInfo(null); }}
                onBlur={handleZipcodeCheck}
                placeholder="우편번호 5자리"
                maxLength={5}
                style={inputStyle}
              />
              {matchingZipcode && <p style={{ fontSize: 12, color: subTextColor, margin: '4px 0 0' }}>배송 구역 확인 중...</p>}
              {deliveryInfo?.zoneName && (
                <div style={{ fontSize: 13, marginTop: 6, color: '#00a85e', fontWeight: 600 }}>
                  ✓ {deliveryInfo.zoneName} 배송 가능
                  {deliveryInfo.deliveryFee > 0 && <span style={{ color: '#178a2d' }}> (지역 추가 +{deliveryInfo.deliveryFee.toLocaleString()}원)</span>}
                </div>
              )}
              {deliveryInfo?.error && (
                <div style={{ fontSize: 13, marginTop: 6, color: '#d32f2f', fontWeight: 600 }}>
                  ✗ {deliveryInfo.error}
                </div>
              )}
            </div>
          </div>

          {/* 결제 영역 */}
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: fixedBg, padding: '16px 20px 36px', borderTop: `1px solid ${borderColor}`, boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: subTextColor }}>상품 금액</span>
              <span style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>₩{totalPrice.toLocaleString()}</span>
            </div>
            {appliedCoupon && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#00a85e' }}>쿠폰 할인</span>
                <span style={{ fontSize: '13px', color: '#00a85e', fontWeight: '700' }}>-₩{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: subTextColor }}>
                기본 배송료
                {freeDeliveryMin > 0 && baseFee === 0 && <span style={{ color: '#00a85e', marginLeft: 6, fontWeight: 700 }}>무료배송 적용</span>}
              </span>
              <span style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>₩{baseFee.toLocaleString()}</span>
            </div>
            {extraDeliveryFee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: subTextColor }}>지역 추가 배송료</span>
                <span style={{ fontSize: '13px', color: textColor, fontWeight: '600' }}>+₩{extraDeliveryFee.toLocaleString()}</span>
              </div>
            )}
            {/* 포인트 사용 */}
            {myPoints > 0 && (
              <div style={{ marginBottom: '12px', padding: '12px 14px', background: darkMode ? '#1a2030' : '#f0f6ff', borderRadius: 12, border: `1px solid ${darkMode ? '#2a3040' : '#d0e4ff'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#1a73e8' }}>포인트 사용</span>
                  <span style={{ fontSize: '12px', color: darkMode ? '#8ab4f8' : '#1a73e8' }}>보유 {myPoints.toLocaleString()}P</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="number" value={usePoints || ''}
                    onChange={e => setUsePoints(Math.min(Number(e.target.value) || 0, myPoints))}
                    placeholder="사용할 포인트 입력"
                    min="0" max={myPoints}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${inputBorder}`, fontSize: '13px', outline: 'none', background: inputBg, color: textColor, fontFamily: 'inherit' }} />
                  <button onClick={() => setUsePoints(Math.min(myPoints, totalPrice - discountAmount + totalDeliveryFee))}
                    style={{ padding: '8px 12px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: 8, fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>전액</button>
                  <button onClick={() => setUsePoints(0)}
                    style={{ padding: '8px 10px', background: darkMode ? '#2e2e2e' : '#e8e8e8', color: textColor, border: 'none', borderRadius: 8, fontSize: '12px', cursor: 'pointer' }}>취소</button>
                </div>
                {clampedUsePoints > 0 && <div style={{ fontSize: '12px', color: '#1a73e8', marginTop: 6, fontWeight: 600 }}>−{clampedUsePoints.toLocaleString()}P 적용</div>}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', paddingTop: '10px', borderTop: `1px solid ${borderColor}` }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: textColor }}>총 결제금액</span>
              <span style={{ fontSize: '22px', fontWeight: '900', color: '#00c471' }}>₩{finalPrice.toLocaleString()}</span>
            </div>
            <button
              disabled={!isAddressComplete || !zipcode || !deliveryInfo?.zoneName || matchingZipcode}
              onClick={() => {
                const currentAddress = useDefaultAddress ? defaultAddress : address;
                onPayment(finalPrice, {
                  zipcode,
                  use_points: clampedUsePoints,
                  baseDeliveryFee: baseFee,
                  extraDeliveryFee,
                  address: currentAddress.address,
                  addressDetail: currentAddress.detail,
                  receiverName: currentAddress.name,
                  receiverPhone: currentAddress.phone,
                  items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.pricing_type === 'weight' ? 1 : item.quantity,
                    grams: item.pricing_type === 'weight' ? (item.grams || 100) : undefined,
                    quantity_type: item.purchase_type === 'box' ? 'box' : 'unit',
                    price: getItemPrice(item),
                  })),
                });
              }}
              style={{ width: '100%', padding: '16px', background: (!isAddressComplete || !zipcode || !deliveryInfo?.zoneName || matchingZipcode) ? '#dee2e6' : 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '16px', fontSize: '16px', cursor: (!isAddressComplete || !zipcode || !deliveryInfo?.zoneName || matchingZipcode) ? 'not-allowed' : 'pointer', fontWeight: '800', boxShadow: (!isAddressComplete || !zipcode || !deliveryInfo?.zoneName || matchingZipcode) ? 'none' : '0 4px 20px rgba(0,196,113,0.35)', letterSpacing: '-0.3px' }}>
              {!zipcode ? '우편번호를 입력해주세요' : !deliveryInfo?.zoneName ? '배송 구역을 확인해주세요' : '카카오페이로 결제하기 💳'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;