import { useState, useEffect } from 'react';
import { useTheme } from '../ThemeContext';
import { getMyPoints, getMyActiveCoupons } from '../api';

function MyPage({ user, orders, wishlist, goToPage, onLogout, users, setUsers, isAdmin }) {
  const { darkMode, setDarkMode, resetToSystem } = useTheme();
  const [myPoints, setMyPoints] = useState(null); // { points, expiring_soon }
  const [myUserCoupons, setMyUserCoupons] = useState([]);
  const [showCouponList, setShowCouponList] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    addressDetail: user?.addressDetail || '',
    zipCode: user?.zipCode || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [myCoupons, setMyCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [couponsLoading, setCouponsLoading] = useState(false);

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';
  const modalBg = darkMode ? '#242424' : 'white';
  const modalTextColor = darkMode ? '#f0f0f0' : '#1a1a1a';

  useEffect(() => {
    if (user) {
      getMyPoints().then(r => setMyPoints(r.data)).catch(() => {});
      getMyActiveCoupons().then(r => setMyUserCoupons(r.data || [])).catch(() => {});
    }
  }, [user]);

  const currentUser = users?.find(u => u.email === user?.email) || user;

  const menuItems = [
    { label: '주문내역', sub: orders.length + '건', page: 'orders',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
    { label: '찜 목록', sub: wishlist.length + '개', page: 'wishlist',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
    { label: '공지사항', sub: '', page: 'notice',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg> },
  ];

  const inputStyle = {
    width: '100%', padding: '12px 14px', border: `1.5px solid ${inputBorder}`,
    borderRadius: '12px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', background: inputBg, fontFamily: 'inherit',
    color: textColor
  };

  const fetchMyCoupons = async () => {
    setCouponsLoading(true);
    try {
      const API = (await import('../api')).default;
      const res = await API.get('/coupons/my');
      setMyCoupons(res.data);
    } catch (err) {
      console.error('쿠폰 불러오기 실패', err);
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleShowCoupons = () => {
    setShowCoupons(true);
    fetchMyCoupons();
  };

  const saveProfile = () => {
    if (!form.name.trim()) return alert('이름을 입력해주세요');
    if (setUsers) {
      setUsers(prev => prev.map(u => u.email === user.email ? { ...u, ...form } : u));
    }
    setSaveMsg('저장됐어요! ✅');
    setTimeout(() => { setSaveMsg(''); setShowEditModal(false); }, 1200);
  };

  const savePassword = () => {
    setPwError('');
    const cu = users?.find(u => u.email === user.email);
    if (!cu) return;
    if (cu.password !== pwForm.current) { setPwError('현재 비밀번호가 틀렸어요'); return; }
    if (pwForm.next.length < 4) { setPwError('새 비밀번호는 4자 이상이어야 해요'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('새 비밀번호가 일치하지 않아요'); return; }
    if (setUsers) {
      setUsers(prev => prev.map(u => u.email === user.email ? { ...u, password: pwForm.next } : u));
    }
    alert('비밀번호가 변경됐어요! 😊');
    setPwForm({ current: '', next: '', confirm: '' });
    setShowPwModal(false);
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 프로필 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #00c471, #00a85e)', padding: '40px 20px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.4)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 0 4px' }}>{currentUser?.name}님</p>
            {currentUser?.username && <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', margin: '0 0 3px', fontWeight: '600' }}>@{currentUser.username}</p>}
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{currentUser?.email}</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ margin: '-28px 16px 0', background: cardBg, borderRadius: '20px', padding: '4px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', zIndex: 2, border: `1px solid ${borderColor}` }}>
        <div style={{ textAlign: 'center', padding: '20px 16px', cursor: 'pointer', borderRadius: '16px' }} onClick={() => goToPage('orders')}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#00c471', margin: '0 0 4px' }}>{orders.length}</p>
          <p style={{ fontSize: '12px', color: subTextColor, margin: 0, fontWeight: '600' }}>주문내역</p>
        </div>
        <div style={{ textAlign: 'center', padding: '20px 16px', cursor: 'pointer', borderLeft: `1px solid ${borderColor}`, borderRadius: '16px' }} onClick={() => goToPage('wishlist')}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#ff4757', margin: '0 0 4px' }}>{wishlist.length}</p>
          <p style={{ fontSize: '12px', color: subTextColor, margin: 0, fontWeight: '600' }}>찜 목록</p>
        </div>
        <div style={{ textAlign: 'center', padding: '20px 16px', cursor: 'pointer', borderLeft: `1px solid ${borderColor}`, borderRadius: '16px' }} onClick={handleShowCoupons}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#f0a500', margin: '0 0 4px' }}>{myCoupons.length}</p>
          <p style={{ fontSize: '12px', color: subTextColor, margin: 0, fontWeight: '600' }}>내 쿠폰</p>
        </div>
      </div>

      {/* 회원정보 수정 버튼 */}
      <div style={{ margin: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button onClick={() => {
          setForm({ name: currentUser?.name || '', email: currentUser?.email || '', phone: currentUser?.phone || '', address: currentUser?.address || '', addressDetail: currentUser?.addressDetail || '', zipCode: currentUser?.zipCode || '' });
          setShowEditModal(true);
        }} style={{ background: cardBg, border: '1.5px solid #00c471', borderRadius: '14px', padding: '14px 0', fontSize: '14px', fontWeight: '600', color: '#00c471', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,196,113,0.1)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          회원정보 수정
        </button>
        <button onClick={() => { setPwForm({ current: '', next: '', confirm: '' }); setPwError(''); setShowPwModal(true); }}
          style={{ background: cardBg, border: `1.5px solid ${borderColor}`, borderRadius: '14px', padding: '14px 0', fontSize: '14px', fontWeight: '600', color: textColor, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          비밀번호 변경
        </button>
      </div>

      {/* 등급 + 포인트 + 쿠폰 카드 */}
      <div style={{ margin: '0 16px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {/* 등급 카드 */}
        <div style={{ background: cardBg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${borderColor}` }}>
          <div style={{ fontSize: 11, color: subTextColor, marginBottom: 6, fontWeight: 600 }}>내 등급</div>
          {currentUser?.membership_tier ? (
            <div style={{ fontSize: 17, fontWeight: 800, color: '#00a85e' }}>{currentUser.membership_tier}</div>
          ) : (
            <div style={{ fontSize: 14, color: subTextColor }}>등급 없음</div>
          )}
          <div style={{ fontSize: 11, color: subTextColor, marginTop: 4 }}>누적 구매 기반 등급</div>
        </div>
        {/* 포인트 카드 */}
        <div style={{ background: cardBg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${borderColor}` }}>
          <div style={{ fontSize: 11, color: subTextColor, marginBottom: 6, fontWeight: 600 }}>내 포인트</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1a73e8' }}>
            {myPoints != null ? Number(myPoints.points).toLocaleString() : '-'}<span style={{ fontSize: 12, marginLeft: 2 }}>P</span>
          </div>
          {myPoints?.expiring_soon > 0 && (
            <div style={{ fontSize: 10, color: '#e65100', marginTop: 4 }}>30일 내 {Number(myPoints.expiring_soon).toLocaleString()}P 만료</div>
          )}
        </div>
        {/* 쿠폰 카드 */}
        <div onClick={() => setShowCouponList(true)} style={{ background: cardBg, borderRadius: 16, padding: '14px 16px', border: `1px solid ${borderColor}`, cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: subTextColor, marginBottom: 6, fontWeight: 600 }}>내 쿠폰</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#e65100' }}>
            {myUserCoupons.filter(c => !c.used_at).length}<span style={{ fontSize: 12, marginLeft: 2 }}>장</span>
          </div>
          <div style={{ fontSize: 10, color: subTextColor, marginTop: 4 }}>미사용 쿠폰</div>
        </div>
      </div>

      {/* 내 쿠폰 목록 */}
      {showCouponList && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCouponList(false); }}>
          <div style={{ background: cardBg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: textColor }}>내 쿠폰</div>
              <button onClick={() => setShowCouponList(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: subTextColor, cursor: 'pointer' }}>✕</button>
            </div>
            {myUserCoupons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: subTextColor }}>보유 쿠폰이 없어요</div>
            ) : myUserCoupons.map(uc => (
              <div key={uc.id} style={{ background: uc.used_at ? (darkMode ? '#2a2a2a' : '#f5f5f5') : (darkMode ? '#1e2a2e' : '#f0faf5'), borderRadius: 12, padding: '14px 16px', marginBottom: 10, opacity: uc.used_at ? 0.6 : 1, border: `1px solid ${borderColor}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{uc.coupon_name}</div>
                    <div style={{ fontSize: 12, color: '#00a85e', fontWeight: 700, marginTop: 3 }}>
                      {uc.discount_type === 'percent' ? `${uc.discount}% 할인` : `₩${Number(uc.discount).toLocaleString()} 할인`}
                      {uc.min_purchase_amount > 0 && <span style={{ color: subTextColor, fontWeight: 400 }}> | ₩{Number(uc.min_purchase_amount).toLocaleString()} 이상</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, background: uc.used_at ? '#eee' : '#e6f9f1', color: uc.used_at ? '#aaa' : '#009a58' }}>
                    {uc.used_at ? '사용완료' : '사용가능'}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: subTextColor, marginTop: 6 }}>
                  {uc.valid_until ? `~${uc.valid_until.split('T')[0]}` : '기간 없음'} · 코드: {uc.code}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <div style={{ margin: '0 16px 12px', background: cardBg, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
        {menuItems.map((menu, index) => (
          <div key={menu.label} onClick={() => goToPage(menu.page)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: index < menuItems.length - 1 ? `1px solid ${borderColor}` : 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {menu.icon}
              </div>
              <span style={{ fontSize: '15px', fontWeight: '600', color: textColor }}>{menu.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {menu.sub && <span style={{ fontSize: '13px', color: '#00c471', fontWeight: '700' }}>{menu.sub}</span>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* 관리자 링크 */}
      {isAdmin && (
        <div style={{ margin: '0 16px 12px' }}>
          <a href="/admin" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: darkMode ? '#1a2e1a' : '#e6f9f1', borderRadius: '20px', border: '1.5px solid #00c471', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: darkMode ? '#1e3a2a' : '#c8f5e0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                🔧
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', color: '#00a85e' }}>관리자 페이지로 이동</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
      )}

      {/* 테마 설정 */}
      <div style={{ margin: '0 16px 12px', background: cardBg, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
        {/* 다크모드 토글 행 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', background: darkMode ? '#1a3a2a' : '#f0f0f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: textColor }}>
                {darkMode ? '다크 모드' : '라이트 모드'}
              </div>
              <div style={{ fontSize: '11px', color: subTextColor, marginTop: 1 }}>
                {localStorage.getItem('srmart_dark_manual') === 'true' ? '수동 설정 중' : '시스템 설정 따르는 중'}
              </div>
            </div>
          </div>
          <div onClick={() => setDarkMode(!darkMode)}
            style={{ width: '50px', height: '28px', borderRadius: '14px', background: darkMode ? '#00c471' : '#ddd', position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: darkMode ? '25px' : '3px', transition: 'all 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
          </div>
        </div>

        {/* 시스템 설정 따르기 행 */}
        <div style={{ padding: '0 20px 14px', borderTop: `1px solid ${borderColor}`, paddingTop: 12 }}>
          <button
            onClick={resetToSystem}
            disabled={localStorage.getItem('srmart_dark_manual') !== 'true'}
            style={{
              width: '100%', padding: '9px', borderRadius: '10px',
              border: `1px solid ${localStorage.getItem('srmart_dark_manual') === 'true' ? '#00a85e' : borderColor}`,
              background: localStorage.getItem('srmart_dark_manual') === 'true' ? (darkMode ? '#1a3a2a' : '#f0faf5') : 'transparent',
              color: localStorage.getItem('srmart_dark_manual') === 'true' ? '#00a85e' : subTextColor,
              fontSize: '13px', fontWeight: '600', cursor: localStorage.getItem('srmart_dark_manual') === 'true' ? 'pointer' : 'default',
              fontFamily: 'inherit', opacity: localStorage.getItem('srmart_dark_manual') === 'true' ? 1 : 0.45,
            }}>
            🔄 시스템 설정 따르기
          </button>
        </div>
      </div>

      {/* 로그아웃 */}
      <div style={{ margin: '0 16px', background: cardBg, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', background: '#fff0f1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#ff4757' }}>로그아웃</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: subTextColor }}>© 2026 Dongsin Market. All rights reserved.</p>

      {/* 내 쿠폰 모달 */}
      {showCoupons && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowCoupons(false)}>
          <div style={{ background: modalBg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '17px', fontWeight: '700', color: modalTextColor }}>🎫 내 쿠폰함</span>
              <button style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: subTextColor }} onClick={() => setShowCoupons(false)}>✕</button>
            </div>
            {couponsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: subTextColor }}>로딩 중...</div>
            ) : myCoupons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎫</div>
                <p style={{ color: subTextColor, fontSize: '14px' }}>보유한 쿠폰이 없어요</p>
              </div>
            ) : myCoupons.map(coupon => {
              const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
              return (
                <div key={coupon.id} style={{ background: darkMode ? '#2e2e2e' : '#f8fffe', borderRadius: '16px', padding: '16px', marginBottom: '10px', border: `1.5px solid ${coupon.is_used || isExpired ? borderColor : '#00c471'}`, opacity: coupon.is_used || isExpired ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '800', color: coupon.is_used || isExpired ? subTextColor : '#00c471', margin: '0 0 4px' }}>
                        {coupon.type === 'percent' ? `${coupon.discount}% 할인` : `₩${Number(coupon.discount).toLocaleString()} 할인`}
                      </p>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: modalTextColor, margin: '0 0 4px', fontFamily: 'monospace' }}>{coupon.code}</p>
                      {coupon.description && <p style={{ fontSize: '12px', color: subTextColor, margin: '0 0 4px' }}>{coupon.description}</p>}
                      {coupon.min_order_amount > 0 && <p style={{ fontSize: '11px', color: subTextColor, margin: 0 }}>최소 ₩{Number(coupon.min_order_amount).toLocaleString()} 이상 주문 시</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '20px', fontWeight: '700',
                        background: coupon.is_used ? '#f0f0f0' : isExpired ? '#fff0f1' : '#e6f9f1',
                        color: coupon.is_used ? '#aaa' : isExpired ? '#ff4757' : '#009a58' }}>
                        {coupon.is_used ? '사용완료' : isExpired ? '만료됨' : '사용가능'}
                      </span>
                      {coupon.expires_at && !coupon.is_used && (
                        <p style={{ fontSize: '11px', color: subTextColor, margin: '6px 0 0' }}>
                          {isExpired ? '만료됨' : `${new Date(coupon.expires_at).toLocaleDateString('ko-KR')} 까지`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 회원정보 수정 모달 */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowEditModal(false)}>
          <div style={{ background: modalBg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '17px', fontWeight: '700', color: modalTextColor }}>회원정보 수정</span>
              <button style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: subTextColor }} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: subTextColor, marginBottom: '6px', fontWeight: '600' }}>아이디 (변경 불가)</div>
              <div style={{ padding: '12px 14px', background: inputBg, borderRadius: '12px', fontSize: '14px', color: subTextColor, border: `1.5px solid ${borderColor}` }}>
                {currentUser?.username ? `@${currentUser.username}` : '(미설정)'}
              </div>
            </div>
            {[{ key: 'name', label: '이름 *', placeholder: '이름 입력' }, { key: 'email', label: '이메일 (선택사항)', placeholder: 'example@email.com' }, { key: 'phone', label: '연락처', placeholder: '010-0000-0000' }, { key: 'zipCode', label: '우편번호', placeholder: '주소 검색 시 자동 입력' }, { key: 'address', label: '주소', placeholder: '주소 찾기 버튼을 눌러주세요' }, { key: 'addressDetail', label: '상세주소', placeholder: '예: 101동 1001호' }].map(f => (
              <div key={f.key} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#00a85e', marginBottom: '6px', fontWeight: '700' }}>{f.label}</div>
                {f.key === 'address' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder={f.placeholder} value={form[f.key]} readOnly onClick={() => {
                      if (window.daum) {
                        new window.daum.Postcode({ oncomplete: (data) => setForm(p => ({ ...p, address: data.roadAddress || data.jibunAddress, zipCode: data.zonecode || '' })) }).open();
                      } else { alert('주소 검색 서비스를 불러오는 중이에요!'); }
                    }} />
                    <button type="button" onClick={() => {
                      if (window.daum) {
                        new window.daum.Postcode({ oncomplete: (data) => setForm(p => ({ ...p, address: data.roadAddress || data.jibunAddress, zipCode: data.zonecode || '' })) }).open();
                      } else { alert('주소 검색 서비스를 불러오는 중이에요!'); }
                    }} style={{ padding: '12px 14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      주소 찾기
                    </button>
                  </div>
                ) : f.key === 'zipCode' ? (
                  <input style={{ ...inputStyle, background: inputBg, color: subTextColor }} placeholder={f.placeholder} value={form[f.key] || ''} readOnly />
                ) : (
                  <input style={inputStyle} placeholder={f.placeholder} value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                )}
              </div>
            ))}
            {saveMsg && (
              <div style={{ background: darkMode ? '#2e2e2e' : '#f0faf5', border: '1px solid #00c471', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#00a85e', fontWeight: '600', marginBottom: '14px', textAlign: 'center' }}>
                {saveMsg}
              </div>
            )}
            <button onClick={saveProfile} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', color: 'white', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              저장하기
            </button>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {showPwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowPwModal(false)}>
          <div style={{ background: modalBg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '17px', fontWeight: '700', color: modalTextColor }}>비밀번호 변경</span>
              <button style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: subTextColor }} onClick={() => setShowPwModal(false)}>✕</button>
            </div>
            {[{ key: 'current', label: '현재 비밀번호', placeholder: '현재 비밀번호' }, { key: 'next', label: '새 비밀번호', placeholder: '새 비밀번호 (4자 이상)' }, { key: 'confirm', label: '새 비밀번호 확인', placeholder: '새 비밀번호 다시 입력' }].map(f => (
              <div key={f.key} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#00a85e', marginBottom: '6px', fontWeight: '700' }}>{f.label}</div>
                <input type="password" style={inputStyle} placeholder={f.placeholder} value={pwForm[f.key]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            {pwError && (
              <div style={{ background: '#fff0f1', border: '1px solid #ff4757', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#ff4757', marginBottom: '14px' }}>
                ⚠️ {pwError}
              </div>
            )}
            <button onClick={savePassword} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', color: 'white', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              비밀번호 변경
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage;
