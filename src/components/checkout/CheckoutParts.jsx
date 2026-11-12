// 결제 부품 — 배송지(S11) · 할인(쿠폰·쿠폰 코드·포인트, S10) · 결제 금액 · 아래 결제 바 (목업 정본 v1, 묶음 3 · 2026-11-12 밤)
//
// 장바구니(Cart.js)와 바로 주문(QuickOrder.js)이 같이 쓴다. 값과 동작은 전부 useCheckoutFlow() 가 준다 —
// 🔴 이 파일은 **그리기만** 한다. 금액 계산·쿠폰 확인·배송 구역 확인·주문에 보낼 값은 훅에서 바꾸지 않았다.
// 예전 AddressBox · CouponCodeBox · SummaryBar 를 대신한다. 달라진 것:
//   · 결제 바가 접혔다 펼쳐지지 않는다 — 금액은 본문(「결제 금액」), 바에는 총액과 결제 단추만(목업 S08)
//   · 배송지는 한 줄 → 누르면 아래에서 시트(S11). 배송 불가(빨강)와 동 정보 없음(주황 + 주소 찾기)을 색으로 가른다
// 색·크기는 styles/shop.css(토큰 이름만).
import { useRef, useState } from 'react';
import Icon from '../ui/Icon';
import usePublishBottomBarHeight from '../../hooks/usePublishBottomBarHeight';
import { useDialog } from '../../DialogContext';

const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;

// ── 배송지 ─────────────────────────────────────────────
export function AddressSection({ c }) {
  const { notify } = useDialog();
  const cur = c.currentAddress;
  const has = !!(cur.name || cur.address);

  // 주소 검색(Daum) — 시트의 「주소 찾기」와 「동 정보 없음」의 바로가기가 이 함수 하나를 쓴다(예전 AddressBox 와 같은 동작).
  // 경고 쪽에서 부르면(기본 주소여도) 「다른 주소」로 바꿔 방금 고른 주소가 화면에 그대로 보이게 한다.
  const openAddressSearch = (fromWarning) => {
    if (!window.daum) { notify('주소 검색 서비스를 불러오는 중이에요. 직접 입력해주세요.'); return; }
    new window.daum.Postcode({
      oncomplete: (data) => {
        if (fromWarning && c.useDefaultAddress) c.handleSwitchAddress(false);
        c.setAddress((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress, detail: '' }));
        if (data.zonecode) { c.setZipcode(data.zonecode); c.checkZipcodeValue(data.zonecode, data.bname); }
      },
    }).open();
  };

  const di = c.deliveryInfo;
  const status = c.matchingZipcode ? <span className="f-hint">배송 구역 확인 중…</span>
    : di?.zoneName ? <span className="lbl" style={{ color: 'var(--brand-strong)', fontSize: 'var(--fs-foot)' }}><Icon name="check" size="sm" /> {di.zoneName} · 배송 가능</span>
    : di?.error ? <span className="lbl" style={{ color: di.noDong ? 'var(--warning-strong)' : 'var(--danger)', fontSize: 'var(--fs-foot)' }}>{di.noDong ? '⚠' : '✗'} {di.error}</span>
    : null;

  return (
    <>
      <section className="sec">
        <div className="sec-h">배송지</div>
        <div className="group">
          <button className="row tap" onClick={() => c.setShowAddress(true)}>
            <span className={`ricon${has ? '' : ' t-gray'}`}><Icon name="pin" /></span>
            {has ? (
              <span className="lbl">{[cur.name, cur.phone].filter(Boolean).join(' · ')}<small>{`${cur.address || ''} ${cur.detail || ''}`.trim()}</small></span>
            ) : (
              <span className="lbl">배송지를 입력해 주세요<small>주소를 찾아야 배송 구역을 확인할 수 있어요</small></span>
            )}
            <span className="val">변경</span>
            <span className="chev"><Icon name="chevR" size="sm" /></span>
          </button>
          {status && (
            <div className="row">
              {status}
              {di?.noDong && <button className="ui-btn sm sec" onClick={() => openAddressSearch(true)}>주소 찾기</button>}
            </div>
          )}
        </div>
      </section>

      {c.showAddress && (
        <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby="addr-sheet-title" onClick={(e) => { if (e.target === e.currentTarget) c.setShowAddress(false); }}>
          <div className="sheet v2">
            <div className="grabber" />
            <div className="sheet-h">
              <div className="nav-side" />
              <div className="nav-title" id="addr-sheet-title">배송지</div>
              <div className="nav-side r"><button className="nav-btn b" onClick={() => c.setShowAddress(false)}>완료</button></div>
            </div>
            <div className="sheet-b">
              <div className="pad" style={{ paddingTop: 0 }}>
                {c.hasDefaultAddress && (
                  <div className="seg" role="radiogroup" aria-label="배송지 고르기">
                    <button role="radio" aria-checked={c.useDefaultAddress} className={c.useDefaultAddress ? 'on' : ''} onClick={() => c.handleSwitchAddress(true)}>기본 주소</button>
                    <button role="radio" aria-checked={!c.useDefaultAddress} className={!c.useDefaultAddress ? 'on' : ''} onClick={() => c.handleSwitchAddress(false)}>다른 주소</button>
                  </div>
                )}
                {c.useDefaultAddress && c.hasDefaultAddress ? (
                  <>
                    <label className="f-lbl">받는 분</label><div className="field ro">{c.defaultAddress.name} · {c.defaultAddress.phone}</div>
                    <label className="f-lbl">주소</label><div className="field ro">{c.defaultAddress.address} {c.defaultAddress.detail}</div>
                  </>
                ) : (
                  <>
                    <label className="f-lbl" htmlFor="addr-name">받는 분</label>
                    <input id="addr-name" className="field" value={c.address.name} onChange={(e) => c.setAddress({ ...c.address, name: e.target.value })} placeholder="받는 분 이름" />
                    <label className="f-lbl" htmlFor="addr-phone">연락처</label>
                    <input id="addr-phone" className="field" type="tel" value={c.address.phone} onChange={(e) => c.setAddress({ ...c.address, phone: e.target.value })} placeholder="010-0000-0000" />
                    <label className="f-lbl">주소</label>
                    <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                      <div className="field ro" style={{ flex: 1 }} onClick={() => openAddressSearch(false)}>{c.address.address || <span style={{ color: 'var(--text-3)' }}>주소 검색</span>}</div>
                      <button className="ui-btn md sec" onClick={() => openAddressSearch(false)}>주소 찾기</button>
                    </div>
                    <div style={{ height: 'var(--sp-2)' }} />
                    <input className="field" value={c.address.detail} onChange={(e) => c.setAddress({ ...c.address, detail: e.target.value })} placeholder="상세 주소 (동·호수)" aria-label="상세 주소" />
                  </>
                )}
                <label className="f-lbl">배송 구역</label>
                {c.matchingZipcode ? (
                  <div className="notice"><div className="spin" style={{ width: 18, height: 18 }} /><div>배송 구역 확인 중…</div></div>
                ) : di?.zoneName ? (
                  <div className="notice g"><Icon name="check" /><div><b>{di.zoneName}</b> · 배송 가능{c.zipcode ? ` · 우편번호 ${c.zipcode}` : ''}</div></div>
                ) : di?.noDong ? (
                  <div className="notice o"><Icon name="alert" /><div style={{ flex: 1 }}><b>동 정보가 없어 확인하지 못했어요</b><br />주소 찾기로 다시 골라 주세요.</div><button className="ui-btn sm sec" onClick={() => openAddressSearch(true)}>주소 찾기</button></div>
                ) : di?.error ? (
                  <div className="notice r"><Icon name="x" /><div><b>{di.error}</b><br />방문 구매나 고객센터로 문의해 주세요.</div></div>
                ) : (
                  <div className="f-hint" style={{ margin: 0 }}>주소를 찾으면 배송 구역을 확인해요.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── 할인 — 보유 쿠폰 · 쿠폰 코드 · 포인트 ──────────────────────
export function DiscountSection({ c, pointsOpen, setPointsOpen }) {
  const [couponOpen, setCouponOpen] = useState(false);
  const picked = c.myCoupons.find(x => String(x.coupon_id || x.id) === String(c.selectedCouponId));
  const showPoints = c.myPoints > 0;
  const couponOff = (c.couponDiscount || 0) + (c.appliedCoupon ? c.discountAmount : 0);
  const couponSub = [picked && `${picked.coupon_name} 적용`, c.appliedCoupon && `코드 ${c.appliedCoupon.code} 적용`].filter(Boolean).join(' · ')
    || `보유 ${c.myCoupons.length}장 · 코드 입력`;
  return (
    <>
    {couponOpen && <CouponSheet c={c} onClose={() => setCouponOpen(false)} />}
    <section className="sec">
      <div className="sec-h">할인</div>
      <div className="group">
        {/* 쿠폰 한 줄(P03) — 누르면 시트에서 보유 쿠폰 고르기 · 쿠폰 코드 입력. 예전엔 고르기 칸과 코드 칸이 따로 두 칸이었다 */}
        <button className="row tap" onClick={() => setCouponOpen(true)}>
          <span className="ricon t-orange"><Icon name="tag" /></span>
          <span className="lbl">쿠폰<small>{couponSub}</small></span>
          <span className={`val${couponOff > 0 ? ' sale' : ''}`}>{couponOff > 0 ? `−${won(couponOff)}` : '선택 안 함'}</span>
          <span className="chev"><Icon name="chevR" size="sm" /></span>
        </button>
        {showPoints && (
          <button className="row tap" onClick={() => setPointsOpen(v => !v)} aria-expanded={pointsOpen}>
            <span className="ricon t-blue"><Icon name="gift" /></span>
            <span className="lbl">포인트<small>보유 {c.myPoints.toLocaleString('ko-KR')}P</small></span>
            {!pointsOpen && <span className={`val${c.clampedUsePoints > 0 ? ' sale' : ''}`}>{c.clampedUsePoints > 0 ? `−${c.clampedUsePoints.toLocaleString('ko-KR')}P` : '사용 안 함'}</span>}
            <span className="chev"><Icon name={pointsOpen ? 'chevD' : 'chevR'} size="sm" /></span>
          </button>
        )}
        {showPoints && pointsOpen && (
          <div className="row">
            <div className="field sm" style={{ flex: 1 }}>
              <input type="number" inputMode="numeric" min="0" max={c.myPoints} value={c.usePoints || ''}
                onChange={e => c.setUsePoints(Math.min(Number(e.target.value) || 0, c.myPoints))} placeholder="사용할 포인트" aria-label="사용할 포인트" />
              <span style={{ color: 'var(--text-2)' }}>P</span>
            </div>
            <button className="ui-btn sm sec" onClick={() => c.setUsePoints(Math.min(c.myPoints, c.totalPrice - c.discountAmount + c.deliveryFee))}>전액</button>
            <button className="ui-btn sm gray" onClick={() => c.setUsePoints(0)}>취소</button>
          </div>
        )}
      </div>
      {showPoints && pointsOpen && c.clampedUsePoints > 0 && <div className="sec-f">−{c.clampedUsePoints.toLocaleString('ko-KR')}P 적용</div>}
    </section>
    </>
  );
}

// 쿠폰 시트 — 보유 쿠폰 고르기(줄을 누르면 바로 적용 — 훅의 handleCouponSelect 가 서버로 확인한다) · 쿠폰 코드 입력(handleApplyCoupon)
// 🔴 고르기·확인·할인 계산은 예전과 같은 훅 함수다. 이 시트는 고르는 자리만 바꿨다(예전 select · 코드 칸)
function CouponSheet({ c, onClose }) {
  const sel = String(c.selectedCouponId || '');
  return (
    <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby="coupon-sheet-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet v2">
        <div className="grabber" />
        <div className="sheet-h">
          <div className="nav-side" />
          <div className="nav-title" id="coupon-sheet-title">쿠폰</div>
          <div className="nav-side r"><button className="nav-btn b" onClick={onClose}>완료</button></div>
        </div>
        <div className="sheet-b">
          <section className="sec">
            <div className="sec-h">보유 쿠폰</div>
            <div className="group" role="radiogroup" aria-label="보유 쿠폰">
              <button className="row tap" role="radio" aria-checked={!sel} onClick={() => c.handleCouponSelect('')}>
                <span className="lbl">쿠폰 선택 안 함</span>
                {!sel && <span className="chev" style={{ color: 'var(--brand-strong)' }}><Icon name="check" size="sm" /></span>}
              </button>
              {c.myCoupons.map(x => {
                const v = String(x.coupon_id || x.id);
                return (
                  <button key={x.id} className="row tap" role="radio" aria-checked={sel === v} onClick={() => c.handleCouponSelect(v)}>
                    <span className="ricon t-orange"><Icon name="tag" /></span>
                    <span className="lbl">{x.coupon_name}<small>{x.discount_type === 'percent' ? `${x.discount}%` : won(x.discount)} 할인</small></span>
                    {sel === v && <span className="chev" style={{ color: 'var(--brand-strong)' }}><Icon name="check" size="sm" /></span>}
                  </button>
                );
              })}
            </div>
            {c.myCoupons.length === 0 && <div className="sec-f">쓸 수 있는 보유 쿠폰이 없어요.</div>}
          </section>
          <section className="sec" style={{ paddingBottom: 'var(--sp-5)' }}>
            <div className="sec-h">쿠폰 코드</div>
            <div className="group">
              {c.appliedCoupon ? (
                <div className="row">
                  <span className="ricon t-gray"><Icon name="doc" /></span>
                  <span className="lbl">{c.appliedCoupon.code}<small>{c.appliedCoupon.description}</small></span>
                  <span className="val sale">−{won(c.discountAmount)}</span>
                  <button className="ui-btn sm gray" onClick={c.handleRemoveCoupon}>빼기</button>
                </div>
              ) : (
                <div className="row">
                  <span className="ricon t-gray"><Icon name="doc" /></span>
                  <input className="field sm" style={{ flex: 1 }} value={c.couponInput} onChange={(e) => c.setCouponInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') c.handleApplyCoupon(); }} placeholder="쿠폰 코드 입력" aria-label="쿠폰 코드" />
                  <button className="ui-btn sm gray" onClick={c.handleApplyCoupon}>적용</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// 영수증(S13)에 그대로 보일 금액 — 결제 화면의 「결제 금액」 칸과 같은 값. 🔴 서버로는 안 간다(App 의 createOrder 는 고른 칸만 보낸다)
export const summaryOf = (c) => ({ goods: c.totalPrice, coupon: (c.discountAmount || 0) + (c.couponDiscount || 0), points: c.clampedUsePoints || 0, deliveryFee: c.deliveryFee || 0 });

// ── 결제 금액 ─────────────────────────────────────────
export function PayRows({ c }) {
  const coupon = (c.discountAmount || 0) + (c.couponDiscount || 0);
  return (
    <section className="sec">
      <div className="sec-h">결제 금액</div>
      <div className="group"><div className="pad">
        <div className="kv"><span>상품 금액</span><span>{won(c.totalPrice)}</span></div>
        {coupon > 0 && <div className="kv"><span>쿠폰 할인</span><span className="minus">−{won(coupon)}</span></div>}
        {c.clampedUsePoints > 0 && <div className="kv"><span>포인트</span><span className="minus">−{won(c.clampedUsePoints)}</span></div>}
        <div className="kv">
          <span>배송비 {c.freeDeliveryMin > 0 && <span className="pill g">{won(c.freeDeliveryMin)} 이상 무료</span>}</span>
          <span>{won(c.deliveryFee)}</span>
        </div>
        <div className="kv total"><span>총 결제금액</span><span>{won(c.finalPrice)}</span></div>
      </div></div>
    </section>
  );
}

// 🔴 보유 쿠폰·포인트를 못 불러왔다 — 결제를 막지는 않지만 **할인이 빠진다는 사실**은 반드시 말한다(useCheckoutFlow 머리말)
export function BenefitsError({ c }) {
  if (!c.benefitsError) return null;
  return (
    <section className="sec">
      <div className="notice r" role="alert">
        <Icon name="alert" />
        <div style={{ flex: 1 }}>
          <b>{c.benefitsError}</b>
          {!!c.retryBenefits && (
            <div style={{ marginTop: 'var(--sp-2)' }}>
              <button className="ui-btn sm line" onClick={c.retryBenefits} disabled={c.benefitsLoading}><Icon name="refresh" size="sm" />{c.benefitsLoading ? '불러오는 중…' : '다시 시도'}</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── 아래 결제 바 — 총액과 결제 단추만. 주소·배송 구역이 없으면 단추 글자가 이유를 말한다 ──
export function PayBar({ c, onPay, payLabel }) {
  const ref = useRef(null);
  usePublishBottomBarHeight(ref);
  const label = !c.zipcode ? '주소를 검색해 주세요' : !c.deliveryInfo?.zoneName ? '배송 구역을 확인해 주세요' : (payLabel || `${won(c.finalPrice)} 결제하기`);   // P03 「43,900원 결제하기」
  return (
    <>
      <div className="pad-bar" />
      <div ref={ref} className="bar pay-bar">
        <div className="in">
          <div className="sum"><small>총 결제금액</small><b>{won(c.finalPrice)}</b></div>
          <button className={`ui-btn ${c.canPay ? 'pri' : 'dis'}`} disabled={!c.canPay} onClick={onPay}>{label}</button>
        </div>
      </div>
    </>
  );
}
