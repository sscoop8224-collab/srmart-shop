// 홈 — 상품 목록 (목업 정본 v1 의 P05 · S02 · S03, 묶음 2 · 2026-11-12 밤)
//
// 목업을 그대로 옮겼다: 검색창 → 배송 한 줄 · 가입 쿠폰 띠(로그인 안 한 손님) → 배너 → 분류 칩 → 목록 머리·정렬 →
// 상품 격자 → 접힌 사업자 정보. 색·크기는 styles/shop.css(토큰 이름만).
// 상품 목록·분류·정렬 상태는 지금처럼 App 이 들고 있다(장바구니·찜·상세가 같은 값을 쓴다). 이 화면은 그리기만 한다.
//
// 서버 자료(화면에 글자를 직접 적지 않는다):
//   배송 한 줄   GET /api/stores/:id/delivery-promise — mode 'off' 거나 못 받으면 줄이 없다
//   가입 쿠폰    GET /api/signup-coupon — enabled 일 때만(본인확인 연동이 꺼져 있으면 서버가 false 를 준다)
//   사업자 정보  GET /api/shop/business-info — 빈 칸은 그 줄을 안 그린다. 다 비었으면 묶음째 없다
import { useEffect, useRef, useState } from 'react';
import Icon from '../components/ui/Icon';
import { getDeliveryPromise, getSignupCoupon, getBusinessInfo, imgUrl } from '../api';

const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;

// 배송 한 줄 — 서버 문구에서 굵게 할 곳만 고른다(목업 promise())
export function DeliveryLine({ p, storeShort }) {
  if (!p || !p.mode || p.mode === 'off' || !p.label) return null;
  if (p.mode === 'today') {
    const m = /^(.*까지) 주문하면 (.*)$/.exec(p.label);
    return (
      <div className="promise">
        <Icon name="truck" size="sm" />
        <span>{m ? <><b>{m[1]}</b> 주문하면 <b>{m[2]}</b></> : p.label}</span>
        {p.sub && <small>{p.sub}</small>}
      </div>
    );
  }
  // 마감 후 · 당일배송 불가 · 배송 휴무 — 회색 줄. 마감 후는 「내일 배송 · 사유」, 나머지는 「사유 · ○일 배송」(목업 DELIV)
  const body = !p.sub ? (p.text || p.label)
    : p.mode === 'tomorrow' ? <><b>{p.label}</b> · {p.sub}</>
    : <>{p.sub} · <b>{p.label}</b></>;
  // 마감 후 오른쪽 작은 글자는 「내일 오후 4시 출발」(목업) — 서버의 배송 시작 시각(start)을 말로 바꾸기만 한다. 나머지는 매장 이름
  const day = p.label.replace(/ 배송$/, '');
  const small = p.mode === 'tomorrow' && p.start ? `${day} ${koTime(p.start)} 출발` : storeShort;
  return (
    <div className="promise late">
      <Icon name="truck" size="sm" />
      <span>{body}</span>
      {small && <small>{small}</small>}
    </div>
  );
}

// 배송 한 줄 자료 — 홈과 상세가 같이 쓴다. 못 받으면 null(줄이 없다)
export function useDeliveryPromise(storeId) {
  const [promise, setPromise] = useState(null);
  useEffect(() => {
    if (!storeId) { setPromise(null); return; }
    let live = true;
    getDeliveryPromise(storeId).then((r) => { if (live) setPromise(r.data); }).catch(() => { if (live) setPromise(null); });
    return () => { live = false; };
  }, [storeId]);
  return promise;
}

// '16:00' → '오후 4시' · '09:30' → '오전 9시 30분' (서버 deliveryPromise.koTime 과 같은 말)
function koTime(hm) {
  const [h, m] = String(hm).split(':').map(Number);
  if (!Number.isFinite(h)) return hm;
  const head = h === 0 ? '밤 12시' : h === 12 ? '낮 12시' : h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`;
  return `${head}${m ? ` ${m}분` : ''}`;
}

// 상품 카드(목업 pcard) — 주류는 본인확인 전 가격·담기를 잠근다
export function ProductCard({ product: p, wished, adultOk, fallbackImage, onOpen, onAdd, onWish }) {
  const lock = p.isAdult && !adultOk;
  const sale = p.salePrice != null && p.salePrice !== p.price ? p.salePrice : null;
  const off = sale ? Math.round((1 - sale / p.price) * 100) : 0;
  const weight = p.pricing_type === 'weight';
  return (
    <div className={`pc${p.isSoldOut ? ' soldout' : ''}`} onClick={() => { if (!p.isSoldOut) onOpen(p); }}>
      <div className="pimg">
        <img src={p.image ? imgUrl(p.image) : fallbackImage(p.large)} alt={p.name} loading="lazy" decoding="async" />
        {p.isSoldOut && <div className="sold">품절</div>}
        <div className="tagtl">
          {p.eventLabel && <span className="pill solid-r">{p.eventLabel}</span>}
          {p.isAdult && <span className="pill r">19</span>}
        </div>
        {/* 찜 단추는 찜을 받는 화면에서만(상세의 관련 상품 줄에는 없다 — 눌러도 아무 일이 없는 단추를 두지 않는다) */}
        {onWish && (
          <button className={`heart${wished ? ' on' : ''}`} aria-label={wished ? '찜 빼기' : '찜'} onClick={(e) => { e.stopPropagation(); onWish(p); }}>
            <Icon name="heart" size={wished ? 'sm fill' : 'sm'} />
          </button>
        )}
        {!p.isSoldOut && !lock && (
          <button className="add" aria-label="담기" onClick={(e) => { e.stopPropagation(); onAdd(p); }}>
            <Icon name="plus" />
          </button>
        )}
      </div>
      <div className={`meta${p.isSoldOut ? ' dim' : ''}`}>
        <div className="cat">{p.large}</div>
        <div className="nm">{p.name}{p.spec ? <> <span className="spec">{p.spec}</span></> : null}</div>
        {lock ? (
          <div className="lock19"><Icon name="lock" size="sm" /> 19세 이상 본인확인 필요</div>
        ) : (
          <div className="price">
            {sale ? <><span className="off">{off}%</span>{won(sale)}<span className="was">{won(p.price)}</span></>
              : won(weight ? (p.unit_price || p.price) : p.price)}
            {weight && <span className="was per">/100g</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// 배너 — 여러 장이면 3초마다 넘기고 손으로 밀어도 넘긴다(지금 앱과 같은 동작). 끝 → 처음은 복제 한 장으로 이어 붙인다
function Banners({ banners, onFilter }) {
  const n = banners.length;
  const [idx, setIdx] = useState(0);
  const [jump, setJump] = useState(false);
  const touchX = useRef(0);
  useEffect(() => { setIdx(0); }, [n]);
  useEffect(() => {
    if (n < 2) return undefined;
    const t = setInterval(() => { setJump(false); setIdx((i) => i + 1); }, 3000);
    return () => clearInterval(t);
  }, [n]);
  useEffect(() => {
    if (n > 1 && idx >= n) {
      const t = setTimeout(() => { setJump(true); setIdx(0); }, 600);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [idx, n]);
  if (!n) return null;
  const slides = n > 1 ? [...banners, banners[0]] : banners;
  const move = (d) => { setJump(false); setIdx((i) => (d > 0 ? i + 1 : (i - 1 < 0 ? n - 1 : i - 1))); };
  return (
    <div className="banner-wrap"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => { const d = touchX.current - e.changedTouches[0].clientX; if (n > 1 && Math.abs(d) > 40) move(d); }}>
      <div className={`banner-track${jump ? ' jump' : ''}`} style={{ transform: `translateX(-${idx * 100}%)` }}>
        {slides.map((s, i) => (
          <button key={i} className="banner home" onClick={() => { if (s.filter) onFilter(s.filter); }}
            style={s.image_url ? { backgroundImage: `url(${imgUrl(s.image_url)})` } : (s.bg ? { background: s.bg } : undefined)}>
            {s.image_url && <span className="scrim" />}
            {s.label && <small>{s.label}</small>}
            <h2>{s.title}</h2>
            {s.sub && <p>{s.sub}</p>}
            <span className="go">{s.filter ? `${s.filter} 보러가기` : '쇼핑하기'}<Icon name="chevR" size="sm" /></span>
            {!s.image_url && s.emoji && <span className="emo">{s.emoji}</span>}
          </button>
        ))}
      </div>
      {n > 1 && <span className="pg">{(idx % n) + 1} / {n}</span>}
    </div>
  );
}

const BIZ = [
  ['company_name', '상호'], ['ceo_name', '대표자'], ['address', '주소'], ['phone', '대표 전화'],
  ['business_number', '사업자등록번호'], ['mail_order_number', '통신판매업 신고번호'], ['privacy_officer', '개인정보 보호책임자'],
];

function BizInfo() {
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { getBusinessInfo().then((r) => setInfo(r.data || {})).catch(() => setInfo({})); }, []);
  const rows = BIZ.map(([k, l]) => {
    let v = info && info[k] ? String(info[k]).trim() : '';
    if (k === 'privacy_officer' && v && info.privacy_officer_contact) v += ` (${info.privacy_officer_contact})`;
    return [l, v];
  }).filter(([, v]) => v);
  if (!rows.length) return null;
  return (
    <div className="biz">
      <button className="bh" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        사업자 정보<Icon name={open ? 'chevD' : 'chevR'} size="sm" />
      </button>
      {open && <dl>{rows.map(([l, v]) => <div key={l} style={{ display: 'contents' }}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>}
    </div>
  );
}

export default function Home({
  user, storeId, storeShort, banners, categories,
  filterLarge, filterMedium, filterSmall, onLarge, onMedium, onSmall, largeObj, mediumObj,
  list, loading, error, onRetry, sortOrder, setSortOrder,
  wishlist, onWish, onAdd, onOpen, onSearch, onSignup, fallbackImage,
}) {
  const promise = useDeliveryPromise(storeId);
  const [coupon, setCoupon] = useState(null);
  useEffect(() => {
    if (user) { setCoupon(null); return; }
    getSignupCoupon().then((r) => setCoupon(r.data && r.data.enabled ? r.data : null)).catch(() => setCoupon(null));
  }, [user]);

  const isEvent = filterLarge === '행사중';
  const title = isEvent ? '행사 상품' : (filterLarge === '전체' ? '전체 상품' : filterLarge);
  const adultOk = !!(user && user.isAdult);
  const promiseRow = <DeliveryLine p={promise} storeShort={storeShort} />;
  const showCoupon = !user && coupon;

  return (
    <div className="v2 home-v2">
      <div className="sec" style={{ marginTop: 'var(--sp-1)' }}>
        <button className="search tall" onClick={onSearch} aria-label="상품 검색">
          <Icon name="search" size="sm" /><span>상품을 검색해 보세요</span>
        </button>
        {(promise && promise.mode !== 'off') || showCoupon ? (
          <div className="dl-row">
            {promiseRow}
            {showCoupon && (
              <div className="cpn slim">
                <Icon name="gift" />
                <div style={{ flex: 1 }}><b>{coupon.label}</b>{coupon.sub && <div className="f-hint">{coupon.sub}</div>}</div>
                <button className="ui-btn sm pri" onClick={onSignup}>가입하기</button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <Banners banners={banners} onFilter={onLarge} />
      <div className="home-gap" />

      <div className="chips" aria-label="분류">
        {['전체', '행사상품', ...categories.map((c) => c.name)].map((name) => {
          const on = name === '행사상품' ? isEvent : filterLarge === name;
          return <button key={name} className={`chip${on ? ' on' : ''}`} aria-pressed={on} onClick={() => onLarge(name === '행사상품' ? '행사중' : name)}>{name}</button>;
        })}
      </div>
      {largeObj && largeObj.children.length > 0 && (
        <div className="chips">
          {['전체', ...largeObj.children.map((m) => m.name)].map((name) => (
            <button key={name} className={`chip sm${filterMedium === name ? ' on' : ''}`} onClick={() => onMedium(name)}>{name}</button>
          ))}
        </div>
      )}
      {mediumObj && mediumObj.children.length > 0 && (
        <div className="chips">
          {['전체', ...mediumObj.children].map((name) => (
            <button key={name} className={`chip sm${filterSmall === name ? ' on' : ''}`} onClick={() => onSmall(name)}>{name}</button>
          ))}
        </div>
      )}

      {loading ? (
        <>
          <div className="list-h"><div className="sk" style={{ width: 120, height: 22 }} /></div>
          <div className="pgrid sk-grid" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i}><div className="pimg" /><div className="sk" style={{ height: 14, marginTop: 8, width: '80%' }} /><div className="sk" style={{ height: 18, marginTop: 6, width: '50%' }} /></div>
            ))}
          </div>
        </>
      ) : error ? (
        <div className="ui-empty">
          <div className="big r"><Icon name="wifiOff" /></div>
          <h3>상품을 불러오지 못했어요</h3>
          <p>인터넷 연결을 확인하고 다시 시도해 주세요.</p>
          <button className="ui-btn pri" onClick={onRetry}><Icon name="refresh" size="sm" />다시 시도</button>
        </div>
      ) : (
        <>
          <div className="list-h">
            <h3>{title}<span>{list.length}개</span></h3>
            <label className="sortbtn">
              {{ default: '기본순', price_asc: '낮은 가격순', price_desc: '높은 가격순', name: '이름순' }[sortOrder] || '기본순'}
              <Icon name="chevD" size="sm" />
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} aria-label="정렬">
                <option value="default">기본순</option>
                <option value="price_asc">낮은 가격순</option>
                <option value="price_desc">높은 가격순</option>
                <option value="name">이름순</option>
              </select>
            </label>
          </div>
          {list.length === 0 ? (
            isEvent ? (
              <div className="ui-empty"><div className="big"><Icon name="gift" /></div><h3>지금 진행 중인 행사가 없어요</h3><p>새 행사가 열리면 여기에 보여 드릴게요.</p></div>
            ) : (
              <div className="ui-empty"><div className="big"><Icon name="box" /></div><h3>이 분류에는 상품이 없어요</h3><p>다른 분류를 골라 보세요.</p></div>
            )
          ) : (
            <div className="pgrid">
              {list.map((p) => (
                <ProductCard key={p.id} product={p} adultOk={adultOk} fallbackImage={fallbackImage}
                  wished={!!wishlist.find((w) => w.id === p.id)} onOpen={onOpen} onAdd={onAdd} onWish={onWish} />
              ))}
            </div>
          )}
        </>
      )}

      <BizInfo />
      <div className="foot">© 2026 Dongsin Market. All rights reserved.</div>
    </div>
  );
}
