import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { login as apiLogin, getActiveProducts, getCategories, getBanners, getMyOrders, createOrder, getWishlist, toggleWishlist as toggleWishlistApi, getActivePromotions } from './api';
import API from './api';
import Chatbot from './components/Chatbot';
import StoreSelectionModal from './components/StoreSelectionModal';
import ForcePasswordChangeModal from './components/ForcePasswordChangeModal';
import ThirdPartyConsentModal from './components/ThirdPartyConsentModal';
import InstallPrompt from './components/InstallPrompt';
import UpdateGate from './components/UpdateGate';
import SplashAd from './components/SplashAd';
import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import './App.css';
import './styles/tokens.css';   // 목업 정본 v1 토큰 — App.css 뒤에 와야 같은 이름에서 이긴다(묶음 1)
import './styles/ui.css';
import './styles/shop.css';   // 묶음 2 — 홈·검색 부품
import TabBar from './components/ui/TabBar';
import AppHeader from './components/ui/AppHeader';
import Icon from './components/ui/Icon';
// 오프라인 화면은 따로 떼어 받지 않는다 — 인터넷이 끊긴 순간에 그 조각을 받으러 가면 못 받는다(묶음 1 비교 사진에서 발견)
import Offline from './pages/Offline';
import Home from './pages/Home';   // 첫 화면이라 바로 싣는다(묶음 2)
import { ThemeProvider, useTheme } from './ThemeContext';
import { DialogProvider, useDialog } from './DialogContext';

import { kakaoPayReady } from './pages/KakaoPay';
import { useAuth } from './AuthContext';
import { useStore } from './StoreContext';
import { initPush, registerPushForUser } from './pushSetup';
import { objectJosa } from './utils/customerStores';
import useShopCart from './hooks/useShopCart';
import useIdentityLive from './identity/useIdentityLive';
import { BRAND, shortStoreName } from './brand';
import { sameUser, payerKey } from './utils/sameUser';   // 이메일 없는 회원(2026-11-17) — 같은 사람은 번호로

// 코드 스플리팅: 홈(App 내 inline) 외 페이지는 지연 로드 → 초기 번들 축소(파싱 단축).
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./pages/Login'));
// 주문내역(P01) — 예전 「주문내역」(Orders.js)과 「구매 내역」(Purchases.jsx)을 한 화면이 대신한다(묶음 4)
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Cart = lazy(() => import('./pages/Cart'));
const Search = lazy(() => import('./pages/Search'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const QuickOrder = lazy(() => import('./pages/QuickOrder'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Notice = lazy(() => import('./pages/Notice'));
const RecentViews = lazy(() => import('./pages/RecentViews'));
const MyReviews = lazy(() => import('./pages/MyReviews'));
const StoreInfo = lazy(() => import('./pages/StoreInfo'));
const CustomerCenter = lazy(() => import('./pages/CustomerCenter'));
const Events = lazy(() => import('./pages/Events'));
const Receipt = lazy(() => import('./pages/Receipt'));
const MyPage = lazy(() => import('./pages/MyPage'));
const About = lazy(() => import('./pages/About'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));   // 마이 → 알림 설정(S50, 2026-11-12)
// 청크 로드 중 — 화면 뼈대(S43). 예전엔 진한 초록 전체 화면이 번쩍였다. 다크에서도 바탕색 그대로(묶음 1)
const PageFallback = () => (
  <div className="page-skeleton" aria-busy="true" aria-label="불러오는 중">
    <div className="pad">
      <div className="sk" style={{ height: 34, width: '50%' }} />
      <div className="sk" style={{ height: 220, marginTop: 'var(--sp-4)', borderRadius: 'var(--r-lg)' }} />
      <div className="sk" style={{ height: 18, marginTop: 'var(--sp-4)', width: '80%' }} />
      <div className="sk" style={{ height: 18, marginTop: 'var(--sp-2)', width: '60%' }} />
      <div className="sk" style={{ height: 64, marginTop: 'var(--sp-5)' }} />
      <div className="sk" style={{ height: 64, marginTop: 'var(--sp-2)' }} />
    </div>
  </div>
);

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

// 배너/상품 이미지 origin은 api.js의 imgUrl()로 통일(웹=동일출처, 네이티브=도메인).

// 백엔드 categories(평면 행 {code,large,medium,small})를 shop UI가 쓰는 중첩 트리
// [{name:대분류, children:[{name:중분류, children:[소분류...]}]}] 로 변환. code 순 정렬로 순서 유지.
function buildCategoryTree(rows) {
  const larges = [];
  const byLarge = {};
  const byMedium = {};
  [...(rows || [])]
    .sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')))
    .forEach((r) => {
      if (!r.large) return;
      if (!byLarge[r.large]) { byLarge[r.large] = { name: r.large, children: [] }; larges.push(byLarge[r.large]); }
      if (!r.medium) return;
      const mkey = r.large + '>' + r.medium;
      if (!byMedium[mkey]) { byMedium[mkey] = { name: r.medium, children: [] }; byLarge[r.large].children.push(byMedium[mkey]); }
      if (r.small && !byMedium[mkey].children.includes(r.small)) byMedium[mkey].children.push(r.small);
    });
  return larges;
}

function AppContent() {
  const { darkMode, setDarkMode } = useTheme();
  const handleSetDark = (val) => setDarkMode(val);
  const { guestStoreId, currentStoreId, currentStore, isGuest, setGuestStoreId, stores, isOwner, ownerViewStoreId, setOwnerViewStoreId } = useStore();
  const { notify, confirm } = useDialog();

  // 웹은 내장 랜딩(homepage)을 건너뛰고 게스트로 바로 쇼핑앱 진입, 네이티브 앱은 로그인 우선
  // (회사 정적 홈페이지가 이미 랜딩 역할을 하므로 웹에서 HomePage.jsx는 표시하지 않음)
  const [page, setPage] = useState('home');   // 웹·앱 공통: 홈(게스트 둘러보기)부터. 로그인은 계정 필요 시점에.
  const [pageHistory, setPageHistory] = useState([]);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [mcpUser, setMcpUser] = useState(null);   // Y5 강제비번변경 대상(must_change_password=1) — 로그인 응답의 dbUser
  // 제3자 제공 동의를 아직 물어본 적 없는 기존 회원인가(로그인 응답의 needsThirdPartyConsent).
  // 동의 항목이 2026-09-11 에 생겨서, 그 전 가입자는 답한 적이 없다 — 로그인 직후 한 번 묻는다.
  const [needsConsent, setNeedsConsent] = useState(false);
  // 전자영수증 알림을 탭해 들어온 경우 그 매출 번호. 구매 내역이 열리면서 바로 그 영수증을 편다.
  const [pushSaleId, setPushSaleId] = useState(null);
  const [ordersDetail, setOrdersDetail] = useState(false);   // 주문내역에서 영수증·주문 상세를 연 동안 — 탭바를 숨긴다(묶음 4)
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(false);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  // 본인확인이 켜져 있으면 성인 상품 안내가 「본인확인 뒤 매장 픽업」을 말한다(목업 S35 · 2026-11-16 지시 7). 판정은 서버가 한다.
  const [idLive] = useIdentityLive(true);
  const ADULT_MSG = idLive ? '주류는 19세 이상 본인확인 뒤 매장 픽업으로 살 수 있어요' : '성인 상품은 19세 이상만 구매할 수 있어요';
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quickOrderItem, setQuickOrderItem] = useState(null);   // '바로 주문' 대상 아이템(카트형, 1개)
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  // 스플래시 2번째(대기) 화면 광고 오버레이 — 네이티브 콜드스타트에서만. 콘텐츠 준비 시 dismiss(로딩 지연 0).
  const [splashAdVisible, setSplashAdVisible] = useState(() => Capacitor.isNativePlatform());
  const splashAdDismissRef = useRef(false);
  const dismissSplashAd = useCallback(() => {
    if (splashAdDismissRef.current) return;
    splashAdDismissRef.current = true;
    setSplashAdVisible(false);
  }, []);

  // 로딩 구간(스플래시~웹 로드 완료 전): 상태바 초록(#077D3C) + 밝은 아이콘 → 하단 흰 띠 없이 스플래시와 연속.
  // 이 구간은 다크모드와 무관하게 항상 초록(스플래시 배경과 동일) — 콘텐츠가 아직 안 보이는 구간이라 의도적.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    (async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#077D3C' });
        await StatusBar.setStyle({ style: Style.Dark });   // Dark=밝은 콘텐츠(초록 배경용)
      } catch (e) {}
    })();
  }, []);

  // 앱 최초 실행 시 푸시 알림 권한 요청 + FCM 토큰 등록 (네이티브만, 웹은 무시)
  // 알림을 탭하면 **그 영수증으로.** 목록만 열면 손님이 다시 찾아 들어가야 한다.
  useEffect(() => {
    initPush((ev) => {
      if (ev?.type !== 'pos_receipt') return;
      setPushSaleId(ev.saleId || null);
      goToPage('purchases');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 로그인하면 기기를 그 회원에게 다시 등록한다(첫 실행 때는 비회원으로 등록됐을 수 있다 — 2026-11-14 결정 b)
  useEffect(() => { if (user?.id) registerPushForUser(); }, [user?.id]);

  // 콘텐츠 로드 후(스플래시 종료 이후) 상태바를 다크모드에 맞춤 — 라이트=흰 배경/어두운 아이콘,
  // 다크=#1a1a1a(홈 헤더의 다크모드 배경과 동일)/밝은 아이콘. setBackgroundColor는 안드로이드 전용
  // (iOS는 지원 안 함 — overlaysWebView:false에서는 아이콘 색만 바뀌고 배경은 OS가 그림, 배경까지
  // 맞추려면 나중에 overlaysWebView:true 구조로 바꿔야 함). darkModeRef로 최신값을 훅 없이 참조해
  // hideSplash(useCallback, deps:[])가 stale closure로 옛 값을 쓰지 않게 한다.
  const darkModeRef = useRef(darkMode);
  useEffect(() => { darkModeRef.current = darkMode; }, [darkMode]);

  const applyStatusBarTheme = useCallback(async (dark) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      if (Capacitor.getPlatform() === 'android') {
        await StatusBar.setBackgroundColor({ color: dark ? '#1a1a1a' : '#ffffff' });
      }
      await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    } catch (e) {}
  }, []);

  // 스플래시 제어 — 중복 호출 방지
  const splashHiddenRef = useRef(false);
  const hideSplash = useCallback(async () => {
    if (splashHiddenRef.current || !Capacitor.isNativePlatform()) return;
    splashHiddenRef.current = true;
    try { await SplashScreen.hide(); } catch (e) {}
    // 로드 완료 → 시스템 바를 콘텐츠(현재 다크모드 상태)에 맞게 복귀.
    // 상태바=StatusBar 플러그인, 하단 내비바=네이티브(MainActivity가 'srmart:loaded' 수신 후 전환).
    await applyStatusBarTheme(darkModeRef.current);
    // 네이티브 로고 스플래시 즉시 종료(초록 종료애니 없이 광고로 바로) + 하단 내비바 콘텐츠용 전환.
    try { window.SrmartNav && window.SrmartNav.releaseSplash(); } catch (e) {}
    try { window.SrmartNav && window.SrmartNav.onContentReady(); } catch (e) {}
  }, [applyStatusBarTheme]);

  // 다크모드를 앱 실행 중(스플래시 종료 후)에 토글하면 상태바도 즉시 따라가게 — 재시작 불필요.
  // 스플래시가 아직 안 끝난 시점의 마운트 최초 실행은 splashHiddenRef가 false라 스킵(그 경우
  // 초기 색은 hideSplash가 처리) — 그 뒤 darkMode가 바뀔 때만 반응.
  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !splashHiddenRef.current) return;
    applyStatusBarTheme(darkMode);
  }, [darkMode, applyStatusBarTheme]);

  // 스플래시: 네이티브 로고 스플래시를 '광고 이미지가 준비되면'(SplashAd onReady=hideSplash) 내린다.
  // → 로고에서 광고로 바로 전환(중간에 녹색 대기화면이 오래 보이던 문제 제거).
  // 안전망: 광고가 끝내 안 뜨면 최대 2.5초 후 강제로 내림.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const safety = setTimeout(hideSplash, 2500);
    return () => clearTimeout(safety);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 스플래시 광고 대기화면 안전망 — 콘텐츠 준비가 지연/실패해도 3초 뒤엔 반드시 걷음(광고가 화면을 가두지 않게).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const t = setTimeout(dismissSplashAd, 3000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  const { login: authLogin, logout: authLogout } = useAuth();

  // ✅ 관리자 판별 - DB role 기반
  const isAdmin = user && (
    user.role === 'owner' ||
    user.role === 'store_manager' ||
    user.role === 'admin' ||
    user.role === 'manager' ||
    user.grade === '관리자'
  );

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('srmart_users');
    return saved ? JSON.parse(saved) : [];
  });
  const [messages] = useState({
    welcome: `환영해요! ${BRAND.name} 가족이 되셨어요! 🎉`,
    logout: '로그아웃 되었어요. 이용해주셔서 감사합니다! 😊',
    login: '님, 환영해요! 즐거운 쇼핑 되세요 😊',
    banner: `${BRAND.name}에 오신 것을 환영해요!`,
    bannerSub: '신선하고 다양한 상품을 만나보세요',
  });
  const [filterLarge, setFilterLarge] = useState('전체');
  const [eventProducts, setEventProducts] = useState([]);
  const [filterMedium, setFilterMedium] = useState('전체');
  const [filterSmall, setFilterSmall] = useState('전체');
  const [sortOrder, setSortOrder] = useState('default');
  const [toast, setToast] = useState('');
  const [chatOpen, setChatOpen] = useState(false);   // AI 상담 — 홈 검색창 오른쪽 단추 · 고객센터 줄로 연다(2026-11-13 B안, 떠 있는 단추 없음)
  const [lastOrder, setLastOrder] = useState(null);
  const [events, setEvents] = useState([]);
  const [banners, setBanners] = useState([]); // 백엔드에서 로드(admin 관리). 0건이면 배너 영역 숨김.

  useEffect(() => { localStorage.setItem('srmart_users', JSON.stringify(users)); }, [users]);

  const currentUser = user || null;
  const storeShort = currentStore ? shortStoreName(currentStore.name) : '';
  const [loginMode, setLoginMode] = useState('login');   // 홈 가입 쿠폰 띠 「가입하기」면 'signup'
  useEffect(() => { if (page !== 'login') setLoginMode('login'); }, [page]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  }, []);

  // 🔴 장바구니는 서버(회원 계정)에 — 비회원은 이 기기에 두고 로그인하면 합친다(2026-11-13 · hooks/useShopCart.js · 목업 S08A)
  const onCartMerged = useCallback((n) => showToast(`이 기기에 담아 둔 상품 ${n}개를 회원 장바구니에 합쳤어요`), [showToast]);
  const shopCart = useShopCart({ user, storeId: currentStoreId, onMerged: onCartMerged });

  const loadWishlist = async () => {
    try {
      const res = await getWishlist();
      // 🔴 서버 찜 줄은 `w.*` 라 id 가 **찜 줄 번호**다(상품 번호는 product_id). 그대로 두면 하트 표시가 어긋나고
      //    찜 빼기가 엉뚱한 상품 번호로 간다 — 상품 번호를 id 로 쓴다(묶음 5 · 2026-11-12 밤)
      setWishlist((res.data || []).map((r) => (r.product_id != null ? { ...r, wishlist_id: r.id, id: r.product_id } : r)));
    } catch (e) {
      // 찜 목록 로드 실패 시 빈 상태 유지 (비로그인·네트워크 오류 등)
    }
  };

  const toggleWishlist = async (product) => {
    const exists = wishlist.find((item) => item.id === product.id);
    // optimistic update
    if (exists) setWishlist((prev) => prev.filter((item) => item.id !== product.id));
    else setWishlist((prev) => [...prev, product]);
    try {
      await toggleWishlistApi(product.id);
    } catch (e) {
      // 실패 시 롤백
      if (exists) setWishlist((prev) => [...prev, product]);
      else setWishlist((prev) => prev.filter((item) => item.id !== product.id));
    }
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

  // 안드로이드 하드웨어 뒤로가기
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (pageHistory.length > 0) {
        goBack();
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => { listenerPromise.then(h => h.remove()); };
  }, [pageHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProducts = async (storeId) => {
    try {
      setProductsLoading(true);
      setProductsError(false);
      const res = await getActiveProducts(storeId);
      setProducts(res.data.map(p => ({
        ...p,
        isAdult: !!p.is_adult,
        isSoldOut: !p.is_available || p.stock <= 0,
        images: [],
      })));
    } catch (err) {
      console.error('상품 로드 실패:', err);
      setProducts([]);        // 가짜 fallback 제거 — 빈 목록 + 에러 안내
      setProductsError(true);
    } finally {
      setProductsLoading(false);
      dismissSplashAd();      // 콘텐츠(상품) 준비 완료 → 스플래시 광고 대기화면 걷기
    }
  };

  // 카테고리(전역 분류체계) 로드 — 백엔드 평면 행 → 중첩 트리로 변환. 실패 시 빈 트리.
  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(buildCategoryTree(res.data));
    } catch (err) {
      console.error('카테고리 로드 실패:', err);
      setCategories([]);
    }
  };

  // 홈 배너 로드(admin 관리). 고객 매장(storeId) 기준: 공용 + 그 매장 배너. 실패/0건이면 숨김.
  const loadBanners = async (storeId) => {
    try {
      const res = await getBanners(storeId);
      setBanners(res.data || []);
    } catch (err) {
      console.error('배너 로드 실패:', err);
      setBanners([]);
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

  // 카테고리(전역)는 최초 1회 로드 — 매장 무관.
  useEffect(() => { loadCategories(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 점포 변경 시 상품·배너 갱신(배너는 공용 + 그 매장).
  useEffect(() => {
    loadBanners(currentStoreId);
    if (currentStoreId && page === 'home') {
      loadProducts(currentStoreId);
    }
    // 스플래시 광고 조회/캐싱은 SplashAd 컴포넌트가 마운트 시 직접 수행(loadActiveSplashAd) → 첫 콜드스타트도 표시.
  }, [currentStoreId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ 로그인 - username 또는 email로 백엔드 연동
  const handleLogin = async (loggedInUser) => {
    const identifier = loggedInUser.username || loggedInUser.email;
    const res = await apiLogin(identifier, loggedInUser.password);
    const { token, user: dbUser } = res.data;
    console.log('[handleLogin] 백엔드 user:', dbUser);
    // Y5: 임시비번(must_change_password) 상태 — admin 과 동일하게 토큰만 저장하고 정식
    // 로그인(setUser/authLogin)은 보류. authMiddleware 가 이 토큰으로는 강제변경 API 외
    // 모든 보호 라우트를 막으므로, 강제변경 모달을 띄워 새 비번부터 받는다.
    if (dbUser.must_change_password === 1) {
      localStorage.setItem('srmart_token', token);
      setMcpUser(dbUser);
      return;
    }
    localStorage.setItem('srmart_token', token);
    setUser(dbUser);
    authLogin(dbUser);
    setNeedsConsent(!!dbUser.needsThirdPartyConsent);
    if (dbUser.role === 'owner') {
      // 오너는 store_id가 항상 null이라 여기서 loadProducts(null)을 부르면 백엔드 기본값(1번 매장)으로
      // 잠깐 떴다가, 바로 이어서 StoreContext의 currentStoreId(미리보기 매장) 반응형 effect가 다시
      // 불러서 실제 선택된 매장으로 덮어쓴다 — 매장이 1번이 아니면 로그인 직후 상품 목록이 한 번
      // 바뀌는 깜빡임 + 중복 요청이 생긴다. 오너는 그 effect 하나에만 맡긴다.
      await Promise.all([loadMyOrders(), loadWishlist()]);
    } else {
      await Promise.all([loadProducts(dbUser.store_id), loadMyOrders(), loadWishlist()]);
    }
    goToPage('home');
  };

  // 강제 비밀번호 변경 완료 — admin 과 동일하게 재로그인을 유도한다(서버가 주는 새 정식
  // 토큰을 바로 쓰지 않고 토큰을 비움 — 로그인 상태 관리가 두 갈래로 갈리지 않게).
  const handleForcePasswordChangeDone = () => {
    localStorage.removeItem('srmart_token');
    setMcpUser(null);
  };

  const handleGuest = () => {
    if (!guestStoreId) {
      setShowStoreModal(true);
      return;
    }
    loadProducts(guestStoreId);
    setPage('home');
  };

  // 웹·앱 공통 최초 진입: 홈(게스트 둘러보기)으로. 로그인 세션(AuthContext)이 복원돼 있으면 그 매장,
  // 매장 미선택(첫 방문)이면 handleGuest가 점포 선택 모달을 띄우고, 선택돼 있으면 바로 home 로드.
  const guestInitRef = useRef(false);
  useEffect(() => {
    if (guestInitRef.current) return;
    guestInitRef.current = true;
    handleGuest();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStoreSelected = async (storeId) => {
    setShowStoreModal(false);
    await loadProducts(storeId);
    setPage('home');
  };

  // 로그아웃 확인(S33) — 다른 확인창과 같은 모양(공용 확인창), 「로그아웃」은 빨강. 비밀번호를 바꾼 뒤에는 묻지 않는다(skipAsk)
  const handleLogout = async (skipAsk) => {
    if (skipAsk !== true) {
      const ok = await confirm({ title: '로그아웃할까요?', message: '정말 로그아웃 하시겠어요?', okLabel: '로그아웃', danger: true });
      if (!ok) return;
    }
    confirmLogout(skipAsk === true);
  };

  const confirmLogout = (quiet) => {
    setNeedsConsent(false);
    localStorage.removeItem('srmart_auto_login');
    localStorage.removeItem('srmart_token');
    authLogout();
    setUser(null); setOrders([]); setProducts([]); setPageHistory([]); handleGuest();   // 로그아웃 후 게스트 홈
    if (!quiet) notify({ icon: 'check', title: '로그아웃 되었어요', message: '이용해 주셔서 감사합니다.' });
  };

  // 로그인 안내(S34 「안내」) — 창을 먼저 보여 주고, 확인을 누르면 로그인 화면으로 간다(목업처럼 지금 화면 위에 뜬다 · 묶음 1)
  const requireLogin = (what) => notify({ icon: 'user', title: '로그인이 필요해요', message: `${what || '이 기능은'} 로그인 후 쓸 수 있어요.` }).then(() => setPage('login'));

  const addToCart = (product, qty = 1) => {
    if (product.isSoldOut) { showToast('품절된 상품이에요'); return; }
    if (product.stock !== '' && Number(product.stock) <= 0) { showToast('재고가 없어요'); return; }
    if (product.isAdult) {
      const latestUser = users.find(u => sameUser(u, user)) || user;
      if (!latestUser.isAdult) { showToast(ADULT_MSG); return; }
    }
    // 수량은 한 번에 보낸다(상세의 수량·박스 수량) — 같은 상품·같은 포장 단위는 서버가 더하고 99개에서 멈춘다.
    // 재고·판매 여부·주류는 서버가 다시 본다(장바구니를 열 때마다 줄 아래에 알린다).
    shopCart.add(product, qty).then((err) => {
      if (err) { showToast(err); return; }
      // 목업 S35 — 「농심 메론킥 60g을 장바구니에 담았어요」(규격까지 · 그림 글자 없이 · 아이콘이 확인 표시)
      const label = [product.name, product.spec].filter(Boolean).join(' ');
      showToast(`${label}${objectJosa(label)} 장바구니에 담았어요`);
    });
  };

  useEffect(() => {
    if (filterLarge === '행사중') {
      // 2026-11-12 고침: 예전엔 `/events/active` 의 `products` 를 읽었는데 그 표(events)는 비어 있고
      // 행사 값은 매장 계산대와 같은 promotions 에 있다 — 그래서 이 목록이 늘 0개였다.
      // 이제 공개 행사 API 를 읽는다. 가격은 서버가 계산대와 같은 식으로 낸 `promo_price` 를 그대로 쓰고
      // (화면에서 다시 계산하면 계산대와 다른 값이 나갈 수 있다), 덤·묶음은 문구(`label`)만 붙인다.
      getActivePromotions(currentStoreId).then(res => {
        const productEventMap = {};
        (Array.isArray(res.data) ? res.data : []).forEach(promo => {
          (promo.products || []).forEach(pp => {
            if (productEventMap[pp.product_id]) return; // 여러 행사에 걸리면 먼저 온 것 하나만
            productEventMap[pp.product_id] = { promoPrice: pp.promo_price, label: promo.label, eventName: promo.name };
          });
        });
        const filtered = products
          .filter(p => productEventMap[p.id])
          .map(p => {
            const ev = productEventMap[p.id];
            const salePrice = ev.promoPrice != null ? Number(ev.promoPrice) : p.price;
            return { ...p, salePrice, eventLabel: ev.label || ev.eventName };
          });
        setEventProducts(filtered);
      }).catch(() => {
        console.log('행사 상품 불러오기 실패');
      });
    }
  }, [filterLarge, products, currentStoreId]);

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

  const handlePayment = async (finalPrice, orderExtras = {}) => {
    const cart = shopCart.orderItems;   // 서버가 「살 수 있다」고 한 줄만(가격도 서버 값)
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (cart.length === 0) { notify('장바구니가 비어있어요!'); return; }
    const latestUser = users.find(u => sameUser(u, user)) || user;
    if (cart.some(item => item.isAdult) && !latestUser.isAdult) {
      notify('🔞 장바구니에 성인 상품이 있어요. 19세 이상만 구매할 수 있어요!'); return;
    }
    try {
      const orderId = 'order_' + Date.now();
      const orderInfo = {
        orderId, userId: payerKey(user),
        itemName: cart.length === 1 ? cart[0].name : cart[0].name + ' 외 ' + (cart.length - 1) + '건',
        quantity: cart.reduce((sum, item) => sum + item.quantity, 0),
        totalAmount: finalPrice || totalPrice,
      };
      const result = await kakaoPayReady(orderInfo);
      if (result.next_redirect_pc_url) {
        const newOrder = { id: orderId, date: new Date().toLocaleString('ko-KR'), items: [...cart], totalPrice: finalPrice || totalPrice, summary: orderExtras.summary, userId: user.email, status: '결제완료' };   // summary — 영수증(S13)에 결제 화면과 같은 금액을 보이려고(서버로는 안 보낸다)
        createOrder({
          id: orderId,
          final_amount: finalPrice,                 // 서버 검증용 실결제(서버가 재계산 후 대조)
          status: '결제완료',
          address: orderExtras.address || user.address || '',
          addressDetail: orderExtras.addressDetail || user.address_detail || '',
          zipcode: orderExtras.zipcode || '',
          dong: orderExtras.dong || '',   // 배송비는 서버가 이 dong으로 zone 직접 재조회해 계산(클라값 미신뢰)
          use_points: orderExtras.use_points || 0,
          coupon_id: orderExtras.coupon_id || null,
          coupon_code: orderExtras.coupon_code || null,   // 코드 쿠폰 — 견적에 실은 그 값(2026-11-13 지시 2 · 예전엔 안 실어서 결제가 409)
          receiverName: orderExtras.receiverName || user.name,
          receiverPhone: orderExtras.receiverPhone || user.phone || '',
          // orderExtras.items 에는 quantity_type/grams 가 담겨 서버 소계 재계산에 필요
          items: orderExtras.items || cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity })),
          store_id: orderExtras.store_id,   // owner 매장 미리보기 전용 — 서버가 role 확인 후에만 반영
        }).catch(err => console.error('주문 저장 실패:', err));
        setOrders([newOrder, ...orders]); setLastOrder(newOrder);
        shopCart.removeMany(shopCart.lines.filter(l => l.ok));   // 주문한 줄만 뺀다 — 살 수 없어 남겨 둔 줄은 그대로(서버 장바구니에서도)
        window.open(result.next_redirect_pc_url, '_blank');
        goToPage('receipt');
      }
    } catch (error) {
      notify('결제 준비 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  // '바로 주문' 전용 결제 — handlePayment 와 로직은 동일하되 전역 cart 를 전혀 건드리지 않는다
  // (장바구니를 거치지 않은 주문이므로 읽지도 비우지도 않음). 두 결제 흐름이 갈리지 않도록
  // orderInfo/createOrder 페이로드 구성 방식은 handlePayment 와 1:1로 맞춰뒀다.
  const handleQuickPayment = async (item, finalPrice, orderExtras = {}) => {
    if (!item) { notify('주문할 상품이 없어요!'); return; }
    const latestUser = users.find(u => sameUser(u, user)) || user;
    if (item.isAdult && !latestUser.isAdult) {
      notify({ icon: 'alert', title: '성인 상품이에요', message: ADULT_MSG }); return;
    }
    try {
      const orderId = 'order_' + Date.now();
      const orderInfo = {
        orderId, userId: payerKey(user),
        itemName: item.name,
        quantity: item.quantity,
        totalAmount: finalPrice,
      };
      const result = await kakaoPayReady(orderInfo);
      if (result.next_redirect_pc_url) {
        const newOrder = { id: orderId, date: new Date().toLocaleString('ko-KR'), items: [item], totalPrice: finalPrice, summary: orderExtras.summary, userId: user.email, status: '결제완료' };
        createOrder({
          id: orderId,
          final_amount: finalPrice,
          status: '결제완료',
          address: orderExtras.address || user.address || '',
          addressDetail: orderExtras.addressDetail || user.address_detail || '',
          zipcode: orderExtras.zipcode || '',
          dong: orderExtras.dong || '',
          use_points: orderExtras.use_points || 0,
          coupon_id: orderExtras.coupon_id || null,
          coupon_code: orderExtras.coupon_code || null,   // 코드 쿠폰 — 견적에 실은 그 값(2026-11-13 지시 2 · 예전엔 안 실어서 결제가 409)
          receiverName: orderExtras.receiverName || user.name,
          receiverPhone: orderExtras.receiverPhone || user.phone || '',
          items: orderExtras.items || [{ id: item.id, name: item.name, quantity: item.quantity }],
          store_id: orderExtras.store_id,   // owner 매장 미리보기 전용 — 서버가 role 확인 후에만 반영
        }).catch(err => console.error('주문 저장 실패:', err));
        setOrders([newOrder, ...orders]); setLastOrder(newOrder);
        setQuickOrderItem(null);
        window.open(result.next_redirect_pc_url, '_blank');
        goToPage('receipt');
      }
    } catch (error) {
      notify('결제 준비 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
  };

  if (page === 'homepage') {
    return (
      <div style={{ width: '100%', minHeight: '100vh' }}>
        <Suspense fallback={<PageFallback />}>
          <HomePage onShop={handleGuest} onLogin={() => setPage('login')} darkMode={darkMode} />
        </Suspense>
        {showStoreModal && <StoreSelectionModal onSelected={handleStoreSelected} />}
        {mcpUser && <ForcePasswordChangeModal onDone={handleForcePasswordChangeDone} />}
      {needsConsent && (
        <ThirdPartyConsentModal
          onDone={(agreed) => {
            setNeedsConsent(false);
            // 답을 했으면(동의/거절) 그 값을 사용자 정보에도 반영한다 — 마이페이지가
            // 다시 조회하지 않아도 맞는 상태를 보여준다. '나중에'(null)면 그대로 둔다.
            if (agreed !== null) setUser(u => (u ? { ...u, thirdPartyConsent: agreed ? 1 : 0 } : u));
          }}
        />
      )}
      </div>
    );
  }

  if (page === 'login') {
    return (
      <div className="App app-v2">
        <Suspense fallback={<PageFallback />}>
          <Login onLogin={handleLogin} onGuest={handleGuest} initialMode={loginMode} />
        </Suspense>
        {showStoreModal && <StoreSelectionModal onSelected={handleStoreSelected} />}
        {mcpUser && <ForcePasswordChangeModal onDone={handleForcePasswordChangeDone} />}
      </div>
    );
  }

  if (isOffline) {
    return <Suspense fallback={<PageFallback />}><Offline onRetry={() => setIsOffline(false)} /></Suspense>;
  }

  // 목업대로 옮긴 화면 — 바탕을 목업의 --bg 로(옛 화면은 --white 그대로). 묶음이 늘 때마다 여기에 더한다
  const v2Page = ['home', 'search', 'productDetail', 'cart', 'quickOrder', 'orderSheet', 'receipt', 'orders', 'purchases', 'mypage', 'wishlist', 'about', 'notice', 'recentViews', 'myReviews', 'storeInfo', 'customerCenter', 'events'].includes(page);
  // 아래 고정 바가 있는 화면은 탭바를 안 그린다(목업 S04·S08·S12·P03 — 바가 탭바를 덮던 것). 빈 장바구니(S09)는 탭바 — 묶음 3
  const noTab = ['productDetail', 'quickOrder', 'orderSheet', 'receipt'].includes(page) || (page === 'cart' && shopCart.count > 0) || (ordersDetail && (page === 'orders' || page === 'purchases'));

  return (
    <div className={`App${v2Page ? ' app-v2' : ''}${noTab ? ' no-tab' : ''}`}>
      {Capacitor.isNativePlatform() && <SplashAd visible={splashAdVisible} storeId={currentStoreId} onReady={hideSplash} />}
      <InstallPrompt />
      {showStoreModal && <StoreSelectionModal onSelected={handleStoreSelected} />}
      {mcpUser && <ForcePasswordChangeModal onDone={handleForcePasswordChangeDone} />}
      {/* 헤더(P05) — 로고 이미지 · 매장 · 종 · 로그인(AI 상담은 홈 검색창 오른쪽). 로그아웃은 마이 맨 아래(결정 11) — 묶음 1 */}
      {/* 검색 화면은 검색창이 헤더다(목업 S06) — 묶음 2 */}
      {!['search', 'productDetail', 'cart', 'quickOrder', 'orderSheet', 'receipt', 'orders', 'purchases', 'mypage', 'wishlist', 'about', 'notice', 'recentViews', 'myReviews', 'storeInfo', 'customerCenter', 'events'].includes(page) && <AppHeader
        storeName={storeShort}
        onStoreClick={!user && !isOwner ? () => setShowStoreModal(true) : null}
        onHome={() => goToPage('home')}
        onBell={() => (user ? goToPage('notice') : requireLogin())}
        loggedIn={!!user}
        onLogin={() => setPage('login')}
      />}

      {/* 오너 매장 미리보기 배너 — 헤더의 작은 드롭다운만으로는 놓치기 쉬워서(실제로 이걸로 인해
          "로그인하면 상품 이미지가 사라진다"는 혼란이 있었음 — 재고 0인 매장을 미리보기 중이라
          품절 처리(어둡게+품절 배지)된 걸 이미지 버그로 오인한 것) 화면 전체에 눈에 띄게 상시 고지. */}
      {isOwner && currentStore && (
        <div className="owner">
          <div className="notice o">
            <Icon name="eye" />
            <div style={{ flex: 1 }}><b>매장 미리보기 중</b> — 실제 가격·재고 기준으로 보여요</div>
            <label className="store-chip">
              {storeShort}<Icon name="chevD" size="sm" />
              <select value={ownerViewStoreId || 1} onChange={(e) => setOwnerViewStoreId(Number(e.target.value))} aria-label="미리볼 매장">
                {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="main-content">
        {page === 'home' && (
          <Home
            user={currentUser} storeId={currentStoreId} storeShort={storeShort} banners={banners} categories={categories}
            filterLarge={filterLarge} filterMedium={filterMedium} filterSmall={filterSmall}
            onLarge={(v) => { setFilterLarge(v); setFilterMedium('전체'); setFilterSmall('전체'); }}
            onMedium={(v) => { setFilterMedium(v); setFilterSmall('전체'); }}
            onSmall={setFilterSmall}
            largeObj={selectedLargeObj} mediumObj={selectedMediumObj}
            list={filterLarge === '행사중' ? eventProducts : filteredProducts}
            loading={productsLoading} error={productsError} onRetry={() => loadProducts(currentStoreId)}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
            wishlist={wishlist} onWish={toggleWishlist} onAdd={addToCart}
            onOpen={(product) => { setSelectedProduct(product); goToPage('productDetail'); }}
            onSearch={() => goToPage('search')}
            onAi={() => setChatOpen(true)}
            onSignup={() => { setLoginMode('signup'); setPage('login'); }}
            fallbackImage={getCategoryImage}
          />
        )}

        {/* 화면 조각을 받는 동안 — 「불러오는 중…」 글자 대신 화면 뼈대(S43, 묶음 1) */}
        <Suspense fallback={<PageFallback />}>
        {page === 'notice'          && <Notice storeId={currentStoreId} isAdmin={isAdmin} goBack={goBack} />}
        {/* 묶음 6 — 최근 본 상품(S41)·내 리뷰(S42) · 가격·그림은 지금 매장 상품 목록에서 */}
        {page === 'recentViews'     && <RecentViews products={products} wishlist={wishlist} adultOk={!!(currentUser && currentUser.isAdult)} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} onAddToCart={addToCart} onToggleWish={toggleWishlist} goBack={goBack} goToHome={() => goToPage('home')} />}
        {/* 묶음 6 — 매장안내(S44)·고객센터(S46) · 매장 바꾸기는 점포 선택과 같은 사람만(손님 · 대표 미리보기) — 회원은 가입 매장 */}
        {page === 'storeInfo'       && <StoreInfo goBack={goBack} onChooseStore={isOwner ? (id) => { setOwnerViewStoreId(id); handleStoreSelected(id); } : !user ? (id) => { setGuestStoreId(id); handleStoreSelected(id); } : null} />}
        {page === 'events'          && <Events storeId={currentStoreId} products={products} wishlist={wishlist} adultOk={!!(currentUser && currentUser.isAdult)} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} onAddToCart={addToCart} onToggleWish={toggleWishlist} goBack={goBack} goToHome={() => goToPage('home')} />}
        {page === 'customerCenter'  && <CustomerCenter goBack={goBack} onOpenChat={() => setChatOpen(true)} />}
        {page === 'myReviews'       && <MyReviews products={products} goBack={goBack} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} />}
        {/* 찜(S19) — 카드는 지금 매장 상품 목록의 값(가격·품절·행사)으로. 이 매장에 없는 상품은 품절로 보인다(담을 수 없다) — 묶음 5 */}
        {page === 'wishlist'        && <Wishlist wishlist={wishlist.map((w) => products.find((p) => p.id === w.id) || { ...w, isSoldOut: true })} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} goBack={goBack} goToHome={() => goToPage('home')} adultOk={!!(currentUser && currentUser.isAdult)} />}
        {page === 'search'          && <Search products={products} goBack={goBack} storeId={currentStoreId} user={currentUser} onProductClick={(product) => { setSelectedProduct(product); goToPage('productDetail'); }} onAddToCart={addToCart} />}
        {page === 'productDetail'   && <ProductDetail product={selectedProduct} onBack={goBack} onAddToCart={addToCart} onBuyNow={(item) => { if (!user) { requireLogin(); return; } setQuickOrderItem(item); goToPage('quickOrder'); }} user={currentUser} storeId={currentStoreId} storeShort={storeShort} adultOk={!!(currentUser && currentUser.isAdult)} wished={!!(selectedProduct && wishlist.some((w) => w.id === selectedProduct.id))} wishlist={wishlist} onToggleWish={toggleWishlist} onNeedLogin={requireLogin} onOpenProduct={(p) => setSelectedProduct(products.find((x) => x.id === p.id) || p)} />}
        {/* 주문서 한 장(P03) — 바로 주문(1건)과 장바구니의 「주문하기」(전부)가 같은 화면 · 결제 함수는 예전 그대로 둘 — 묶음 3 */}
        {page === 'quickOrder'      && <QuickOrder items={quickOrderItem ? [quickOrderItem] : []} title="바로 주문" onBack={goBack} onPayment={(finalPrice, extras) => handleQuickPayment(quickOrderItem, finalPrice, extras)} user={currentUser} />}
        {page === 'orderSheet'      && <QuickOrder items={shopCart.orderItems} title="주문서" onBack={goBack} onPayment={handlePayment} user={currentUser} />}
        {page === 'cart'            && <Cart cart={shopCart} loggedIn={!!user} onLogin={() => setPage('login')} onOrder={() => goToPage('orderSheet')} onHome={() => goToPage('home')} />}
        {(page === 'orders' || page === 'purchases') && <OrderHistory orders={orders} onReloadOrders={loadMyOrders} onOpenConsent={() => setNeedsConsent(true)} openSaleId={pushSaleId} onOpened={() => setPushSaleId(null)} onShop={() => goToPage('home')} onDetail={setOrdersDetail} />}
        {page === 'receipt'         && <Receipt order={lastOrder} onClose={() => goToPage('orders')} onGoHome={() => goToPage('home')} />}
        {page === 'notificationSettings' && <NotificationSettings goBack={goBack} />}
        {/* 마이(P02) — 로그인 안 한 손님도 연다(S47 — 로그인·회원가입 단추) · 묶음 5 */}
        {page === 'mypage'          && <MyPage user={user ? currentUser : null} orders={orders} wishlist={wishlist} goToPage={goToPage} onLogout={handleLogout} users={users} setUsers={setUsers} onUserChange={(patch) => setUser((u) => (u ? { ...u, ...patch } : u))} isAdmin={isAdmin} onLogin={() => setPage('login')} onSignup={() => { setLoginMode('signup'); setPage('login'); }} />}
        {page === 'about'           && <About user={user} storeId={currentStoreId} storeShort={storeShort} goBack={goBack} onShop={() => goToPage('home')} onNotice={() => goToPage('notice')} onStores={() => goToPage('storeInfo')} onEvents={() => goToPage('events')} onHelp={() => goToPage('customerCenter')} onSignup={() => { setLoginMode('signup'); setPage('login'); }} />}
        </Suspense>

        {/* 제3자 제공 동의 팝업 — 로그인 직후 자동으로 뜨는 것 말고, 구매 내역에서
            직접 열 수도 있다(거절했던 회원이 마음을 바꿀 길). */}
        {needsConsent && (
          <ThirdPartyConsentModal
            onDone={(agreed) => {
              setNeedsConsent(false);
              if (agreed !== null) setUser(u => (u ? { ...u, thirdPartyConsent: agreed ? 1 : 0 } : u));
            }}
          />
        )}
      </div>

      {/* 하단 탭 — 홈·검색·장바구니·주문내역·마이(결정 6). 폰·태블릿 모두 — 묶음 1 */}
      {!noTab && <TabBar page={page} cartCount={shopCart.count} loggedIn={!!user} onGo={goToPage} onNeedLogin={(key) => requireLogin({ orders: '주문내역은', mypage: '마이 화면은' }[key])} />}

      {/* 토스트(S35) — 탭바 바로 위. 담김은 확인 표시, 막힘은 경고 표시 — 묶음 1 */}
      {toast && (
        <div className="toast" role="status">
          <Icon name={/담겼|담았/.test(toast) ? 'check' : 'alert'} />
          <span>{toast}</span>
        </div>
      )}

      <Chatbot open={chatOpen} onClose={() => setChatOpen(false)} />
      {/* 목업대로 옮긴 화면(홈은 사업자 정보 아래 제 바닥글 · 검색은 없음)에는 옛 바닥글을 안 그린다 — 묶음 2 */}
      {!v2Page && <footer style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: 'var(--gray-400)', borderTop: '1px solid var(--gray-200)' }}>
        © 2026 Dongsin Market. All rights reserved.
      </footer>}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <DialogProvider>
        <UpdateGate>
          <AppContent />
        </UpdateGate>
      </DialogProvider>
    </ThemeProvider>
  );
}

export default App;