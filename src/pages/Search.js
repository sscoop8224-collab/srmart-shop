import { useState } from 'react';

function Search({ products, categories, goBack, onProductClick, onAddToCart }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLarge, setFilterLarge] = useState('전체');
  const [filterMedium, setFilterMedium] = useState('전체');

  // 검색 및 필터링된 상품
  const filteredProducts = products.filter((product) => {
    // 상품명으로 검색
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    // 카테고리 필터링
    const matchesLarge = filterLarge === '전체' || product.large === filterLarge;
    const matchesMedium = filterMedium === '전체' || product.medium === filterMedium;

    return matchesSearch && matchesLarge && matchesMedium;
  });

  const selectedLargeObj = categories.find((c) => c.name === filterLarge);

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: '0', background: 'white', zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>←</button>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#212529' }}>🔍 상품 검색</h2>
      </div>

      {/* 검색 입력 필드 */}
      <div style={{ padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
        <input
          type="text"
          placeholder="상품명으로 검색해보세요"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1.5px solid #dee2e6',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'all 0.2s',
            background: 'white',
          }}
          onFocus={(e) => e.target.style.borderColor = '#00c471'}
          onBlur={(e) => e.target.style.borderColor = '#dee2e6'}
        />
      </div>

      {/* 대분류 카테고리 필터 */}
      <div style={{ overflowX: 'auto', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', padding: '8px 16px' }}>
        <div style={{ display: 'flex', gap: '8px', width: 'max-content' }}>
          {['전체', ...categories.map((c) => c.name)].map((name) => (
            <button
              key={name}
              onClick={() => { setFilterLarge(name); setFilterMedium('전체'); }}
              style={{
                border: '1.5px solid #dee2e6',
                background: filterLarge === name ? '#00c471' : 'white',
                color: filterLarge === name ? 'white' : '#868e96',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
                borderColor: filterLarge === name ? '#00c471' : '#dee2e6',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 중분류 카테고리 필터 */}
      {selectedLargeObj && selectedLargeObj.children.length > 0 && (
        <div style={{ overflowX: 'auto', scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', padding: '4px 16px' }}>
          <div style={{ display: 'flex', gap: '6px', width: 'max-content' }}>
            {['전체', ...selectedLargeObj.children.map((m) => m.name)].map((name) => (
              <button
                key={name}
                onClick={() => setFilterMedium(name)}
                style={{
                  border: '1.5px solid #e9ecef',
                  background: filterMedium === name ? '#e8faf3' : 'white',
                  color: filterMedium === name ? '#00a85e' : '#adb5bd',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  borderColor: filterMedium === name ? '#00c471' : '#e9ecef',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 검색 결과 */}
      <div style={{ padding: '16px 20px' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#495057', margin: '0 0 12px' }}>
          검색 결과 ({filteredProducts.length}개)
        </p>

        {filteredProducts.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: '#adb5bd', gap: '12px' }}>
            <span style={{ fontSize: '48px', opacity: '0.6' }}>🔍</span>
            <span style={{ fontSize: '15px', fontWeight: '500', color: '#adb5bd' }}>
              {searchQuery || filterLarge !== '전체' || filterMedium !== '전체'
                ? '검색 결과가 없어요!'
                : '상품을 검색해보세요'}
            </span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '14px',
          }}>
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                style={{
                  background: 'white',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
                onClick={() => onProductClick(product)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* 상품 이미지 */}
                {product.image ? (
                  <img src={product.image} alt={product.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', background: '#f8f9fa', padding: '8px' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>🛍️</div>
                )}

                {/* 상품 정보 */}
                <div style={{ padding: '12px' }}>
                  <p style={{ fontSize: '11px', color: '#00c471', fontWeight: '600', margin: '0 0 5px', letterSpacing: '0.2px' }}>
                    {[product.large, product.medium, product.small].filter(Boolean).join(' > ')}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#212529', margin: '0 0 8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.name}
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: '800', color: '#212529', margin: '0 0 10px', letterSpacing: '-0.5px' }}>
                    ₩{product.price.toLocaleString()}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(product);
                    }}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #00c471, #00a85e)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                      letterSpacing: '0.2px',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '0.9';
                      e.target.style.boxShadow = '0 4px 16px rgba(0,196,113,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '1';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    🛒 담기
                  </button>
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
