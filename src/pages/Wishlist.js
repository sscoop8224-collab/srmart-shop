function Wishlist({ wishlist, onProductClick, onAddToCart, onToggleWishlist }) {
  const handleAddAll = () => {
    if (wishlist.length === 0) return;
    wishlist.forEach((product) => onAddToCart(product));
    alert('찜 목록의 모든 상품을 장바구니에 담았어요! 🛒');
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>❤️ 찜 목록</h2>
        {wishlist.length > 0 && (
          <button onClick={handleAddAll} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            🛒 전체 담기
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#adb5bd', gap: '12px' }}>
          <span style={{ fontSize: '64px', opacity: '0.6' }}>🤍</span>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#495057', margin: 0 }}>찜한 상품이 없어요!</p>
          <p style={{ fontSize: '13px', color: '#adb5bd', margin: 0 }}>마음에 드는 상품을 찜해보세요</p>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 20px', background: 'white', borderBottom: '1px solid #f1f3f5' }}>
            <p style={{ fontSize: '13px', color: '#868e96', margin: 0, fontWeight: '600' }}>
              총 <span style={{ color: '#00c471' }}>{wishlist.length}개</span> 상품
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', padding: '16px' }}>
            {wishlist.map((product) => (
              <div
                key={product.id}
                style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                onClick={() => onProductClick(product)}
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#f8f9fa', padding: '8px', boxSizing: 'border-box' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🛍️</div>
                )}
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 3px' }}>{product.large}</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#212529', margin: '0 0 8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                  <p style={{ fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 10px' }}>₩{product.price.toLocaleString()}</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                      style={{ flex: 1, background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '10px', padding: '9px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      🛒 담기
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                      style={{ width: '36px', height: '36px', background: '#fff0f1', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      ❤️
                    </button>
                  </div>
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