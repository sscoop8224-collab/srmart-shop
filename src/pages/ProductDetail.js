import { useState } from 'react';

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

function ProductDetail({ product, onBack, onAddToCart }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product);
    }
  };

  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', position: 'sticky', top: 0,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)',
        zIndex: 10, borderBottom: '1px solid #f0faf5'
      }}>
        <button onClick={onBack} style={{
          width: '38px', height: '38px', background: '#f0faf5',
          border: 'none', borderRadius: '50%', cursor: 'pointer',
          fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#00a85e'
        }}>←</button>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#1a1a1a' }}>상품 상세</h2>
        <div style={{ width: '38px' }} />
      </div>

      {/* 이미지 영역 */}
      <div style={{ position: 'relative', background: 'white' }}>
        {images.length > 0 ? (
          <>
            <img src={images[selectedImage]} alt={product.name}
              style={{ width: '100%', height: '300px', objectFit: 'cover' }} />
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto', background: 'white' }}>
                {images.map((img, index) => (
                  <img key={index} src={img} alt={'상품' + (index + 1)}
                    onClick={() => setSelectedImage(index)}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: selectedImage === index ? '2px solid #00c471' : '2px solid #e9ecef', cursor: 'pointer', flexShrink: 0 }} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ position: 'relative', height: '300px', overflow: 'hidden' }}>
            <img
              src={getCategoryImage(product.large)}
              alt={product.large}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,196,113,0.05), rgba(0,168,94,0.15))' }} />
          </div>
        )}
      </div>

      {/* 상품 정보 카드 */}
      <div style={{
        background: 'white', borderRadius: '24px 24px 0 0',
        marginTop: '-16px', position: 'relative', zIndex: 1,
        padding: '24px 20px 20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
      }}>
        {/* 카테고리 태그 */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {product.large && (
            <span style={{ background: '#e8faf3', color: '#00a85e', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
              {product.large}
            </span>
          )}
          {product.medium && (
            <span style={{ background: '#f1f3f5', color: '#495057', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
              {product.medium}
            </span>
          )}
          {product.small && (
            <span style={{ background: '#f1f3f5', color: '#868e96', padding: '4px 12px', borderRadius: '20px', fontSize: '11px' }}>
              {product.small}
            </span>
          )}
        </div>

        {/* 상품명 */}
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          {product.name}
        </h1>

        {/* 바코드 */}
        {product.barcode && (
          <p style={{ fontSize: '12px', color: '#adb5bd', margin: '0 0 12px', fontFamily: 'monospace' }}>
            바코드: {product.barcode}
          </p>
        )}

        {/* 가격 */}
        <p style={{ fontSize: '30px', fontWeight: '900', color: '#1a1a1a', margin: '0 0 20px', letterSpacing: '-1px' }}>
          ₩{product.price.toLocaleString()}
        </p>

        <div style={{ height: '1px', background: '#f0faf5', margin: '0 0 20px' }} />

        {/* 수량 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a' }}>수량</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fffe', border: '1.5px solid #e8faf3', borderRadius: '16px', padding: '8px 16px' }}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{ width: '32px', height: '32px', background: 'white', border: '1.5px solid #e9ecef', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057', fontWeight: 'bold' }}>-</button>
            <span style={{ fontSize: '16px', fontWeight: '800', minWidth: '32px', textAlign: 'center' }}>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}
              style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>+</button>
          </div>
        </div>

        {/* 총 금액 */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'linear-gradient(135deg, #f0faf5, #e8faf3)',
          borderRadius: '16px', padding: '16px 20px', marginBottom: '20px',
          border: '1px solid #d4f5e9'
        }}>
          <span style={{ fontSize: '14px', color: '#00a85e', fontWeight: '600' }}>총 금액</span>
          <span style={{ fontSize: '24px', fontWeight: '900', color: '#00a85e' }}>
            ₩{(product.price * quantity).toLocaleString()}
          </span>
        </div>
      </div>

      {/* 상품 설명 */}
      {product.description && (
        <div style={{ background: 'white', margin: '8px 0', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 12px' }}>📝 상품 설명</h3>
          <div style={{ background: '#f8fffe', borderRadius: '14px', padding: '16px', border: '1px solid #f0faf5' }}>
            <p style={{ fontSize: '14px', color: '#495057', margin: 0, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
              {product.description}
            </p>
          </div>
        </div>
      )}

      {/* 영양정보 */}
      {product.nutritionImage && (
        <div style={{ background: 'white', margin: '8px 0', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 12px' }}>🥗 영양정보</h3>
          <img src={product.nutritionImage} alt="영양정보"
            style={{ width: '100%', borderRadius: '14px', border: '1px solid #e9ecef' }} />
        </div>
      )}

      {/* 하단 장바구니 버튼 */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px', padding: '16px 20px 36px',
        background: 'white', borderTop: '1px solid #f0faf5',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
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
    </div>
  );
}

export default ProductDetail;