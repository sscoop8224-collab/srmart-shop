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

  const menuItems = [
    { icon: '📋', label: '주문내역', sub: orders.length + '건', page: 'orders' },
    { icon: '❤️', label: '찜 목록', sub: wishlist.length + '개', page: 'wishlist' },
    { icon: '📢', label: '공지사항', sub: '', page: 'notice' },
  ];

  // 회원정보 저장
  const saveProfile = () => {
    if (!form.name.trim()) return alert('이름을 입력해주세요');
    if (setUsers) {
      setUsers(prev => prev.map(u =>
        u.email === user.email ? { ...u, ...form } : u
      ));
    }
    // user 객체도 업데이트 (App.js에서 user를 users에서 찾아 반영)
    setSaveMsg('저장됐어요! ✅');
    setTimeout(() => { setSaveMsg(''); setShowEditModal(false); }, 1200);
  };

  // 비밀번호 변경
  const savePassword = () => {
    setPwError('');
    const currentUser = users?.find(u => u.email === user.email);
    if (!currentUser) return;
    if (currentUser.password !== pwForm.current) { setPwError('현재 비밀번호가 틀렸어요'); return; }
    if (pwForm.next.length < 4) { setPwError('새 비밀번호는 4자 이상이어야 해요'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('새 비밀번호가 일치하지 않아요'); return; }
    if (setUsers) {
      setUsers(prev => prev.map(u =>
        u.email === user.email ? { ...u, password: pwForm.next } : u
      ));
    }
    alert('비밀번호가 변경됐어요! 😊');
    setPwForm({ current: '', next: '', confirm: '' });
    setShowPwModal(false);
  };

  // 현재 저장된 유저 정보 (최신)
  const currentUser = users?.find(u => u.email === user?.email) || user;

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 프로필 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #00c471, #00a85e)', padding: '40px 20px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: '2px solid rgba(255,255,255,0.4)' }}>👤</div>
          <div>
            <p style={{ fontSize: '20px', fontWeight: '800', color: 'white', margin: '0 0 4px' }}>{currentUser?.name}님</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 2px' }}>{currentUser?.email}</p>
            {currentUser?.phone && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>📱 {currentUser.phone}</p>}
            {currentUser?.address && <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>📍 {currentUser.address}</p>}
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ margin: '-28px 16px 0', background: 'white', borderRadius: '20px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', padding: '16px', cursor: 'pointer' }} onClick={() => goToPage('orders')}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#00c471', margin: '0 0 4px' }}>{orders.length}</p>
          <p style={{ fontSize: '12px', color: '#868e96', margin: 0, fontWeight: '600' }}>주문내역</p>
        </div>
        <div style={{ textAlign: 'center', padding: '16px', cursor: 'pointer', borderLeft: '1px solid #f1f3f5' }} onClick={() => goToPage('wishlist')}>
          <p style={{ fontSize: '28px', fontWeight: '900', color: '#ff4757', margin: '0 0 4px' }}>{wishlist.length}</p>
          <p style={{ fontSize: '12px', color: '#868e96', margin: 0, fontWeight: '600' }}>찜 목록</p>
        </div>
      </div>

      {/* 회원정보 수정 버튼 */}
      <div style={{ margin: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          onClick={() => { setForm({ name: currentUser?.name || '', phone: currentUser?.phone || '', address: currentUser?.address || '', addressDetail: currentUser?.addressDetail || '', zipCode: currentUser?.zipCode || '' }); setShowEditModal(true); }}
          style={{ background: 'white', border: '1.5px solid #00c471', borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 600, color: '#00c471', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 8px rgba(0,196,113,0.1)' }}
        >
          ✏️ 회원정보 수정
        </button>
        <button
          onClick={() => { setPwForm({ current: '', next: '', confirm: '' }); setPwError(''); setShowPwModal(true); }}
          style={{ background: 'white', border: '1.5px solid #dee2e6', borderRadius: 14, padding: '14px 0', fontSize: 14, fontWeight: 600, color: '#495057', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          🔒 비밀번호 변경
        </button>
      </div>

      {/* 메뉴 */}
      <div style={{ margin: '0 16px 16px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        {menuItems.map((menu, index) => (
          <div
            key={menu.label}
            onClick={() => goToPage(menu.page)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: index < menuItems.length - 1 ? '1px solid #f8f9fa' : 'none', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '40px', height: '40px', background: '#f8f9fa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{menu.icon}</div>
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#212529' }}>{menu.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {menu.sub && <span style={{ fontSize: '13px', color: '#00c471', fontWeight: '700' }}>{menu.sub}</span>}
              <span style={{ color: '#adb5bd', fontSize: '18px' }}>›</span>
            </div>
          </div>
        ))}
      </div>

      {/* 로그아웃 */}
      <div style={{ margin: '0 16px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
        <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px 20px', cursor: 'pointer' }}>
          <div style={{ width: '40px', height: '40px', background: '#fff0f1', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🚪</div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#ff4757' }}>로그아웃</span>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#dee2e6' }}>© 2026 Dongsin Market. All rights reserved.</p>

      {/* ✅ 회원정보 수정 모달 */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowEditModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#212529' }}>✏️ 회원정보 수정</span>
              <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#adb5bd' }} onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            {/* 이메일 (수정 불가) */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#868e96', marginBottom: 6, fontWeight: 600 }}>이메일 (변경 불가)</div>
              <div style={{ padding: '10px 14px', background: '#f8f9fa', borderRadius: 10, fontSize: 14, color: '#868e96' }}>{currentUser?.email}</div>
            </div>

            {/* 이름 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#495057', marginBottom: 6, fontWeight: 600 }}>이름 *</div>
              <input
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="이름 입력"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* 연락처 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#495057', marginBottom: 6, fontWeight: 600 }}>연락처</div>
              <input
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              />
            </div>

            {/* 우편번호 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#495057', marginBottom: 6, fontWeight: 600 }}>우편번호</div>
              <input
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="예: 21565"
                value={form.zipCode}
                onChange={e => setForm(p => ({ ...p, zipCode: e.target.value }))}
              />
            </div>

            {/* 주소 */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#495057', marginBottom: 6, fontWeight: 600 }}>주소</div>
              <input
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="예: 인천시 서구 검암동"
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              />
            </div>

            {/* 상세주소 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: '#495057', marginBottom: 6, fontWeight: 600 }}>상세주소</div>
              <input
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="예: 101동 1001호"
                value={form.addressDetail}
                onChange={e => setForm(p => ({ ...p, addressDetail: e.target.value }))}
              />
            </div>

            {saveMsg && (
              <div style={{ background: '#e6f9f1', border: '1px solid #00c471', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#009a58', fontWeight: 600, marginBottom: 14, textAlign: 'center' }}>
                {saveMsg}
              </div>
            )}

            <button
              onClick={saveProfile}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer' }}
            >
              저장하기
            </button>
          </div>
        </div>
      )}

      {/* ✅ 비밀번호 변경 모달 */}
      {showPwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowPwModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 17, fontWeight: 700, color: '#212529' }}>🔒 비밀번호 변경</span>
              <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#adb5bd' }} onClick={() => setShowPwModal(false)}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#495057', marginBottom: 6, fontWeight: 600 }}>현재 비밀번호</div>
              <input
                type="password"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="현재 비밀번호"
                value={pwForm.current}
                onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: '#495057', marginBottom: 6, fontWeight: 600 }}>새 비밀번호</div>
              <input
                type="password"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="새 비밀번호 (4자 이상)"
                value={pwForm.next}
                onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: '#495057', marginBottom: 6, fontWeight: 600 }}>새 비밀번호 확인</div>
              <input
                type="password"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: 10, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                placeholder="새 비밀번호 다시 입력"
                value={pwForm.confirm}
                onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
              />
            </div>

            {pwError && (
              <div style={{ background: '#fff0f1', border: '1px solid #ff4757', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff4757', marginBottom: 14 }}>
                ⚠️ {pwError}
              </div>
            )}

            <button
              onClick={savePassword}
              style={{ width: '100%', padding: '14px', background: '#212529', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer' }}
            >
              비밀번호 변경
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage;