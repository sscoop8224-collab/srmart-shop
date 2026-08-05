import { imgUrl } from '../api';
import { useCheckoutFlow } from '../hooks/useCheckoutFlow';
import { getItemPrice } from '../utils/pricing';
import CouponCodeBox from '../components/checkout/CouponCodeBox';
import AddressBox from '../components/checkout/AddressBox';
import SummaryBar from '../components/checkout/SummaryBar';

const getCategoryImage = (large) => {
  switch (large) {
    case '식품': return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80';
    case '음료': return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&q=80';
    case '생활용품': return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&q=80';
    case '간식/과자': return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&q=80';
    case '주류': return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';
  }
};

// 상품 상세에서 고른 수량/옵션 그대로 장바구니를 거치지 않고 바로 결제로 진입.
// 배송지/쿠폰/포인트/배송권역/합계 계산은 Cart.js 와 완전히 동일한 useCheckoutFlow 를 공유한다
// (item 1개짜리 배열을 넘기는 것만 다름) — 계산식이 두 갈래로 갈리지 않는다.
function QuickOrder({ item, onBack, onPayment, user, darkMode }) {
  const checkout = useCheckoutFlow(item ? [item] : [], { user });

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';

  if (!item) {
    return (
      <div style={{ background: bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
        <p style={{ fontSize: '15px', color: subTextColor, margin: '0 0 20px' }}>주문할 상품 정보를 찾을 수 없어요.</p>
        <button onClick={onBack} style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontSize: '15px', fontWeight: '700' }}>
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="cart-root" style={{ background: bg, minHeight: '100vh', paddingBottom: '180px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: headerBg, borderBottom: `1px solid ${borderColor}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack} style={{ width: '38px', height: '38px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#f0f0f0' : '#1a1a1a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: textColor }}>바로 주문</h2>
        </div>
      </div>

      <div className="cart-layout">
        <div className="cart-main">
          {/* 주문 상품 요약 — 상세에서 고른 옵션/수량 그대로, 여기서는 변경 불가 */}
          <div style={{ padding: '16px' }}>
            <div style={{ background: cardBg, borderRadius: '18px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${borderColor}` }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '14px', overflow: 'hidden', flexShrink: 0 }}>
                <img src={item.image ? imgUrl(item.image) : getCategoryImage(item.large)} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '11px', color: '#00c471', margin: '0 0 3px', fontWeight: '700' }}>{item.large}</p>
                <p style={{ fontSize: '14px', fontWeight: '700', color: textColor, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                {item.purchase_type === 'box' && (
                  <p style={{ fontSize: '10px', color: '#e17055', margin: '0 0 2px', fontWeight: '700' }}>박스 구매 · {item.quantity}박스</p>
                )}
                {item.pricing_type === 'weight' && (
                  <p style={{ fontSize: '10px', color: subTextColor, margin: '0 0 2px' }}>{item.grams || 100}g</p>
                )}
                {item.purchase_type !== 'box' && item.pricing_type !== 'weight' && (
                  <p style={{ fontSize: '10px', color: subTextColor, margin: '0 0 2px' }}>수량 {item.quantity}개</p>
                )}
                <p style={{ fontSize: '15px', fontWeight: '800', color: '#00c471', margin: 0 }}>₩{getItemPrice(item).toLocaleString()}</p>
              </div>
            </div>
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
            zipcode={checkout.zipcode} setZipcode={checkout.setZipcode} setDeliveryInfo={checkout.setDeliveryInfo}
            handleZipcodeCheck={checkout.handleZipcodeCheck} checkZipcodeValue={checkout.checkZipcodeValue}
            matchingZipcode={checkout.matchingZipcode} deliveryInfo={checkout.deliveryInfo}
          />
        </div>{/* /cart-main */}

        <div className="cart-side">
          <SummaryBar
            darkMode={darkMode}
            totalPrice={checkout.totalPrice} appliedCoupon={checkout.appliedCoupon} discountAmount={checkout.discountAmount}
            baseFee={checkout.baseFee} freeDeliveryMin={checkout.freeDeliveryMin} extraDeliveryFee={checkout.extraDeliveryFee}
            myCoupons={checkout.myCoupons} selectedCouponId={checkout.selectedCouponId} handleCouponSelect={checkout.handleCouponSelect} couponDiscount={checkout.couponDiscount}
            myPoints={checkout.myPoints} usePoints={checkout.usePoints} setUsePoints={checkout.setUsePoints} clampedUsePoints={checkout.clampedUsePoints}
            finalPrice={checkout.finalPrice} canPay={checkout.canPay} zipcode={checkout.zipcode} deliveryInfo={checkout.deliveryInfo}
            onPay={() => onPayment(item, checkout.finalPrice, checkout.buildOrderExtras())}
          />
        </div>{/* /cart-side */}
      </div>{/* /cart-layout */}
    </div>
  );
}

export default QuickOrder;
