// 장바구니 (목업 정본 v1 의 S08 · S08A · P03, 묶음 3 · 2026-11-12 밤 · 서버 장바구니 2026-11-13)
//
// 큰 제목 「장바구니」 + 「전체 삭제」(확인창) → 배송 한 줄(매장 설정) → 담은 줄(규격·박스·무게 ±100g·수량·삭제) →
// 아래 바(상품 금액 · 「주문하기」). 비어 있으면 같은 큰 제목 + 「쇼핑 계속하기」.
// 🔴 P03(주문서 한 장): 장바구니 = 고르기 / 주문서 = 결제. 배송지·할인·결제 금액은 「주문하기」 다음의 주문서(QuickOrder.js)에 있다.
// 🔴 2026-11-13 서버 장바구니(hooks/useShopCart.js): 장바구니는 회원 계정에 저장되고, 열 때마다 서버가 **지금 매장** 기준으로
//    다시 확인한다 — 줄 아래 한 줄로 할인 중 · 가격이 바뀜 · 품절 · 판매 중지 · 이 매장에 없음 · 주류 본인확인 전을 알린다(S08A).
//    금액은 서버 값만 쓴다(화면에서 다시 계산하지 않는다). 비회원도 담는다 — 「주문하기」에서만 로그인을 묻는다(S34 안내).
import { imgUrl } from '../api';
import usePublishBottomBarHeight from '../hooks/usePublishBottomBarHeight';
import { useEffect, useRef } from 'react';
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

// 줄을 흐리게 그리는 상태 — 지금 살 수 없고 수량을 바꿔도 소용없는 것(빼거나 그대로 둔다)
const OFF = ['sold_out', 'stopped', 'gone', 'not_in_store', 'other_brand', 'alcohol_not_sold'];

/** 줄 아래 안내 한 줄(목업 S08A .cnote) — 서버가 준 상태·문구를 그대로 */
function CartNote({ l }) {
  const n = (cls, icon, body) => <div className={`cnote ${cls}`}><Icon name={icon} size="sm" /><span>{body}</span></div>;
  if (l.status === 'checking') return n('m', 'info', '가격·재고를 확인하고 있어요');
  if (l.status === 'adult_required' || l.status === 'alcohol_not_sold') return n('o', 'user', l.message);
  if (l.status === 'not_in_store' || l.status === 'other_brand') return n('m', 'info', l.message);
  if (l.status === 'sold_out') return n('r', 'alert', `${l.message} · 결제 금액에서 빠져요`);
  if (!l.ok) return n('r', 'alert', l.message);
  if (l.price_changed) return n('o', 'alert', <>가격이 바뀌었어요 <span className="was">{won(l.added_unit_price)}</span> → {won(l.unit_price)}</>);
  if (l.discount_amount > 0) return n('s', 'tag', `오늘 할인 중${l.promo_label ? ` · ${l.promo_label}` : ''} (−${won(l.discount_amount)})`);
  if (l.pickup_only) return n('m', 'pin', '매장 픽업 · 받으실 때 신분증을 확인해요');
  return null;
}

function Cart({ cart, loggedIn, onLogin, onOrder, onHome }) {
  const { confirm, notify } = useDialog();
  const { currentStoreId, currentStore } = useStore();
  const promise = useDeliveryPromise(currentStoreId);
  const storeShort = currentStore ? String(currentStore.name || '').replace(/^에스알마트\s*/, '').trim() : '';
  const barRef = useRef(null);
  usePublishBottomBarHeight(barRef);
  const lines = cart.lines;
  const checking = lines.some(l => l.status === 'checking');
  const problems = lines.filter(l => !l.ok && l.status !== 'checking');

  // 열 때마다 서버가 다시 확인한다(가격·행사·재고·판매 여부)
  useEffect(() => { cart.refresh(); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const say = (err) => { if (err) notify(err); };
  const step = (l, d) => cart.setQty(l, { quantity: Math.min(99, Math.max(1, l.quantity + d)) }).then(say);
  const stepG = (l, d) => cart.setQty(l, { grams: Math.min(20000, Math.max(100, (l.grams || 100) + d)) }).then(say);

  const order = async () => {
    if (!loggedIn) {
      if (await confirm({ icon: 'user', title: '주문하려면 로그인해 주세요', message: '담아 둔 상품은 로그인하면 회원 장바구니로 옮겨져요.', okLabel: '로그인' })) onLogin();
      return;
    }
    if (!lines.some(l => l.ok)) { notify('지금 주문할 수 있는 상품이 없어요.'); return; }
    if (problems.length && !(await confirm({ title: `살 수 없는 상품 ${problems.length}개는 빼고 주문할까요?`, message: '그 상품은 장바구니에 그대로 남아요.', okLabel: '주문하기' }))) return;
    onOrder();
  };

  const head = (
    <header className="app-nav">
      <div className="nav-row">
        <div className="nav-side" />
        <div className="nav-title" />
        <div className="nav-side r">
          {lines.length > 0 && <button className="nav-btn danger" onClick={async () => { if (await confirm({ title: '장바구니를 비울까요?', message: `담은 상품 ${lines.length}개가 모두 빠져요.`, okLabel: '비우기', danger: true })) say(await cart.clear()); }}>전체 삭제</button>}
        </div>
      </div>
      <div className="large"><h1>장바구니</h1>{lines.length > 0 && <span className="sub">{lines.length}개 상품</span>}</div>
    </header>
  );

  if (lines.length === 0) {
    return (
      <div className="v2 cart-v2">
        {head}
        {cart.error ? (
          <section className="sec"><div className="notice r"><Icon name="alert" /><div style={{ flex: 1 }}><b>장바구니를 불러오지 못했어요</b><br />{cart.error}</div><button className="ui-btn sm sec" onClick={cart.refresh}>다시 시도</button></div></section>
        ) : (
          <div className="ui-empty">
            <div className="big g"><Icon name="cart" /></div>
            <h3>{cart.loading ? '장바구니를 불러오고 있어요' : '장바구니가 비어 있어요'}</h3>
            {!cart.loading && <p>마음에 드는 상품을 담아 보세요.</p>}
            {!cart.loading && <button className="ui-btn pri" onClick={onHome}>쇼핑 계속하기</button>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="v2 cart-v2">
      {head}
      <div className="tw">
          {!loggedIn && (
            <section className="sec" style={{ marginTop: 'var(--sp-2)' }}>
              <div className="notice b"><Icon name="user" /><div style={{ flex: 1 }}><b>로그인하지 않았어요</b> — 이 기기에만 저장돼요. 로그인하면 회원 장바구니로 옮겨져 다른 기기에서도 보여요.</div></div>
            </section>
          )}
          {cart.storeNotice && (
            <section className="sec" style={{ marginTop: 'var(--sp-2)' }}>
              <div className="notice g"><Icon name="pin" /><div style={{ flex: 1 }}><b>{String(cart.storeNotice).replace(/^에스알마트\s*/, '')}</b> 기준으로 가격·재고를 다시 확인했어요</div></div>
            </section>
          )}
          {cart.error && (
            <section className="sec"><div className="notice r"><Icon name="alert" /><div style={{ flex: 1 }}>{cart.error}</div><button className="ui-btn sm sec" onClick={cart.refresh}>다시 시도</button></div></section>
          )}
          {loggedIn && promise && promise.mode !== 'off' && (
            <div className="sec" style={{ marginTop: 'var(--sp-2)' }}><DeliveryLine p={promise} storeShort={storeShort} /></div>
          )}
          <section className="sec">
            <div className="group">
              {lines.map((l) => {
                const weight = l.unit_type === 'weight';
                const box = l.unit_type === 'box';
                const off = OFF.includes(l.status);
                const priceText = l.status === 'adult_required' ? '가격은 본인확인 뒤에 보여요'
                  : l.line != null && l.unit_price != null ? won(l.line) : l.status === 'checking' ? '확인 중' : null;
                return (
                  <div key={`${l.product_id}:${l.unit_type}`} className={'row' + (off ? ' off' : '')}>
                    <div className="cart-row-in">
                      <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
                        <div className="prow" style={{ flex: 1, minWidth: 0 }}>
                          <div className="pimg"><img src={l.image ? imgUrl(l.image) : getCategoryImage(l.large)} alt={l.name || ''} onError={e => { e.currentTarget.src = getCategoryImage(l.large); }} /></div>
                          <div className="info">
                            <div className="nm">{l.name || '상품'}</div>
                            {/* 규격 — 같은 상품도 용량이 여러 가지라(500ml/1.5L) 이게 없으면 담은 것이 어느 물건인지 모른다 */}
                            <div className="spec">{l.spec}{box && <> · <span className="box">박스 구매{l.box_quantity ? `(${l.box_quantity}개)` : ''}</span></>}{weight && ` · ${l.grams || 100}g`}</div>
                            {priceText && <div className="price">{priceText}</div>}
                          </div>
                        </div>
                        <div className="cart-line">
                          <button className="del" aria-label={`${l.name || '상품'} 빼기`} onClick={async () => say(await cart.remove(l))}><Icon name="x" size="sm" /></button>
                          {!off && (weight ? (
                            <span className="step">
                              <button aria-label="100g 빼기" disabled={(l.grams || 100) <= 100} onClick={() => stepG(l, -100)}><Icon name="minus" size="sm" /></button>
                              <span>{l.grams || 100}g</span>
                              <button aria-label="100g 더하기" disabled={(l.grams || 100) >= 20000} onClick={() => stepG(l, 100)}><Icon name="plus" size="sm" /></button>
                            </span>
                          ) : (
                            <span className="step">
                              <button aria-label="하나 빼기" disabled={l.quantity <= 1} onClick={() => step(l, -1)}><Icon name="minus" size="sm" /></button>
                              <span>{box ? `${l.quantity}박스` : l.quantity}</span>
                              <button aria-label="하나 더하기" disabled={l.quantity >= 99} onClick={() => step(l, 1)}><Icon name="plus" size="sm" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <CartNote l={l} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          {problems.length > 0 && (
            <section className="sec">
              <button className="ui-btn sec" style={{ width: '100%' }} onClick={async () => {
                if (await confirm({ title: `살 수 없는 상품 ${problems.length}개를 뺄까요?`, message: '품절·판매 중지·이 매장에 없는 상품이 빠져요.', okLabel: '빼기' })) say(await cart.removeMany(problems));
              }}>살 수 없는 상품 {problems.length}개 빼기</button>
            </section>
          )}
          <div className="sec-f" style={{ padding: 'var(--sp-2) var(--page-x) 0' }}>{loggedIn ? '배송지·쿠폰·포인트는 다음 「주문서」에서 골라요.' : '주문할 때 로그인하면 배송지·쿠폰·포인트를 골라요.'}</div>
      </div>
      <div className="pad-bar" />
      {/* 「상품 금액」 = 위 줄 금액의 합(살 수 있는 줄만 · 서버 gross · 행사 전 — 목업 S08A).
          🔴 바로 아래 「행사 할인 −○원」 — 주문서 · 주문 완료와 같은 줄(2026-11-13 지시 3). 결제 금액은 주문서(P03)에서 */}
      <div ref={barRef} className="bar pay-bar">
        <div className="in">
          <div className="sum">
            <small>상품 금액</small><b>{checking ? '확인 중' : won(cart.view.gross)}</b>
            {!checking && cart.view.promo_discount > 0 && <small className="promo">행사 할인 −{won(cart.view.promo_discount)}</small>}
          </div>
          <button className="ui-btn pri" onClick={order}>{loggedIn ? '주문하기' : '로그인하고 주문하기'}</button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
