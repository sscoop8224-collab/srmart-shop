// 주문 완료 · 영수증 (목업 정본 v1 의 S13, 묶음 3 · 2026-11-12 밤)
//
// 큰 확인 표시 → 주문번호·일시·상태 → 주문 상품 → 금액 → 아래 바 「주문내역」 / 「쇼핑 계속하기」.
// 🔴 금액은 **결제 화면이 보여 준 그 값**(order.summary — 장바구니·바로 주문의 「결제 금액」 칸)을 그대로 쓴다.
//    예전엔 결제 금액(할인·배송비 반영)을 「상품 금액」으로 적고 배송비를 늘 「무료」로 적었다 — 배송비 3,000원을 낸 손님에게도.
//    줄 금액도 단가 × 수량이라 박스·무게 상품이 틀렸다(이제 장바구니와 같은 getItemPrice).
// 색·크기는 styles/shop.css(토큰 이름만).
import { useEffect, useState } from 'react';
import { imgUrl, getSellerTax } from '../api';
import SellerTaxNote from '../components/SellerTaxNote';
import { getItemPrice } from '../utils/pricing';
import Icon from '../components/ui/Icon';
import { useStore } from '../StoreContext';

/** 픽업 수령 안내(S53 「예약 완료」) — 픽업 주문(주류)을 결제하면 완료 화면에 같이 보인다.
 *  🔴 기한 날짜는 서버가 결제일 + 매장 설정 N일로 정한다(orders.pickup_deadline) — 여기서 지어내지 않고 「알림으로 알려 드려요」만.
 *  바코드는 아직 없다(계산대가 주문번호로 찾는다) — 목업 S53 의 바코드 자리는 계산대 쪽 조회가 생긴 뒤에. */
function PickupGuide({ order, store }) {
  const name = store ? (store.display_name || store.name) : '가입 매장';
  const sub = store ? [store.address, store.operating_hours].filter(Boolean).join(' · ') : '';
  const pickupId = order.fulfillment === 'split' ? String(order.id).split(' · ').find(x => /-P$/.test(x)) || order.id : order.id;
  return (
    <>
      <section className="sec">
        <div className="notice g"><Icon name="check" /><div style={{ flex: 1 }}><b>픽업 예약을 마쳤어요</b><br />매장에서 준비되면 알려 드려요. 찾아가는 기한도 그 알림에 적어 드려요.</div></div>
      </section>
      <section className="sec">
        <div className="sec-h">픽업 매장</div>
        <div className="group">
          <div className="row"><span className="ricon"><Icon name="store" /></span><span className="lbl">{name}{sub && <small>{sub}</small>}</span></div>
          {store && store.phone && <a className="row tap" href={`tel:${store.phone}`}><span className="ricon"><Icon name="phone" /></span><span className="lbl">{store.phone}<small>매장에 전화하기</small></span></a>}
          <div className="row"><span className="lbl">픽업 주문번호</span><span className="val">{pickupId}</span></div>
        </div>
      </section>
      <section className="sec">
        <div className="sec-h">찾아가는 법</div>
        <div className="group"><div className="pad">
          <div className="kv"><span>1</span><span style={{ flex: 1, textAlign: 'left', marginLeft: 'var(--sp-3)' }}>계산대에 픽업 주문번호를 보여 주세요</span></div>
          <div className="kv"><span>2</span><span style={{ flex: 1, textAlign: 'left', marginLeft: 'var(--sp-3)' }}>신분증으로 나이를 확인해요 — 예약한 본인만 받을 수 있어요</span></div>
          <div className="kv"><span>3</span><span style={{ flex: 1, textAlign: 'left', marginLeft: 'var(--sp-3)' }}>결제는 앱에서 끝났어요 — 매장에서 다시 내지 않아요</span></div>
        </div></div>
        <div className="sec-f">기한이 지나면 예약을 취소하고 환불해 드려요.</div>
      </section>
    </>
  );
}

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
const TONE = { '결제완료': 'g', '배송중': 'b', '배송완료': 'g', '취소': 'r' };

function Receipt({ order, onClose, onGoHome, earnPoints }) {
  const { currentStore } = useStore() || {};
  // 판매자 과세 유형 문구(2026-11-15 지시 3) — 🔴 못 받으면 null 그대로 → 부가세 줄도 세금계산서 단추도 안 그린다
  const [sellerTax, setSellerTax] = useState(null);
  useEffect(() => {
    let live = true;
    // Promise.resolve().then(…) — 부르는 것 자체가 던져도(옛 api · 시험의 가짜 api) 같은 catch 로 가서 숨긴다
    Promise.resolve().then(() => getSellerTax()).then(r => { if (live) setSellerTax(r.data || null); }).catch(() => {});
    return () => { live = false; };
  }, []);
  if (!order) return null;

  const status = order.status || '결제완료';
  const sm = order.summary;   // 없으면(옛 주문 기록) 총 결제금액만 보인다 — 모르는 값을 지어내지 않는다
  const what = (item) => item.purchase_type === 'box' ? `${item.quantity}박스`
    : item.pricing_type === 'weight' ? `${item.grams || 100}g` : `${item.quantity}개`;

  return (
    <div className="v2 receipt-v2">
      <div style={{ height: 'calc(env(safe-area-inset-top) + var(--sp-8))' }} />
      <div className="tw">
        <div className="ui-empty">
          <div className="big g"><Icon name="check" /></div>
          <h3>주문이 완료됐어요</h3>
          <p>주문해 주셔서 감사해요!</p>
          {earnPoints > 0 && <span className="pill b">배송 완료 시 {earnPoints.toLocaleString('ko-KR')}P 적립 예정</span>}
        </div>

        {(order.fulfillment === 'pickup' || order.fulfillment === 'split') && <PickupGuide order={order} store={currentStore} />}

        <section className="sec">
          <div className="group">
            <div className="row"><span className="lbl">주문번호</span><span className="val">{order.id}</span></div>
            <div className="row"><span className="lbl">주문 일시</span><span className="val">{order.date}</span></div>
            <div className="row"><span className="lbl">상태</span><span className={`pill ${TONE[status] || 'g'}`} style={{ marginLeft: 'auto' }}>{status}</span></div>
          </div>
        </section>

        <section className="sec">
          <div className="sec-h">주문 상품</div>
          <div className="group">
            {order.items.map((item, index) => (
              <div key={index} className="row">
                <div className="prow" style={{ flex: 1, minWidth: 0 }}>
                  <div className="pimg"><img src={item.image ? imgUrl(item.image) : getCategoryImage(item.large)} alt={item.name} onError={e => { e.currentTarget.src = getCategoryImage(item.large); }} /></div>
                  <div className="info">
                    <div className="nm">{item.name}</div>
                    {/* 규격 — 주문 시점 스냅샷(주문내역과 같은 이유) */}
                    <div className="spec">{item.spec}{item.spec ? ' · ' : ''}{what(item)}</div>
                    <div className="price">{won(getItemPrice(item))}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="sec">
          <div className="group"><div className="pad">
            {sm && <div className="kv"><span>상품 금액</span><span>{won(sm.goods)}</span></div>}
            {/* 행사 할인 — 결제 화면 「결제 금액」 칸과 같은 줄(2026-11-13 지시 3) */}
            {sm && sm.promo > 0 && <div className="kv"><span>행사 할인</span><span className="minus">−{won(sm.promo)}</span></div>}
            {sm && sm.coupon > 0 && <div className="kv"><span>쿠폰 할인</span><span className="minus">−{won(sm.coupon)}</span></div>}
            {sm && sm.points > 0 && <div className="kv"><span>포인트</span><span className="minus">−{won(sm.points)}</span></div>}
            {sm && order.fulfillment !== 'pickup' && <div className="kv"><span>배송비</span><span>{sm.deliveryFee > 0 ? won(sm.deliveryFee) : '무료'}</span></div>}
            <div className="kv total"><span>총 결제금액</span><span>{won(order.totalPrice)}</span></div>
            <SellerTaxNote info={sellerTax} />
          </div></div>
        </section>
      </div>

      <div className="pad-bar" />
      <div className="bar">
        <div className="in">
          <button className="ui-btn gray" style={{ flex: 1 }} onClick={onClose}>주문내역</button>
          <button className="ui-btn pri" style={{ flex: 1 }} onClick={onGoHome}>쇼핑 계속하기</button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;
