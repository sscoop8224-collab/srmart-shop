// 회사 소개·사업자 정보 (목업 정본 v1 의 S40, 묶음 5 · 2026-11-12 밤)
// 결정 4: 마이 맨 아래 「회사 소개·사업자 정보」로 들어온다(예전 앱은 들어갈 길이 없었다 — F6).
//   · 위 — 소개 띠 · 약속 3가지. 「빠른 배송」 문구는 **설정값에서 만든다**(홈 배송 한 줄과 같은 `GET /delivery-promise`).
//   · 신규회원 쿠폰 띠 — 서버가 「지급 가능」이라 할 때만, 로그인 안 한 손님에게만(홈과 같은 조건).
//   · 아래 — 사업자 정보 7칸(`GET /shop/business-info`, 어드민 「사업자 정보」). 비어 있으면 「—」.
import { useEffect, useState } from 'react';
import { getSignupCoupon, getBusinessInfo } from '../api';
import Icon from '../components/ui/Icon';
import { BIZ, useDeliveryPromise } from './Home';
import { BRAND } from '../brand';

// 배송 약속 한 줄 — 오늘 도착이면 서버 문구 그대로, 아니면 「사유 · ○일 배송」(홈 DeliveryLine 과 같은 말)
const promiseText = (p) => {
  if (!p || !p.mode || !p.label) return '';
  if (p.mode === 'today' || !p.sub) return p.label;
  return p.mode === 'tomorrow' ? `${p.label} · ${p.sub}` : `${p.sub} · ${p.label}`;
};

export default function About({ user, storeId, storeShort, goBack, onShop, onNotice, onStores, onEvents, onHelp, onSignup }) {
  const promise = useDeliveryPromise(storeId);
  const [coupon, setCoupon] = useState(null);
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let live = true;
    getSignupCoupon().then((r) => { if (live) setCoupon(r.data && r.data.enabled && r.data.label ? r.data : null); }).catch(() => {});
    getBusinessInfo().then((r) => { if (live) setInfo(r.data || {}); }).catch(() => { if (live) setInfo({}); });
    return () => { live = false; };
  }, []);

  const ship = promiseText(promise);
  const bizRows = BIZ.map(([k, l]) => {
    let v = info && info[k] ? String(info[k]).trim() : '';
    if (k === 'privacy_officer' && v && info.privacy_officer_contact) v += ` (${info.privacy_officer_contact})`;
    return [l, v];
  });

  return (
    <div className="v2 about-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" onClick={goBack}><Icon name="chevL" />마이</button></div>
          <div className="nav-title" /><div className="nav-side r" />
        </div>
        <div className="large"><h1>회사 소개·사업자 정보</h1></div>
      </header>

      <div className="banner">
        <small>동신마켓이 운영하는 온라인 마트</small>
        <h2>신선한 장보기,<br />집 앞까지</h2>
        <button type="button" className="go" onClick={onShop}>쇼핑하기<Icon name="chevR" size="sm" /></button>
      </div>
      <div className="chips about-chips">
        {/* 목업 순서: 매장안내 · 이벤트 · 공지사항 · 고객센터 */}
        <button type="button" className="chip sm" onClick={onStores}>매장안내</button>
        <button type="button" className="chip sm" onClick={onEvents}>이벤트</button>
        <button type="button" className="chip sm" onClick={onNotice}>공지사항</button>
        <button type="button" className="chip sm" onClick={onHelp}>고객센터</button>
      </div>

      <section className="sec">
        <div className="sec-h">고객 만족을 위한 {BRAND.name}의 약속</div>
        <div className="group">
          <div className="row ind"><span className="ricon"><Icon name="sparkle" /></span><span className="lbl">신선한 식품<small>매장에서 직접 고른 신선 식품</small></span></div>
          <div className="row ind"><span className="ricon t-blue"><Icon name="truck" /></span><span className="lbl">빠른 배송<small>{ship ? `${ship}${storeShort ? ` (${storeShort})` : ''}` : '가까운 매장에서 바로 보내 드려요'}</small></span></div>
          <div className="row ind"><span className="ricon t-orange"><Icon name="tag" /></span><span className="lbl">합리적인 가격<small>동네마트의 따뜻함으로</small></span></div>
        </div>
      </section>

      {!user && coupon && (
        <section className="sec">
          <div className="cpn">
            <Icon name="gift" />
            <div style={{ flex: 1 }}><b>{coupon.label}</b>{coupon.sub && <div className="f-hint">{coupon.sub}</div>}</div>
            <button type="button" className="ui-btn sm pri" onClick={onSignup}>가입하기</button>
          </div>
        </section>
      )}

      <section className="sec">
        <div className="sec-h">사업자 정보 (통신판매업 표시)</div>
        <div className="group">
          {bizRows.map(([l, v]) => (
            <div className="row" key={l}><span className="lbl">{l}</span><span className={`val${v ? '' : ' none'}`}>{v || '—'}</span></div>
          ))}
        </div>
      </section>
      <div className="foot">© 2026 Dongsin Market. All rights reserved.</div>
    </div>
  );
}
