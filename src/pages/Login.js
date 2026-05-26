import { useState, useRef, useEffect } from 'react';
import FindAccount from './FindAccount';
import srmLogo from '../srm_logo.png';

// ✅ 나이 계산 함수 (주민번호 앞 6자리로)
function calcAge(frontId) {
  if (!frontId || frontId.length !== 6) return null;
  const yy = parseInt(frontId.slice(0, 2));
  const mm = parseInt(frontId.slice(2, 4));
  const dd = parseInt(frontId.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  // 2000년대생 기준 (뒷자리 1,2 → 1900년대, 3,4 → 2000년대)
  // 앞자리만으로는 정확한 연도 불가, 뒷 첫자리로 판단
  return { yy, mm, dd };
}

function calcAgeFromId(frontId, genderDigit) {
  if (!frontId || frontId.length !== 6) return null;
  const yy = parseInt(frontId.slice(0, 2));
  const mm = parseInt(frontId.slice(2, 4));
  const dd = parseInt(frontId.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const g = parseInt(genderDigit);
  let fullYear;
  if (g === 1 || g === 2) fullYear = 1900 + yy;
  else if (g === 3 || g === 4) fullYear = 2000 + yy;
  else return null;
  const today = new Date();
  let age = today.getFullYear() - fullYear;
  const birthday = new Date(fullYear, mm - 1, dd);
  if (today < birthday) age--;
  return age;
}

function Login({ onLogin, onGuest }) {
  const [isSignup, setIsSignup] = useState(false);
  const [isFindAccount, setIsFindAccount] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    address: '', addressDetail: '',
    idFront: '',     // 주민번호 앞 6자리
    idGender: '',    // 주민번호 뒷 첫자리 (성별)
  });
  const [autoLogin, setAutoLogin] = useState(false);

  // 휴대폰 인증
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [codeStep, setCodeStep] = useState(false); // 인증번호 입력 단계
  const [codeMsg, setCodeMsg] = useState('');

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('srmart_users');
    return saved ? JSON.parse(saved) : [
      { name: '관리자', email: 'admin@srmart.com', password: '1234', grade: '관리자' },
      { name: '이민우', email: 'sscoop@naver.com', password: '1234', grade: '일반' },
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

  const emptyForm = {
    name: '', email: '', password: '', phone: '',
    address: '', addressDetail: '', idFront: '', idGender: '',
  };
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    if (!form.email || !form.password) { alert('아이디와 비밀번호를 입력해주세요!'); return; }
    try {
      const res = await import('../api').then(m => m.login(form.email, form.password));
      const { token, user } = res.data;
      localStorage.setItem('srmart_token', token);
      if (autoLogin) {
        localStorage.setItem('srmart_auto_login', JSON.stringify({ email: form.email, password: form.password }));
      } else {
        localStorage.removeItem('srmart_auto_login');
      }
      onLogin(user);
    } catch (err) {
      alert(err.response?.data?.error || '아이디 또는 비밀번호가 틀렸어요!');
    }
  };

  // ✅ 휴대폰 인증번호 발송 (로직만 — 실제 SMS 없이 화면에 표시)
  const sendVerifyCode = () => {
    if (!form.phone || form.phone.replace(/-/g, '').length < 10) {
      alert('휴대폰 번호를 먼저 입력해주세요');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6자리 랜덤
    setVerifyCode(code);
    setCodeStep(true);
    setInputCode('');
    setCodeMsg('');
    // 실제 서비스에서는 여기서 SMS API 호출
    alert(`[테스트] 인증번호: ${code}\n실제 서비스에서는 SMS로 발송돼요.`);
  };

  const checkVerifyCode = () => {
    if (inputCode === verifyCode) {
      setPhoneVerified(true);
      setCodeMsg('✅ 인증 완료됐어요!');
    } else {
      setCodeMsg('❌ 인증번호가 틀렸어요. 다시 확인해주세요.');
    }
  };

  const handleSignup = () => {
    if (!form.name || !form.email || !form.password || !form.phone) {
      alert('이름, 아이디, 비밀번호, 휴대폰 번호는 필수예요!');
      return;
    }
    if (!phoneVerified) {
      alert('휴대폰 인증을 완료해주세요!');
      return;
    }
    if (!form.idFront || form.idFront.length !== 6 || !form.idGender) {
      alert('주민번호를 올바르게 입력해주세요!');
      return;
    }
    if (!/^\d{6}$/.test(form.idFront)) {
      alert('주민번호 앞자리는 숫자 6자리예요!');
      return;
    }
    if (!['1','2','3','4'].includes(form.idGender)) {
      alert('주민번호 뒷자리 성별코드가 올바르지 않아요 (1~4)');
      return;
    }
    if (users.find((u) => u.email === form.email)) {
      alert('이미 가입된 아이디예요!');
      return;
    }

    // 나이 계산
    const age = calcAgeFromId(form.idFront, form.idGender);
    const isAdult = age !== null && age >= 19;

    const newUser = {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      address: form.address,
      addressDetail: form.addressDetail,
      idFront: form.idFront,          // 앞 6자리 저장
      idGender: form.idGender,         // 뒷 첫자리 저장
      isAdult,                          // 성인 여부
      age,
      grade: '일반',
    };
    setUsers([...users, newUser]);
    alert(form.name + '님 가입을 축하해요! 🎉' + (isAdult ? '' : '\n미성년자로 확인됐어요. 성인 상품 구매가 제한돼요.'));
    setIsSignup(false);
    setForm({ ...emptyForm });
    setPhoneVerified(false);
    setCodeStep(false);
    setVerifyCode('');
    setInputCode('');
    setCodeMsg('');
  };

  const handleCancel = () => {
    setIsSignup(false);
    setForm({ ...emptyForm });
    setPhoneVerified(false);
    setCodeStep(false);
    setVerifyCode('');
    setInputCode('');
    setCodeMsg('');
  };

  const handleKeyDownName = (e) => { if (e.key === 'Enter') emailRef.current?.focus(); };
  const handleKeyDownEmail = (e) => { if (e.key === 'Enter') passwordRef.current?.focus(); };
  const handleKeyDownPassword = (e) => { if (e.key === 'Enter') { if (isSignup) handleSignup(); else handleLogin(); } };

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '14px',
    border: '1.5px solid #e8faf3', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8fffe',
    transition: 'all 0.2s', color: '#1a1a1a'
  };
  const inputFocus = (e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 3px rgba(0,196,113,0.1)'; };
  const inputBlur = (e) => { e.target.style.borderColor = '#e8faf3'; e.target.style.background = '#f8fffe'; e.target.style.boxShadow = 'none'; };
  const labelStyle = { fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' };

  if (isFindAccount) {
    return <FindAccount users={users} onBack={() => setIsFindAccount(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>

      {/* 상단 그린 영역 */}
      <div style={{
        background: 'linear-gradient(160deg, #00c471 0%, #00a85e 100%)',
        padding: '60px 32px 80px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-30px', width: '220px', height: '220px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '30px', left: '20px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.04)', borderRadius: '50%' }} />
        <img src={srmLogo} alt="SR Mart" style={{ height: '160px', objectFit: 'contain', marginBottom: '12px', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }} />
        <span style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: '32px', color: 'white', fontWeight: '700', position: 'relative', zIndex: 1 }}>에스알마트</span>
        <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', marginTop: '6px', position: 'relative', zIndex: 1 }}>신선하고 다양한 상품을 만나보세요</span>
      </div>

      {/* 하단 폼 영역 */}
      <div style={{
        flex: 1, background: 'white', borderRadius: '28px 28px 0 0',
        marginTop: '-28px', padding: '32px 24px',
        position: 'relative', zIndex: 2,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.06)'
      }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px' }}>
          {isSignup ? '회원가입' : '로그인'}
        </h2>
        <p style={{ fontSize: '13px', color: '#adb5bd', margin: '0 0 28px' }}>
          {isSignup ? '계정을 만들어 쇼핑을 시작하세요' : '아이디와 비밀번호를 입력해주세요'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {isSignup && (
            <div>
              <label style={labelStyle}>이름</label>
              <input ref={nameRef} name="name" value={form.name} onChange={handleChange}
                onKeyDown={handleKeyDownName} placeholder="이름을 입력해주세요"
                style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
            </div>
          )}

          <div>
            <label style={labelStyle}>아이디</label>
            <input ref={emailRef} name="email" value={form.email} onChange={handleChange}
              onKeyDown={handleKeyDownEmail} placeholder="아이디를 입력해주세요"
              type="text" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          <div>
            <label style={labelStyle}>비밀번호</label>
            <input ref={passwordRef} name="password" value={form.password} onChange={handleChange}
              onKeyDown={handleKeyDownPassword} placeholder="비밀번호를 입력해주세요"
              type="password" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
          </div>

          {isSignup && (
            <>
              {/* ✅ 휴대폰 번호 + 인증 */}
              <div>
                <label style={labelStyle}>휴대폰 번호 *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    name="phone" value={form.phone} onChange={handleChange}
                    placeholder="010-0000-0000" type="tel"
                    style={{ ...inputStyle, flex: 1 }}
                    onFocus={inputFocus} onBlur={inputBlur}
                    disabled={phoneVerified}
                  />
                  <button
                    type="button"
                    onClick={sendVerifyCode}
                    disabled={phoneVerified}
                    style={{
                      padding: '14px 12px', background: phoneVerified ? '#dee2e6' : 'linear-gradient(135deg, #00c471, #00a85e)',
                      color: 'white', border: 'none', borderRadius: '14px',
                      fontSize: '12px', fontWeight: '700', cursor: phoneVerified ? 'default' : 'pointer', whiteSpace: 'nowrap'
                    }}
                  >
                    {phoneVerified ? '✓ 완료' : codeStep ? '재발송' : '인증 요청'}
                  </button>
                </div>

                {/* 인증번호 입력 */}
                {codeStep && !phoneVerified && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={inputCode}
                      onChange={e => setInputCode(e.target.value)}
                      placeholder="인증번호 6자리 입력"
                      maxLength={6}
                      style={{ ...inputStyle, flex: 1 }}
                      onFocus={inputFocus} onBlur={inputBlur}
                    />
                    <button
                      type="button"
                      onClick={checkVerifyCode}
                      style={{
                        padding: '14px 12px', background: '#212529',
                        color: 'white', border: 'none', borderRadius: '14px',
                        fontSize: '12px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap'
                      }}
                    >
                      확인
                    </button>
                  </div>
                )}

                {codeMsg && (
                  <div style={{ fontSize: 12, marginTop: 6, color: codeMsg.startsWith('✅') ? '#009a58' : '#ff4757', fontWeight: 600 }}>
                    {codeMsg}
                  </div>
                )}
              </div>

              {/* ✅ 주민번호 */}
              <div>
                <label style={labelStyle}>주민등록번호 (성인 인증용)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* 앞 6자리 */}
                  <input
                    name="idFront"
                    value={form.idFront}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setForm(p => ({ ...p, idFront: val }));
                    }}
                    placeholder="앞 6자리"
                    maxLength={6}
                    type="text"
                    inputMode="numeric"
                    style={{ ...inputStyle, flex: 1, letterSpacing: 4 }}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                  <span style={{ fontSize: 20, color: '#adb5bd', fontWeight: 700 }}>-</span>
                  {/* 뒷 1자리 (성별) */}
                  <input
                    name="idGender"
                    value={form.idGender}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 1);
                      setForm(p => ({ ...p, idGender: val }));
                    }}
                    placeholder="1"
                    maxLength={1}
                    type="text"
                    inputMode="numeric"
                    style={{ ...inputStyle, width: 44, textAlign: 'center', letterSpacing: 0, flexShrink: 0 }}
                    onFocus={inputFocus} onBlur={inputBlur}
                  />
                  {/* 뒷 6자리 — * 처리 */}
                  <div style={{
                    flex: 1, padding: '14px 16px', borderRadius: '14px',
                    border: '1.5px solid #e8faf3', background: '#f1f3f5',
                    color: '#adb5bd', fontSize: 18, letterSpacing: 6, userSelect: 'none'
                  }}>
                    ******
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#adb5bd', marginTop: 6 }}>
                  ※ 성인 인증 목적으로만 사용되며 안전하게 보호돼요
                </div>
                {/* 나이 미리보기 */}
                {form.idFront.length === 6 && form.idGender && (
                  (() => {
                    const age = calcAgeFromId(form.idFront, form.idGender);
                    if (age === null) return <div style={{ fontSize: 12, color: '#ff4757', marginTop: 4 }}>⚠ 올바른 주민번호를 입력해주세요</div>;
                    return (
                      <div style={{ fontSize: 12, marginTop: 6, color: age >= 19 ? '#009a58' : '#ff4757', fontWeight: 600 }}>
                        {age >= 19 ? `✅ 성인 확인됐어요 (만 ${age}세)` : `⚠ 미성년자예요 (만 ${age}세) — 성인 상품 구매가 제한돼요`}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* 주소 */}
              <div>
                <label style={labelStyle}>주소</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input name="address" value={form.address} readOnly
                    placeholder="주소 검색 버튼을 눌러주세요"
                    style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={() => {
                    new window.daum.Postcode({
                      oncomplete: (data) => {
                        setForm((prev) => ({ ...prev, address: data.roadAddress || data.jibunAddress, addressDetail: '' }));
                      }
                    }).open();
                  }} style={{
                    padding: '14px 14px', background: 'linear-gradient(135deg, #00c471, #00a85e)',
                    color: 'white', border: 'none', borderRadius: '14px',
                    fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap'
                  }}>
                    주소 찾기
                  </button>
                </div>
                <input name="addressDetail" value={form.addressDetail} onChange={handleChange}
                  placeholder="상세 주소 (동/호수 등)"
                  style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
              </div>
            </>
          )}

          {!isSignup && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="autoLogin" checked={autoLogin}
                  onChange={(e) => setAutoLogin(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#00c471', cursor: 'pointer' }} />
                <label htmlFor="autoLogin" style={{ fontSize: '13px', color: '#868e96', cursor: 'pointer' }}>자동 로그인</label>
              </div>
              <span onClick={() => setIsFindAccount(true)}
                style={{ fontSize: '13px', color: '#00c471', cursor: 'pointer', fontWeight: '600' }}>
                아이디/비밀번호 찾기
              </span>
            </div>
          )}

          {/* 메인 버튼 */}
          <button onClick={isSignup ? handleSignup : handleLogin}
            style={{
              padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)',
              color: 'white', border: 'none', borderRadius: '16px',
              fontSize: '16px', cursor: 'pointer', fontWeight: '800',
              marginTop: '4px', boxShadow: '0 4px 20px rgba(0,196,113,0.35)',
              letterSpacing: '-0.3px', transition: 'all 0.2s'
            }}>
            {isSignup ? '회원가입' : '로그인'}
          </button>

          {isSignup && (
            <button onClick={handleCancel}
              style={{
                padding: '14px', background: '#f8fffe',
                color: '#00a85e', border: '1.5px solid #e8faf3',
                borderRadius: '16px', fontSize: '15px',
                cursor: 'pointer', fontWeight: '700'
              }}>
              취소
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <span style={{ fontSize: '14px', color: '#adb5bd' }}>
            {isSignup ? '이미 계정이 있으신가요? ' : '계정이 없으신가요? '}
          </span>
          <span onClick={() => { setIsSignup(!isSignup); setForm({ ...emptyForm }); setPhoneVerified(false); setCodeStep(false); setVerifyCode(''); setInputCode(''); setCodeMsg(''); }}
            style={{ fontSize: '14px', color: '#00c471', cursor: 'pointer', fontWeight: '700' }}>
            {isSignup ? '로그인으로 돌아가기' : '회원가입'}
          </span>
        </div>

        {onGuest && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span onClick={onGuest}
              style={{ fontSize: '13px', color: '#adb5bd', cursor: 'pointer', textDecoration: 'underline' }}>
              로그인 없이 둘러보기
            </span>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#dee2e6' }}>
          © 2026 Dongsin Market. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
