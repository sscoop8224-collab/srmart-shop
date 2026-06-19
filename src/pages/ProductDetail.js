import { useState, useEffect } from 'react';
import { getProductReviews, createReview, toggleWishlist, getRelatedProducts, recordRecentView } from '../api';

const getCategoryImage = (large) => {
  switch(large) {
    case '식품': return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80';
    case '음료': return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&q=80';
    case '생활용품': return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&q=80';
    case '간식/과자': return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&q=80';
    case '주류': return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80';
  }
};

function ProductDetail({ product, onBack, onAddToCart, darkMode, user }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [grams, setGrams] = useState(100);
  const [purchaseType, setPurchaseType] = useState('single');
  const [wishlisted, setWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [related, setRelated] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!product) return;
    if (user) recordRecentView(product.id).catch(() => {});
    getProductReviews(product.id).then(r => { setReviews(r.data.reviews || []); setReviewStats(r.data.stats); }).catch(() => {});
    getRelatedProducts(product.id).then(r => setRelated(r.data || [])).catch(() => {});
  }, [product?.id]); // eslint-disable-line

  const handleWishlist = async () => {
    if (!user) { alert('로그인이 필요해요!'); return; }
    try { const r = await toggleWishlist(product.id); setWishlisted(r.data.wishlisted); alert(r.data.message); }
    catch { alert('오류가 발생했어요.'); }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.content.trim()) { alert('리뷰 내용을 입력해주세요!'); return; }
    setSubmittingReview(true);
    try {
      await createReview({ product_id: product.id, rating: reviewForm.rating, content: reviewForm.content });
      alert('리뷰가 등록됐어요! 😊');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, content: '' });
      const r = await getProductReviews(product.id);
      setReviews(r.data.reviews || []); setReviewStats(r.data.stats);
    } catch (err) { alert(err.response?.data?.error || '오류가 발생했어요.'); }
    finally { setSubmittingReview(false); }
  };

  const bg          = darkMode ? '#1a1a1a' : '#ffffff';
  const cardBg      = darkMode ? '#2a2a2a' : '#ffffff';
  const border      = darkMode ? '#3a3a3a' : '#dee2e6';
  const text        = darkMode ? '#f0f0f0' : '#212529';
  const sub         = darkMode ? '#a0a0a0' : '#6c757d';
  const inputBg     = darkMode ? '#2a2a2a' : '#ffffff';
  const inputBorder = darkMode ? '#3a3a3a' : '#dee2e6';
  const badgeBg     = darkMode ? '#1a4a2a' : '#e8faf3';
  const totalBg     = darkMode ? '#1a4a2a' : '#e8faf3';
  const totalBorder = darkMode ? '#2a5c3a' : '#c8f0df';

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : product.image ? [product.image] : [];

  const handleAddToCart = () => {
    if (product.pricing_type === 'weight') {
      onAddToCart({ ...product, grams, quantity: 1 });
    } else if (product.box_price_override && purchaseType === 'box') {
      onAddToCart({ ...product, purchase_type: 'box', price: product.box_price_override, quantity: 1 });
    } else {
      for (let i = 0; i < quantity; i++) onAddToCart(product);
    }
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '120px' }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', position: 'sticky', top: 0,
        background: darkMode
          ? 'linear-gradient(135deg, #0d4d2a 0%, #1a5c2a 100%)'
          : 'linear-gradient(135deg, #00c471 0%, #00a85e 100%)',
        zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, flexShrink: 0,
          background: 'rgba(255,255,255,0.15)',
          border: 'none', borderRadius: '50%', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'white' }}>상품 상세</h2>
        <button onClick={handleWishlist} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlisted ? '#ff4757' : 'none'} stroke={wishlisted ? '#ff4757' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>

      {/* 이미지 영역 */}
      <div style={{ position: 'relative', background: cardBg }}>
        {images.length > 0 ? (
          <>
            <img src={images[selectedImage]} alt={product.name}
              style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', background: cardBg }}>
                {images.map((img, index) => (
                  <img key={index} src={img} alt={'상품' + (index + 1)}
                    onClick={() => setSelectedImage(index)}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: selectedImage === index ? '2px solid #00c471' : `2px solid ${border}`, cursor: 'pointer', flexShrink: 0 }} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ position: 'relative', height: '300px', overflow: 'hidden' }}>
            <img src={getCategoryImage(product.large)} alt={product.large}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,196,113,0.05), rgba(0,168,94,0.15))' }} />
          </div>
        )}
      </div>

      {/* 상품 정보 카드 */}
      <div style={{
        background: cardBg, borderRadius: '24px 24px 0 0',
        marginTop: '-16px', position: 'relative', zIndex: 1,
        padding: '24px 20px 20px',
        boxShadow: darkMode ? 'none' : '0 -4px 20px rgba(0,0,0,0.06)'
      }}>
        {/* 카테고리 태그 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {product.large && (
            <span style={{ background: badgeBg, color: '#00a85e', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
              {product.large}
            </span>
          )}
          {product.medium && (
            <span style={{ background: darkMode ? '#333' : '#f1f3f5', color: darkMode ? '#ccc' : '#495057', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
              {product.medium}
            </span>
          )}
          {product.small && (
            <span style={{ background: darkMode ? '#333' : '#f1f3f5', color: sub, padding: '4px 12px', borderRadius: '20px', fontSize: '11px' }}>
              {product.small}
            </span>
          )}
        </div>

        {/* 상품명 */}
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: text, margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          {product.name}
        </h1>

        {/* 바코드 */}
        {product.barcode && (
          <p style={{ fontSize: '12px', color: sub, margin: '0 0 8px', fontFamily: 'monospace' }}>
            바코드: {product.barcode}
          </p>
        )}

        {/* 원산지 / 제조사 */}
        {['농산물', '축산물', '수산물'].includes(product.product_type) ? (
          product.origin_country && (
            <p style={{ fontSize: '13px', color: '#00a85e', margin: '0 0 8px', fontWeight: '700' }}>
              📍 원산지: {product.origin_country}
            </p>
          )
        ) : (
          product.manufacturer && (
            <p style={{ fontSize: '13px', color: '#00a85e', margin: '0 0 8px', fontWeight: '700' }}>
              🏭 제조사: {product.manufacturer}
            </p>
          )
        )}

        {/* 재고 */}
        {product.stock !== undefined && (
          <p style={{ fontSize: '12px', color: product.stock === 0 ? '#ff4757' : sub, margin: '0 0 12px' }}>
            {product.stock === 0
              ? '품절'
              : product.box_quantity
                ? `재고 ${product.stock}개 · 박스 ${Math.floor(product.stock / product.box_quantity)}개 가능`
                : `재고 ${product.stock}개`
            }
          </p>
        )}

        {/* 가격 */}
        {product.pricing_type === 'weight' ? (
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '13px', color: sub, margin: '0 0 2px' }}>
              100g당 ₩{(product.unit_price || product.price).toLocaleString()}
            </p>
            <p style={{ fontSize: '30px', fontWeight: '900', color: text, margin: 0, letterSpacing: '-1px' }}>
              ₩{((product.unit_price || product.price) * grams / 100).toLocaleString()}
            </p>
          </div>
        ) : (
          <p style={{ fontSize: '30px', fontWeight: '900', color: text, margin: '0 0 20px', letterSpacing: '-1px' }}>
            ₩{product.price.toLocaleString()}
          </p>
        )}

        <div style={{ height: '1px', background: border, margin: '0 0 20px' }} />

        {/* 박스 구매 옵션 */}
        {product.box_price_override && product.box_quantity && (
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: text, display: 'block', marginBottom: '10px' }}>구매 단위</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { value: 'single', label: '낱개', price: `₩${product.price.toLocaleString()}` },
                { value: 'box', label: `박스 (${product.box_quantity}개)`, price: `₩${product.box_price_override.toLocaleString()}` },
              ].map(opt => (
                <label key={opt.value} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', background: purchaseType === opt.value ? '#e8faf3' : inputBg, border: `1.5px solid ${purchaseType === opt.value ? '#00c471' : inputBorder}`, borderRadius: '14px', padding: '12px 14px', cursor: 'pointer' }}>
                  <input type="radio" name="purchaseType" value={opt.value} checked={purchaseType === opt.value} onChange={() => setPurchaseType(opt.value)} style={{ accentColor: '#00c471' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: text }}>{opt.label}</div>
                    <div style={{ fontSize: '12px', color: '#00a85e', fontWeight: '600' }}>{opt.price}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* 수량/무게 선택 */}
        {product.pricing_type === 'weight' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: text }}>무게</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: '16px', padding: '8px 16px' }}>
              <button onClick={() => setGrams(Math.max(100, grams - 100))}
                style={{ width: '32px', height: '32px', background: cardBg, border: `1.5px solid ${border}`, borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text, fontWeight: 'bold' }}>-</button>
              <span style={{ fontSize: '15px', fontWeight: '800', minWidth: '48px', textAlign: 'center', color: text }}>{grams}g</span>
              <button onClick={() => setGrams(grams + 100)}
                style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>+</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: text }}>수량</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: inputBg, border: `1.5px solid ${inputBorder}`, borderRadius: '16px', padding: '8px 16px' }}>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: '32px', height: '32px', background: cardBg, border: `1.5px solid ${border}`, borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: text, fontWeight: 'bold' }}>-</button>
              <span style={{ fontSize: '16px', fontWeight: '800', minWidth: '32px', textAlign: 'center', color: text }}>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}
                style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>+</button>
            </div>
          </div>
        )}

        {/* 총 금액 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: totalBg, borderRadius: '16px', padding: '16px 20px', marginBottom: '20px',
          border: `1px solid ${totalBorder}`
        }}>
          <span style={{ fontSize: '14px', color: '#00a85e', fontWeight: '600' }}>
            {product.pricing_type === 'weight' ? `${grams}g 합계` : '총 금액'}
          </span>
          <span style={{ fontSize: '24px', fontWeight: '900', color: '#00a85e' }}>
            {product.pricing_type === 'weight'
              ? `₩${((product.unit_price || product.price) * grams / 100).toLocaleString()}`
              : product.box_price_override && purchaseType === 'box'
                ? `₩${(product.box_price_override * quantity).toLocaleString()}`
                : `₩${(product.price * quantity).toLocaleString()}`
            }
          </span>
        </div>
      </div>

      {/* 상품 설명 */}
      {product.description && (
        <div style={{ background: cardBg, margin: '8px 0', padding: '20px', borderTop: `1px solid ${border}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: text, margin: '0 0 12px' }}>📝 상품 설명</h3>
          <div style={{ background: inputBg, borderRadius: '14px', padding: '16px', border: `1px solid ${border}` }}>
            <p style={{ fontSize: '14px', color: darkMode ? '#ccc' : '#495057', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {product.description}
            </p>
          </div>
        </div>
      )}

      {/* 영양정보 */}
      {product.nutritionImage && (
        <div style={{ background: cardBg, margin: '8px 0', padding: '20px', borderTop: `1px solid ${border}` }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: text, margin: '0 0 12px' }}>🥗 영양정보</h3>
          <img src={product.nutritionImage} alt="영양정보"
            style={{ width: '100%', borderRadius: '14px', border: `1px solid ${border}` }} />
        </div>
      )}

      {/* 하단 장바구니 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px', padding: '16px 20px 36px',
        background: cardBg, borderTop: `1px solid ${border}`,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', boxSizing: 'border-box',
      }}>
        <button onClick={handleAddToCart} style={{
          width: '100%', padding: '16px',
          background: 'linear-gradient(135deg, #00c471, #00a85e)',
          color: 'white', border: 'none', borderRadius: '16px',
          fontSize: '16px', fontWeight: '800', cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,196,113,0.35)',
          letterSpacing: '-0.3px'
        }}>
          🛒 장바구니 담기
        </button>
      </div>

      {/* 리뷰 섹션 */}
      <div style={{ margin: '12px 0', background: cardBg, borderTop: `8px solid ${darkMode ? '#111' : '#f8f9fa'}`, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <span style={{ fontSize: '17px', fontWeight: '800', color: text }}>리뷰</span>
            {reviewStats && <span style={{ fontSize: '14px', color: sub, marginLeft: 8 }}>{reviewStats.total}개</span>}
          </div>
          {user && (
            <button onClick={() => setShowReviewForm(!showReviewForm)} style={{ padding: '6px 14px', background: '#f0faf5', color: '#00a85e', border: 'none', borderRadius: 20, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              {showReviewForm ? '취소' : '리뷰 쓰기'}
            </button>
          )}
        </div>
        {reviewStats && reviewStats.total > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '12px 14px', background: darkMode ? '#1a1a1a' : '#f8f9fa', borderRadius: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: text }}>{reviewStats.avg_rating}</div>
              <div style={{ color: '#ffd700', fontSize: 14 }}>{'★'.repeat(Math.round(reviewStats.avg_rating))}{'☆'.repeat(5 - Math.round(reviewStats.avg_rating))}</div>
            </div>
          </div>
        )}
        {showReviewForm && (
          <div style={{ background: darkMode ? '#1a1a1a' : '#f8f9fa', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {[1,2,3,4,5].map(r => (
                <button key={r} onClick={() => setReviewForm(f => ({ ...f, rating: r }))} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: r <= reviewForm.rating ? '#ffd700' : '#ddd' }}>★</button>
              ))}
            </div>
            <textarea value={reviewForm.content} onChange={e => setReviewForm(f => ({ ...f, content: e.target.value }))} placeholder="리뷰를 작성해주세요 (구매 후 작성 가능)" rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${darkMode ? '#3a3a3a' : '#ddd'}`, fontSize: 14, outline: 'none', background: darkMode ? '#2a2a2a' : 'white', color: text, boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit' }} />
            <button onClick={handleSubmitReview} disabled={submittingReview} style={{ marginTop: 8, width: '100%', padding: '10px', background: '#00c471', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {submittingReview ? '등록 중...' : '리뷰 등록'}
            </button>
          </div>
        )}
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: sub, fontSize: 14 }}>첫 리뷰를 작성해주세요!</div>
        ) : reviews.map(r => (
          <div key={r.id} style={{ padding: '14px 0', borderBottom: `1px solid ${darkMode ? '#2a2a2a' : '#f0f0f0'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: text }}>{r.user_name || '익명'}</span>
                <span style={{ color: '#ffd700', fontSize: 13 }}>{'★'.repeat(r.rating)}</span>
              </div>
              <span style={{ fontSize: 11, color: sub }}>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: text, lineHeight: 1.6 }}>{r.content}</p>
            {r.reply && <div style={{ marginTop: 8, padding: '8px 12px', background: darkMode ? '#1a4a2a' : '#f0faf5', borderRadius: 8, fontSize: 12, color: '#009a58' }}>💬 판매자: {r.reply}</div>}
          </div>
        ))}
      </div>

      {/* 관련 상품 */}
      {related.length > 0 && (
        <div style={{ margin: '0', background: cardBg, borderTop: `8px solid ${darkMode ? '#111' : '#f8f9fa'}`, padding: '20px' }}>
          <div style={{ fontSize: '17px', fontWeight: '800', color: text, marginBottom: 14 }}>관련 상품</div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
            {related.map(p => (
              <div key={p.id} style={{ flexShrink: 0, width: 120, background: darkMode ? '#1a1a1a' : '#f8fffe', borderRadius: 12, overflow: 'hidden', border: `1px solid ${border}` }}>
                <img src={getCategoryImage(p.large)} alt={p.name} style={{ width: '100%', height: 80, objectFit: 'cover' }} />
                <div style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
