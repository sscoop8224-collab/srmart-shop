import { login as apiLogin, getActiveProducts, getMyOrders, createOrder, getCoupons } from './api';
import API from './api';
import Chatbot from './components/Chatbot';
import { useState, useEffect, useCallback } from 'react';
import './App.css';
import srmLogo from './srm_logo.png';
import { ThemeProvider, useTheme } from './ThemeContext';

import HomePage from './pages/HomePage';
import Login from './pages/Login';
import Orders from './pages/Orders';
import Cart from './pages/Cart';
import { kakaoPayReady } from './pages/KakaoPay';
import Search from './pages/Search';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Notice from './pages/Notice';
import Receipt from './pages/Receipt';
import MyPage from './pages/MyPage';
import { useAuth } from './AuthContext';

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

const initialProducts = [
  { id: 1, name: '신선 사과', price: 5000, large: '식품', medium: '신선식품', small: '과일', image: null, stock: 50, barcode: '', images: [], status: '판매중' },
  { id: 2, name: '제주 감귤', price: 8000, large: '식품', medium: '신선식품', small: '과일', image: null, stock: 30, barcode: '', images: [], status: '판매중' },
  { id: 3, name: '세탁 세제', price: 12000, large: '생활용품', medium: '세탁/청소', small: '세제', image: null, stock: 20, barcode: '', images: [], status: '판매중' },
  { id: 4, name: '콜라 1.5L', price: 3000, large: '음료', medium: '탄산음료', small: '', image: null, stock: 100, barcode: '', images: [], status: '판매중' },
  { id: 5, name: '냉동 만두', price: 7000, large: '식품', medium: '가공식품', small: '냉동식품', image: null, stock: 15, barcode: '', images: [], status: '판매중' },
  { id: 6, name: '포카칩', price: 2500, large: '간식/과자', medium: '과자/스낵', small: '', image: null, stock: 0, barcode: '', images: [], status: '판매중지' },
  { id: 7, name: '소주 360ml', price: 1800, large: '주류', medium: '소주/막걸리', small: '소주', image: null, stock: 100, barcode: '', images: [], status: '판매중', isAdult: true, spec: '360', unit: 'ml' },
  { id: 8, name: '맥주 500ml', price: 2500, large: '주류', medium: '맥주', small: '국산맥주', image: null, stock: 80, barcode: '', images: [], status: '판매중', isAdult: true, spec: '500', unit: 'ml' },
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

function AppContent() {
  const { darkMode, setDarkMode } = useTheme();
  const handleSetDark = (val) => setDarkMode(val);

  const [page, setPage] = useState('homepage');
  const [pageHistory, setPageHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categories, setCategories] = useState(initialCategories);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [notices, setNotices] = useState([]);
  const [orders, setOrders] = useState([]);

  const { login: authLogin, logout: authLogout } = useAuth();

  // ✅ 관리자 판별 - role, grade 모두 체크
  const isAdmin = user && (
    user.email === 'admin@srmart.com' ||
    user.role === 'owner' ||
    user.role === 'admin' ||
    user.role === 'manager' ||
    user.grade === '관리자'
  );

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('srmart_users');
    return saved ? JSON.parse(saved) : [
      { name: '관리자', email: 'admin@srmart.com', password: '1234', grade: '관리자' },
      { name: '이민우', email: 'sscoop@naver.com', password: '1234', grade: '일반' },
    ];
  });
  const [messages] = useState({
    welcome: '환영해요! SR Mart 가족이 되셨어요! 🎉',
    logout: '로그아웃 되었어요. 이용해주셔서 감사합니다! 😊',
    login: '님, 환영해요! 즐거운 쇼핑 되세요 😊',
    banner: 'SR Mart에 오신 것을 환영해요!',
    bannerSub: '신선하고 다양한 상품을 만나보세요',
  });
  const [filterLarge, setFilterLarge] = useState('행사중');
  const [eventProducts, setEventProducts] = useState([]);
  const [filterMedium, setFilterMedium] = useState('전체');
  const [filterSmall, setFilterSmall] = useState('전체');
  const [sortOrder, setSortOrder] = useState('default');
  const [toast, setToast] = useState('');
  const [bannerIndex, setBannerIndex] = useState(0);
  const [bannerTransition, setBannerTransition] = useState(true);
  const [lastOrder, setLastOrder] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [events, setEvents] = useState([]);
  const [banners, setBanners] = useState([
    { id: 1, label: '특별 할인', title: 'SR Mart에 오신 것을 환영해요!', sub: '신선하고 다양한 상품을 만나보세요', emoji: '🛒', bg: 'linear-gradient(135deg, #00c471, #00a85e)', filter: null },
    { id: 2, label: '신선식품', title: '신선한 채소와 과일!', sub: '오늘의 특가 상품을 확인해보세요', emoji: '🥦', bg: 'linear-gradient(135deg, #ff6b6b, #ee5a24)', filter: '식품' },
    { id: 3, label: '음료 코너', title: '시원한 음료 모음!', sub: '다양한 음료를 만나보세요', emoji: '🧃', bg: 'linear-gradient(135deg, #a29bfe, #6c5ce7)', filter: '음료' },
    { id: 4, label: '간식/과자', title: '맛있는 간식 특가!', sub: '달콤한 간식을 지금 담아보세요', emoji: '🍿', bg: 'linear-gradient(135deg, #fdcb6e, #e17055)', filter: '간식/과자' },
  ]);

  useEffect(() => { localStorage.setItem('srmart_users', JSON.stringify(users)); }, [users]);

  const currentUser = user || null;

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerTransition(true);
      setBannerIndex((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    if (bannerIndex === banners.length) {
      setTimeout(() => { setBannerTransition(false); setBannerIndex(0); }, 600);
    }
  }, [bannerIndex, banners.length]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  }, []);

  const toggleWishlist = (product) => {
    const exists = wishlist.find((item) => item.id === product.id);
    if (exists) setWishlist(wishlist.filter((item) => item.id !== product.id));
    else setWishlist([...wishlist, product]);
  };

  const goToPage = (newPage) => {
    setPageHistory((prev) => [...prev, page]);
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (pageHistory.length === 0) return;
    const prevPage = pageHistory[pageHistory.length - 1];
    setPageHistory((prev) => prev.slice(0, -1));
    setPage(prevPage);
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await getActiveProducts();
      setProducts(res.data.map(p => ({
        ...p,
        isAdult: !!p.is_adult,
        isSoldOut: !p.is_available || p.stock <= 0,
        images: [],
      })));
    } catch (err) {
      console.error('상품 로드 실패:', err);
      setProducts(initialProducts);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadMyOrders = async () => {
    try {
      const res = await getMyOrders();
      setOrders(res.data.map(o => ({
        ...o,
        date: new Date(o.created_at).toLocaleString('ko-KR'),
        totalPrice: o.total_price,
        items: [],
      })));
    } catch (err) {
      console.error('주문 내역 로드 실패:', err);
    }
  };

  const loadCoupons = async () => {
    try {
      const res = await getCoupons();
      setCoupons(res.data.map(c => ({
        ...c,
        isActive: !!c.is_active,
      })));
    } catch (err) {
      console.error('쿠폰 로드 실패:', err);
    }
  };

  // ✅ 로그인 - username 또는 email로 백엔드 연동
  const handleLogin = async (loggedInUser) => {
    const identifier = loggedInUser.username || loggedInUser.email;
    const res = await apiLogin(identifier, loggedInUser.password);
    const { token, user: dbUser } = res.data;
    console.log('[handleLogin] 백엔드 user:', dbUser);
    localStorage.setItem('srmart_token', token);
    setUser(dbUser);
    authLogin(dbUser);
    await Promise.all([loadProducts(), loadMyOrders(), loadCoupons()]);
    goToPage('home');
  };

  const handleGuest = async () => {
    await loadProducts();
    await loadCoupons();
    setPage('home');
  };

  const handleLogout = () => {
    if (window.confirm('정말 로그아웃 하시겠어요?')) {
      localStorage.removeItem('srmart_auto_login');
      localStorage.removeItem('srmart_token');
      authLogout();
      setUser(null); setCart([]); setOrders([]); setProducts([]); setPageHistory([]); setPage('login');
      alert(messages.logout);
    }
  };

  const requireLogin = () => { alert('로그인이 필요해요! 😊'); setPage('login'); };

  const addToCart = (product) => {
    if (!user) { requireLogin(); return; }
    if (product.isSoldOut) { showToast('품절된 상품이에요! 😢'); return; }
    if (product.stock !== '' && Number(product.stock) <= 0) { showToast('재고가 없어요! 😢'); return; }
    if (product.isAdult) {
      const latestUser = users.find(u => u.email === user.email) || user;
      if (!latestUser.isAdult) { showToast('🔞 성인 상품은 19세 이상만 구매할 수 있어요!'); return; }
    }
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (product.stock !== '' && existing.quantity >= Number(product.stock)) { showToast('재고 수량을 초과했어요! 😢'); return; }
      setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast(product.name + '이(가) 장바구니에 담겼어요! 🛒');
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (filterLarge === '행사중') {
      API.get('/events/active').then(res => {
        const eventsData = res.data;
        const productEventMap = {};
        eventsData.forEach(e => {
          const prods = typeof e.products === 'string' ? JSON.parse(e.products) : (e.products || []);
          prods.forEach(p => {
            productEventMap[p.id] = {
              eventType: e.event_type,
              discountValue: e.discount_value,
              bundleQty: e.bundle_qty,
              bundlePrice: e.bundle_price,
              eventName: e.name,
            };
          });
        });
        const filtered = products
          .filter(p => productEventMap[p.id])
          .map(p => {
            const ev = productEventMap[p.id];
            let salePrice = p.price;
            if (ev.eventType === '정액할인') salePrice = Math.max(0, p.price - Number(ev.discountValue));
            else if (ev.eventType === '퍼센트할인') salePrice = Math.floor(p.price * (1 - Number(ev.discountValue) / 100));
            else if (ev.eventType === '단품행사') salePrice = Number(ev.discountValue);
            else if (ev.eventType === '묶음가') salePrice = Number(ev.bundlePrice);
            return { ...p, salePrice, eventLabel: ev.eventName, eventType: ev.eventType };
          });
        setEventProducts(filtered);
      }).catch(() => {
        console.log('행사 상품 불러오기 실패');
      });
    }
  }, [filterLarge, products]);

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

  const handlePayment = async (finalPrice) => {
    if (cart.length === 0) { alert('장바구니가 비어있어요!'); return; }
    const latestUser = users.find(u => u.email === user.email) || user;
    if (cart.some(item => item.isAdult) && !latestUser.isAdult) {
      alert('🔞 장바구니에 성인 상품이 있어요. 19세 이상만 구매할 수 있어요!'); return;
    }
    try {
      const orderInfo = {
        orderId: 'order_' + Date.now(), userId: user.email,
        itemName: cart.length === 1 ? cart[0].name : cart[0].name + ' 외 ' + (cart.length - 1) + '건',
        quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: finalPrice || totalPrice,
      };
      const result = await kakaoPayReady(orderInfo);
      if (result.next_redirect_pc_url) {
        const newOrder = { id: orderInfo.orderId, date: new Date().toLocaleString('ko-KR'), items: [...cart], totalPrice: finalPrice || totalPrice, userId: user.email, status: '결제완료' };
        createOrder({
          id: orderInfo.orderId,
          totalPrice: finalPrice || totalPrice,
          status: '결제완료',
          address: user.address || '',
          addressDetail: user.address_detail || '',
          receiverName: user.name,
          receiverPhone: user.phone || '',
          items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        }).catch(err => console.error('주문 저장 실패:', err));
        setOrders([newOrder, ...orders]); setLastOrder(newOrder); setCart([]);
        window.open(result.next_redirect_pc_url, '_blank');
        goToPage('receipt');
      }
    } catch (error) {
      alert('결제 준비 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  if (page === 'homepage') {
    return (
      <div style={{ width: '100%', minHeight: '100vh' }}>
        <HomePage
          onShop={() => setPage('login')}
          onLogin={() => setPage('login')}
          darkMode={darkMode}
        />
      </div>
    );
  }

  if (page === 'login') {
    return <div className="App"><Login onLogin={handleLogin} onGuest={handleGuest} /></div>;
  }

  return (
    <div className="App">
      {/* 헤더 */}
      <header className="header">
        <div className="header-logo" onClick={() => goToPage('home')}>
          <img src={srmLogo} alt="SR Mart" style={{ height: '34px', objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: 'clamp(16px, 5vw, 26px)', color: '#1b5e20', fontWeight: '700', lineHeight: '1', marginTop: '2px', whiteSpace: 'nowrap' }}>에스알마트</span>
        </div>
        <div className="header-actions">
          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '4px 8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <span title={currentUser?.username ? `@${currentUser.username}` : undefined} style={{ fontSize: '10px', fontWeight: '600', color: '#adb5bd', maxWidth: '44px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser?.name}</span>
            </div>
          )}
          <button className="header-icon-btn" onClick={() => user ? goToPage('notice') : requireLogin()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#adb5bd' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span style={{ fontSize: '10px', fontWeight: '600' }}>공지</span>
          </button>
          {user ? (
            <button onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#adb5bd' }}>로그아웃</span>
            </button>
          ) : (
            <button onClick={() => setPage('login')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span style={{ fontSize: '10px', fontWeight: '600', color: '#00c471' }}>로그인</span>
            </button>
          )}
        </div>
      </header>

      <div className="main-content">
        {page === 'home' && (
          <>
            <div style={{ padding: '16px' }}>
              <div style={{ position: 'relative', borderRadius: '18px', overflow: 'hidden' }}>
                <div
                  onTouchStart={(e) => { window._touchStartX = e.touches[0].clientX; }}
                  onTouchEnd={(e) => {
                    const diff = window._touchStartX - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 40) {
                      if (diff > 0) {
                        setBannerTransition(true);
                        setBannerIndex((prev) => (prev + 1 >= banners.length ? 0 : prev + 1));
                      } else {
                        setBannerTransition(true);
                        setBannerIndex((prev) => (prev - 1 < 0 ? banners.length - 1 : prev - 1));
                      }
                    }
                  }}
                  style={{ display: 'flex', transition: bannerTransition ? 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none', WebkitTransform: `translateX(-${bannerIndex * 100}%)`, transform: `translateX(-${bannerIndex * 100}%)`, willChange: 'transform' }}>
                  {[...banners, banners[0]].map((slide, index) => (
                    <div key={index} onClick={() => { if (slide.filter) { setFilterLarge(slide.filter); setFilterMedium('전체'); setFilterSmall('전체'); } }}
                      style={{ minWidth: '100%', background: slide.bg, borderRadius: '18px', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', position: 'relative', cursor: slide.filter ? 'pointer' : 'default', boxSizing: 'border-box' }}>
                      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: '0 0 4px', fontWeight: '600' }}>{slide.label}</p>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: '0 0 6px', letterSpacing: '-0.5px' }}>{slide.title}</h2>
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', margin: '0 0 12px' }}>{slide.sub}</p>
                        <button onClick={(e) => { e.stopPropagation(); if (slide.filter) { setFilterLarge(slide.filter); setFilterMedium('전체'); setFilterSmall('전체'); } }}
                          style={{ background: 'white', color: '#333', border: 'none', borderRadius: '20px', padding: '7px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                          {slide.filter ? slide.filter + ' 보러가기 →' : '쇼핑하기 →'}
                        </button>
                      </div>
                      <span style={{ fontSize: '64px', position: 'relative', zIndex: 1 }}>{slide.emoji}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                  {banners.map((_, i) => (
                    <button key={i} onClick={() => { setBannerTransition(true); setBannerIndex(i); }}
                      style={{ width: (bannerIndex % banners.length) === i ? '20px' : '8px', height: '8px', background: bannerIndex === i ? '#00c471' : '#dee2e6', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: 0, transition: 'all 0.3s' }} />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
              {['행사상품', ...categories.map((c) => c.name)].map((name) => {
                const isActive = name === '행사상품' ? filterLarge === '행사중' : filterLarge === name;
                return (
                  <button key={name} onClick={() => {
                    setFilterLarge(name === '행사상품' ? '행사중' : name);
                    setFilterMedium('전체'); setFilterSmall('전체');
                  }}
                    style={{ padding: '8px 18px', background: isActive ? '#00c471' : (darkMode ? '#2a2a2a' : 'white'), color: isActive ? 'white' : (darkMode ? '#a0a0a0' : '#495057'), border: isActive ? 'none' : `1.5px solid ${darkMode ? '#3a3a3a' : '#e9ecef'}`, borderRadius: '20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0, boxShadow: isActive ? '0 2px 8px rgba(0,196,113,0.3)' : 'none' }}>
                    {name}
                  </button>
                );
              })}
            </div>

            {selectedLargeObj && selectedLargeObj.children.length > 0 && (
              <div style={{ padding: '4px 16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {['전체', ...selectedLargeObj.children.map((m) => m.name)].map((name) => (
                  <button key={name} onClick={() => { setFilterMedium(name); setFilterSmall('전체'); }}
                    style={{ padding: '6px 14px', background: filterMedium === name ? (darkMode ? '#0d4d2a' : '#212529') : (darkMode ? '#2a2a2a' : 'white'), color: filterMedium === name ? 'white' : (darkMode ? '#a0a0a0' : '#868e96'), border: filterMedium === name ? 'none' : `1.5px solid ${darkMode ? '#3a3a3a' : '#e9ecef'}`, borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            {selectedMediumObj && selectedMediumObj.children.length > 0 && (
              <div style={{ padding: '4px 16px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {['전체', ...selectedMediumObj.children].map((name) => (
                  <button key={name} onClick={() => setFilterSmall(name)}
                    style={{ padding: '5px 12px', background: filterSmall === name ? (darkMode ? '#1a5c2a' : '#868e96') : (darkMode ? '#2a2a2a' : 'white'), color: filterSmall === name ? 'white' : (darkMode ? '#808080' : '#adb5bd'), border: filterSmall === name ? 'none' : `1.5px solid ${darkMode ? '#3a3a3a' : '#e9ecef'}`, borderRadius: '20px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}>
                    {name}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}>
              <p style={{ fontSize: '16px', fontWeight: '700', color: darkMode ? '#f0f0f0' : '#212529', margin: 0 }}>
                {filterLarge === '행사중' ? '🎉 행사 상품' : filterLarge} ({(filterLarge === '행사중' ? eventProducts : filteredProducts).length}개)
              </p>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: `1.5px solid ${darkMode ? '#3a3a3a' : '#dee2e6'}`, fontSize: '13px', outline: 'none', background: darkMode ? '#2a2a2a' : 'white', color: darkMode ? '#f0f0f0' : '#212529', cursor: 'pointer' }}>
                <option value="default">기본순</option>
                <option value="price_asc">낮은 가격순</option>
                <option value="price_desc">높은 가격순</option>
                <option value="name">이름순</option>
              </select>
            </div>

            {productsLoading ? (
              <div className="empty-state">
                <span className="empty-state-icon">⏳</span>
                <span className="empty-state-text">상품을 불러오는 중이에요...</span>
              </div>
            ) : (filterLarge === '행사중' ? eventProducts : filteredProducts).length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">{filterLarge === '행사중' ? '🎁' : '🛍️'}</span>
                <span className="empty-state-text">{filterLarge === '행사중' ? '현재 진행중인 행사가 없어요!' : '해당 카테고리에 상품이 없어요!'}</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', padding: '0 16px 100px' }}>
                {(filterLarge === '행사중' ? eventProducts : filteredProducts).map((product) => (
                  <div key={product.id}
                    onClick={() => { if (!product.isSoldOut) { setSelectedProduct(product); goToPage('productDetail'); } }}
                    style={{ background: darkMode ? '#2a2a2a' : 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: darkMode ? '0 2px 16px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.07)', position: 'relative', opacity: product.isSoldOut ? 0.6 : 1, cursor: product.isSoldOut ? 'default' : 'pointer', border: product.isAdult ? '1.5px solid #ffcdd2' : `1px solid ${darkMode ? '#3a3a3a' : '#f0faf5'}` }}>
                    <div style={{ height: '130px', position: 'relative', overflow: 'hidden' }}>
                      <img src={product.image || getCategoryImage(product.large)} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {!product.image && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,196,113,0.08)' }} />}
                      {product.isSoldOut && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontWeight: '800', fontSize: '13px', background: '#ff4757', padding: '4px 12px', borderRadius: '20px' }}>품절</span>
                        </div>
                      )}
                      {product.eventLabel && (
                        <div style={{ position: 'absolute', top: 8, left: 8, background: '#ff4757', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '8px' }}>{product.eventLabel}</div>
                      )}
                      {product.isAdult && !product.eventLabel && <div style={{ position: 'absolute', top: 8, left: 8, background: '#ff4757', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 7px', borderRadius: '8px' }}>🔞 성인</div>}
                      <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product); }}
                        style={{ position: 'absolute', top: '8px', right: '8px', width: '30px', height: '30px', borderRadius: '50%', background: darkMode ? '#3a3a3a' : 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                        {wishlist.find((item) => item.id === product.id) ? '❤️' : '🤍'}
                      </button>
                    </div>
                    <div style={{ padding: '10px 11px 12px' }}>
                      <p style={{ fontSize: '10px', color: '#00c471', margin: '0 0 3px', fontWeight: '700' }}>{product.large}</p>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: darkMode ? '#f0f0f0' : '#1a1a1a', margin: '0 0 8px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.name}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          {product.salePrice != null && product.salePrice !== product.price ? (
                            <>
                              <p style={{ fontSize: '10px', color: '#adb5bd', margin: 0, textDecoration: 'line-through' }}>₩{product.price.toLocaleString()}</p>
                              <p style={{ fontSize: '14px', fontWeight: '800', color: '#ff4757', margin: 0 }}>₩{product.salePrice.toLocaleString()}</p>
                            </>
                          ) : (
                            <p style={{ fontSize: '14px', fontWeight: '800', color: darkMode ? '#f0f0f0' : '#1a1a1a', margin: 0 }}>₩{product.price.toLocaleString()}</p>
                          )}
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); addToCart(product); }} disabled={product.isSoldOut}
                          style={{ width: '30px', height: '30px', borderRadius: '50%', background: product.isSoldOut ? '#dee2e6' : 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', cursor: product.isSoldOut ? 'not-allowed' : 'pointer', fontSize: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: product.isSoldOut ? 'none' : '0 2px 8px rgba(0,196,113,0.4)', lineHeight: 1, fontWeight: '300' }}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {page === 'notice'          && <Notice notices={notices} setNotices={setNotices} isAdmin={isAdmin} goBack={goBack} goToHome={() => goToPage('home')} darkMode={darkMode} />}
        {page === 'wishlist'        && <Wishlist wishlist={wishlist} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} goBack={goBack} goToHome={() => goToPage('home')} darkMode={darkMode} />}
        {page === 'search'          && <Search products={products} categories={categories} goBack={goBack} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} onAddToCart={addToCart} />}
        {page === 'productDetail'   && <ProductDetail product={selectedProduct} onBack={goBack} onAddToCart={addToCart} darkMode={darkMode} />}
        {page === 'cart'            && <Cart cart={cart} setCart={setCart} onPayment={handlePayment} onHome={() => goToPage('home')} goBack={goBack} coupons={coupons} user={currentUser} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} darkMode={darkMode} />}
        {page === 'orders'          && <Orders orders={orders} goBack={goBack} />}
        {page === 'receipt'         && <Receipt order={lastOrder} onClose={() => goToPage('orders')} onGoHome={() => goToPage('home')} />}
        {page === 'mypage'          && <MyPage user={currentUser} orders={orders} wishlist={wishlist} goToPage={goToPage} onLogout={handleLogout} users={users} setUsers={setUsers} isAdmin={isAdmin} />}
      </div>

      {/* 하단 탭 */}
      {(
        <nav className="bottom-nav">
          <button className={'bottom-nav-item' + (page === 'home' ? ' active' : '')} onClick={() => goToPage('home')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={page === 'home' ? '#00c471' : '#adb5bd'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>홈</span>
          </button>
          <button className={'bottom-nav-item' + (page === 'cart' ? ' active' : '')} onClick={() => user ? goToPage('cart') : requireLogin()}>
            <div style={{ position: 'relative' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={page === 'cart' ? '#00c471' : '#adb5bd'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {cart.length > 0 && <span className="badge">{cart.length}</span>}
            </div>
            <span>장바구니</span>
          </button>
          <button onClick={() => goToPage('search')}
            style={{ flex: 1, height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', position: 'relative' }}>
            <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #00c471, #00a85e)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,196,113,0.4)', marginTop: '-20px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <span style={{ fontSize: '10px', fontWeight: '600', color: '#00c471' }}>검색</span>
          </button>
          <button className={'bottom-nav-item' + (page === 'wishlist' ? ' active' : '')} onClick={() => user ? goToPage('wishlist') : requireLogin()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill={page === 'wishlist' ? '#00c471' : 'none'} stroke={page === 'wishlist' ? '#00c471' : '#adb5bd'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span>찜</span>
          </button>
          <button className={'bottom-nav-item' + (page === 'mypage' ? ' active' : '')} onClick={() => user ? goToPage('mypage') : requireLogin()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={page === 'mypage' ? '#00c471' : '#adb5bd'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>마이</span>
          </button>
        </nav>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: '90px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.75)', color: 'white', padding: '12px 24px', borderRadius: '24px', fontSize: '14px', fontWeight: '600', zIndex: 9999, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          {toast}
        </div>
      )}

      <Chatbot />
      <footer style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: 'var(--gray-400)', borderTop: '1px solid var(--gray-200)' }}>
        © 2026 Dongsin Market. All rights reserved.
      </footer>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;