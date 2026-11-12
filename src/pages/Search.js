// 검색 (목업 정본 v1 의 S06 · S07, 묶음 2 · 2026-11-12 밤)
//
// 검색창(지우기 · 취소) → 분류 칩 → 정렬(인기순·신상품순·낮은가격·높은가격) → 결과 개수 · 「재고 있는 것만」 →
// 인기 검색어(순위) → 검색 결과(줄마다 담기). 입력하는 동안 추천 검색어가 뜨고 누르면 바로 검색한다(S07).
// 색·크기는 styles/shop.css(토큰 이름만).
import { useState, useEffect, useRef } from 'react';
import Icon from '../components/ui/Icon';
import { searchProducts, getSearchSuggestions, getPopularSearches, imgUrl } from '../api';

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
const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;

// 추천 검색어 안에서 친 글자를 굵게(목업 S07)
function Mark({ text, q }) {
  const i = q ? text.indexOf(q) : -1;
  if (i < 0) return text;
  return <>{text.slice(0, i)}<b>{q}</b>{text.slice(i + q.length)}</>;
}

// 🔴 `storeId` 를 **반드시 보낸다.** 안 보내면 서버가 기본 매장(검암)으로 떨어져
//    **다른 매장 손님에게 엉뚱한 가격**을 보여 준다 — 예전엔 아예 안 보냈다.
function Search({ products, goBack, onProductClick, onAddToCart, user, storeId }) {
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
  const [lastQ, setLastQ] = useState('');
  const suggestTimer = useRef(null);
  const suggestSeq = useRef(0);

  useEffect(() => {
    getPopularSearches().then(r => setPopular(r.data || [])).catch(() => {});
  }, []);

  // 정렬·분류·재고 칸은 값을 바꾼 **다음** 그 값으로 다시 찾는다(예전엔 바꾸기 전 값으로 찾았다)
  const handleSearch = async (q = query, o = {}) => {
    const trimmed = q.trim();
    const s = o.sort ?? sort, cat = o.cat ?? filterCat, stock = o.stock ?? inStockOnly;
    // 아직 안 온 추천 검색어는 버린다 — 엔터 뒤에 늦게 와서 결과를 덮던 것(묶음 2 에서 찾음)
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestSeq.current += 1;
    if (!trimmed) { setResults(products); setHasSearched(false); return; }
    setSearching(true); setHasSearched(true); setShowSuggest(false); setLastQ(trimmed);
    try {
      const r = await searchProducts({ q: trimmed, sort: s, category: cat !== '전체' ? cat : undefined, in_stock: stock || undefined, store_id: storeId || undefined });
      setResults(r.data.products || []);
    } catch {
      setResults(products.filter(p => p.name.toLowerCase().includes(trimmed.toLowerCase())));
    } finally { setSearching(false); }
  };

  const handleQueryChange = (val) => {
    setQuery(val);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (val.length >= 1) {
      const seq = ++suggestSeq.current;
      suggestTimer.current = setTimeout(async () => {
        try {
          const r = await getSearchSuggestions(val);
          if (seq !== suggestSeq.current) return;   // 그 사이 더 쳤거나 검색했다
          setSuggestions(r.data || []); setShowSuggest(true);
        } catch { if (seq === suggestSeq.current) setSuggestions([]); }
      }, 200);
    } else { setSuggestions([]); setShowSuggest(false); }
  };

  const pick = (term) => { setQuery(term); setShowSuggest(false); handleSearch(term); };
  const clear = () => { suggestSeq.current += 1; if (suggestTimer.current) clearTimeout(suggestTimer.current); setQuery(''); setResults(products); setHasSearched(false); setSuggestions([]); setShowSuggest(false); };

  const filtered = hasSearched ? results : products.filter(p => {
    if (filterCat !== '전체' && p.large !== filterCat) return false;
    if (inStockOnly) { const sp = p.stores?.find(s => s.stock > 0); if (!sp) return false; }
    return true;
  });

  const largeCategories = ['전체', ...new Set(products.map(p => p.large).filter(Boolean))];
  const adultOk = !!(user && user.isAdult);
  // 검색 응답에는 사진이 없다 — 홈이 받아 둔 같은 매장 상품이 있으면 그것을 쓴다(사진·품절·행사 표시가 같아진다)
  const full = (p) => {
    const f = products.find(x => x.id === p.id);
    if (f) return f;
    const price = p.stores?.[0]?.price ?? p.price;
    return { ...p, price, isAdult: !!(p.is_adult ?? p.isAdult), isSoldOut: p.stock != null && Number(p.stock) <= 0 };
  };
  const suggesting = showSuggest && suggestions.length > 0;

  return (
    <div className="v2 search-v2">
      <header className={`app-nav${suggesting ? ' line' : ''}`}>
        <div className="nav-row">
          <div className="search">
            <Icon name="search" size="sm" />
            <input type="search" enterKeyHint="search" value={query} onChange={e => handleQueryChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              onFocus={() => { if (suggestions.length) setShowSuggest(true); }}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              placeholder="상품을 검색해 보세요" aria-label="상품 검색" autoFocus />
            {query && <button className="clear" onClick={clear} aria-label="지우기"><Icon name="x" size="sm" /></button>}
          </div>
          <button className="nav-btn" onClick={goBack}>취소</button>
        </div>
      </header>

      {suggesting ? (
        <section className="sec">
          <div className="sec-h">추천 검색어</div>
          <div className="group">
            {suggestions.map((s, i) => (
              <button key={i} className="row ind" onMouseDown={(e) => { e.preventDefault(); pick(s); }}>
                <span className="ricon t-gray"><Icon name="search" /></span>
                <span className="lbl"><Mark text={s} q={query.trim()} /></span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <>
          <div style={{ height: 'var(--sp-2)' }} />
          <div className="chips">
            {largeCategories.slice(0, 8).map(cat => (
              <button key={cat} className={`chip sm${filterCat === cat ? ' on' : ''}`}
                onClick={() => { setFilterCat(cat); if (hasSearched) handleSearch(query, { cat }); }}>{cat}</button>
            ))}
          </div>
          <div className="list-h" style={{ paddingTop: 'var(--sp-3)' }}>
            <div className="seg" style={{ flex: 1, maxWidth: 300 }} role="radiogroup" aria-label="정렬">
              {SORT_OPTIONS.map(s => (
                <button key={s.value} role="radio" aria-checked={sort === s.value} className={sort === s.value ? 'on' : ''}
                  onClick={() => { setSort(s.value); if (hasSearched) handleSearch(query, { sort: s.value }); }}>{s.label}</button>
              ))}
            </div>
          </div>
          <div className="list-h" style={{ paddingTop: 0 }}>
            <span className="f-hint" style={{ margin: 0 }}>결과 {filtered.length}개</span>
            <button style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', fontSize: 'var(--fs-sub)' }}
              role="switch" aria-checked={inStockOnly}
              onClick={() => { const v = !inStockOnly; setInStockOnly(v); if (hasSearched) handleSearch(query, { stock: v }); }}>
              재고 있는 것만<span className={`switch${inStockOnly ? ' on' : ''}`} />
            </button>
          </div>

          {popular.length > 0 && (
            <section className="sec">
              <div className="sec-h">인기 검색어</div>
              <div className="group"><div className="pad"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                {popular.map((p, i) => (
                  <button key={i} className="chip sm" onClick={() => pick(p.keyword)}><b>{i + 1}</b> {p.keyword}</button>
                ))}
              </div></div></div>
            </section>
          )}

          {(hasSearched || query) && (
            searching ? (
              <div className="ui-empty"><div className="spin" /><p>검색 중…</p></div>
            ) : filtered.length === 0 ? (
              <div className="ui-empty">
                <div className="big"><Icon name="search" /></div>
                <h3>‘{lastQ || query}’ 검색 결과가 없어요</h3>
                <p>다른 검색어로 찾아보세요.</p>
              </div>
            ) : (
              <section className="sec">
                <div className="sec-h">검색 결과</div>
                <div className="group">
                  {filtered.map(raw => {
                    const p = full(raw);
                    const lock = p.isAdult && !adultOk;
                    const sale = p.salePrice != null && p.salePrice !== p.price ? p.salePrice : null;
                    return (
                      <div key={p.id} className="row" onClick={() => onProductClick?.(p)} style={{ cursor: 'pointer' }}>
                        <div className="prow">
                          <div className="pimg"><img src={p.image ? imgUrl(p.image) : getCategoryImage(p.large)} alt={p.name} loading="lazy" onError={e => { e.currentTarget.src = getCategoryImage(p.large); }} /></div>
                          <div className="info">
                            <div className="nm">{p.name}</div>
                            {p.spec && <div className="spec">{p.spec}</div>}
                            {lock ? <div className="pc"><span className="lock19"><Icon name="lock" size="sm" /> 19세 이상 본인확인 필요</span></div>
                              : <div className="price">{p.isSoldOut ? '품절' : won(sale ?? p.price)}</div>}
                          </div>
                          {!lock && !p.isSoldOut && (
                            <button className="ui-btn sm sec" aria-label="담기" onClick={(e) => { e.stopPropagation(); onAddToCart?.(p); }}>
                              <Icon name="plus" size="sm" />담기
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )
          )}
        </>
      )}
    </div>
  );
}

export default Search;
