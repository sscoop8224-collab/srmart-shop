import { useState } from 'react';

function Search({ products, categories, goBack, onProductClick, onAddToCart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLarge, setFilterLarge] = useState('전체');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLarge = filterLarge === '전체' || product.large === filterLarge;
    return matchesSearch && matchesLarge;
  });

  const selectedLargeObj = categories.find((c) => c.name === filterLarge);

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ background: 'white', padding: '16px 20px', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>상품 검색</h2>
        </div>

        {/* 검색창 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8f9fa', borderRadius: '14px', padding: '12px 16px', border: '1.5px solid #e9ecef' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input
            type="text"
            placeholder="상품명으로 검색해보세요"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', fontFamily: 'inherit', color: '#212529' }}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '16px', padding: 0 }}>✕</button>
          )}
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div style={{ background: 'white', padding: '12px 20px', borderBottom: '1px solid #f1f3f5', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '8px', width: 'max-content' }}>
          {['전체', ...categories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              onClick={() => setFilterLarge(name)}
              style={{ padding: '7px 16px', background: filterLarge === name ? '#00c471' : 'white', color: filterLarge === name ? 'white' : '#868e96', border: filterLarge === name ? 'none' : '1.5px solid #e9ecef', borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 검색 결과 */}
      <div style={{ padding: '16px' }}>
        <p style={{ fontSize: '13px', color: '#868e96', margin: '0 0 14px', fontWeight: '600' }}>
          검색 결과 <span style={{ color: '#00c471' }}>{filteredProducts.length}개</span>
        </p>

        {filteredProducts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', color: '#adb5bd' }}>
            <span style={{ fontSize: '52px', marginBottom: '12px', opacity: '0.6' }}>🔍</span>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#495057', margin: '0 0 6px' }}>검색 결과가 없어요!</p>
            <p style={{ fontSize: '13px', color: '#adb5bd', margin: 0 }}>다른 검색어를 입력해보세요</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer' }}
                onClick={() => onProductClick(product)}
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#f8f9fa', padding: '8px' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🛍️</div>
                )}
                <div style={{ padding: '10px 12px 12px' }}>
                  <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 3px' }}>{product.large}</p>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#212529', margin: '0 0 8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '15px', fontWeight: '800', color: '#212529', margin: 0 }}>₩{product.price.toLocaleString()}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                      style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,196,113,0.3)' }}
                    >+</button>
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
