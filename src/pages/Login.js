import React, { useState, useEffect } from 'react';
import FindAccount from './FindAccount';
import srmLogo from '../srm_logo.png';

// ── 나이 계산 함수 ──────────────────────────────────────────
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

// ── Brand tokens ────────────────────────────────────────────
const COLORS = {
  green:       '#1FA938',
  greenDark:   '#178A2D',
  greenLite:   '#3DD25C',
  greenTint:   '#F2FBF4',
  greenBorder: 'rgba(31,169,56,0.18)',
  yellow:      '#F5C518',
  ink900:      '#14110F',
  ink700:      '#3A332E',
  ink500:      '#6B6259',
  ink300:      '#B6ADA4',
  danger:      '#E5484D',
};

// ── 아이콘 ──────────────────────────────────────────────────
const EyeIcon = ({ open }) => open ? (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
) : (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.3 3.9M6.5 7.6C3.7 9.5 2 12 2 12s3.5 6 10 6c1.6 0 3-.3 4.3-.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.9 10a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const CheckBox = ({ on }) => (
  <span style={{
    width: 18, height: 18, borderRadius: 4,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    border: on ? `1.5px solid ${COLORS.green}` : '1.5px solid #C9C2BA',
    background: on ? COLORS.green : '#fff',
    transition: 'all 0.15s ease', flexShrink: 0,
  }}>
    {on && (
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.5L4.8 8.8L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )}
  </span>
);

// ── Field 컴포넌트 ──────────────────────────────────────────
function Field({ label, placeholder, type, value, onChange, error, trailing, disabled }) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? COLORS.danger : focused ? COLORS.green : COLORS.greenBorder;

  return (
    <div>
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 700,
        color: COLORS.greenDark, marginBottom: 6, letterSpacing: '-0.01em',
      }}>
        {label}
      </label>
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        height: 52, borderRadius: 14,
        background: disabled ? '#f1f3f5' : focused ? '#fff' : COLORS.greenTint,
        border: `1.5px solid ${borderColor}`,
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
        boxShadow: focused && !error ? `0 0 0 4px rgba(31,169,56,0.10)` : 'none',
        paddingRight: trailing ? 6 : 0,
      }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          style={{
            flex: 1, height: '100%', border: 'none', outline: 'none',
            background: 'transparent', padding: '0 16px',
            fontSize: 15, fontWeight: 500, color: COLORS.ink900,
            letterSpacing: '-0.01em',
          }}
        />
        {trailing}
      </div>
      {error && (
        <div style={{
          marginTop: 6, fontSize: 12.5, color: COLORS.danger, fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8 4.5v4M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

// ── Green Hero 헤더 ─────────────────────────────────────────
function GreenHero() {
  return (
    <div style={{
      position: 'relative',
      background: `linear-gradient(165deg, ${COLORS.greenLite} 0%, ${COLORS.green} 55%, ${COLORS.greenDark} 100%)`,
      padding: '60px 28px 80px',
      color: '#fff', textAlign: 'center', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -40, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
      <div style={{ position: 'absolute', top: 30, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ position: 'absolute', top: 140, left: 30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(245,197,24,0.16)' }} />
      <div style={{ position: 'absolute', bottom: 90, right: 40, width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 84, height: 84, borderRadius: 22, overflow: 'hidden',
          margin: '0 auto',
          boxShadow: '0 14px 30px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.10)',
          background: COLORS.green, border: '3px solid rgba(255,255,255,0.6)',
        }}>
          <img src={srmLogo} alt="SR Mart" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{
          marginTop: 16,
          fontFamily: '"Nanum Pen Script", cursive',
          fontSize: 34, lineHeight: 1, letterSpacing: '0.02em',
          color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }}>
          에스알마트
        </div>
        <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 500, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em' }}>
          신선하고 다양한 상품을 만나보세요
        </div>
      </div>

      <svg viewBox="0 0 440 60" preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 60, display: 'block' }}>
        <path d="M0,60 L0,30 Q110,0 220,28 T440,30 L440,60 Z" fill="#fff" />
      </svg>
    </div>
  );
}

// ── 메인 컴포넌트 ───────────────────────────────────────────
function Login({ onLogin, onGuest }) {
  const [mode, setMode] = useState('login');
  const [isFindAccount, setIsFindAccount] = useState(false);

  // 로그인 상태
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);

  // 회원가입 상태
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', phone: '',
    address: '', addressDetail: '', idFront: '', idGender: '',
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [codeStep, setCodeStep] = useState(false);
  const [codeMsg, setCodeMsg] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const emptyForm = {
    name: '', username: '', email: '', password: '', phone: '',
    address: '', addressDetail: '', idFront: '', idGender: '',
  };

  useEffect(() => {
    const saved = localStorage.getItem('srmart_auto_login');
    if (saved) {
      try {
        const { username, password } = JSON.parse(saved);
        doLogin(username, password);
      } catch (e) {}
    }
  }, []);

  const doLogin = async (username, password) => {
    try {
      await onLogin({ username, password });
    } catch (err) {}
  };

  const handleLogin = async () => {
    const e = {};
    if (!loginForm.username.trim()) e.username = '아이디를 입력해주세요.';
    if (!loginForm.password) e.password = '비밀번호를 입력해주세요.';
    setLoginErrors(e);
    if (Object.keys(e).length) return;

    try {
      setLoginLoading(true);
      if (remember) {
        localStorage.setItem('srmart_auto_login', JSON.stringify({ username: loginForm.username, password: loginForm.password }));
      } else {
        localStorage.removeItem('srmart_auto_login');
      }
      await onLogin({ username: loginForm.username, password: loginForm.password });
    } catch (err) {
      setLoginErrors({ password: err.response?.data?.error || '아이디 또는 비밀번호가 틀려요!' });
    } finally {
      setLoginLoading(false);
    }
  };

  const sendVerifyCode = () => {
    if (!form.phone || form.phone.replace(/-/g, '').length < 10) {
      alert('전화번호를 올바르게 입력해주세요'); return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setVerifyCode(code);
    setCodeStep(true);
    setInputCode('');
    setCodeMsg('');
    alert(`[테스트] 인증코드: ${code}\n실제 서비스에서는 SMS로 발송됩니다.`);
  };

  const checkVerifyCode = () => {
    if (inputCode === verifyCode) {
      setPhoneVerified(true);
      setCodeMsg('✅ 인증 완료됐어요!');
    } else {
      setCodeMsg('❌ 인증코드가 틀려요. 다시 확인해주세요.');
    }
  };

  const handleSignup = async () => {
    if (!form.name || !form.username || !form.email || !form.password || !form.phone) {
      alert('이름, 아이디, 이메일, 비밀번호, 전화번호는 필수예요!'); return;
    }
    if (!phoneVerified) { alert('전화번호 인증을 완료해주세요!'); return; }
    if (!form.idFront || form.idFront.length !== 6 || !form.idGender) {
      alert('주민번호를 올바르게 입력해주세요!'); return;
    }
    if (!/^\d{6}$/.test(form.idFront)) { alert('주민번호 앞자리는 숫자 6자리예요!'); return; }
    if (!['1', '2', '3', '4'].includes(form.idGender)) { alert('주민번호 뒷자리 첫번째가 올바르지 않아요 (1~4)'); return; }

    const age = calcAgeFromId(form.idFront, form.idGender);
    const isAdult = age !== null && age >= 19;

    try {
      setSignupLoading(true);
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
          addressDetail: form.addressDetail,
          idFront: form.idFront,
          idGender: form.idGender,
          isAdult,
          age,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '회원가입 실패');
      alert(form.name + '님 가입을 환영해요! 🎉' + (isAdult ? '' : '\n미성년자로 확인됐어요. 성인 상품 구매가 제한됩니다.'));
      setMode('login');
      setForm({ ...emptyForm });
      setPhoneVerified(false);
      setCodeStep(false);
      setVerifyCode('');
      setInputCode('');
      setCodeMsg('');
    } catch (err) {
      alert(err.message || '회원가입 중 오류가 발생했어요.');
    } finally {
      setSignupLoading(false);
    }
  };

  const resetSignup = () => {
    setForm({ ...emptyForm });
    setPhoneVerified(false);
    setCodeStep(false);
    setVerifyCode('');
    setInputCode('');
    setCodeMsg('');
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: '14px',
    border: `1.5px solid ${COLORS.greenBorder}`, fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit', background: COLORS.greenTint,
    transition: 'all 0.2s', color: COLORS.ink900,
  };
  const inputFocus = (e) => { e.target.style.borderColor = COLORS.green; e.target.style.background = 'white'; e.target.style.boxShadow = '0 0 0 4px rgba(31,169,56,0.10)'; };
  const inputBlur = (e) => { e.target.style.borderColor = COLORS.greenBorder; e.target.style.background = COLORS.greenTint; e.target.style.boxShadow = 'none'; };
  const labelStyle = { fontSize: 13, fontWeight: 700, color: COLORS.greenDark, display: 'block', marginBottom: 6, letterSpacing: '-0.01em' };

  if (isFindAccount) {
    return <FindAccount onBack={() => setIsFindAccount(false)} />;
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" rel="stylesheet" />
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: COLORS.ink900 }}>

        <GreenHero />

        <div style={{ flex: 1, padding: '12px 26px 0', marginTop: -8, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', background: '#fff' }}>

          {/* 로그인 모드 */}
          {mode === 'login' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.ink900, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                  즐거운 쇼핑을 시작하세요
                </h1>
                <p style={{ margin: '8px 0 0', fontSize: 13.5, color: COLORS.ink500, letterSpacing: '-0.01em' }}>
                  오늘도 SR Mart에서 좋은 하루 되세요
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field
                  label="아이디"
                  placeholder="아이디를 입력해주세요"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => { setLoginForm({ ...loginForm, username: e.target.value }); if (loginErrors.username) setLoginErrors({ ...loginErrors, username: null }); }}
                  error={loginErrors.username}
                />
                <Field
                  label="비밀번호"
                  placeholder="비밀번호를 입력해주세요"
                  type={showPw ? 'text' : 'password'}
                  value={loginForm.password}
                  onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); if (loginErrors.password) setLoginErrors({ ...loginErrors, password: null }); }}
                  error={loginErrors.password}
                  trailing={
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', color: showPw ? COLORS.greenDark : COLORS.ink300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <EyeIcon open={showPw} />
                    </button>
                  }
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <button type="button" onClick={() => setRemember(r => !r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: COLORS.ink700 }}>
                  <CheckBox on={remember} />
                  자동 로그인
                </button>
                <button type="button" onClick={() => setIsFindAccount(true)}
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: COLORS.greenDark }}>
                  아이디/비밀번호 찾기
                </button>
              </div>

              <button onClick={handleLogin} disabled={loginLoading}
                style={{
                  marginTop: 14, height: 52, borderRadius: 14, border: 'none',
                  background: loginLoading ? COLORS.ink300 : `linear-gradient(180deg, #2BC047 0%, ${COLORS.greenDark} 100%)`,
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: loginLoading ? 'default' : 'pointer',
                  boxShadow: loginLoading ? 'none' : '0 10px 24px rgba(23,138,45,0.32)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {loginLoading ? '로그인 중...' : '로그인'}
              </button>

              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: COLORS.ink500 }}>
                계정이 없으신가요?{' '}
                <button type="button" onClick={() => { setMode('signup'); resetSignup(); }}
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: COLORS.greenDark, borderBottom: `2px solid ${COLORS.yellow}`, paddingBottom: 1 }}>
                  회원가입
                </button>
              </div>

              {onGuest && (
                <button type="button" onClick={onGuest}
                  style={{ marginTop: 10, alignSelf: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12.5, color: COLORS.ink500, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  로그인 없이 둘러보기
                </button>
              )}
            </>
          )}

          {/* 회원가입 모드 */}
          {mode === 'signup' && (
            <>
              <div style={{ marginBottom: 14 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: COLORS.ink900, letterSpacing: '-0.03em' }}>회원가입</h1>
                <p style={{ margin: '8px 0 0', fontSize: 13.5, color: COLORS.ink500 }}>정보를 입력하고 쇼핑을 시작해보세요!</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <div>
                  <label style={labelStyle}>이름</label>
                  <input name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="이름을 입력해주세요" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </div>

                <div>
                  <label style={labelStyle}>아이디</label>
                  <input name="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="아이디를 입력해주세요" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </div>

                <div>
                  <label style={labelStyle}>이메일</label>
                  <input name="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="이메일을 입력해주세요" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </div>

                <div>
                  <label style={labelStyle}>비밀번호</label>
                  <input name="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="비밀번호를 입력해주세요" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </div>

                <div>
                  <label style={labelStyle}>전화번호 *</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input name="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                      placeholder="010-0000-0000" type="tel" disabled={phoneVerified}
                      style={{ ...inputStyle, flex: 1 }} onFocus={inputFocus} onBlur={inputBlur} />
                    <button type="button" onClick={sendVerifyCode} disabled={phoneVerified}
                      style={{ padding: '0 14px', height: 52, background: phoneVerified ? '#dee2e6' : `linear-gradient(135deg, ${COLORS.green}, ${COLORS.greenDark})`, color: 'white', border: 'none', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: phoneVerified ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
                      {phoneVerified ? '✅ 완료' : codeStep ? '재발송' : '인증 발송'}
                    </button>
                  </div>
                  {codeStep && !phoneVerified && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input value={inputCode} onChange={e => setInputCode(e.target.value)}
                        placeholder="인증코드 6자리 입력" maxLength={6}
                        style={{ ...inputStyle, flex: 1 }} onFocus={inputFocus} onBlur={inputBlur} />
                      <button type="button" onClick={checkVerifyCode}
                        style={{ padding: '0 14px', height: 52, background: COLORS.ink900, color: 'white', border: 'none', borderRadius: 14, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        확인
                      </button>
                    </div>
                  )}
                  {codeMsg && (
                    <div style={{ fontSize: 12, marginTop: 6, color: codeMsg.startsWith('✅') ? '#009a58' : COLORS.danger, fontWeight: 600 }}>
                      {codeMsg}
                    </div>
                  )}
                </div>

                <div>
                  <label style={labelStyle}>주민등록번호 (성인 확인용)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input name="idFront" value={form.idFront}
                      onChange={e => setForm(p => ({ ...p, idFront: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      placeholder="앞 6자리" maxLength={6} type="text" inputMode="numeric"
                      style={{ ...inputStyle, flex: 1, letterSpacing: 4 }} onFocus={inputFocus} onBlur={inputBlur} />
                    <span style={{ fontSize: 20, color: COLORS.ink300, fontWeight: 700 }}>-</span>
                    <input name="idGender" value={form.idGender}
                      onChange={e => setForm(p => ({ ...p, idGender: e.target.value.replace(/\D/g, '').slice(0, 1) }))}
                      placeholder="1" maxLength={1} type="text" inputMode="numeric"
                      style={{ ...inputStyle, width: 44, textAlign: 'center', flexShrink: 0 }} onFocus={inputFocus} onBlur={inputBlur} />
                    <div style={{ flex: 1, height: 52, padding: '0 16px', borderRadius: 14, border: `1.5px solid ${COLORS.greenBorder}`, background: '#f1f3f5', color: COLORS.ink300, fontSize: 18, letterSpacing: 6, display: 'flex', alignItems: 'center' }}>
                      ******
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.ink300, marginTop: 6 }}>성인 확인 목적으로만 사용되며 전체번호는 저장되지 않아요</div>
                  {form.idFront.length === 6 && form.idGender && (() => {
                    const age = calcAgeFromId(form.idFront, form.idGender);
                    if (age === null) return <div style={{ fontSize: 12, color: COLORS.danger, marginTop: 4 }}>올바른 주민등록번호를 입력해주세요</div>;
                    return (
                      <div style={{ fontSize: 12, marginTop: 6, color: age >= 19 ? '#009a58' : COLORS.danger, fontWeight: 600 }}>
                        {age >= 19 ? `✅ 성인 확인됐어요! (만 ${age}세)` : `⚠️ 미성년자예요 (만 ${age}세) - 성인 상품 구매가 제한됩니다`}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label style={labelStyle}>주소</label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input name="address" value={form.address} readOnly
                      placeholder="주소 찾기 버튼을 눌러주세요"
                      style={{ ...inputStyle, flex: 1 }} />
                    <button type="button" onClick={() => {
                      new window.daum.Postcode({
                        oncomplete: (data) => setForm(p => ({ ...p, address: data.roadAddress || data.jibunAddress, addressDetail: '' }))
                      }).open();
                    }} style={{ padding: '0 14px', height: 52, background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.greenDark})`, color: 'white', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      주소 찾기
                    </button>
                  </div>
                  <input name="addressDetail" value={form.addressDetail} onChange={e => setForm({ ...form, addressDetail: e.target.value })}
                    placeholder="상세 주소 (동/호수 등)" style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </div>

              </div>

              <button onClick={handleSignup} disabled={signupLoading}
                style={{
                  marginTop: 20, height: 52, borderRadius: 14, border: 'none',
                  background: signupLoading ? COLORS.ink300 : `linear-gradient(180deg, #2BC047 0%, ${COLORS.greenDark} 100%)`,
                  color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: signupLoading ? 'default' : 'pointer',
                  boxShadow: signupLoading ? 'none' : '0 10px 24px rgba(23,138,45,0.32)',
                }}>
                {signupLoading ? '가입 중...' : '회원가입'}
              </button>

              <button onClick={() => { setMode('login'); resetSignup(); }}
                style={{ marginTop: 10, height: 48, borderRadius: 14, border: `1.5px solid ${COLORS.greenBorder}`, background: COLORS.greenTint, color: COLORS.greenDark, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                취소
              </button>

              <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: COLORS.ink500 }}>
                이미 계정이 있으신가요?{' '}
                <button type="button" onClick={() => { setMode('login'); resetSignup(); }}
                  style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: COLORS.greenDark, borderBottom: `2px solid ${COLORS.yellow}`, paddingBottom: 1 }}>
                  로그인하러 가기
                </button>
              </div>
            </>
          )}

          <div style={{ marginTop: 'auto', padding: '14px 0 12px', textAlign: 'center', fontSize: 10.5, color: COLORS.ink300 }}>
            © 2026 Dongsin Market. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
