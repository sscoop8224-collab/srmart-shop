function Wishlist({ wishlist, onProductClick, onAddToCart, onToggleWishlist }) {
  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f3f5' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>❤️ 찜 목록</h2>
      </div>

      {wishlist.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#adb5bd', gap: '12px' }}>
          <span style={{ fontSize: '52px' }}>🤍</span>
          <span style={{ fontSize: '15px', fontWeight: '500' }}>찜한 상품이 없어요!</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', padding: '16px 20px' }}>
          {wishlist.map((product) => (
            <div
              key={product.id}
              style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e9ecef', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              onClick={() => onProductClick(product)}
            >
              {product.image ? (
                <img src={product.image} alt={product.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#f8f9fa', padding: '8px' }} />
              ) : (
                <div style={{ width: '100%', aspectRatio: '1', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🛍️</div>
              )}
              <div style={{ padding: '12px' }}>
                <p style={{ fontSize: '11px', color: '#00c471', fontWeight: '600', margin: '0 0 5px' }}>
                  {[product.large, product.medium, product.small].filter(Boolean).join(' > ')}
                </p>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#212529', margin: '0 0 8px', lineHeight: '1.4' }}>
                  {product.name}
                </p>
                <p style={{ fontSize: '16px', fontWeight: '800', color: '#212529', margin: '0 0 10px' }}>
                  ₩{product.price.toLocaleString()}
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                    style={{ flex: 1, background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '10px', padding: '9px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    🛒 담기
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleWishlist(product); }}
                    style={{ width: '36px', height: '36px', background: '#fff0f1', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    ❤️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;