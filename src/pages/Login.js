// 로그인(목업 정본 v1 의 S27) · 회원가입 3단계(P04) · 가입 완료 — 묶음 5 · 2026-11-12 밤
//
// 로그인 — 로고 · 인사 · 아이디/비밀번호(보기) · 자동 로그인 · 찾기 · 로그인 · 회원가입 · 둘러보기. 오류는 칸 아래에 바로 쓴다.
// 회원가입 — 한 화면에 칸이 11개라 길었다(S28). 「배송할 곳 → 계정 → 동의」 세 단계로 나눈다.
//   항목·문구·동의 방식·보내는 값은 예전 한 화면 그대로다(register 에 싣는 값이 같다).
//   🔸 목업 2단계의 「휴대폰 본인확인」 은 아직 없다 — 본인확인(S48)이 운영에 꺼져 있다. 그 전까지는 손으로 넣는 칸.
//   🔸 목업 3단계의 [필수] 만 14세 · 이용약관 줄은 넣지 않았다 — 서버가 받아 남기지 않는 동의를 화면에만 두면
//      「받았다」 는 증거가 없다. 서버에 칸이 생기면 함께 넣는다.
import { useState, useEffect, useRef } from 'react';
import FindAccount from './FindAccount';
import logo from '../assets/brand/logo_h_ko.png';
import { getStores, register, getCoverage } from '../api';
import { useDialog } from '../DialogContext';
import { todayYmd } from '../utils/localDate';
import Icon from '../components/ui/Icon';
// 동의 문구의 지점 목록 — 아래 `stores`(GET /api/stores?audience=customer)로 만든다. 못 불러오면 목록 없이 「각 지점」.
import { branchList } from '../utils/customerStores';

// 만 나이 — **생년월일**에서 계산한다.
//
// 예전엔 주민등록번호 앞 6자리 + 성별자리를 받아 계산했다(calcAgeFromId). 그 값은 서버에
// 평문으로 저장됐지만 읽는 코드가 한 곳도 없었고, 성인 여부는 여기서 나온 파생값만으로
// 끝난다. 주민등록번호는 법령 근거 없이는 수집 자체가 금지라(개인정보보호법 제24조의2)
// 생년월일로 바꿨다 — 성인 확인이라는 목적은 그대로 이루면서 받는 정보는 줄어든다.
function calcAgeFromBirth(birth) {
  if (!birth) return null;
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

// 가입 비밀번호 — 서버 validatePassword(index.js)와 같은 규칙. 화면은 안내만 하고 판정은 서버가 한다
// (아이디·이메일 포함 · 쉬운 단어는 서버가 막고, 그 말을 2단계 칸 아래에 그대로 쓴다).
const PW_KINDS = [['소문자', /[a-z]/], ['숫자', /[0-9]/], ['특수문자', /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/]];
const pwProblem = (p) => {
  if (!p || p.length < 6) return '비밀번호는 6자 이상이어야 해요!';
  if (PW_KINDS.filter(([, re]) => re.test(p)).length < 2) return '비밀번호는 소문자·숫자·특수문자 중 2종 이상을 포함해야 해요!';
  return '';
};

// 칸 하나 — 목업 field(라벨 · 칸 · 아래 오류)
function Field({ label, error, trail, children }) {
  return (
    <>
      {label && <label className="f-lbl">{label}</label>}
      <div className={`field${error ? ' err' : ''}`}>{children}{trail}</div>
      {error && <div className="f-err"><Icon name="alert" size="sm" />{error}</div>}
    </>
  );
}

// 네모 체크 — 진짜 체크박스는 숨겨 두고(키보드·읽어 주기) 모양만 목업대로
const SqCheck = ({ on }) => <span className={`check sq${on ? ' on' : ''}`}>{on && <Icon name="check" size="sm" />}</span>;

// 동의 한 줄 — 설명을 접어두지 않고 **항상 펼쳐서** 보여준다. 접어두면 대부분 안 펴보고 체크하는데,
// 그건 동의를 받았다고 하기 어렵다. 특히 선택 항목은 "동의 안 해도 된다" 는 사실이 보여야 의미가 있다.
// 줄 전체가 <label> — 휴대폰에서 체크만 겨냥하기 어렵다.
function ConsentRow({ checked, onChange, label, detail, required = false, big = false }) {
  return (
    <label className={`consent${big ? ' all' : ''}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <SqCheck on={checked} />
      <span className="ct">
        <b>{!big && <span className={required ? 'req' : 'opt-t'}>{required ? '[필수]' : '[선택]'}</span>}{!big && ' '}{label}</b>
        {detail && <p>{detail}</p>}
      </span>
    </label>
  );
}

// 비밀번호 보기 단추 — 누를 때 칸의 초점을 뺏지 않는다(키보드가 내려가지 않게) · 커서는 끝에.
function EyeBtn({ show, setShow, inputRef }) {
  return (
    <button type="button" className="trail" aria-label={show ? '비밀번호 가리기' : '비밀번호 보기'}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        setShow((s) => !s);
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (el) { el.focus(); const n = el.value.length; try { el.setSelectionRange(n, n); } catch {} }
        });
      }}>
      <Icon name="eye" size="sm" />
    </button>
  );
}

const EMPTY_FORM = { name: '', username: '', email: '', password: '', phone: '', address: '', addressDetail: '', birth: '' };

// ── 메인 ───────────────────────────────────────────────────
function Login({ onLogin, onGuest, initialMode }) {
  const { notify } = useDialog();
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');   // 홈 가입 쿠폰 띠 「가입하기」 → 바로 가입(묶음 2)
  const [isFindAccount, setIsFindAccount] = useState(false);

  // 로그인
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);   // 회원가입 비밀번호 표시
  const pwRef = useRef(null);
  const pw2Ref = useRef(null);
  const [remember, setRemember] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);

  // 회원가입 — step: 1 배송할 곳 · 2 계정 · 3 동의 · 'done' 가입 완료
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errs, setErrs] = useState({});
  const [signupLoading, setSignupLoading] = useState(false);
  const [done, setDone] = useState(null);                   // 가입 완료 — { name, storeName, isAdult, marketing, coupon }
  const [startLoading, setStartLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storesLoading, setStoresLoading] = useState(false);
  const [coverage, setCoverage] = useState(null);           // 배송권역 커버리지 결과 {stores, recommended}
  const [coverageLoading, setCoverageLoading] = useState(false);
  const [signupDong, setSignupDong] = useState('');         // Daum에서 받은 동 이름(bname) — 커버리지 주 기준
  const [signupZipcode, setSignupZipcode] = useState('');

  // 동의 항목 (2026-09-10 신설).
  //
  // 그전까지 가입 화면에는 **동의 항목이 하나도 없었다.** 개인정보 수집·이용 동의는 받아야
  // 하는 것이고(개인정보보호법 제15조), 동의를 받았다는 사실의 입증 책임은 사업자에게 있다.
  //
  // 두 개를 **분리해서** 받는다 — 묶으면 안 된다:
  //   · 개인정보 수집·이용 [필수] — 서비스 제공에 필요한 최소한. 없으면 가입이 성립 안 함.
  //   · 지점 통합 회원·포인트·구매 내역 제3자 제공 [선택] — 5개 지점이 **서로 다른
  //     사업자**라, 한 곳에서 가입한 회원 정보를 다른 지점이 쓰려면 제3자 제공 동의가
  //     필요하다. 동의하지 않아도 가입·주문은 그대로 되고, 매장 포인트 통합과 **매장
  //     구매 내역 표시(전자영수증)** 만 빠진다.
  //
  //   · 혜택 알림(행사·쿠폰) 수신 [선택] (2026-11-12 지시 5) — **광고성 정보**라 따로 묻는다
  //     (정보통신망법 제50조). 가입 요청에 `marketing_push` 로 싣고, 나중에 마이 → 알림 설정에서 바꾼다.
  //
  // 「전체 동의」(2026-11-12 P04 확정)는 **한 번에 체크하는 단추일 뿐**이다 — 줄마다 따로 켜고 끌 수
  // 있고, 서버에는 줄마다 따로 간다. 전체 동의 뒤 선택 줄 하나를 끄면 전체 동의도 꺼진다.
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [thirdPartyConsent, setThirdPartyConsent] = useState(false);
  const [marketingPush, setMarketingPush] = useState(false);
  const allConsent = privacyConsent && thirdPartyConsent && marketingPush;
  const setAllConsent = (v) => { setPrivacyConsent(v); setThirdPartyConsent(v); setMarketingPush(v); };
  const resetConsents = () => { setPrivacyConsent(false); setThirdPartyConsent(false); setMarketingPush(false); };

  useEffect(() => {
    if (mode === 'signup') {
      setStoresLoading(true);
      getStores()
        .then(res => setStores(res.data || []))
        .catch(err => {
          console.error('점포 목록 조회 실패:', err);
          notify('점포 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
        })
        .finally(() => setStoresLoading(false));
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 배송지 주소(동 이름 우선) → 커버리지(배송 가능 매장) 조회.
  useEffect(() => {
    if (mode !== 'signup') return;
    const zip = (signupZipcode || '').replace(/\D/g, '');
    const dong = (signupDong || '').trim();
    if (!dong && zip.length < 3) { setCoverage(null); return; }
    let cancelled = false;
    setCoverageLoading(true);
    getCoverage(zip, dong)
      .then(res => { if (!cancelled) setCoverage(res.data); })
      .catch(() => { if (!cancelled) setCoverage(null); })
      .finally(() => { if (!cancelled) setCoverageLoading(false); });
    return () => { cancelled = true; };
  }, [signupZipcode, signupDong, mode]);

  // 목업 1단계: 「○○점이 배송해요 · 가입 매장으로 정할게요」 — 이 주소를 배송하는 매장을 가입 매장으로 정한다.
  // 손님이 이미 그 주소를 배송하는 매장 중 하나를 골랐으면 건드리지 않는다.
  useEffect(() => {
    if (!coverage || !coverage.stores || coverage.stores.length === 0) return;
    if (coverage.stores.some((s) => String(s.store_id) === String(selectedStoreId))) return;
    const pick = coverage.recommended || coverage.stores[0];
    setSelectedStoreId(String(pick.store_id));
  }, [coverage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const saved = localStorage.getItem('srmart_auto_login');
    if (saved) {
      try {
        const { username } = JSON.parse(saved);
        if (username) { setLoginForm(prev => ({ ...prev, username })); setRemember(true); }
      } catch (e) {}
    }
  }, []);

  const handleLogin = async () => {
    const e = {};
    if (!loginForm.username.trim()) e.username = '아이디를 입력해주세요.';
    if (!loginForm.password) e.password = '비밀번호를 입력해주세요.';
    setLoginErrors(e);
    if (Object.keys(e).length) return;

    try {
      setLoginLoading(true);
      if (remember) {
        localStorage.setItem('srmart_auto_login', JSON.stringify({ username: loginForm.username }));
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

  const setF = (k) => (e) => { const v = e.target.value; setForm((p) => ({ ...p, [k]: v })); if (errs[k]) setErrs((x) => ({ ...x, [k]: null })); };
  // 목업처럼 「왕길점」 — 앞의 「에스알마트」 는 뗀다(모든 매장 이름 앞에 붙어 있어 한 줄을 넘긴다)
  const shortName = (n) => String(n || '').replace(/^에스알마트\s*/, '');
  const storeName = (id) => (stores.find((s) => String(s.id) === String(id)) || {}).name
    || (((coverage && coverage.stores) || []).find((s) => String(s.store_id) === String(id)) || {}).store_name || '';

  // 단계마다 그 단계 칸만 본다 — 다음 단계로 넘어가기 전에 칸 아래에 바로 알려 준다.
  const check1 = () => {
    const e = {};
    if (!form.name.trim()) e.name = '이름을 입력해 주세요.';
    // (B1) 우편번호 필수 — 주소 찾기로 입력해야 저장·배송권역 매칭 가능. (서버도 400으로 이중 검증)
    if (!signupZipcode || !signupZipcode.trim()) e.address = '우편번호가 필요해요. 주소 찾기로 주소를 입력해주세요.';
    else if (!selectedStoreId) e.store = '가입 매장을 골라 주세요.';
    return e;
  };
  const check2 = () => {
    const e = {};
    if (!form.username.trim()) e.username = '아이디를 입력해 주세요.';
    if (!form.password) e.password = '비밀번호를 입력해 주세요.';
    else if (pwProblem(form.password)) e.password = pwProblem(form.password);
    if (!form.email.trim()) e.email = '이메일을 입력해 주세요.';
    if (!form.phone.trim()) e.phone = '전화번호를 입력해 주세요.';
    if (!form.birth || calcAgeFromBirth(form.birth) === null) e.birth = '생년월일을 올바르게 입력해주세요!';
    return e;
  };
  const next = () => {
    const e = step === 1 ? check1() : check2();
    setErrs(e);
    if (Object.keys(e).length) return;
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const handleSignup = async () => {
    // 앞 단계 값이 비어 있으면(뒤로 가서 지웠을 때) 그 단계로 돌려보낸다
    const e1 = check1(); if (Object.keys(e1).length) { setErrs(e1); setStep(1); return; }
    const e2 = check2(); if (Object.keys(e2).length) { setErrs(e2); setStep(2); return; }
    if (!privacyConsent) { setErrs({ consent: '개인정보 수집·이용에 동의해주세요.' }); return; }

    const age = calcAgeFromBirth(form.birth);
    const isAdult = age !== null && age >= 19;

    try {
      setSignupLoading(true);
      const res = await register({
        name: form.name,
        username: form.username,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address,
        addressDetail: form.addressDetail,
        birth: form.birth,        // 서버가 이 값으로 is_adult/age 를 다시 계산한다
        privacyConsent,           // 필수 — 서버도 없으면 400 으로 막는다
        thirdPartyConsent,        // 선택 — 미동의면 온라인 전용 회원이 된다
        marketing_push: marketingPush,   // 선택 — 혜택 알림(광고성) 수신. 기본 false
        isAdult,
        age,
        store_id: Number(selectedStoreId),
        zipcode: signupZipcode || null,
        dong_name: signupDong || null,   // Daum 동 이름 → 체크아웃 배송권역 매칭용 저장
      });
      const sc = res && res.data && res.data.signup_coupon;
      setDone({
        name: form.name, storeName: shortName(storeName(selectedStoreId)), isAdult,
        // 혜택 알림에 동의했으면 처리 결과(날짜)를 같이 알린다 — 정보통신망법상 수신 동의 결과 안내.
        marketing: marketingPush ? `${todayYmd().replace(/-/g, '.')} 혜택 알림 수신에 동의하셨어요.` : '',
        coupon: sc && sc.granted ? sc : null,   // 서버가 「지급했다」 고 할 때만 쿠폰 칸을 그린다
      });
      setStep('done');
      window.scrollTo(0, 0);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || '회원가입 중 오류가 발생했어요.';
      // 서버가 막은 칸이 있는 단계로 돌려보내 그 칸 아래에 쓴다(3단계에서 창만 뜨면 어느 칸인지 모른다)
      if (/아이디/.test(msg)) { setErrs({ username: msg }); setStep(2); }
      else if (/비밀번호/.test(msg)) { setErrs({ password: msg }); setStep(2); }
      else if (/이메일/.test(msg)) { setErrs({ email: msg }); setStep(2); }
      else if (/우편번호/.test(msg)) { setErrs({ address: msg }); setStep(1); }
      else if (/점포/.test(msg)) { setErrs({ store: msg }); setStep(1); }
      else notify(msg);
    } finally {
      setSignupLoading(false);
    }
  };

  const resetSignup = () => {
    setForm({ ...EMPTY_FORM });
    setSelectedStoreId('');
    setSignupZipcode('');
    setSignupDong('');
    setErrs({});
    setStep(1);
    resetConsents();
  };
  const toLogin = () => { resetSignup(); setDone(null); setMode('login'); };

  // 가입 완료 → 「쇼핑 시작하기」 — 방금 만든 아이디로 바로 로그인한다. 안 되면 로그인 화면(아이디 채움).
  const startShopping = async () => {
    const { username, password } = form;
    try {
      setStartLoading(true);
      await onLogin({ username, password });
    } catch (err) {
      setStartLoading(false);
      toLogin();
      setLoginForm({ username, password: '' });
      notify(err.response?.data?.error || '로그인하지 못했어요. 다시 로그인해 주세요.');
    }
  };

  const findAddress = () => {
    if (!window.daum || !window.daum.Postcode) { notify('주소 찾기를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'); return; }
    new window.daum.Postcode({
      oncomplete: (data) => {
        setForm(p => ({ ...p, address: data.roadAddress || data.jibunAddress, addressDetail: '' }));
        setSignupZipcode(data.zonecode || '');
        setSignupDong(data.bname || '');
        setErrs((x) => ({ ...x, address: null, store: null }));
      },
    }).open();
  };

  if (isFindAccount) {
    return <FindAccount onBack={() => setIsFindAccount(false)} />;
  }

  // ── 로그인(S27) ──
  if (mode === 'login') {
    return (
      <div className="v2 plain auth-v2">
        <div className="auth-wrap">
          <div className="auth-top">
            <img src={logo} alt="에스알마트" />
            <h1>즐거운 쇼핑을 시작하세요</h1>
            <p>오늘도 에스알마트에서 좋은 하루 되세요</p>
          </div>
          <div className="auth">
            <Field label="아이디" error={loginErrors.username}>
              <input value={loginForm.username} placeholder="아이디를 입력해 주세요" autoComplete="username"
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                onChange={(e) => { setLoginForm({ ...loginForm, username: e.target.value }); if (loginErrors.username) setLoginErrors({ ...loginErrors, username: null }); }} />
            </Field>
            <Field label="비밀번호" error={loginErrors.password} trail={<EyeBtn show={showPw} setShow={setShowPw} inputRef={pwRef} />}>
              <input ref={pwRef} type={showPw ? 'text' : 'password'} value={loginForm.password} placeholder="비밀번호를 입력해 주세요"
                autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); if (loginErrors.password) setLoginErrors({ ...loginErrors, password: null }); }} />
            </Field>
            <div className="or">
              <label className="chk">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <SqCheck on={remember} />자동 로그인
              </label>
              <button type="button" className="link" onClick={() => setIsFindAccount(true)}>아이디/비밀번호 찾기</button>
            </div>
            <button type="button" className={`ui-btn full ${loginLoading ? 'dis' : 'pri'}`} disabled={loginLoading} onClick={handleLogin}>
              {loginLoading ? '로그인 중…' : '로그인'}
            </button>
            <div style={{ height: 'var(--sp-2)' }} />
            <button type="button" className="ui-btn full sec" onClick={() => { resetSignup(); setMode('signup'); }}>회원가입</button>
            {onGuest && (
              <div className="guest-go"><button type="button" onClick={onGuest}>로그인 없이 둘러보기<Icon name="chevR" size="sm" /></button></div>
            )}
            <div className="foot">© 2026 Dongsin Market. All rights reserved.</div>
          </div>
        </div>
      </div>
    );
  }

  // ── 가입 완료 ──
  if (step === 'done' && done) {
    return (
      <div className="v2 plain auth-v2">
        <div className="auth-wrap auth-done">
          <div className="auth">
            <span className="ricon done-ic"><Icon name="check" size="lg" /></span>
            <h2 className="step-h">가입을 환영해요, {done.name}님!</h2>
            {done.storeName && <p className="f-hint">가입 매장은 <b>{done.storeName}</b>이에요.</p>}
            {!done.isAdult && <p className="f-hint">미성년자로 확인됐어요. 성인 상품 구매가 제한돼요.</p>}
            {done.marketing && <p className="f-hint">{done.marketing}</p>}
            {done.coupon && (
              <div className="done-cpn">
                <div className="cpn">
                  <Icon name="gift" />
                  <div style={{ flex: 1 }}><b>{done.coupon.label || done.coupon.name}</b>{done.coupon.sub && <div className="f-hint">{done.coupon.sub}</div>}</div>
                </div>
                <div className="f-hint">마이 → 내 쿠폰에 들어 있어요</div>
              </div>
            )}
          </div>
        </div>
        <div className="pad-bar" />
        <div className="bar"><div className="in">
          <button type="button" className={`ui-btn ${startLoading ? 'dis' : 'pri'}`} style={{ flex: 1 }} disabled={startLoading} onClick={startShopping}>
            {startLoading ? '들어가는 중…' : '쇼핑 시작하기'}
          </button>
        </div></div>
      </div>
    );
  }

  // ── 회원가입 3단계(P04) ──
  const cov = (() => {
    if (!(signupDong || (signupZipcode && signupZipcode.replace(/\D/g, '').length >= 3))) return null;
    if (coverageLoading) return <div className="notice b"><Icon name="info" /><div>배송 가능 매장 확인 중…</div></div>;
    if (!coverage) return null;
    const sel = (coverage.stores || []).find(s => String(s.store_id) === String(selectedStoreId));
    if (sel) return <div className="notice g"><Icon name="check" /><div><b>{shortName(sel.store_name)}</b>이 배송해요 · 가입 매장으로 정할게요</div></div>;
    return <div className="notice r"><Icon name="x" /><div>이 주소는 배송 가능한 매장이 없어요. 방문하시거나 고객센터로 문의해 주세요.</div></div>;
  })();
  // 가입 매장을 손으로 고르는 칸 — 배송 매장이 없거나(방문 손님) 여러 곳일 때만. 하나로 정해지면 위 안내로 끝난다.
  const covStores = (coverage && coverage.stores) || [];
  const showStorePick = !!signupZipcode && !coverageLoading && covStores.length !== 1;
  const age = calcAgeFromBirth(form.birth);

  return (
    <div className="v2 plain auth-v2">
      <header className="app-nav line">
        <div className="nav-row">
          <div className="nav-side">
            <button type="button" className="nav-btn" aria-label="뒤로" onClick={() => { if (step === 1) toLogin(); else { setErrs({}); setStep(step - 1); } }}><Icon name="chevL" /></button>
          </div>
          <div className="nav-title">회원가입</div>
          <div className="nav-side r"><span className="f-hint step-n">{step} / 3</span></div>
        </div>
      </header>
      <div className="progress"><i className="on" /><i className={step >= 2 ? 'on' : ''} /><i className={step >= 3 ? 'on' : ''} /></div>

      <div className="auth-wrap">
        {step === 1 && (
          <div className="auth">
            <h2 className="step-h">어디로 배송할까요?</h2>
            <p className="f-hint">주소를 넣으면 배송하는 매장을 찾아 드려요.</p>
            <Field label="이름" error={errs.name}>
              <input value={form.name} onChange={setF('name')} placeholder="이름을 입력해 주세요" autoComplete="name" />
            </Field>
            <label className="f-lbl">배송지 주소</label>
            <div className="addr-row">
              <div className={`field${errs.address ? ' err' : ''}`} style={{ flex: 1 }} onClick={findAddress}>
                {form.address ? <span className="v">{form.address}</span> : <span className="ph">주소 찾기를 눌러 주세요</span>}
              </div>
              <button type="button" className="ui-btn sec" onClick={findAddress}>주소 찾기</button>
            </div>
            {errs.address && <div className="f-err"><Icon name="alert" size="sm" />{errs.address}</div>}
            <div style={{ height: 'var(--sp-2)' }} />
            <div className="field"><input value={form.addressDetail} onChange={setF('addressDetail')} placeholder="상세 주소 (동·호수)" /></div>
            {signupZipcode && <div className="f-hint">우편번호 {signupZipcode} (자동 입력)</div>}
            {cov && <div style={{ marginTop: 'var(--sp-3)' }}>{cov}</div>}
            {showStorePick && (
              <Field label="가입 매장" error={errs.store}>
                {storesLoading ? <span className="ph">불러오는 중…</span>
                  : stores.length === 0 ? <span className="ph">지금 가입할 수 있는 매장이 없어요</span>
                  : (
                    <select value={selectedStoreId} onChange={(e) => { setSelectedStoreId(e.target.value); setErrs((x) => ({ ...x, store: null })); }}>
                      <option value="">가입 매장을 골라 주세요</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  )}
              </Field>
            )}
            <div className="auth-alt">이미 계정이 있으신가요? <button type="button" className="link" onClick={toLogin}>로그인하러 가기</button></div>
          </div>
        )}

        {step === 2 && (
          <div className="auth">
            <h2 className="step-h">계정 만들기</h2>
            <p className="f-hint">로그인할 아이디와 연락처를 넣어 주세요.</p>
            <Field label="아이디" error={errs.username}>
              <input value={form.username} onChange={setF('username')} placeholder="아이디를 입력해 주세요" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </Field>
            <Field label="비밀번호" error={errs.password} trail={<EyeBtn show={showPw2} setShow={setShowPw2} inputRef={pw2Ref} />}>
              <input ref={pw2Ref} type={showPw2 ? 'text' : 'password'} value={form.password} onChange={setF('password')} placeholder="비밀번호를 입력해 주세요"
                autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
            </Field>
            {!errs.password && (
              <div className="pw-pills">
                <span className={`pill${form.password.length >= 6 ? ' g' : ''}`}>{form.password.length >= 6 ? '✓' : '○'} 6자 이상</span>
                {PW_KINDS.map(([l, re]) => <span key={l} className={`pill${re.test(form.password) ? ' g' : ''}`}>{re.test(form.password) ? '✓' : '○'} {l}</span>)}
                <span className="f-hint" style={{ margin: 0 }}>· 소문자·숫자·특수문자 중 2가지</span>
              </div>
            )}
            <Field label="이메일" error={errs.email}>
              <input type="email" value={form.email} onChange={setF('email')} placeholder="이메일을 입력해 주세요" autoComplete="email" autoCapitalize="none" />
            </Field>
            <Field label="전화번호" error={errs.phone}>
              <input type="tel" value={form.phone} onChange={setF('phone')} placeholder="010-0000-0000" autoComplete="tel" />
            </Field>
            {/* 예전엔 주민등록번호 앞 6자리 + 성별자리를 받았다(위 calcAgeFromBirth 주석). 생년월일만 받는다. */}
            <Field label="생년월일 (성인 확인용)" error={errs.birth}>
              {/* 🔴 **한국 시간으로** (판단 ③) — UTC 상한이면 오전 9시 전엔 오늘 날짜를 못 고른다. */}
              <input type="date" value={form.birth} max={todayYmd()} onChange={setF('birth')} />
            </Field>
            {!errs.birth && <div className="f-hint">성인 여부 확인·생일 혜택에만 쓰고, 주민등록번호는 받지 않아요</div>}
            {!errs.birth && form.birth && (age === null
              ? <div className="f-err"><Icon name="alert" size="sm" />올바른 생년월일을 입력해 주세요</div>
              : age >= 19
                ? <div className="f-ok"><Icon name="check" size="sm" />성인 확인됐어요 (만 {age}세)</div>
                : <div className="f-err"><Icon name="alert" size="sm" />미성년자예요 (만 {age}세) · 성인 상품 구매가 제한돼요</div>)}
          </div>
        )}

        {step === 3 && (
          <>
            <div className="auth">
              <h2 className="step-h">동의</h2>
              <p className="f-hint">[필수]에 동의해야 가입할 수 있어요.</p>
            </div>
            <section className="sec">
              <div className="group consents">
                <ConsentRow big checked={allConsent} onChange={setAllConsent} label="전체 동의" detail="선택 항목 포함" />
                <ConsentRow checked={privacyConsent} onChange={(v) => { setPrivacyConsent(v); setErrs({}); }} required
                  label="개인정보 수집·이용 동의"
                  detail="이름, 아이디, 이메일, 휴대전화번호, 생년월일, 주소를 회원 관리와 주문·배송에 이용합니다." />
                <ConsentRow checked={thirdPartyConsent} onChange={setThirdPartyConsent}
                  label="지점 통합 회원·포인트·구매 내역 이용 동의"
                  detail={`에스알마트 각 지점${branchList(stores) ? `(${branchList(stores)})` : ''}은 서로 다른 사업자입니다. 동의하시면 모든 지점에서 포인트를 함께 쌓고 쓰시고, 매장 구매 영수증도 앱에서 보실 수 있어요. 제공 항목은 이름·연락처·회원번호·포인트 내역·매장 구매 내역입니다. 동의하지 않으셔도 가입과 온라인 주문은 그대로 가능하며, 이 경우 매장 포인트 적립·사용과 매장 구매 내역 표시만 제한됩니다.`} />
                <ConsentRow checked={marketingPush} onChange={setMarketingPush}
                  label="혜택 알림(행사·쿠폰) 받기"
                  detail="행사·쿠폰 소식을 앱 푸시·문자로 보내 드려요. 동의하지 않으셔도 가입·주문과 주문·배송 알림은 그대로예요. 마이 → 알림 설정에서 언제든 끌 수 있어요." />
              </div>
              {errs.consent && <div className="f-err" style={{ padding: '0 var(--sp-4)' }}><Icon name="alert" size="sm" />{errs.consent}</div>}
              <div className="sec-f"><a className="link" href="https://dongsinmarket.co.kr/privacy.html" target="_blank" rel="noreferrer">개인정보처리방침 전문 보기</a></div>
            </section>
          </>
        )}
      </div>

      <div className="pad-bar" />
      <div className="bar"><div className="in">
        {step > 1 && <button type="button" className="ui-btn line" style={{ flex: 1 }} onClick={() => { setErrs({}); setStep(step - 1); }}>이전</button>}
        {step === 3 ? (
          <button type="button" className={`ui-btn ${signupLoading || stores.length === 0 ? 'dis' : 'pri'}`} style={{ flex: 2 }}
            disabled={signupLoading || stores.length === 0} onClick={handleSignup}>
            {signupLoading ? '가입 중…' : '가입하기'}
          </button>
        ) : (
          <button type="button" className="ui-btn pri" style={{ flex: step > 1 ? 2 : 1 }} onClick={next}>다음</button>
        )}
      </div></div>
    </div>
  );
}

export default Login;
