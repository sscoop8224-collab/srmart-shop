import { useState } from 'react';
import './App.css';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import { kakaoPayReady } from './pages/KakaoPay';

const initialProducts = [
  { id: 1, name: '신선 사과', price: 5000, large: '식품', medium: '신선식품', small: '과일', image: null },
  { id: 2, name: '제주 감귤', price: 8000, large: '식품', medium: '신선식품', small: '과일', image: null },
  { id: 3, name: '세탁 세제', price: 12000, large: '생활용품', medium: '세탁/청소', small: '세제', image: null },
  { id: 4, name: '콜라 1.5L', price: 3000, large: '음료', medium: '탄산음료', small: '', image: null },
  { id: 5, name: '냉동 만두', price: 7000, large: '식품', medium: '가공식품', small: '냉동식품', image: null },
  { id: 6, name: '포카칩', price: 2500, large: '간식/과자', medium: '과자/스낵', small: '', image: null },
];

const initialCategories = [
  { name: '식품', children: [
    { name: '신선식품', children: ['채소', '과일', '육류', '수산물'] },
    { name: '가공식품', children: ['통조림', '냉동식품', '즉석식품'] },
    { name: '유제품', children: ['우유', '치즈', '요거트'] },
  ]},
  { name: '음료', children: [
    { name: '탄산음료', children: ['콜라', '사이다', '탄산수'] },
    { name: '주스/과채음료', children: ['오렌지주스', '포도주스'] },
    { name: '생수/차', children: ['생수', '녹차', '홍차'] },
  ]},
  { name: '생활용품', children: [
    { name: '세탁/청소', children: ['세제', '섬유유연제', '청소도구'] },
    { name: '욕실용품', children: ['샴푸', '치약', '비누'] },
    { name: '주방용품', children: ['랩', '지퍼백', '일회용품'] },
  ]},
  { name: '간식/과자', children: [
    { name: '과자/스낵', children: ['감자칩', '팝콘', '쿠키'] },
    { name: '사탕/초콜릿', children: ['사탕', '초콜릿', '젤리'] },
    { name: '빵/케이크', children: ['식빵', '케이크', '머핀'] },
  ]},
  { name: '주류', children: [
    { name: '맥주', children: ['국산맥주', '수입맥주'] },
    { name: '소주/막걸리', children: ['소주', '막걸리'] },
    { name: '와인', children: ['레드와인', '화이트와인'] },
  ]},
];

function App() {
  const [page, setPage] = useState('login');
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filterLarge, setFilterLarge] = useState('전체');
  const [filterMedium, setFilterMedium] = useState('전체');
  const [filterSmall, setFilterSmall] = useState('전체');

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setPage('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setPage('login');
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    alert(product.name + '이(가) 장바구니에 담겼어요!');
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter((p) => {
    if (filterLarge !== '전체' && p.large !== filterLarge) return false;
    if (filterMedium !== '전체' && p.medium !== filterMedium) return false;
    if (filterSmall !== '전체' && p.small !== filterSmall) return false;
    return true;
  });

  const selectedLargeObj = categories.find((c) => c.name === filterLarge);
  const selectedMediumObj = selectedLargeObj && selectedLargeObj.children.find((m) => m.name === filterMedium);

  const handlePayment = async () => {
    if (cart.length === 0) {
      alert('장바구니가 비어있어요!');
      return;
    }
    try {
      const orderInfo = {
        orderId: 'order_' + Date.now(),
        userId: user.email,
        itemName: cart.length === 1 ? cart[0].name : cart[0].name + ' 외 ' + (cart.length - 1) + '건',
        quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: totalPrice,
      };
      const result = await kakaoPayReady(orderInfo);
      if (result.next_redirect_pc_url) {
        const newOrder = {
          id: orderInfo.orderId,
          date: new Date().toLocaleString('ko-KR'),
          items: [...cart],
          totalPrice,
        };
        setOrders([newOrder, ...orders]);
        setCart([]);
        window.open(result.next_redirect_pc_url, '_blank');
      }
    } catch (error) {
      alert('결제 준비 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  if (page === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fbe7' }}>
        <header style={{ background: '#2e7d32', padding: '16px 32px' }}>
          <h1 style={{ color: 'white', margin: 0, fontSize: '26px' }}>🛒 SR Mart</h1>
        </header>
        <Login onLogin={handleLogin} />
        <footer style={{ background: '#1b5e20', color: 'white', padding: '24px', textAlign: 'center', marginTop: '40px' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>© 2026 SR Mart. All rights reserved.</p>
        </footer>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fbe7' }}>
      <header style={{ background: '#2e7d32', padding: '0 32px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '24px', cursor: 'pointer' }} onClick={() => setPage('home')}>🛒 SR Mart</h1>
        <nav style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[{ label: '홈', key: 'home' }, { label: '주문내역', key: 'orders' }].map((item) => (
            <button key={item.key} onClick={() => setPage(item.key)} style={{ background: page === item.key ? 'rgba(255,255,255,0.25)' : 'transparent', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: page === item.key ? 'bold' : 'normal' }}>
              {item.label}
            </button>
          ))}
          <button onClick={() => setPage('cart')} style={{ background: page === 'cart' ? 'rgba(255,255,255,0.25)' : 'transparent', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', position: 'relative' }}>
            🛒 장바구니
            {cart.length > 0 && (
              <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ff6f00', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {cart.length}
              </span>
            )}
          </button>
          {user && user.email === 'admin@srmart.com' && (
            <button onClick={() => setPage('admin')} style={{ background: page === 'admin' ? 'rgba(255,255,255,0.25)' : 'transparent', color: '#ffd54f', border: '1px solid #ffd54f', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
              ⚙️ 관리자
            </button>
          )}
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '12px', marginLeft: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'white', fontSize: '13px' }}>👤 {user && user.name}님</span>
            <button onClick={handleLogout} style={{ background: 'transparent', color: '#ffcdd2', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontSize: '13px' }}>
              로그아웃
            </button>
          </div>
        </nav>
      </header>

      {page === 'home' && (
        <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ background: 'linear-gradient(135deg, #2e7d32, #4caf50)', borderRadius: '16px', padding: '40px 48px', marginBottom: '32px', color: 'white' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '28px' }}>🛒 SR Mart에 오신 것을 환영해요!</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>신선하고 다양한 상품을 만나보세요</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            {/* 대분류 */}
            <div style={{ overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', minWidth: 'max-content' }}>
                {['전체', ...categories.map((c) => c.name)].map((name) => (
                  <button key={name} onClick={() => { setFilterLarge(name); setFilterMedium('전체'); setFilterSmall('전체'); }} style={{ padding: '8px 18px', background: filterLarge === name ? '#2e7d32' : 'white', color: filterLarge === name ? 'white' : '#2e7d32', border: '1px solid #c8e6c9', borderRadius: '20px', cursor: 'pointer', fontWeight: filterLarge === name ? 'bold' : 'normal', fontSize: '14px', whiteSpace: 'nowrap' }}>
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 중분류 */}
            {selectedLargeObj && selectedLargeObj.children.length > 0 && (
              <div style={{ overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px', paddingLeft: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', minWidth: 'max-content' }}>
                  {['전체', ...selectedLargeObj.children.map((m) => m.name)].map((name) => (
                    <button key={name} onClick={() => { setFilterMedium(name); setFilterSmall('전체'); }} style={{ padding: '6px 14px', background: filterMedium === name ? '#388e3c' : '#f1f8e9', color: filterMedium === name ? 'white' : '#388e3c', border: '1px solid #c8e6c9', borderRadius: '20px', cursor: 'pointer', fontWeight: filterMedium === name ? 'bold' : 'normal', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 소분류 */}
            {selectedMediumObj && selectedMediumObj.children.length > 0 && (
              <div style={{ overflowX: 'auto', paddingBottom: '8px', paddingLeft: '32px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', minWidth: 'max-content' }}>
                  {['전체', ...selectedMediumObj.children].map((name) => (
                    <button key={name} onClick={() => setFilterSmall(name)} style={{ padding: '5px 12px', background: filterSmall === name ? '#4caf50' : '#f9fbe7', color: filterSmall === name ? 'white' : '#4caf50', border: '1px solid #c8e6c9', borderRadius: '20px', cursor: 'pointer', fontWeight: filterSmall === name ? 'bold' : 'normal', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <h2 style={{ marginBottom: '20px', color: '#1b5e20', fontSize: '20px' }}>
            {filterLarge === '전체' ? '전체 상품' : filterLarge} ({filteredProducts.length}개)
          </h2>

          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#888', background: 'white', borderRadius: '16px', border: '1px solid #e0e0e0' }}>
              <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🛍️</p>
              <p>해당 카테고리에 상품이 없어요!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {filteredProducts.map((product) => (
                <div key={product.id} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '180px', objectFit: 'contain', background: '#f5f5f5' }} />
                  ) : (
                    <div style={{ background: '#f1f8e9', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px' }}>🛍️</div>
                  )}
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {product.large && <span style={{ fontSize: '11px', background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '20px', fontWeight: 'bold' }}>{product.large}</span>}
                      {product.medium && <span style={{ fontSize: '11px', background: '#f1f8e9', color: '#388e3c', padding: '3px 8px', borderRadius: '20px' }}>{product.medium}</span>}
                      {product.small && <span style={{ fontSize: '11px', background: '#f9fbe7', color: '#4caf50', padding: '3px 8px', borderRadius: '20px' }}>{product.small}</span>}
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#1a1a1a' }}>{product.name}</h3>
                    <p style={{ color: '#2e7d32', fontWeight: 'bold', margin: '0 0 14px', fontSize: '18px' }}>₩{product.price.toLocaleString()}</p>
                    <button onClick={() => addToCart(product)} style={{ background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 16px', cursor: 'pointer', width: '100%', fontSize: '14px', fontWeight: 'bold' }}>
                      🛒 장바구니 담기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {page === 'cart' && (
        <Cart cart={cart} setCart={setCart} onPayment={handlePayment} onHome={() => setPage('home')} />
      )}

      {page === 'orders' && <Orders orders={orders} />}

      {page === 'admin' && (
        <Admin products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} />
      )}

      <footer style={{ background: '#1b5e20', color: 'white', padding: '32px', textAlign: 'center', marginTop: '60px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 'bold' }}>🛒 SR Mart</p>
        <p style={{ margin: 0, fontSize: '13px', opacity: 0.7 }}>© 2026 SR Mart. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;