import { useState } from 'react';
import './App.css';
import srmLogo from './srm_logo.png';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import { kakaoPayReady } from './pages/KakaoPay';
import AdminHome from './pages/AdminHome';
import Members from './pages/Members';
import AdminOrders from './pages/AdminOrders';
import Search from './pages/Search';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Notice from './pages/Notice';

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
  const [pageHistory, setPageHistory] = useState([]);
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [notices, setNotices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([
    { name: '관리자', email: 'admin@srmart.com', password: '1234', grade: '관리자' },
  ]);
  const [messages] = useState({
    welcome: '환영해요! SR Mart 가족이 되셨어요! 🎉',
    logout: '로그아웃 되었어요. 이용해주셔서 감사합니다! 😊',
    login: '님, 환영해요! 즐거운 쇼핑 되세요 😊',
    banner: 'SR Mart에 오신 것을 환영해요!',
    bannerSub: '신선하고 다양한 상품을 만나보세요',
  });
  const [filterLarge, setFilterLarge] = useState('전체');
  const [filterMedium, setFilterMedium] = useState('전체');
  const [filterSmall, setFilterSmall] = useState('전체');
  const [sortOrder, setSortOrder] = useState('default');

  const isAdmin = user && user.email === 'admin@srmart.com';

  const toggleWishlist = (product) => {
    const exists = wishlist.find((item) => item.id === product.id);
    if (exists) {
      setWishlist(wishlist.filter((item) => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const goToPage = (newPage) => {
    setPageHistory((prev) => [...prev, page]);
    setPage(newPage);
  };

  const goBack = () => {
    if (pageHistory.length === 0) return;
    const prevPage = pageHistory[pageHistory.length - 1];
    setPageHistory((prev) => prev.slice(0, -1));
    setPage(prevPage);
  };

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    if (loggedInUser.email === 'admin@srmart.com') {
      goToPage('adminHome');
    } else {
      goToPage('home');
    }
  };

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃 하시겠어요?')) {
      localStorage.removeItem('srmart_auto_login');
      setUser(null);
      setCart([]);
      setPageHistory([]);
      setPage('login');
      alert(messages.logout);
    }
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
    alert(product.name + '이(가) 장바구니에 담겼어요! 🛒');
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter((p) => {
    if (filterLarge !== '전체' && p.large !== filterLarge) return false;
    if (filterMedium !== '전체' && p.medium !== filterMedium) return false;
    if (filterSmall !== '전체' && p.small !== filterSmall) return false;
    return true;
  }).sort((a, b) => {
    if (sortOrder === 'price_asc') return a.price - b.price;
    if (sortOrder === 'price_desc') return b.price - a.price;
    if (sortOrder === 'name') return a.name.localeCompare(b.name);
    return 0;
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
      <div className="App">
        <Login onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="App">
      {/* 헤더 */}
      <header className="header">
        <div className="header-logo" onClick={() => goToPage(isAdmin ? 'adminHome' : 'home')}>
          <img src={srmLogo} alt="SR Mart" style={{ height: '24px', objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: 'clamp(14px, 4vw, 22px)', color: '#1b5e20', fontWeight: '700', lineHeight: '1', marginTop: '2px', whiteSpace: 'nowrap' }}>에스알마트</span>
        </div>
        <div className="header-actions">
          {user && (
            <span style={{ fontSize: '12px', color: 'var(--gray-600)', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              👤 {user.name}
            </span>
          )}
          <button className="header-icon-btn" onClick={() => goToPage('search')}>🔍</button>
          <button className="header-icon-btn" onClick={() => goToPage('cart')}>
            🛒
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </button>
          <button onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
              <line x1="12" y1="2" x2="12" y2="12"/>
            </svg>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#868e96' }}>로그아웃</span>
          </button>
        </div>
      </header>

      {/* 페이지 콘텐츠 */}
      <div className="main-content">
        {page === 'home' && (
          <>
            <div className="banner">
              <h2>🛒 {messages.banner}</h2>
              <p>{messages.bannerSub}</p>
            </div>
            <div className="divider" />
            <div className="category-scroll">
              <div className="category-list">
                {['전체', ...categories.map((c) => c.name)].map((name) => (
                  <button key={name} className={'category-btn' + (filterLarge === name ? ' active' : '')} onClick={() => { setFilterLarge(name); setFilterMedium('전체'); setFilterSmall('전체'); }}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
            {selectedLargeObj && selectedLargeObj.children.length > 0 && (
              <div className="category-scroll">
                <div className="category-list">
                  {['전체', ...selectedLargeObj.children.map((m) => m.name)].map((name) => (
                    <button key={name} className={'category-btn' + (filterMedium === name ? ' active' : '')} onClick={() => { setFilterMedium(name); setFilterSmall('전체'); }} style={{ fontSize: '12px', padding: '5px 12px' }}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selectedMediumObj && selectedMediumObj.children.length > 0 && (
              <div className="category-scroll">
                <div className="category-list">
                  {['전체', ...selectedMediumObj.children].map((name) => (
                    <button key={name} className={'category-btn' + (filterSmall === name ? ' active' : '')} onClick={() => setFilterSmall(name)} style={{ fontSize: '11px', padding: '4px 10px' }}>
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#212529', margin: 0 }}>
                {filterLarge === '전체' ? '전체 상품' : filterLarge} ({filteredProducts.length}개)
              </p>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1.5px solid #dee2e6', fontSize: '13px', outline: 'none', background: 'white', cursor: 'pointer' }}>
                <option value="default">기본순</option>
                <option value="price_asc">낮은 가격순</option>
                <option value="price_desc">높은 가격순</option>
                <option value="name">이름순</option>
              </select>
            </div>
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">🛍️</span>
                <span className="empty-state-text">해당 카테고리에 상품이 없어요!</span>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card" onClick={() => { setSelectedProduct(product); goToPage('productDetail'); }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="product-card-image" />
                    ) : (
                      <div className="product-card-image-placeholder">🛍️</div>
                    )}
                    <div className="product-card-body">
                      <p className="product-card-category">{[product.large, product.medium, product.small].filter(Boolean).join(' > ')}</p>
                      <p className="product-card-name">{product.name}</p>
                      <p className="product-card-price">₩{product.price.toLocaleString()}</p>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-cart" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); addToCart(product); }}>🛒 담기</button>
                        <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }} style={{ width: '36px', height: '36px', background: wishlist.find((item) => item.id === product.id) ? '#ff4757' : '#f1f3f5', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {wishlist.find((item) => item.id === product.id) ? '❤️' : '🤍'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {page === 'notice' && <Notice notices={notices} setNotices={setNotices} isAdmin={isAdmin} goBack={goBack} />}
        {page === 'wishlist' && <Wishlist wishlist={wishlist} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} />}
        {page === 'search' && <Search products={products} categories={categories} goBack={goBack} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} onAddToCart={addToCart} />}
        {page === 'productDetail' && <ProductDetail product={selectedProduct} onBack={goBack} onAddToCart={addToCart} />}
        {page === 'cart' && <Cart cart={cart} setCart={setCart} onPayment={handlePayment} onHome={() => goToPage('home')} goBack={goBack} />}
        {page === 'orders' && <Orders orders={orders} goBack={goBack} />}
        {page === 'adminHome' && <AdminHome setPage={goToPage} products={products} orders={orders} users={users} goBack={goBack} />}
        {page === 'members' && <Members users={users} setUsers={setUsers} setPage={goToPage} goBack={goBack} />}
        {page === 'adminOrders' && <AdminOrders orders={orders} goBack={goBack} />}
        {page === 'admin' && <Admin products={products} setProducts={setProducts} categories={categories} setCategories={setCategories} messages={messages} setMessages={() => {}} goBack={goBack} />}
      </div>

      {/* 고객 하단 탭 */}
      {!isAdmin && (
        <nav className="bottom-nav">
          <button className={'bottom-nav-item' + (page === 'home' ? ' active' : '')} onClick={() => goToPage('home')}>
            <span>🏠</span>
            <span>홈</span>
          </button>
          <button className={'bottom-nav-item' + (page === 'notice' ? ' active' : '')} onClick={() => goToPage('notice')}>
            <span>📢</span>
            <span>공지</span>
          </button>
          <button className={'bottom-nav-item' + (page === 'cart' ? ' active' : '')} onClick={() => goToPage('cart')}>
            <span>🛒</span>
            <span>장바구니</span>
            {cart.length > 0 && <span className="badge">{cart.length}</span>}
          </button>
          <button className={'bottom-nav-item' + (page === 'wishlist' ? ' active' : '')} onClick={() => goToPage('wishlist')}>
            <span>❤️</span>
            <span>찜</span>
            {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </button>
          <button className={'bottom-nav-item'} onClick={handleLogout}>
            <span>👤</span>
            <span>마이</span>
          </button>
        </nav>
      )}

      {/* 관리자 하단 탭 */}
      {isAdmin && (
        <nav className="bottom-nav">
          <button className={'bottom-nav-item' + (page === 'adminHome' ? ' active' : '')} onClick={() => goToPage('adminHome')}>
            <span>🏠</span>
            <span>대시보드</span>
          </button>
          <button className={'bottom-nav-item' + (page === 'notice' ? ' active' : '')} onClick={() => goToPage('notice')}>
            <span>📢</span>
            <span>공지</span>
          </button>
          <button className={'bottom-nav-item' + (page === 'admin' ? ' active' : '')} onClick={() => goToPage('admin')}>
            <span>📦</span>
            <span>상품관리</span>
          </button>
          <button className={'bottom-nav-item' + (page === 'members' ? ' active' : '')} onClick={() => goToPage('members')}>
            <span>👥</span>
            <span>회원관리</span>
          </button>
          <button className={'bottom-nav-item'} onClick={handleLogout}>
            <span>🚪</span>
            <span>로그아웃</span>
          </button>
        </nav>
      )}

      <footer style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: 'var(--gray-400)', borderTop: '1px solid var(--gray-200)' }}>
        © 2026 Dongsin Market. All rights reserved.
      </footer>
    </div>
  );
}

export default App;