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

function Wishlist({ wishlist, onProductClick, onAddToCart, onToggleWishlist, goBack, goToHome, darkMode }) {
  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';

  const handleAddAll = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach((product) => onAddToCart(product));
    alert('찜 목록의 모든 상품을 장바구니에 담았어요! 🛒');
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: headerBg, borderBottom: `1px solid ${borderColor}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={goBack} style={{ width: '38px', height: '38px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#f0f0f0' : '#1a1a1a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: textColor }}>찜 목록</h2>
        </div>
        {wishlist.length > 0 && (
          <button onClick={handleAddAll} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,196,113,0.3)' }}>
            전체 담기
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: '12px' }}>
          <div style={{ width: '80px', height: '80px', background: darkMode ? '#2e2e2e' : '#fff0f1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: textColor, margin: 0 }}>찜한 상품이 없어요!</p>
          <p style={{ fontSize: '13px', color: subTextColor, margin: 0 }}>마음에 드는 상품을 찜해보세요</p>
          <button onClick={goToHome} style={{ marginTop: '8px', padding: '14px 32px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
            쇼핑 계속하기
          </button>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 20px', background: headerBg, borderBottom: `1px solid ${borderColor}` }}>
            <p style={{ fontSize: '13px', color: subTextColor, margin: 0, fontWeight: '600' }}>
              총 <span style={{ color: '#00c471', fontWeight: '800' }}>{wishlist.length}개</span> 상품
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px' }}>
            {wishlist.map((product) => (
              <div key={product.id}
                style={{ background: cardBg, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', cursor: 'pointer', border: `1px solid ${borderColor}` }}
                onClick={() => onProductClick(product)}>
                <div style={{ height: '130px', position: 'relative', overflow: 'hidden' }}>
                  <img src={product.image || getCategoryImage(product.large)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {!product.image && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,196,113,0.06)' }} />}
                  <button onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                    style={{ position: 'absolute', top: '8px', right: '8px', width: '30px', height: '30px', borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff4757" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
                <div style={{ padding: '10px 11px 12px' }}>
                  <p style={{ fontSize: '10px', color: '#00c471', margin: '0 0 3px', fontWeight: '700' }}>{product.large}</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: textColor, margin: '0 0 6px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                  <p style={{ fontSize: '14px', fontWeight: '800', color: textColor, margin: '0 0 10px' }}>₩{product.price.toLocaleString()}</p>
                  <button onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', padding: '9px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,196,113,0.3)' }}>
                    장바구니 담기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;
