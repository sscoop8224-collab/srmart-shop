// 최근 본 상품 (목업 정본 v1 의 S41, 묶음 6 · 2026-11-13 새벽)
// 결정 3: 만든다. 마이 → 「최근 본 상품」(뒤로 = 마이). 상세를 열 때 서버에 기록(`POST /recent-views`) — 목업이 짚은 F10
//   (상세에 로그인 정보가 안 넘어가 기록이 안 쌓임)은 묶음 3 에서 이미 고쳐졌다(ProductDetail 이 user 를 받는다).
// 목록 = `GET /users/me/recent-views`(최근 20개). 그 응답에는 **가격·재고가 없다**(전 매장 공통 상품 칸만) —
//   그래서 앱이 들고 있는 **지금 매장의 상품 목록**에서 찾아 카드로 보인다(가격·품절·행사·주류 잠금이 홈과 같다).
//   지금 매장에서 팔지 않는 상품은 카드로 못 보이므로 빼고, **몇 개 뺐는지 말한다**(조용히 빠지면 기록이 사라진 줄 안다).
// 🔸 목업의 「편집」(지우기)은 넣지 않았다 — 서버에 최근 본 기록을 지우는 길이 없다(대표님 결정 대기).
import { useEffect, useState } from 'react';
import { getRecentViews } from '../api';
import Icon from '../components/ui/Icon';
import { ProductCard } from './Home';

const getCategoryImage = (large) => {
  switch (large) {
    case '식품': return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80';
    case '음료': return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80';
    case '생활용품': return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80';
    case '간식/과자': return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=80';
    case '주류': return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80';
  }
};

function RecentViews({ products = [], wishlist = [], adultOk, onProductClick, onAddToCart, onToggleWish, goBack, goToHome }) {
  const [rows, setRows] = useState(null);       // null = 불러오는 중
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    getRecentViews()
      .then((r) => { if (alive) setRows(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (alive) { setFailed(true); setRows([]); } });
    return () => { alive = false; };
  }, [tick]);

  const list = (rows || []).map((r) => products.find((p) => p.id === r.product_id)).filter(Boolean);
  const missing = (rows || []).length - list.length;

  return (
    <div className="v2 recent-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" onClick={goBack}><Icon name="chevL" />마이</button></div>
          <div className="nav-title" />
          <div className="nav-side r" />
        </div>
        <div className="large"><h1>최근 본 상품</h1></div>
      </header>

      {rows === null ? (
        <div className="ui-empty"><p>불러오는 중…</p></div>
      ) : failed ? (
        <div className="ui-empty">
          <div className="big"><Icon name="wifiOff" /></div>
          <h3>최근 본 상품을 불러오지 못했어요</h3>
          <p>인터넷 연결을 확인하고 다시 시도해 주세요.</p>
          <button type="button" className="ui-btn pri" onClick={() => setTick((t) => t + 1)}>다시 시도</button>
        </div>
      ) : list.length === 0 ? (
        <div className="ui-empty">
          <div className="big"><Icon name="clock" /></div>
          <h3>최근 본 상품이 없어요</h3>
          <p>{missing > 0 ? `본 상품 ${missing}개는 지금 매장에서 팔지 않아 보이지 않아요.` : '상품을 둘러보면 여기에 모아 드려요.'}</p>
          <button type="button" className="ui-btn md pri" onClick={goToHome}>쇼핑하러 가기</button>
        </div>
      ) : (
        <>
          <div className="pgrid" style={{ marginTop: 'var(--sp-3)' }}>
            {list.map((product) => (
              <ProductCard key={product.id} product={product} wished={wishlist.some((w) => w.id === product.id)} adultOk={adultOk} fallbackImage={getCategoryImage}
                onOpen={onProductClick} onAdd={onAddToCart} onWish={onToggleWish} />
            ))}
          </div>
          {missing > 0 && <p className="f-hint rv-miss">지금 매장에서 팔지 않는 상품 {missing}개는 빼고 보여 드려요.</p>}
        </>
      )}
    </div>
  );
}

export default RecentViews;
