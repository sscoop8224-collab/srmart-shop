// 장바구니 (목업 정본 v1 의 S08 · S09 · S10 · S11, 묶음 3 · 2026-11-12 밤)
//
// 큰 제목 「장바구니」 + 「전체 삭제」(확인창) → 배송 한 줄(매장 설정) → 담은 줄(규격·박스·무게 ±100g·수량·삭제) →
// 아래 바(상품 금액 · 「주문하기」). 비어 있으면 같은 큰 제목 + 「쇼핑 계속하기」.
// 🔴 P03(주문서 한 장): 장바구니 = 고르기 / 주문서 = 결제. 배송지·할인·결제 금액은 「주문하기」 다음의 주문서(QuickOrder.js)에 있다 —
//    예전엔 이 화면 아래에 쿠폰 코드·배송지·접히는 결제 바가 다 있어 길었다. 배송비는 주소를 알아야 정해지므로 여기서는 상품 금액만 보인다.
import { imgUrl } from '../api';
import { getItemPrice } from '../utils/pricing';
import usePublishBottomBarHeight from '../hooks/usePublishBottomBarHeight';
import { useRef } from 'react';
import { useDialog } from '../DialogContext';
import { useStore } from '../StoreContext';
import Icon from '../components/ui/Icon';
import { DeliveryLine, useDeliveryPromise } from './Home';

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
const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;

function Cart({ cart, setCart, onOrder, onHome }) {
  const { confirm } = useDialog();
  const { currentStoreId, currentStore } = useStore();
  const promise = useDeliveryPromise(currentStoreId);
  const storeShort = currentStore ? String(currentStore.name || '').replace(/^에스알마트\s*/, '').trim() : '';
  const barRef = useRef(null);
  usePublishBottomBarHeight(barRef);
  const goods = cart.reduce((sum, item) => sum + getItemPrice(item), 0);

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

  const head = (
    <header className="app-nav">
      <div className="nav-row">
        <div className="nav-side" />
        <div className="nav-title" />
        <div className="nav-side r">
          {cart.length > 0 && <button className="nav-btn danger" onClick={async () => { if (await confirm('장바구니를 비울까요?')) setCart([]); }}>전체 삭제</button>}
        </div>
      </div>
      <div className="large"><h1>장바구니</h1>{cart.length > 0 && <span className="sub">{cart.length}개 상품</span>}</div>
    </header>
  );

  if (cart.length === 0) {
    return (
      <div className="v2 cart-v2">
        {head}
        <div className="ui-empty">
          <div className="big g"><Icon name="cart" /></div>
          <h3>장바구니가 비어 있어요</h3>
          <p>마음에 드는 상품을 담아 보세요.</p>
          <button className="ui-btn pri" onClick={onHome}>쇼핑 계속하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="v2 cart-v2">
      {head}
      <div className="tw">
          {promise && promise.mode !== 'off' && (
            <div className="sec" style={{ marginTop: 'var(--sp-2)' }}><DeliveryLine p={promise} storeShort={storeShort} /></div>
          )}
          <section className="sec">
            <div className="group">
              {cart.map((item) => {
                const weight = item.pricing_type === 'weight';
                const box = item.purchase_type === 'box';
                return (
                  <div key={item.id} className="row">
                    <div className="prow" style={{ flex: 1, minWidth: 0 }}>
                      <div className="pimg"><img src={item.image ? imgUrl(item.image) : getCategoryImage(item.large)} alt={item.name} onError={e => { e.currentTarget.src = getCategoryImage(item.large); }} /></div>
                      <div className="info">
                        <div className="nm">{item.name}</div>
                        {/* 규격 — 같은 상품도 용량이 여러 가지라(500ml/1.5L) 이게 없으면 담은 것이 어느 물건인지 모른다 */}
                        <div className="spec">{item.spec}{box && <> · <span className="box">박스 구매{item.box_quantity ? `(${item.box_quantity}개)` : ''}</span></>}{weight && ` · ${item.grams || 100}g`}</div>
                        <div className="price">{won(getItemPrice(item))}</div>
                      </div>
                    </div>
                    <div className="cart-line">
                      <button className="del" aria-label={`${item.name} 빼기`} onClick={() => removeFromCart(item.id)}><Icon name="x" size="sm" /></button>
                      {weight ? (
                        <span className="step">
                          <button aria-label="100g 빼기" disabled={(item.grams || 100) <= 100} onClick={() => updateGrams(item.id, -100)}><Icon name="minus" size="sm" /></button>
                          <span>{item.grams || 100}g</span>
                          <button aria-label="100g 더하기" onClick={() => updateGrams(item.id, 100)}><Icon name="plus" size="sm" /></button>
                        </span>
                      ) : (
                        <span className="step">
                          <button aria-label="하나 빼기" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, -1)}><Icon name="minus" size="sm" /></button>
                          <span>{box ? `${item.quantity}박스` : item.quantity}</span>
                          <button aria-label="하나 더하기" onClick={() => updateQuantity(item.id, 1)}><Icon name="plus" size="sm" /></button>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <div className="sec-f" style={{ padding: 'var(--sp-2) var(--page-x) 0' }}>배송지·쿠폰·포인트는 다음 「주문서」에서 골라요.</div>
      </div>
      <div className="pad-bar" />
      <div ref={barRef} className="bar pay-bar">
        <div className="in">
          <div className="sum"><small>상품 금액</small><b>{won(goods)}</b></div>
          <button className="ui-btn pri" onClick={onOrder}>주문하기</button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
