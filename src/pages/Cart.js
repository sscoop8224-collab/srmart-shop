import { imgUrl } from '../api';
import { useCheckoutFlow } from '../hooks/useCheckoutFlow';
import { getItemPrice } from '../utils/pricing';
import CouponCodeBox from '../components/checkout/CouponCodeBox';
import AddressBox from '../components/checkout/AddressBox';
import SummaryBar from '../components/checkout/SummaryBar';

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

function Cart({ cart, setCart, onPayment, onHome, goBack, user, darkMode }) {
  // 배송지/쿠폰/포인트/배송권역/합계 계산은 QuickOrder.js 와 공유하는 훅으로 이전됨(useCheckoutFlow).
  const checkout = useCheckoutFlow(cart, { user });

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';

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

  return (
    <div className="cart-root" style={{ background: bg, minHeight: '100vh', paddingBottom: 'calc(180px + env(safe-area-inset-bottom))' }}>

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
          <div className="cart-layout">
          <div className="cart-main">
          {/* 상품 목록 */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cart.map((item) => (
              <div key={item.id} style={{ background: cardBg, borderRadius: '18px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${borderColor}` }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={item.image ? imgUrl(item.image) : getCategoryImage(item.large)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

          <CouponCodeBox
            darkMode={darkMode}
            appliedCoupon={checkout.appliedCoupon}
            couponInput={checkout.couponInput}
            setCouponInput={checkout.setCouponInput}
            onApply={checkout.handleApplyCoupon}
            onRemove={checkout.handleRemoveCoupon}
          />

          <AddressBox
            darkMode={darkMode}
            showAddress={checkout.showAddress} setShowAddress={checkout.setShowAddress}
            useDefaultAddress={checkout.useDefaultAddress} handleSwitchAddress={checkout.handleSwitchAddress}
            hasDefaultAddress={checkout.hasDefaultAddress} defaultAddress={checkout.defaultAddress}
            address={checkout.address} setAddress={checkout.setAddress}
            zipcode={checkout.zipcode} setZipcode={checkout.setZipcode}
            checkZipcodeValue={checkout.checkZipcodeValue}
            matchingZipcode={checkout.matchingZipcode} deliveryInfo={checkout.deliveryInfo}
          />

          </div>{/* /cart-main */}
          <div className="cart-side">
          <SummaryBar
            darkMode={darkMode}
            totalPrice={checkout.totalPrice} appliedCoupon={checkout.appliedCoupon} discountAmount={checkout.discountAmount}
            deliveryFee={checkout.deliveryFee} freeDeliveryMin={checkout.freeDeliveryMin}
            myCoupons={checkout.myCoupons} selectedCouponId={checkout.selectedCouponId} handleCouponSelect={checkout.handleCouponSelect} couponDiscount={checkout.couponDiscount}
            myPoints={checkout.myPoints} usePoints={checkout.usePoints} setUsePoints={checkout.setUsePoints} clampedUsePoints={checkout.clampedUsePoints}
            finalPrice={checkout.finalPrice} canPay={checkout.canPay} zipcode={checkout.zipcode} deliveryInfo={checkout.deliveryInfo}
            onPay={() => onPayment(checkout.finalPrice, checkout.buildOrderExtras())}
          />
          </div>{/* /cart-side */}
          </div>{/* /cart-layout */}
        </>
      )}
    </div>
  );
}

export default Cart;