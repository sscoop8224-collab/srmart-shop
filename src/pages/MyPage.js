// 마이 (목업 정본 v1 의 P02 · S21 · S22 · S23 · S24 · S25 · S47, 묶음 5 · 2026-11-12 밤)
//
// 결정 9·11(2026-11-12): 예전 마이(S20)를 P02 가 대신한다.
//   · 위 — 프로필 한 줄(누르면 회원정보 수정 S21) + 요약 4칸(주문 · 찜 · 포인트 · 쿠폰). 예전의 통계 3칸 + 카드 3칸(같은 숫자 두 번)을 하나로.
//   · 쇼핑 — 「주문내역」 한 줄(예전 「구매 내역」·「주문내역」 두 줄이 같은 화면으로 갔다 — P01) · 「찜」 한 줄(예전 「찜한 상품」·「찜 목록」) · 「내 쿠폰」.
//   · 계정·정보 — 본인확인(켜져 있을 때만) · 알림 설정 · 비밀번호 변경(S22) · 로그인 이력(S24) · 공지사항.
//   · 휴대폰 본인확인(2026-11-16 지시 7 · 목업 P02·S21·S48) — 서버가 「연동 켬」일 때만 보인다(꺼져 있으면 예전 그대로).
//     「본인확인 하기」 → POST /users/me/identity · 번호는 본인확인으로만 바꾼다 → PUT /users/me/phone.
//     본인확인한 회원의 이름은 읽기 전용(서버 PUT /users/:id 도 본인 수정이면 이름을 그대로 둔다 — 판정은 서버).
//   · 오른쪽(태블릿) — 화면 모드 · 회사 소개·사업자 정보(S40) · 로그아웃(맨 아래 — 확인창 S33) · 회원탈퇴(S25).
//   · 🔴 로그인 안 한 손님(S47)도 마이를 연다 — 로그인·회원가입 단추 + 공지 · 회사 소개 · 화면 모드(예전엔 마이 탭을 누르면 로그인 창뿐이었다).
// 🔴 쿠폰은 **창 하나**(S23) — 예전엔 창이 둘이었고, 그중 통계 칸이 부르던 `/coupons/my` 는 서버에 없는 주소라 늘 0장이었다.
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import { getMyPoints, getMyActiveCoupons, deleteAccount, SITE, verifyMemberIdentity, changePhoneByIdentity } from '../api';
import IdentitySheet from '../identity/IdentitySheet';
import useIdentityLive from '../identity/useIdentityLive';
import API from '../api';
import { useDialog } from '../DialogContext';
import Icon from '../components/ui/Icon';
import { sameUser } from '../utils/sameUser';

const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;
const pad2 = (x) => String(x).padStart(2, '0');
// DATE 컬럼은 UTC ISO 로 와서 앞 10자를 자르면 하루 이르다 — 로컬 연·월·일로 읽는다(CLAUDE.md 「DATE 컬럼」)
const ymd = (v) => {
  if (!v) return '';
  const s = String(v);
  if (!s.includes('T')) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};
const md = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v || '') : `${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
// 로그인 이력의 IP 는 가려서 보인다(목업 S24) — 앞 두 마디만. IPv6 는 앞 두 묶음만
const maskIp = (ip) => {
  if (!ip) return '-';
  const s = String(ip).replace(/^::ffff:/, '');
  if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return s.split('.').slice(0, 2).join('.') + '.*.*';
  if (s.includes(':')) return s.split(':').slice(0, 2).join(':') + ':*';
  return s;
};
const couponDiscount = (c) => (c.discount_type === 'percent' ? `${Number(c.discount)}%` : won(c.discount));
const couponGone = (c) => !!c.used_at || (c.valid_until && ymd(c.valid_until) < ymd(new Date().toISOString()));

const PW_CHECKS = [
  ['8자+', (p) => p.length >= 8],
  ['대문자', (p) => /[A-Z]/.test(p)],
  ['소문자', (p) => /[a-z]/.test(p)],
  ['숫자', (p) => /[0-9]/.test(p)],
  ['특수문자', (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p)],
];

// 읽기 전용 번호 표시 — 01012345678 → 010-1234-5678(목업 S21). 모양이 다르면 그대로 둔다
const phoneView = (v) => { const d = String(v || '').replace(/\D/g, ''); return /^01\d{8,9}$/.test(d) ? d.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3') : (v || ''); };

function Row({ icon, tone = '', label, sub, val, danger, chev = true, onClick, children }) {
  return (
    <button type="button" className={`row tap${icon ? ' ind' : ''}${danger ? ' danger' : ''}`} onClick={onClick}>
      {icon && <span className={`ricon ${tone}`}><Icon name={icon} /></span>}
      <span className="lbl">{label}{sub && <small>{sub}</small>}</span>
      {val != null && val !== '' && <span className="val">{val}</span>}
      {children}
      {chev && <span className="chev"><Icon name="chevR" size="sm" /></span>}
    </button>
  );
}

function Group({ h, f, children }) {
  return (
    <section className="sec">
      {h && <div className="sec-h">{h}</div>}
      <div className="group">{children}</div>
      {f && <div className="sec-f">{f}</div>}
    </section>
  );
}

// 시트 — 목업 sheet(): 손잡이 · 위쪽 「취소 · 제목 · 오른쪽 단추」 · 본문
function Sheet({ title, onClose, left = '취소', right, children, id }) {
  return (
    <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby={id} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet v2">
        <div className="grabber" />
        <div className="sheet-h">
          <div className="nav-side">{left && <button type="button" className="nav-btn" onClick={onClose}>{left}</button>}</div>
          <div className="nav-title" id={id}>{title}</div>
          <div className="nav-side r">{right}</div>
        </div>
        <div className="sheet-b">{children}</div>
      </div>
    </div>
  );
}

function FieldErr({ msg }) {
  if (!msg) return null;
  return <div className="f-err"><Icon name="alert" size="sm" />{msg}</div>;
}

// ── 내 쿠폰(S23) — 쿠폰표 모양. 사용 가능 / 사용 완료(기간이 지난 것도 여기) ──
function CouponSheet({ coupons, loading, onClose }) {
  const [tab, setTab] = useState(0);
  const live = coupons.filter((c) => !couponGone(c));
  const gone = coupons.filter(couponGone);
  const list = tab === 0 ? live : gone;
  return (
    <Sheet id="coupon-sheet-title" title="내 쿠폰" left="" right={<button type="button" className="nav-btn b" onClick={onClose}>닫기</button>} onClose={onClose}>
      {loading ? (
        <div className="ui-empty"><span className="spin" /></div>
      ) : coupons.length === 0 ? (
        <div className="ui-empty"><div className="big"><Icon name="tag" /></div><h3>보유 쿠폰이 없어요</h3></div>
      ) : (
        <div className="pad" style={{ paddingTop: 0 }}>
          <div className="seg" role="tablist" aria-label="쿠폰">
            {[`사용 가능 ${live.length}`, `사용 완료 ${gone.length}`].map((l, i) => (
              <button key={l} type="button" role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{l}</button>
            ))}
          </div>
          {list.length === 0 ? (
            <div className="f-hint" style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>{tab === 0 ? '쓸 수 있는 쿠폰이 없어요' : '사용한 쿠폰이 없어요'}</div>
          ) : list.map((c) => {
            const gonePill = c.used_at ? '사용완료' : '기간 만료';
            return (
              <div key={c.id} className={`group cticket${tab === 1 ? ' used' : ''}`}>
                <div className="cd">{couponDiscount(c)}</div>
                <div className="pad ci">
                  <b>{c.coupon_name}</b>
                  <div className="f-hint">{Number(c.min_purchase_amount) > 0 ? `${won(c.min_purchase_amount)} 이상 구매 시` : '조건 없음'}</div>
                  <div className="f-hint">{c.valid_until ? `~${ymd(c.valid_until)}` : '기간 없음'}{c.code ? ` · 코드 ${c.code}` : ''}</div>
                </div>
                {tab === 1 && <span className="pill">{gonePill}</span>}
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

// ── 로그인 이력(S24) ──
// 기기(Android 앱 · iPhone · PC)는 서버가 거친 이름으로 준다(r.device · 2026-11-17 낮 지시 5). 옛 기록·옛 서버는 없음 → IP 만.
function LoginHistorySheet({ rows, loading, failed, onClose }) {
  return (
    <Sheet id="login-history-title" title="로그인 이력" left="" right={<button type="button" className="nav-btn b" onClick={onClose}>닫기</button>} onClose={onClose}>
      {loading ? (
        <div className="ui-empty"><span className="spin" /></div>
      ) : failed ? (
        <div className="ui-empty"><div className="big r"><Icon name="alert" /></div><h3>불러오지 못했어요</h3><p>잠시 후 다시 열어 주세요.</p></div>
      ) : rows.length === 0 ? (
        <div className="ui-empty"><div className="big"><Icon name="clock" /></div><h3>로그인 이력이 없어요</h3></div>
      ) : (
        <Group f="내가 아닌 로그인이 보이면 비밀번호를 바꿔 주세요.">
          {rows.map((r, i) => (
            <div className="row" key={i}>
              <span className="lbl">{md(r.created_at)}<small>{[r.device, maskIp(r.ip)].filter(Boolean).join(' · ')}</small></span>
              <span className={`pill ${r.success ? 'g' : 'r'}`}>{r.success ? '성공' : '실패'}</span>
            </div>
          ))}
        </Group>
      )}
    </Sheet>
  );
}

function MyPage({ user, orders = [], wishlist = [], goToPage, onLogout, users, setUsers, onUserChange, isAdmin, onLogin, onSignup }) {
  const { themeMode, setThemeMode } = useTheme();
  const { login: setAuthUser } = useAuth();   // 저장 성공 후 로그인 사용자 정보 갱신(재로그인 없이 반영)
  const { notify } = useDialog();
  const [myPoints, setMyPoints] = useState(null); // { points, expiring_soon }
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [sheet, setSheet] = useState(null);       // 'coupons' | 'history' | 'edit' | 'pw' | 'delete'
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', addressDetail: '', zipcode: '', dong_name: '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwShow, setPwShow] = useState(false);
  const [pwError, setPwError] = useState(null);   // { at: 'current'|'next'|'confirm', msg }
  const [pwLoading, setPwLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState(false);      // 저장 실패 여부(성공/실패 색 구분)
  const [saveLoading, setSaveLoading] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [idLive] = useIdentityLive(!!user);
  const [idvSheet, setIdvSheet] = useState(null);   // 'verify_member' | 'phone_change'

  useEffect(() => {
    if (!user) return;
    getMyPoints().then((r) => setMyPoints(r.data)).catch(() => {});
    setCouponsLoading(true);
    getMyActiveCoupons().then((r) => setCoupons(r.data || [])).catch(() => {}).finally(() => setCouponsLoading(false));
  }, [user]);

  const currentUser = users?.find((u) => sameUser(u, user)) || user;
  const liveCoupons = coupons.filter((c) => !couponGone(c)).length;
  const verified = !!(currentUser?.identityVerified ?? user?.identityVerified);

  // 본인확인 결과를 로그인 정보에 반영 — 다시 로그인하지 않고 이름·번호·성인 여부가 바뀐다(서버가 돌려준 값만 쓴다)
  const applyUser = (patch) => {
    const updated = { ...user, ...patch };
    setAuthUser(updated);
    if (onUserChange) onUserChange(patch);   // App 의 user — 마이·성인 상품 판정이 이것을 읽는다
    if (setUsers) setUsers((prev) => prev.map((u) => (sameUser(u, currentUser || user) ? { ...u, ...patch } : u)));
  };
  const onIdentityDone = async (r) => {
    const purpose = idvSheet;
    setIdvSheet(null);
    try {
      if (purpose === 'verify_member') {
        const res = await verifyMemberIdentity(r.token);
        const d = res.data || {};
        applyUser({ identityVerified: true, name: d.name || user?.name, phone: d.phone || user?.phone, isAdult: !!d.adult, is_adult: d.adult ? 1 : 0 });
        notify({ icon: 'check', title: '본인확인을 마쳤어요', message: d.adult ? '이제 주류를 매장 픽업으로 주문할 수 있어요.' : '이름·휴대폰 번호가 본인확인한 값으로 바뀌었어요.' });
      } else {
        const res = await changePhoneByIdentity(r.token);
        const phone = (res.data && res.data.phone) || '';
        applyUser({ phone });
        setForm((p) => ({ ...p, phone }));
        setSaveErr(false); setSaveMsg('본인확인으로 휴대폰 번호를 바꿨어요');
      }
    } catch (e) {
      notify({ icon: 'alert', title: '본인확인을 반영하지 못했어요', message: e.response?.data?.error || '잠시 후 다시 시도해 주세요.' });
    }
  };

  // 서버(PUT /api/users/:id)에 실제로 저장한 뒤에만 성공 표시한다.
  // ※ 이 엔드포인트는 부분 수정이 아니라 전체 UPDATE 라, 화면에서 안 고치는 username·is_adult 도
  //   현재 값 그대로 함께 보내야 한다(안 보내면 해당 컬럼이 비워진다).
  const saveProfile = async () => {
    if (!form.name.trim()) { setSaveErr(true); setSaveMsg('이름을 입력해 주세요'); return; }
    const uid = currentUser?.id || user?.id;
    if (!uid) return notify('로그인 정보를 확인할 수 없어요. 다시 로그인해주세요.');
    setSaveLoading(true); setSaveErr(false); setSaveMsg('');
    try {
      await API.put(`/users/${uid}`, {
        username: currentUser?.username ?? user?.username,
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        addressDetail: form.addressDetail || null,
        zipcode: form.zipcode || null,
        dong_name: form.dong_name || null,   // 배송권역 매칭 주 기준 — 없으면 null(예전 값 유지 안 함)
        is_adult: (currentUser?.isAdult ?? currentUser?.is_adult ?? user?.isAdult ?? false) ? 1 : 0,
      });
      // 로그인 사용자 정보 갱신 — 장바구니 기본배송지 자동채움이 이 값을 읽으므로 재로그인 없이 반영된다.
      const updated = {
        ...user,
        name: form.name, email: form.email, phone: form.phone,
        address: form.address, addressDetail: form.addressDetail, zipcode: form.zipcode,
        dong_name: form.dong_name || null,
      };
      setAuthUser(updated);
      if (setUsers) {
        setUsers((prev) => prev.map((u) => (sameUser(u, { id: uid, email: user?.email }) ? { ...u, ...updated } : u)));
      }
      setSaveMsg('저장했어요');
      setTimeout(() => { setSaveMsg(''); setSheet(null); }, 1200);
    } catch (e) {
      setSaveErr(true);
      setSaveMsg(e.response?.data?.error || '저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaveLoading(false);
    }
  };

  // 주소 검색(Daum) 공통 핸들러 — bname(법정동)이 배송권역 매칭의 주 기준이라 함께 캡처한다.
  // bname 이 비어 올 수 있음(도로명 주소만 있고 법정동 정보가 명시적으로 없는 경우 등, Kakao Postcode
  // 가이드에 명시된 동작) — 그 경우 이전 동을 유지하지 않고 '확인 안 됨'으로 비워서 저장한다
  // (다른 주소인데 예전 동이 남아있으면 잘못된 매칭보다 더 나쁨).
  const openAddressSearch = () => {
    if (!window.daum) { notify('주소 검색 서비스를 불러오는 중이에요!'); return; }
    new window.daum.Postcode({
      oncomplete: (data) => setForm((p) => ({
        ...p,
        address: data.roadAddress || data.jibunAddress,
        zipcode: data.zonecode || '',
        dong_name: data.bname || '',
      })),
    }).open();
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) { setDeleteError('비밀번호를 입력해 주세요'); return; }
    setDeleteLoading(true);
    try {
      await deleteAccount(deletePassword);
      localStorage.removeItem('srmart_token');
      localStorage.removeItem('srmart_auto_login');
      await notify('회원탈퇴가 완료되었어요. 그동안 이용해주셔서 감사합니다.');
      window.location.href = '/';
    } catch (err) {
      setDeleteError(err.response?.data?.error || '탈퇴하지 못했어요');
    } finally {
      setDeleteLoading(false);
    }
  };

  const savePassword = async () => {
    setPwError(null);
    if (!pwForm.current) { setPwError({ at: 'current', msg: '현재 비밀번호를 입력해 주세요' }); return; }
    if (pwForm.next.length < 8) { setPwError({ at: 'next', msg: '새 비밀번호는 8자 이상이어야 해요' }); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError({ at: 'confirm', msg: '새 비밀번호가 서로 달라요' }); return; }
    setPwLoading(true);
    try {
      await API.put('/users/me/password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      await notify({ icon: 'check', title: '비밀번호를 바꿨어요', message: '새 비밀번호로 다시 로그인해 주세요.' });
      setPwForm({ current: '', next: '', confirm: '' });
      setSheet(null);
      if (onLogout) onLogout(true);
    } catch (err) {
      // 서버가 거절하는 것은 대부분 현재 비밀번호 — 그 칸 아래에 쓴다(목업 S22 「오류」)
      setPwError({ at: 'current', msg: err.response?.data?.error || '비밀번호를 바꾸지 못했어요' });
    } finally {
      setPwLoading(false);
    }
  };

  const openHistory = async () => {
    setSheet('history'); setHistoryLoading(true); setHistoryFailed(false);
    try {
      const res = await API.get('/users/me/login-history');
      setLoginHistory(res.data || []);
    } catch (e) {
      setHistoryFailed(true);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEdit = () => {
    setForm({ name: currentUser?.name || '', email: currentUser?.email || '', phone: currentUser?.phone || '', address: currentUser?.address || '', addressDetail: currentUser?.addressDetail || '', zipcode: currentUser?.zipcode || '', dong_name: currentUser?.dong_name || '' });
    setSaveMsg(''); setSaveErr(false);
    setSheet('edit');
  };

  const openAdmin = () => {
    if (Capacitor.isNativePlatform()) window.open(`${SITE}/admin`, '_system');
    else window.open('/admin', '_blank', 'noopener,noreferrer');
  };

  const login = !!user;
  const name = currentUser?.name || '';
  const pts = myPoints != null ? `${Number(myPoints.points || 0).toLocaleString('ko-KR')}P` : '-';
  const pwOk = PW_CHECKS.map(([l, f]) => [l, f(pwForm.next)]);

  return (
    <div className="v2 my-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side" /><div className="nav-title" />
          <div className="nav-side r"><button type="button" className="icon-btn" aria-label="공지사항" onClick={() => goToPage('notice')}><Icon name="bell" /></button></div>
        </div>
        <div className="large"><h1>마이</h1></div>
      </header>

      <div className="split">
        <div>
          {login ? (
            <section className="sec" style={{ marginTop: 'var(--sp-2)' }}>
              <div className="group">
                <button type="button" className="row tap prof" onClick={openEdit} aria-label="내 정보 수정">
                  <span className="ricon avatar">{name ? name.slice(0, 1) : <Icon name="user" />}</span>
                  <span className="lbl">
                    <b>{name}</b>{currentUser?.membership_tier && <> <span className="pill g">{currentUser.membership_tier}</span></>}
                    <small>{currentUser?.username ? `@${currentUser.username} · ` : ''}내 정보 수정</small>
                  </span>
                  <span className="chev"><Icon name="chevR" size="sm" /></span>
                </button>
                <div className="row sum4">
                  <button type="button" onClick={() => goToPage('orders')}><b>{orders.length}</b><span>주문</span></button>
                  <button type="button" onClick={() => goToPage('wishlist')}><b>{wishlist.length}</b><span>찜</span></button>
                  <div><b>{pts}</b><span>포인트</span></div>
                  <button type="button" onClick={() => setSheet('coupons')}><b>{liveCoupons}장</b><span>쿠폰</span></button>
                </div>
              </div>
              {myPoints?.expiring_soon > 0 && <div className="sec-f">30일 안에 {Number(myPoints.expiring_soon).toLocaleString('ko-KR')}P가 사라져요</div>}
            </section>
          ) : (
            <section className="sec" style={{ marginTop: 'var(--sp-2)' }}>
              <div className="group pad guest">
                <span className="ricon t-gray avatar"><Icon name="user" /></span>
                <b>로그인하고 더 편하게 장 보세요</b>
                <div className="f-hint">주문내역·찜·포인트·쿠폰을 한 곳에서 볼 수 있어요</div>
                <div className="btn-row">
                  <button type="button" className="ui-btn md pri" onClick={onLogin}>로그인</button>
                  <button type="button" className="ui-btn md sec" onClick={onSignup}>회원가입</button>
                </div>
              </div>
            </section>
          )}

          {login && (
            <Group h="쇼핑">
              <Row icon="receipt" label="주문내역" sub="온라인 주문 · 매장 영수증" onClick={() => goToPage('orders')} />
              <Row icon="heart" tone="t-red" label="찜" val={`${wishlist.length}개`} onClick={() => goToPage('wishlist')} />
              <Row icon="clock" tone="t-gray" label="최근 본 상품" onClick={() => goToPage('recentViews')} />
              <Row icon="msg" tone="t-blue" label="내 리뷰" onClick={() => goToPage('myReviews')} />
              <Row icon="tag" tone="t-orange" label="내 쿠폰" val={`${liveCoupons}장`} onClick={() => setSheet('coupons')} />
            </Group>
          )}

          <Group h={login ? '계정·정보' : '정보'}>
            {login && <>
              {idLive && (verified
                ? <Row icon="shield" label="본인확인" sub="휴대폰 본인확인을 마쳤어요" val="완료" chev={false} />
                : <Row icon="shield" label="본인확인" sub="주류 구매·휴대폰 번호 변경에 필요해요" val="본인확인 하기" onClick={() => setIdvSheet('verify_member')} />)}
              <Row icon="bell" tone="t-blue" label="알림 설정" sub="주문·배송 알림 · 혜택 알림" onClick={() => goToPage('notificationSettings')} />
              <Row icon="lock" tone="t-gray" label="비밀번호 변경" onClick={() => { setPwForm({ current: '', next: '', confirm: '' }); setPwError(null); setPwShow(false); setSheet('pw'); }} />
              <Row icon="clock" tone="t-gray" label="로그인 이력" onClick={openHistory} />
            </>}
            <Row icon="bell" tone="t-orange" label="공지사항" onClick={() => goToPage('notice')} />
          </Group>

          {login && isAdmin && (
            <Group h="관리자">
              <Row icon="external" label="관리자 페이지로 이동" sub="동신마켓 관리자(/admin) 새 창" onClick={openAdmin} />
            </Group>
          )}
        </div>

        <div>
          {/* 화면 모드 — 자동 · 밝게 · 어둡게(묶음 1) */}
          <section className="sec">
            <div className="sec-h">화면 모드</div>
            <div className="seg" role="radiogroup" aria-label="화면 모드">
              {[['auto', '자동'], ['light', '밝게'], ['dark', '어둡게']].map(([k, l]) => (
                <button key={k} type="button" role="radio" aria-checked={themeMode === k} className={themeMode === k ? 'on' : ''} onClick={() => setThemeMode(k)}>{l}</button>
              ))}
            </div>
            <div className="sec-f">자동은 휴대폰 설정을 따라요</div>
          </section>
          <Group>
            <Row icon="info" tone="t-gray" label="회사 소개·사업자 정보" onClick={() => goToPage('about')} />
          </Group>
          {login && <>
            <Group>
              <Row icon="logout" tone="t-red" label="로그아웃" danger chev={false} onClick={() => onLogout()} />
            </Group>
            <div className="quit">
              <button type="button" onClick={() => { setDeletePassword(''); setDeleteError(''); setSheet('delete'); }}>회원탈퇴</button>
            </div>
          </>}
          <div className="foot">© 2026 Dongsin Market. All rights reserved.</div>
        </div>
      </div>

      {sheet === 'coupons' && <CouponSheet coupons={coupons} loading={couponsLoading} onClose={() => setSheet(null)} />}
      {sheet === 'history' && <LoginHistorySheet rows={loginHistory} loading={historyLoading} failed={historyFailed} onClose={() => setSheet(null)} />}

      {/* 회원정보 수정(S21) */}
      {sheet === 'edit' && (
        <Sheet id="edit-sheet-title" title="회원정보 수정" onClose={() => setSheet(null)}
          right={<button type="button" className="nav-btn b" disabled={saveLoading} onClick={saveProfile}>{saveLoading ? '저장 중' : '저장'}</button>}>
          <div className="pad" style={{ paddingTop: 0 }}>
            {saveMsg && (
              <div className={`notice ${saveErr ? 'r' : 'g'}`}><Icon name={saveErr ? 'alert' : 'check'} /><div>{saveMsg}</div></div>
            )}
            <label className="f-lbl">아이디</label>
            <div className="field ro"><span className="v">{currentUser?.username || '(없음)'}</span><span className="ro-tag">변경 불가</span></div>
            {verified ? (
              <><label className="f-lbl">이름</label><div className="field ro"><span className="v">{form.name}</span><span className="ro-tag">본인확인</span></div></>
            ) : (
              <><label className="f-lbl" htmlFor="my-name">이름</label>
              <div className="field"><input id="my-name" value={form.name} placeholder="이름" onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div></>
            )}
            <label className="f-lbl" htmlFor="my-email">이메일 (선택)</label>
            <div className="field"><input id="my-email" type="email" value={form.email || ''} placeholder="example@email.com" onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            {idLive ? (
              <>
                <label className="f-lbl">휴대폰 번호</label>
                <div className="addr-row">
                  <div className="field ro" style={{ flex: 1 }}><span className={form.phone ? 'v' : 'ph'}>{form.phone ? phoneView(form.phone) : '번호 없음'}</span>{verified && <span className="ro-tag">본인확인</span>}</div>
                  <button type="button" className="ui-btn md sec" onClick={() => setIdvSheet(verified ? 'phone_change' : 'verify_member')}>{verified ? '본인확인으로 변경' : '본인확인 하기'}</button>
                </div>
                <div className="f-hint">번호는 본인확인으로만 바꿀 수 있어요</div>
              </>
            ) : (
              <><label className="f-lbl" htmlFor="my-phone">휴대폰 번호</label>
              <div className="field"><input id="my-phone" inputMode="tel" value={form.phone || ''} placeholder="010-0000-0000" onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div></>
            )}
            <label className="f-lbl">주소</label>
            <div className="addr-row">
              <div className="field ro zip"><span className="v">{form.zipcode || '우편번호'}</span></div>
              <button type="button" className="ui-btn md sec" onClick={openAddressSearch}>주소 찾기</button>
            </div>
            <div className="f-hint">우편번호·주소는 주소 찾기로 채워져요</div>
            <div className="field ro" style={{ marginTop: 'var(--sp-2)' }} onClick={openAddressSearch} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && openAddressSearch()}>
              <span className={form.address ? 'v' : 'ph'}>{form.address || '주소 찾기를 눌러 주세요'}</span>
            </div>
            <div className="field" style={{ marginTop: 'var(--sp-2)' }}>
              <input aria-label="상세 주소" value={form.addressDetail || ''} placeholder="상세 주소" onChange={(e) => setForm((p) => ({ ...p, addressDetail: e.target.value }))} />
            </div>
          </div>
        </Sheet>
      )}

      {/* 비밀번호 변경(S22) */}
      {sheet === 'pw' && (
        <Sheet id="pw-sheet-title" title="비밀번호 변경" onClose={() => setSheet(null)}
          right={<button type="button" className="nav-btn b" disabled={pwLoading} onClick={savePassword}>{pwLoading ? '변경 중' : '변경'}</button>}>
          <div className="pad" style={{ paddingTop: 0 }}>
            <label className="f-lbl" htmlFor="pw-cur">현재 비밀번호</label>
            <div className={`field${pwError?.at === 'current' ? ' err' : ''}`}><input id="pw-cur" type="password" autoComplete="current-password" value={pwForm.current} placeholder="현재 비밀번호" onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))} /></div>
            <FieldErr msg={pwError?.at === 'current' && pwError.msg} />
            <label className="f-lbl" htmlFor="pw-new">새 비밀번호</label>
            <div className={`field${pwError?.at === 'next' ? ' err' : ''}`}>
              <input id="pw-new" type={pwShow ? 'text' : 'password'} autoComplete="new-password" value={pwForm.next} placeholder="8자 이상, 3종 이상" onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))} />
              <button type="button" className="trail" aria-label={pwShow ? '비밀번호 가리기' : '비밀번호 보기'} onClick={() => setPwShow((v) => !v)}><Icon name="eye" size="sm" /></button>
            </div>
            <FieldErr msg={pwError?.at === 'next' && pwError.msg} />
            <div className="pw-pills">
              {pwOk.map(([l, ok]) => <span key={l} className={`pill${ok ? ' g' : ''}`}>{ok ? '✓' : '○'} {l}</span>)}
            </div>
            <label className="f-lbl" htmlFor="pw-cf">새 비밀번호 확인</label>
            <div className={`field${pwError?.at === 'confirm' ? ' err' : ''}`}><input id="pw-cf" type="password" autoComplete="new-password" value={pwForm.confirm} placeholder="새 비밀번호 다시 입력" onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))} /></div>
            <FieldErr msg={pwError?.at === 'confirm' && pwError.msg} />
            {pwForm.confirm && pwForm.confirm === pwForm.next && pwError?.at !== 'confirm' && (
              <div className="f-ok"><Icon name="check" size="sm" /> 두 비밀번호가 같아요</div>
            )}
          </div>
        </Sheet>
      )}

      {/* 회원탈퇴(S25) */}
      {sheet === 'delete' && (
        <Sheet id="del-sheet-title" title="회원탈퇴" onClose={() => setSheet(null)}>
          <div className="pad" style={{ paddingTop: 0 }}>
            <div className="notice r"><Icon name="alert" /><div>탈퇴하면 이름·연락처·주소 등 개인정보가 삭제되고 <b>되돌릴 수 없어요.</b><br />주문·거래 내역은 전자상거래법에 따라 보관 기간 동안 <b>익명 처리되어</b> 남습니다.</div></div>
            <label className="f-lbl" htmlFor="del-pw">비밀번호 확인</label>
            <div className={`field${deleteError ? ' err' : ''}`}><input id="del-pw" type="password" autoComplete="current-password" value={deletePassword} placeholder="현재 비밀번호" onChange={(e) => setDeletePassword(e.target.value)} /></div>
            <FieldErr msg={deleteError} />
            <div style={{ height: 'var(--sp-4)' }} />
            <button type="button" className="ui-btn full danger" disabled={deleteLoading} onClick={handleDeleteAccount}>{deleteLoading ? '처리 중…' : '탈퇴하기'}</button>
          </div>
        </Sheet>
      )}
      {idvSheet && <IdentitySheet purpose={idvSheet} onClose={() => setIdvSheet(null)} onDone={onIdentityDone} />}
    </div>
  );
}

export default MyPage;
