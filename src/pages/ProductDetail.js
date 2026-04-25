import { useState } from 'react';

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
    alert(product.name + ' ' + quantity + '개를 장바구니에 담았어요! 🛒');
  };

  return (
    <div style={{ paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: '0', background: 'white', zIndex: 10 }}>
        <button onClick={onBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#212529' }}>상품 상세</h2>
      </div>

      {/* 이미지 */}
      <div style={{ background: '#f8f9fa' }}>
        {images.length > 0 ? (
          <>
            <img
              src={images[selectedImage]}
              alt={product.name}
              style={{ width: '100%', height: '300px', objectFit: 'contain', background: '#f8f9fa' }}
            />
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', overflowX: 'auto' }}>
                {images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={'상품' + (index + 1)}
                    onClick={() => setSelectedImage(index)}
                    style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: selectedImage === index ? '2px solid #00c471' : '2px solid #e9ecef', cursor: 'pointer', background: 'white', flexShrink: 0 }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ width: '100%', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '72px', background: '#f8f9fa' }}>
            🛍️
          </div>
        )}
      </div>

      {/* 상품 정보 */}
      <div style={{ padding: '20px 16px' }}>

        {/* 카테고리 */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {product.large && <span style={{ background: '#e8faf3', color: '#00a85e', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{product.large}</span>}
          {product.medium && <span style={{ background: '#f1f3f5', color: '#495057', padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}>{product.medium}</span>}
          {product.small && <span style={{ background: '#f1f3f5', color: '#868e96', padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}>{product.small}</span>}
        </div>

        {/* 상품명 */}
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#212529', margin: '0 0 8px', letterSpacing: '-0.5px' }}>{product.name}</h1>

        {/* 바코드 */}
        {product.barcode && (
          <p style={{ fontSize: '12px', color: '#adb5bd', margin: '0 0 16px', fontFamily: 'monospace' }}>바코드: {product.barcode}</p>
        )}

        {/* 가격 */}
        <p style={{ fontSize: '28px', fontWeight: '900', color: '#212529', margin: '0 0 24px', letterSpacing: '-1px' }}>
          ₩{product.price.toLocaleString()}
        </p>

        <div style={{ height: '1px', background: '#f1f3f5', margin: '0 0 24px' }} />

        {/* 수량 선택 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#212529' }}>수량</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8f9fa', borderRadius: '10px', padding: '6px 12px' }}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              style={{ width: '32px', height: '32px', background: 'white', border: '1px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057' }}
            >-</button>
            <span style={{ fontSize: '16px', fontWeight: '800', minWidth: '32px', textAlign: 'center' }}>{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              style={{ width: '32px', height: '32px', background: 'white', border: '1px solid #dee2e6', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#495057' }}
            >+</button>
          </div>
        </div>

        {/* 총 금액 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <span style={{ fontSize: '14px', color: '#868e96', fontWeight: '600' }}>총 금액</span>
          <span style={{ fontSize: '20px', fontWeight: '900', color: '#00c471' }}>₩{(product.price * quantity).toLocaleString()}</span>
        </div>

        {/* 장바구니 버튼 */}
        <button
          onClick={handleAddToCart}
          style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', letterSpacing: '-0.3px' }}
        >
          🛒 장바구니 담기
        </button>
      </div>
    </div>
  );
}

export default ProductDetail;