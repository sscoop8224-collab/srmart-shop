// 이벤트 (목업 정본 v1 의 S45, 묶음 6 · 2026-11-13 새벽)
// 지시 6: 새 화면. 회사 소개(S40)의 「이벤트」 칩 → 이 화면(뒤로 = 앞 화면).
//   · 목록 = `GET /api/events/active`(홍보 이벤트 — 제목 · 설명 · 기간 · 그림) — 카드마다 「행사 상품 보기」
//   · 상세 = 그 이벤트와 **연결된 행사 상품** `GET /api/promotions/active?store_id=&event_id=`(이벤트↔행사 `event_promotions`).
//     값(promo_price · 문구 label)은 서버가 계산대와 같은 식으로 낸 것을 그대로 쓴다(화면에서 다시 계산하지 않는다).
//     카드는 홈과 같은 ProductCard — 재고·품절·주류 잠금은 **지금 매장 상품 목록**의 값(목록에 없으면 빼고 개수를 말한다).
// 🔸 홍보 이벤트를 만드는 어드민 경로가 아직 없어(백엔드 docs/EVENTS_WRITE_DEFECT.md A) 운영에서는 「진행 중인 이벤트가 없어요」로 보일 수 있다.
import { useEffect, useState } from 'react';
import { getActiveEvents, getActivePromotions, imgUrl } from '../api';
import Icon from '../components/ui/Icon';
import { ProductCard } from './Home';

// DATETIME 은 JSON 에서 UTC ISO 로 온다 — new Date 로 읽어 기기 날짜로
const md = (s) => { const d = new Date(s); return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일`; };
const when = (e) => [md(e.start_date), md(e.end_date)].filter(Boolean).join(' ~ ');
const fallback = () => 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80';

function EventImage({ e, className }) {
  const [bad, setBad] = useState(false);
  if (!e.image_url || bad) return <div className={className}><Icon name="gift" /></div>;
  return <div className={`${className} has-img`}><img src={imgUrl(e.image_url)} alt="" onError={() => setBad(true)} /></div>;
}

function Events({ storeId, products = [], wishlist = [], adultOk, onProductClick, onAddToCart, onToggleWish, goBack, goToHome }) {
  const [events, setEvents] = useState(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);
  const [sel, setSel] = useState(null);           // 고른 이벤트
  const [promos, setPromos] = useState(null);     // 그 이벤트의 행사(null = 불러오는 중)
  const [promoFailed, setPromoFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    getActiveEvents()
      .then((r) => { if (alive) setEvents(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (alive) { setFailed(true); setEvents([]); } });
    return () => { alive = false; };
  }, [tick]);

  useEffect(() => {
    if (!sel) return undefined;
    let alive = true;
    setPromos(null); setPromoFailed(false);
    getActivePromotions(storeId, sel.id)
      .then((r) => { if (alive) setPromos(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (alive) { setPromoFailed(true); setPromos([]); } });
    return () => { alive = false; };
  }, [sel, storeId]);

  // 행사 상품 → 지금 매장 상품 카드(재고·주류 잠금은 목록 값) + 서버가 낸 행사가·문구. 여러 행사에 걸리면 먼저 온 것 하나만(홈 「행사중」과 같다)
  const seen = new Set();
  let missing = 0;
  const items = [];
  for (const pr of promos || []) {
    for (const pp of pr.products || []) {
      if (seen.has(pp.product_id)) continue;
      seen.add(pp.product_id);
      const p = products.find((x) => x.id === pp.product_id);
      if (!p) { missing++; continue; }
      items.push({ ...p, salePrice: pp.promo_price != null ? Number(pp.promo_price) : p.price, eventLabel: pr.label || pr.name });
    }
  }

  if (sel) {
    return (
      <div className="v2 events-v2">
        <header className="app-nav line">
          <div className="nav-row">
            <div className="nav-side"><button type="button" className="nav-btn" onClick={() => setSel(null)}><Icon name="chevL" />이벤트</button></div>
            <div className="nav-title">{sel.title}</div>
            <div className="nav-side r" />
          </div>
        </header>
        <div className="banner ev-banner">
          <small>이벤트{when(sel) ? ` · ${when(sel)}` : ''}</small>
          <h2>{sel.title}</h2>
          {sel.description && <p>{sel.description}</p>}
          <span className="emo"><Icon name="gift" /></span>
        </div>
        <div className="list-h"><h3>연결된 행사 상품{promos && <span>{items.length}개</span>}</h3></div>
        {promos === null ? (
          <div className="ui-empty"><p>불러오는 중…</p></div>
        ) : promoFailed ? (
          <div className="ui-empty">
            <div className="big"><Icon name="wifiOff" /></div>
            <h3>행사 상품을 불러오지 못했어요</h3>
            <p>인터넷 연결을 확인하고 다시 시도해 주세요.</p>
            <button type="button" className="ui-btn pri" onClick={() => setSel({ ...sel })}>다시 시도</button>
          </div>
        ) : items.length === 0 ? (
          <div className="ui-empty">
            <div className="big"><Icon name="tag" /></div>
            <h3>이 이벤트에 연결된 행사 상품이 없어요</h3>
            <p>{missing > 0 ? `연결된 상품 ${missing}개는 지금 매장에서 팔지 않아요.` : '매장에서 행사를 연결하면 여기에 모여요.'}</p>
          </div>
        ) : (
          <>
            <div className="pgrid">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} wished={wishlist.some((w) => w.id === p.id)} adultOk={adultOk} fallbackImage={fallback}
                  onOpen={onProductClick} onAdd={onAddToCart} onWish={onToggleWish} />
              ))}
            </div>
            {missing > 0 && <p className="f-hint rv-miss">지금 매장에서 팔지 않는 상품 {missing}개는 빼고 보여 드려요.</p>}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="v2 events-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" aria-label="뒤로" onClick={goBack}><Icon name="chevL" /></button></div>
          <div className="nav-title" />
          <div className="nav-side r" />
        </div>
        <div className="large"><h1>이벤트</h1></div>
      </header>

      {events === null ? (
        <div className="ui-empty"><p>불러오는 중…</p></div>
      ) : failed ? (
        <div className="ui-empty">
          <div className="big"><Icon name="wifiOff" /></div>
          <h3>이벤트를 불러오지 못했어요</h3>
          <p>인터넷 연결을 확인하고 다시 시도해 주세요.</p>
          <button type="button" className="ui-btn pri" onClick={() => setTick((t) => t + 1)}>다시 시도</button>
        </div>
      ) : events.length === 0 ? (
        <div className="ui-empty">
          <div className="big"><Icon name="gift" /></div>
          <h3>진행 중인 이벤트가 없어요</h3>
          <p>새 이벤트가 열리면 알려 드릴게요.</p>
          <button type="button" className="ui-btn md pri" onClick={goToHome}>쇼핑하러 가기</button>
        </div>
      ) : (
        <div className="tw">
          {events.map((e) => (
            <section className="sec" key={e.id}>
              <div className="ev-card">
                <EventImage e={e} className="ev-img" />
                <div className="ev-b">
                  <b>{e.title}</b>
                  {e.description && <div className="f-hint ev-desc">{e.description}</div>}
                  {when(e) && <div className="f-hint"><Icon name="clock" size="sm" /> {when(e)}</div>}
                  <button type="button" className="ui-btn sm sec ev-go" onClick={() => setSel(e)}>행사 상품 보기<Icon name="chevR" size="sm" /></button>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default Events;
