// 주문서 한 장 (목업 정본 v1 의 P03 · S10 · S11 · S12, 묶음 3 · 2026-11-12 밤)
//
// 장바구니의 「주문하기」(제목 「주문서」, 담은 것 전부)와 상세의 「바로 주문」(제목 「바로 주문」, 고른 상품 1건)이 **같은 화면**을 쓴다(P03).
// 주문 상품 → 배송지(누르면 시트 S11) → 할인(쿠폰 한 줄 → 시트 · 포인트) → 결제 금액 → 아래 바 「○원 결제하기」.
// 박스·무게·수량은 여기서 못 바꾼다(장바구니·상세에서 바꾼다). 바로 주문은 장바구니를 건드리지 않는다.
// 배송지/쿠폰/포인트/배송권역/합계 계산은 예전과 같은 useCheckoutFlow — 장바구니(옛 Cart.js)·바로 주문(옛 QuickOrder.js)이 쓰던 그 훅을
// 그대로 부른다(넘기는 상품 배열만 다름). 계산식이 갈리지 않는다. 그리는 부품은 components/checkout/CheckoutParts.jsx.
// 🔴 주류(매장 픽업 · S51·S52 · 2026-11-17 밤샘 지시 6): 줄의 pickup_only(서버 판정)로 나눈다.
//    배송만 → 예전 그대로 · 픽업만 → 배송지 대신 픽업 매장 · 섞임 → 「배송 주문 + 매장 픽업 주문」 두 덩어리, 결제는 한 번(POST /api/orders/checkout).
//    쿠폰·포인트는 섞인 경우 배송 주문에만 건다(서버: 두 주문 합쳐 쿠폰 한 장 — 목업 S52 「쿠폰·배송비는 배송 주문에만」).
import { useState } from 'react';
import { useStore } from '../StoreContext';
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

/** 상품 묶음 — 하나면 그대로, 여럿이면 한 줄로 접는다(P03 「주문 상품 3개 · ○○ 외 2건」) — 누르면 펼친다 */
function ItemsGroup({ list, amount }) {
  const [open, setOpen] = useState(false);
  if (list.length === 1) return <div className="group"><ItemRow item={list[0]} /></div>;
  return (
    <div className="group">
      <button className="row tap" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        <span className="ricon"><Icon name="cart" /></span>
        <span className="lbl">주문 상품 {list.length}개<small>{list[0].name} 외 {list.length - 1}건</small></span>
        <span className="val">{won(amount)}</span>
        <span className="chev"><Icon name={open ? 'chevD' : 'chevR'} size="sm" /></span>
      </button>
      {open && list.map((item, i) => <ItemRow key={item.id ?? i} item={item} />)}
    </div>
  );
}

/** 픽업 매장(S51·S52) — 배송지 대신. 기한은 결제한 날 기준이라 주문 완료 화면(S53)에 적는다 */
export function PickupSection({ c, store }) {
  const name = store ? (store.display_name || store.name) : '가입 매장';
  return (
    <section className="sec">
      <div className="sec-h">픽업 매장</div>
      <div className="group">
        <div className="row">
          <span className="ricon"><Icon name="store" /></span>
          <span className="lbl">{name}<small>받으실 때 신분증으로 나이를 확인해요 · 예약한 본인만 받을 수 있어요</small></span>
        </div>
        <div className="row">
          <span className="ricon"><Icon name="user" /></span>
          <span className="lbl">받는 분<small>{c.currentAddress.name || '이름 없음'} · {c.currentAddress.phone || '전화번호 없음'}</small></span>
        </div>
      </div>
      <div className="sec-f">주류는 배송하지 않아요. 찾아가는 기한은 주문 완료 화면과 알림으로 알려 드려요.</div>
    </section>
  );
}

const sumSummary = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, (a[k] || 0) + (b[k] || 0)]));
const groupHead = (icon, text) => <div className="sec-h"><Icon name={icon} size="sm" /> {text}</div>;

// items — 주문할 상품 배열(장바구니 전체 또는 바로 주문 1건) · onPayment(finalPrice, orderExtras)
function OrderSheet({ items, title = '주문서', onBack, onPayment, user }) {
  const list = items || [];
  const { currentStore } = useStore();
  const pickupItems = list.filter(i => i.pickup_only);
  const deliveryItems = list.filter(i => !i.pickup_only);
  const mode = !pickupItems.length ? 'delivery' : !deliveryItems.length ? 'pickup' : 'split';
  // 훅은 늘 둘 다 부른다(훅 규칙) — 빈 쪽은 견적도 쿠폰 조회도 하지 않는다
  const d = useCheckoutFlow(deliveryItems, { user, benefits: mode !== 'pickup' });
  const p = useCheckoutFlow(pickupItems, { user, fulfillment: 'pickup', benefits: mode === 'pickup' });
  const checkout = mode === 'pickup' ? p : d;   // 쿠폰·포인트를 거는 쪽
  const pay = mode !== 'split' ? checkout : {
    ...d,
    finalPrice: d.finalPrice + p.finalPrice,
    canPay: d.canPay && p.canPay,
    quoteLoading: d.quoteLoading || p.quoteLoading,
    quoteError: d.quoteError || p.quoteError,
  };
  const [pointsOpen, setPointsOpen] = useState(false);
  const onPay = () => {
    if (mode !== 'split') return onPayment(checkout.finalPrice, { ...checkout.buildOrderExtras(), summary: summaryOf(checkout) });
    return onPayment(pay.finalPrice, {
      split: { delivery: d.buildOrderExtras(), pickup: p.buildOrderExtras() },
      summary: sumSummary(summaryOf(d), summaryOf(p)),
      amounts: { delivery: d.finalPrice, pickup: p.finalPrice },
    });
  };

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

  return (
    <div className="v2 qo-v2">
      {head}
      {mode === 'split' && (
        <section className="sec" style={{ marginTop: 'var(--sp-2)' }}>
          <div className="notice b"><Icon name="info" /><div style={{ flex: 1 }}>주문이 두 개로 나뉘어요 — <b>배송 주문 + 매장 픽업 주문</b>. 주류는 배송하지 않아요.</div></div>
        </section>
      )}
      <div className="split">
        <div>
          {mode !== 'pickup' && (
            <section className="sec">
              {mode === 'split' ? groupHead('truck', `배송 주문 · ${deliveryItems.length}개`) : <div className="sec-h">주문 상품</div>}
              <ItemsGroup list={deliveryItems} amount={d.totalPrice} />
            </section>
          )}
          {mode !== 'pickup' && <AddressSection c={d} />}
          {mode !== 'delivery' && (
            <section className="sec">
              {groupHead('store', `매장 픽업 주문 · ${pickupItems.length}개`)}
              <ItemsGroup list={pickupItems} amount={p.totalPrice} />
            </section>
          )}
          {mode !== 'delivery' && <PickupSection c={p} store={currentStore} />}
        </div>
        <div>
          <DiscountSection c={checkout} pointsOpen={pointsOpen} setPointsOpen={setPointsOpen} />
          {mode === 'split' ? (
            <>
              <PayRows c={d} title="배송 주문" />
              <PayRows c={p} title="매장 픽업 주문" />
              <section className="sec">
                <div className="group"><div className="pad">
                  <div className="kv total"><span>총 결제금액</span><span>{pay.quoteLoading ? '확인 중' : won(pay.finalPrice)}</span></div>
                </div></div>
                <div className="sec-f">결제는 한 번 · 주문내역에는 두 건으로 남아요</div>
              </section>
            </>
          ) : <PayRows c={checkout} />}
          <BenefitsError c={checkout} />
        </div>
      </div>
      <PayBar c={pay} onPay={onPay} />
    </div>
  );
}

export default OrderSheet;
