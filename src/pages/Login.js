import { useState, useRef, useEffect } from 'react';
import FindAccount from './FindAccount';
import srmLogo from '../srm_logo.png';

function Login({ onLogin, onGuest }) {
  const [isSignup, setIsSignup] = useState(false);
  const [isFindAccount, setIsFindAccount] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      if (autoLogin) {
        localStorage.setItem('srmart_auto_login', JSON.stringify({ email: form.email, password: form.password }));
      } else {
        localStorage.removeItem('srmart_auto_login');
      }
      onLogin(user);
    } else {
      alert('이메일 또는 비밀번호가 틀렸어요!');
    }
  };

  const handleSignup = () => {
    if (!form.name || !form.email || !form.password) {
      alert('모든 항목을 입력해주세요!');
      return;
    }
    if (users.find((u) => u.email === form.email)) {
      alert('이미 가입된 이메일이에요!');
      return;
    }
    setUsers([...users, { name: form.name, email: form.email, password: form.password }]);
    alert(form.name + '님 가입을 축하해요! 🎉');
    setIsSignup(false);
    setForm({ name: '', email: '', password: '' });
  };

  const handleKeyDownName = (e) => { if (e.key === 'Enter') emailRef.current?.focus(); };
  const handleKeyDownEmail = (e) => { if (e.key === 'Enter') passwordRef.current?.focus(); };
  const handleKeyDownPassword = (e) => { if (e.key === 'Enter') { if (isSignup) handleSignup(); else handleLogin(); } };

  if (isFindAccount) {
    return <FindAccount users={users} onBack={() => setIsFindAccount(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #e8faf3 0%, #ffffff 60%)', padding: '24px' }}>

      {/* 로고 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        <img src={srmLogo} alt="SR Mart" style={{ height: '80px', objectFit: 'contain', marginBottom: '8px' }} />
        <span style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: '28px', color: '#1b5e20', fontWeight: '700' }}>에스알마트</span>
        <span style={{ fontSize: '13px', color: '#868e96', marginTop: '4px' }}>신선하고 다양한 상품을 만나보세요</span>
      </div>

      {/* 폼 */}
      <div style={{ background: 'white', borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px rgba(0,196,113,0.1)', border: '1px solid #e8faf3' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#212529', fontSize: '18px', fontWeight: '800' }}>
          {isSignup ? '회원가입' : '로그인'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isSignup && (
            <input ref={nameRef} name="name" value={form.name} onChange={handleChange} onKeyDown={handleKeyDownName} placeholder="이름" style={{ padding: '13px 16px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={(e) => e.target.style.borderColor = '#00c471'} onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
          )}
          <input ref={emailRef} name="email" value={form.email} onChange={handleChange} onKeyDown={handleKeyDownEmail} placeholder="이메일" type="email" style={{ padding: '13px 16px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={(e) => e.target.style.borderColor = '#00c471'} onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />
          <input ref={passwordRef} name="password" value={form.password} onChange={handleChange} onKeyDown={handleKeyDownPassword} placeholder="비밀번호" type="password" style={{ padding: '13px 16px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} onFocus={(e) => e.target.style.borderColor = '#00c471'} onBlur={(e) => e.target.style.borderColor = '#e9ecef'} />

          {!isSignup && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="autoLogin" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#00c471', cursor: 'pointer' }} />
              <label htmlFor="autoLogin" style={{ fontSize: '13px', color: '#868e96', cursor: 'pointer', fontWeight: '500' }}>자동 로그인</label>
            </div>
          )}

          <button onClick={isSignup ? handleSignup : handleLogin} style={{ padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', marginTop: '4px', letterSpacing: '-0.3px' }}>
            {isSignup ? '회원가입' : '로그인'}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <span onClick={() => { setIsSignup(!isSignup); setForm({ name: '', email: '', password: '' }); }} style={{ color: '#00c471', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>
            {isSignup ? '로그인' : '회원가입'}
          </span>
          {!isSignup && (
            <span onClick={() => setIsFindAccount(true)} style={{ color: '#868e96', cursor: 'pointer', fontSize: '14px' }}>
              아이디/비밀번호 찾기
            </span>
          )}
        </div>
      </div>

      {/* 로그인 없이 둘러보기 */}
      {onGuest && (
        <button onClick={onGuest} style={{ marginTop: '16px', background: 'transparent', border: 'none', color: '#868e96', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}>
          로그인 없이 둘러보기
        </button>
      )}

      <p style={{ marginTop: '16px', fontSize: '12px', color: '#adb5bd' }}>© 2026 Dongsin Market. All rights reserved.</p>
    </div>
  );
}

export default Login;