import { useState, useRef, useEffect } from 'react';
import FindAccount from './FindAccount';
import srmLogo from '../srm_logo.png';

function Login({ onLogin, onGuest }) {
  const [isSignup, setIsSignup] = useState(false);
  const [isFindAccount, setIsFindAccount] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [autoLogin, setAutoLogin] = useState(false);
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('srmart_users');
    return saved ? JSON.parse(saved) : [
      { name: '관리자', email: 'admin@srmart.com', password: '1234' }
    ];
  });

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const nameRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('srmart_auto_login');
    if (saved) {
      try {
        const { email, password } = JSON.parse(saved);
        const user = users.find((u) => u.email === email && u.password === password);
        if (user) onLogin(user);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('srmart_users', JSON.stringify(users));
  }, [users]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = () => {
    const user = users.find((u) => u.email === form.email && u.password === form.password);
    if (user) {
      if (user.grade === '장기미고객') {
        alert('이용이 제한된 계정이에요. 관리자에게 문의해주세요!');
        return;
      }
      if (autoLogin) {
        localStorage.setItem('srmart_auto_login', JSON.stringify({ email: form.email, password: form.password }));
      } else {
        localStorage.removeItem('srmart_auto_login');
      }
      onLogin(user);
    } else {
      alert('아이디 또는 비밀번호가 틀렸어요!');
    }
  };

  const handleSignup = () => {
    if (!form.name || !form.email || !form.password || !form.phone) {
      alert('이름, 아이디, 비밀번호, 휴대폰 번호는 필수예요!');
      return;
    }
    if (users.find((u) => u.email === form.email)) {
      alert('이미 가입된 아이디예요!');
      return;
    }
    setUsers([...users, { name: form.name, email: form.email, password: form.password, phone: form.phone, address: form.address }]);
    alert(form.name + '님 가입을 축하해요! 🎉');
    setIsSignup(false);
    setForm({ name: '', email: '', password: '', phone: '', address: '' });
  };

  const handleKeyDownName = (e) => { if (e.key === 'Enter') emailRef.current?.focus(); };
  const handleKeyDownEmail = (e) => { if (e.key === 'Enter') passwordRef.current?.focus(); };
  const handleKeyDownPassword = (e) => { if (e.key === 'Enter') { if (isSignup) handleSignup(); else handleLogin(); } };

  if (isFindAccount) {
    return <FindAccount users={users} onBack={() => setIsFindAccount(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>

      {/* 상단 그린 영역 */}
      <div style={{ background: 'linear-gradient(160deg, #00c471 0%, #00a85e 100%)', padding: '60px 32px 80px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <img src={srmLogo} alt="SR Mart" style={{ height: '180px', objectFit: 'contain', marginBottom: '12px', position: 'relative', zIndex: 1 }} />
        <span style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: '32px', color: 'white', fontWeight: '700', position: 'relative', zIndex: 1 }}>에스알마트</span>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginTop: '6px', position: 'relative', zIndex: 1 }}>신선하고 다양한 상품을 만나보세요</span>
      </div>

      {/* 하단 폼 영역 */}
      <div style={{ flex: 1, background: 'white', borderRadius: '28px 28px 0 0', marginTop: '-24px', padding: '32px 24px', position: 'relative', zIndex: 2 }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#212529', margin: '0 0 6px' }}>
          {isSignup ? '회원가입' : '로그인'}
        </h2>
        <p style={{ fontSize: '13px', color: '#868e96', margin: '0 0 28px' }}>
          {isSignup ? '계정을 만들어 쇼핑을 시작하세요' : '아이디와 비밀번호를 입력해주세요'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isSignup && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>이름</label>
              <input ref={nameRef} name="name" value={form.name} onChange={handleChange} onKeyDown={handleKeyDownName} placeholder="이름을 입력해주세요" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8f9fa' }} onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }} onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }} />
            </div>
          )}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>아이디</label>
            <input ref={emailRef} name="email" value={form.email} onChange={handleChange} onKeyDown={handleKeyDownEmail} placeholder="아이디를 입력해주세요" type="text" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8f9fa' }} onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }} onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>비밀번호</label>
            <input ref={passwordRef} name="password" value={form.password} onChange={handleChange} onKeyDown={handleKeyDownPassword} placeholder="비밀번호를 입력해주세요" type="password" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8f9fa' }} onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }} onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }} />
          </div>

          {isSignup && (
            <>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>휴대폰 번호</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" type="tel" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8f9fa' }} onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }} onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>주소 (선택)</label>
                <input name="address" value={form.address} onChange={handleChange} placeholder="주소를 입력해주세요" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8f9fa' }} onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }} onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }} />
              </div>
            </>
          )}

          {!isSignup && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="autoLogin" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#00c471', cursor: 'pointer' }} />
                <label htmlFor="autoLogin" style={{ fontSize: '13px', color: '#868e96', cursor: 'pointer' }}>자동 로그인</label>
              </div>
              <span onClick={() => setIsFindAccount(true)} style={{ fontSize: '13px', color: '#00c471', cursor: 'pointer', fontWeight: '600' }}>아이디/비밀번호 찾기</span>
            </div>
          )}

          <button onClick={isSignup ? handleSignup : handleLogin} style={{ padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', marginTop: '8px', boxShadow: '0 4px 16px rgba(0,196,113,0.3)', letterSpacing: '-0.3px' }}>
            {isSignup ? '회원가입' : '로그인'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ fontSize: '14px', color: '#868e96' }}>
            {isSignup ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
          </span>
          <span onClick={() => { setIsSignup(!isSignup); setForm({ name: '', email: '', password: '', phone: '', address: '' }); }} style={{ fontSize: '14px', color: '#00c471', cursor: 'pointer', fontWeight: '700' }}>
            {isSignup ? '로그인' : '회원가입'}
          </span>
        </div>

        {onGuest && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span onClick={onGuest} style={{ fontSize: '13px', color: '#adb5bd', cursor: 'pointer', textDecoration: 'underline' }}>
              로그인 없이 둘러보기
            </span>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#dee2e6' }}>© 2026 Dongsin Market. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Login;