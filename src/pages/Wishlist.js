// 찜 (목업 정본 v1 의 S19, 묶음 5 · 2026-11-12 밤)
// 결정 6: 찜은 탭에서 빠지고 마이 → 「찜」 으로 들어온다(뒤로 = 마이). 「전체 담기」 · 카드를 누르면 상세 · 담기 · 하트로 찜 빼기.
// 카드는 홈과 같은 상품 카드(ProductCard) — 주류 잠금·품절·행사 딱지를 홈과 같은 규칙으로 보인다.
import { useDialog } from '../DialogContext';
import Icon from '../components/ui/Icon';
import { ProductCard } from './Home';

const getCategoryImage = (large) => {
  switch(large) {
    case '식품': return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80';
    case '음료': return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80';
    case '생활용품': return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80';
    case '간식/과자': return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=80';
    case '주류': return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80';
  }
};

function Wishlist({ wishlist, onProductClick, onAddToCart, onToggleWishlist, goBack, goToHome, adultOk }) {
  const { notify } = useDialog();

  // 품절·주류 잠금은 담을 수 없다 — 담을 수 있는 것만 담고, 빠진 것은 말한다(조용히 빠지면 다 담긴 줄 안다)
  const handleAddAll = () => {
    const ok = wishlist.filter((p) => !p.isSoldOut && !(p.isAdult && !adultOk));
    if (ok.length === 0) { notify('담을 수 있는 상품이 없어요'); return; }
    ok.forEach((product) => onAddToCart(product));
    const skipped = wishlist.length - ok.length;
    notify(skipped ? `${ok.length}개를 장바구니에 담았어요. 품절·본인확인 필요 ${skipped}개는 빼고 담았어요.` : `${ok.length}개를 모두 장바구니에 담았어요`);
  };

  return (
    <div className="v2 wish-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" onClick={goBack}><Icon name="chevL" />마이</button></div>
          <div className="nav-title" />
          <div className="nav-side r">{wishlist.length > 0 && <button type="button" className="nav-btn b" onClick={handleAddAll}>전체 담기</button>}</div>
        </div>
        <div className="large"><h1>찜</h1>{wishlist.length > 0 && <span className="sub">{wishlist.length}개</span>}</div>
      </header>

      {wishlist.length === 0 ? (
        <div className="ui-empty">
          <div className="big"><Icon name="heart" /></div>
          <h3>찜한 상품이 없어요</h3>
          <p>마음에 드는 상품의 하트를 눌러 보세요.</p>
          <button type="button" className="ui-btn md pri" onClick={goToHome}>홈으로</button>
        </div>
      ) : (
        <div className="pgrid" style={{ marginTop: 'var(--sp-3)' }}>
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} wished adultOk={adultOk} fallbackImage={getCategoryImage}
              onOpen={onProductClick} onAdd={onAddToCart} onWish={onToggleWishlist} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
