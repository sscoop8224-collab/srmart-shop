import { useState } from 'react';

function MyPage({ user, orders, wishlist, goToPage, onLogout, users, setUsers }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    addressDetail: user?.addressDetail || '',
    zipCode: user?.zipCode || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

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
    width: '100%', padding: '12px 14px', border: '1.5px solid #e8faf3',
    borderRadius: '12px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', background: '#f8fffe', fontFamily: 'inherit'
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
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '80px' }}>

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
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 2px' }}>{currentUser?.email}</p>
            {currentUser?.phone && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{currentUser.phone}</p>}
            {currentUser?.address && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{currentUser.address}</p>}
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ margin: '-28px 16px 0', background: 'white', borderRadius: '20px', padding: '4px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', zIndex: 2, border: '1px solid #f0faf5' }}>
        <div style={{ textAlign: 'center', padding: '20px 16px', cursor: 'pointer', borderRadius: '16px' }} onClick={() => goToPage('orders')}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#00c471', margin: '0 0 4px' }}>{orders.length}</p>
          <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0, fontWeight: '600' }}>주문내역</p>
        </div>
        <div style={{ textAlign: 'center', padding: '20px 16px', cursor: 'pointer', borderLeft: '1px solid #f0faf5', borderRadius: '16px' }} onClick={() => goToPage('wishlist')}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#ff4757', margin: '0 0 4px' }}>{wishlist.length}</p>
          <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0, fontWeight: '600' }}>찜 목록</p>
        </div>
      </div>

      {/* 회원정보 수정 버튼 */}
      <div style={{ margin: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <button onClick={() => {
          setForm({ name: currentUser?.name || '', phone: currentUser?.phone || '', address: currentUser?.address || '', addressDetail: currentUser?.addressDetail || '', zipCode: currentUser?.zipCode || '' });
          setShowEditModal(true);
        }} style={{ background: 'white', border: '1.5px solid #00c471', borderRadius: '14px', padding: '14px 0', fontSize: '14px', fontWeight: '600', color: '#00c471', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(0,196,113,0.1)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          회원정보 수정
        </button>
        <button onClick={() => { setPwForm({ current: '', next: '', confirm: '' }); setPwError(''); setShowPwModal(true); }}
          style={{ background: 'white', border: '1.5px solid #e8faf3', borderRadius: '14px', padding: '14px 0', fontSize: '14px', fontWeight: '600', color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#495057" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          비밀번호 변경
        </button>
      </div>

      {/* 메뉴 */}
      <div style={{ margin: '0 16px 12px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
        {menuItems.map((menu, index) => (
          <div key={menu.label} onClick={() => goToPage(menu.page)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: index < menuItems.length - 1 ? '1px solid #f8fffe' : 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: '#f0faf5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {menu.icon}
              </div>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>{menu.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {menu.sub && <span style={{ fontSize: '13px', color: '#00c471', fontWeight: '700' }}>{menu.sub}</span>}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* 로그아웃 */}
      <div style={{ margin: '0 16px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', background: '#fff0f1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#ff4757' }}>로그아웃</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#dee2e6' }}>© 2026 Dongsin Market. All rights reserved.</p>

      {/* 회원정보 수정 모달 */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowEditModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a1a' }}>회원정보 수정</span>
              <button style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#adb5bd' }} onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: '#adb5bd', marginBottom: '6px', fontWeight: '600' }}>이메일 (변경 불가)</div>
              <div style={{ padding: '12px 14px', background: '#f8fffe', borderRadius: '12px', fontSize: '14px', color: '#adb5bd', border: '1.5px solid #f0faf5' }}>{currentUser?.email}</div>
            </div>
            {[{ key: 'name', label: '이름 *', placeholder: '이름 입력' }, { key: 'phone', label: '연락처', placeholder: '010-0000-0000' }, { key: 'zipCode', label: '우편번호', placeholder: '예: 21565' }, { key: 'address', label: '주소', placeholder: '예: 인천시 서구 검암동' }, { key: 'addressDetail', label: '상세주소', placeholder: '예: 101동 1001호' }].map(f => (
              <div key={f.key} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#00a85e', marginBottom: '6px', fontWeight: '700' }}>{f.label}</div>
                <input style={inputStyle} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            {saveMsg && (
              <div style={{ background: '#f0faf5', border: '1px solid #00c471', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#00a85e', fontWeight: '600', marginBottom: '14px', textAlign: 'center' }}>
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
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a1a' }}>비밀번호 변경</span>
              <button style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#adb5bd' }} onClick={() => setShowPwModal(false)}>✕</button>
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