// 주문서 한 장 (목업 정본 v1 의 P03 · S10 · S11 · S12, 묶음 3 · 2026-11-12 밤)
//
// 장바구니의 「주문하기」(제목 「주문서」, 담은 것 전부)와 상세의 「바로 주문」(제목 「바로 주문」, 고른 상품 1건)이 **같은 화면**을 쓴다(P03).
// 주문 상품 → 배송지(누르면 시트 S11) → 할인(쿠폰 한 줄 → 시트 · 포인트) → 결제 금액 → 아래 바 「○원 결제하기」.
// 박스·무게·수량은 여기서 못 바꾼다(장바구니·상세에서 바꾼다). 바로 주문은 장바구니를 건드리지 않는다.
// 배송지/쿠폰/포인트/배송권역/합계 계산은 예전과 같은 useCheckoutFlow — 장바구니(옛 Cart.js)·바로 주문(옛 QuickOrder.js)이 쓰던 그 훅을
// 그대로 부른다(넘기는 상품 배열만 다름). 계산식이 갈리지 않는다. 그리는 부품은 components/checkout/CheckoutParts.jsx.
import { useState } from 'react';
import { imgUrl } from '../api';
import { useCheckoutFlow } from '../hooks/useCheckoutFlow';
import { getItemPrice } from '../utils/pricing';
import { AddressSection, DiscountSection, PayRows, BenefitsError, PayBar, summaryOf } from '../components/checkout/CheckoutParts';
import Icon from '../components/ui/Icon';

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
const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;
const what = (item) => item.purchase_type === 'box' ? `박스 구매 · ${item.quantity}박스`
  : item.pricing_type === 'weight' ? `${item.grams || 100}g` : `수량 ${item.quantity}개`;

function ItemRow({ item }) {
  return (
    <div className="row">
      <div className="prow" style={{ flex: 1, minWidth: 0 }}>
        <div className="pimg"><img src={item.image ? imgUrl(item.image) : getCategoryImage(item.large)} alt={item.name} onError={e => { e.currentTarget.src = getCategoryImage(item.large); }} /></div>
        <div className="info">
          <div className="nm">{item.name}</div>
          {/* 규격 — 장바구니와 같은 이유(같은 이름에 용량만 다른 물건이 많다) */}
          <div className="spec">{item.spec}{item.spec ? ' · ' : ''}<span className={item.purchase_type === 'box' ? 'box' : undefined}>{what(item)}</span></div>
          <div className="price">{won(getItemPrice(item))}</div>
        </div>
      </div>
    </div>
  );
}

// items — 주문할 상품 배열(장바구니 전체 또는 바로 주문 1건) · onPayment(finalPrice, orderExtras)
function OrderSheet({ items, title = '주문서', onBack, onPayment, user }) {
  const list = items || [];
  const checkout = useCheckoutFlow(list, { user });
  const [pointsOpen, setPointsOpen] = useState(false);
  // 상품이 여러 개면 한 줄로 접는다(P03 「주문 상품 3개 · ○○ 외 2건」) — 누르면 펼친다
  const [itemsOpen, setItemsOpen] = useState(false);

  const head = (
    <header className="app-nav line">
      <div className="nav-row">
        <div className="nav-side"><button className="nav-btn" aria-label="뒤로" onClick={onBack}><Icon name="chevL" /></button></div>
        <h2 className="nav-title">{title}</h2>
        <div className="nav-side r" />
      </div>
    </header>
  );

  if (list.length === 0) {
    return (
      <div className="v2 qo-v2">
        {head}
        <div className="ui-empty">
          <div className="big"><Icon name="alert" /></div>
          <h3>주문할 상품 정보를 찾을 수 없어요</h3>
          <p>상품 화면에서 다시 시도해 주세요.</p>
          <button className="ui-btn md gray" onClick={onBack}>돌아가기</button>
        </div>
      </div>
    );
  }

  const first = list[0];
  return (
    <div className="v2 qo-v2">
      {head}
      <div className="split">
        <div>
          <section className="sec">
            <div className="sec-h">주문 상품</div>
            <div className="group">
              {list.length === 1 ? <ItemRow item={first} /> : (
                <>
                  <button className="row tap" onClick={() => setItemsOpen(v => !v)} aria-expanded={itemsOpen}>
                    <span className="ricon"><Icon name="cart" /></span>
                    <span className="lbl">주문 상품 {list.length}개<small>{first.name} 외 {list.length - 1}건</small></span>
                    <span className="val">{won(checkout.totalPrice)}</span>
                    <span className="chev"><Icon name={itemsOpen ? 'chevD' : 'chevR'} size="sm" /></span>
                  </button>
                  {itemsOpen && list.map((item, i) => <ItemRow key={item.id ?? i} item={item} />)}
                </>
              )}
            </div>
          </section>
          <AddressSection c={checkout} />
        </div>
        <div>
          <DiscountSection c={checkout} pointsOpen={pointsOpen} setPointsOpen={setPointsOpen} />
          <PayRows c={checkout} />
          <BenefitsError c={checkout} />
        </div>
      </div>
      <PayBar c={checkout} onPay={() => onPayment(checkout.finalPrice, { ...checkout.buildOrderExtras(), summary: summaryOf(checkout) })} />
    </div>
  );
}

export default OrderSheet;
