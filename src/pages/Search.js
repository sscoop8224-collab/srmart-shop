import { useState } from 'react';

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

function Search({ products, categories, goBack, onProductClick, onAddToCart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLarge, setFilterLarge] = useState('전체');

  const filteredProducts = products.filter((product) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = q === '' || 
      product.name.toLowerCase().includes(q) ||
      (product.large && product.large.toLowerCase().includes(q)) ||
      (product.medium && product.medium.toLowerCase().includes(q)) ||
      (product.small && product.small.toLowerCase().includes(q)) ||
      (product.barcode && product.barcode.includes(q));
    const matchesLarge = filterLarge === '전체' || product.large === filterLarge;
    return matchesSearch && matchesLarge;
  });

  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button onClick={goBack} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>상품 검색</h2>
        </div>

        {/* 검색창 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fffe', borderRadius: '14px', padding: '12px 16px', border: '1.5px solid #e8faf3' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="상품명, 카테고리, 바코드로 검색해보세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', fontFamily: 'inherit', color: '#1a1a1a' }}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: '#f0faf5', border: 'none', cursor: 'pointer', color: '#00a85e', fontSize: '12px', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>지우기</button>
          )}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ background: 'white', padding: '10px 20px', borderBottom: '1px solid #f0faf5', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', width: 'max-content' }}>
          {['전체', ...categories.map((c) => c.name)].map((name) => (
            <button key={name} onClick={() => setFilterLarge(name)}
              style={{ padding: '7px 16px', background: filterLarge === name ? '#00c471' : 'white', color: filterLarge === name ? 'white' : '#868e96', border: filterLarge === name ? 'none' : '1.5px solid #e8faf3', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', boxShadow: filterLarge === name ? '0 2px 8px rgba(0,196,113,0.3)' : 'none' }}>
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 결과 */}
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: '13px', color: '#adb5bd', margin: '0 0 14px', fontWeight: '600' }}>
          검색 결과 <span style={{ color: '#00c471', fontWeight: '800' }}>{filteredProducts.length}개</span>
        </p>

        {filteredProducts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
            <div style={{ width: '72px', height: '72px', background: '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>검색 결과가 없어요!</p>
            <p style={{ fontSize: '13px', color: '#adb5bd', margin: 0 }}>다른 검색어를 입력해보세요</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filteredProducts.map((product) => (
              <div key={product.id}
                style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', cursor: 'pointer', border: '1px solid #f0faf5', opacity: product.status === '판매중지' ? 0.6 : 1 }}
                onClick={() => onProductClick(product)}>
                <div style={{ height: '130px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={product.image || getCategoryImage(product.large)}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {!product.image && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,196,113,0.06)' }} />}
                  {product.stock === 0 && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontWeight: '800', fontSize: '13px', background: '#ff4757', padding: '4px 12px', borderRadius: '20px' }}>품절</span>
                    </div>
                  )}
                  {product.isAdult && (
                    <div style={{ position: 'absolute', top: 8, left: 8, background: '#ff4757', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '8px' }}>🔞 성인</div>
                  )}
                </div>
                <div style={{ padding: '10px 11px 12px' }}>
                  <p style={{ fontSize: '10px', color: '#00c471', margin: '0 0 3px', fontWeight: '700' }}>{product.large}</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '14px', fontWeight: '800', color: '#1a1a1a', margin: 0 }}>₩{product.price.toLocaleString()}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                      disabled={product.stock === 0 || product.status === '판매중지'}
                      style={{ width: '30px', height: '30px', background: (product.stock === 0 || product.status === '판매중지') ? '#dee2e6' : 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: (product.stock === 0 || product.status === '판매중지') ? 'not-allowed' : 'pointer', fontSize: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: (product.stock === 0 || product.status === '판매중지') ? 'none' : '0 2px 8px rgba(0,196,113,0.4)', lineHeight: 1, fontWeight: '300' }}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;