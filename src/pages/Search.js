import { useState, useEffect, useRef } from 'react';
import { searchProducts, getSearchSuggestions, getPopularSearches } from '../api';

const SORT_OPTIONS = [
  { value: 'popular', label: '인기순' },
  { value: 'newest', label: '신상품순' },
  { value: 'price_asc', label: '낮은가격' },
  { value: 'price_desc', label: '높은가격' },
];

const getCategoryImage = (large) => {
  const map = { '식품': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&q=80', '음료': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&q=80', '생활용품': 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=80', '간식/과자': 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=80', '주류': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80' };
  return map[large] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80';
};

function Search({ products, categories, goBack, onProductClick, onAddToCart, darkMode, user }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(products);
  const [popular, setPopular] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [sort, setSort] = useState('popular');
  const [filterCat, setFilterCat] = useState('전체');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef(null);
  const suggestTimer = useRef(null);

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#2a2a2a' : 'white';
  const text = darkMode ? '#f0f0f0' : '#1a1a1a';
  const sub = darkMode ? '#9e9e9e' : '#adb5bd';
  const border = darkMode ? '#3a3a3a' : '#f0faf5';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';

  useEffect(() => {
    getPopularSearches().then(r => setPopular(r.data || [])).catch(() => {});
  }, []);

  const handleSearch = async (q = query) => {
    const trimmed = q.trim();
    if (!trimmed) { setResults(products); setHasSearched(false); return; }
    setSearching(true); setHasSearched(true); setShowSuggest(false);
    try {
      const r = await searchProducts({ q: trimmed, sort, category: filterCat !== '전체' ? filterCat : undefined, in_stock: inStockOnly || undefined });
      setResults(r.data.products || []);
    } catch {
      setResults(products.filter(p => p.name.toLowerCase().includes(trimmed.toLowerCase())));
    } finally { setSearching(false); }
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (val.length >= 1) {
      suggestTimer.current = setTimeout(async () => {
        try { const r = await getSearchSuggestions(val); setSuggestions(r.data || []); setShowSuggest(true); }
        catch { setSuggestions([]); }
      }, 200);
    } else { setSuggestions([]); setShowSuggest(false); }
  };

  const handleSelectSuggest = (term) => { setQuery(term); setShowSuggest(false); handleSearch(term); };

  const filtered = hasSearched ? results : products.filter(p => {
    if (filterCat !== '전체' && p.large !== filterCat) return false;
    if (inStockOnly) { const sp = p.stores?.find(s => s.stock > 0); if (!sp) return false; }
    return true;
  });

  const largeCategories = ['전체', ...new Set(products.map(p => p.large).filter(Boolean))];

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* 헤더 */}
      <div style={{ background: darkMode ? '#1a1a1a' : 'white', padding: '16px 20px 12px', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={goBack} style={{ width: 38, height: 38, background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: inputBg, borderRadius: 14, padding: '10px 14px', border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e8faf3'}` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input ref={inputRef} type="text" value={query} onChange={e => handleQueryChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                onFocus={() => { if (suggestions.length) setShowSuggest(true); }}
                onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                placeholder="상품명 검색..." autoFocus
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: text, fontFamily: 'inherit' }} />
              {query && <button onClick={() => { setQuery(''); setResults(products); setHasSearched(false); setSuggestions([]); }} style={{ background: 'none', border: 'none', color: sub, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>}
            </div>
            {/* 자동완성 */}
            {showSuggest && suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: darkMode ? '#2a2a2a' : 'white', borderRadius: 12, border: `1px solid ${border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 30, marginTop: 4 }}>
                {suggestions.map((s, i) => (
                  <div key={i} onMouseDown={() => handleSelectSuggest(s)}
                    style={{ padding: '10px 16px', fontSize: 14, color: text, cursor: 'pointer', borderBottom: i < suggestions.length - 1 ? `1px solid ${border}` : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => handleSearch()} disabled={searching}
            style={{ padding: '10px 16px', background: '#00c471', color: 'white', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {searching ? '...' : '검색'}
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {largeCategories.slice(0, 8).map(cat => (
            <button key={cat} onClick={() => { setFilterCat(cat); if (hasSearched) handleSearch(); }}
              style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${filterCat === cat ? '#00c471' : border}`, background: filterCat === cat ? '#e6f9f1' : 'transparent', color: filterCat === cat ? '#009a58' : sub, fontSize: 12, fontWeight: filterCat === cat ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 정렬 + 필터 바 */}
      <div style={{ padding: '10px 20px', display: 'flex', gap: 8, alignItems: 'center', background: darkMode ? '#1a1a1a' : 'white', borderBottom: `1px solid ${border}` }}>
        {SORT_OPTIONS.map(s => (
          <button key={s.value} onClick={() => { setSort(s.value); if (hasSearched) handleSearch(); }}
            style={{ padding: '4px 10px', borderRadius: 12, border: `1px solid ${sort === s.value ? '#1a73e8' : border}`, background: sort === s.value ? '#e8f0fe' : 'transparent', color: sort === s.value ? '#1a73e8' : sub, fontSize: 11, fontWeight: sort === s.value ? 700 : 400, cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: sub, cursor: 'pointer', marginLeft: 'auto' }}>
          <input type="checkbox" checked={inStockOnly} onChange={e => { setInStockOnly(e.target.checked); if (hasSearched) handleSearch(); }} style={{ accentColor: '#00c471' }} />
          재고있음
        </label>
        <span style={{ fontSize: 11, color: sub }}>{filtered.length}개</span>
      </div>

      {/* 인기 검색어 (검색 전) */}
      {!hasSearched && popular.length > 0 && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 10 }}>🔥 인기 검색어</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {popular.map((p, i) => (
              <button key={i} onClick={() => { setQuery(p.keyword); handleSearch(p.keyword); }}
                style={{ padding: '6px 14px', borderRadius: 20, background: darkMode ? '#2e2e2e' : '#f0faf5', border: `1px solid ${border}`, color: text, fontSize: 13, cursor: 'pointer' }}>
                <span style={{ color: '#00c471', fontWeight: 700, marginRight: 4 }}>{i + 1}</span>{p.keyword}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 결과 그리드 */}
      {(hasSearched || query) && (
        <div style={{ padding: '16px 20px' }}>
          {searching ? (
            <div style={{ textAlign: 'center', padding: 40, color: sub }}>검색 중...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: sub }}>
              <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: text }}>검색 결과가 없어요</p>
              <p style={{ fontSize: 13 }}>다른 검색어로 찾아보세요</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {filtered.map(product => {
                const price = product.stores?.[0]?.price ?? product.price;
                return (
                  <div key={product.id} onClick={() => onProductClick?.(product)} style={{ background: cardBg, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${border}` }}>
                    <div style={{ width: '100%', aspectRatio: '1', overflow: 'hidden', background: darkMode ? '#1a1a1a' : '#f0faf5' }}>
                      <img src={product.image || getCategoryImage(product.large)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.currentTarget.src = getCategoryImage(product.large); }} />
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</div>
                      {price && <div style={{ fontSize: 15, fontWeight: 800, color: '#00c471' }}>₩{Number(price).toLocaleString()}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Search;
