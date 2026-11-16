// 아이디/비밀번호 찾기 — 목업 정본 v1 의 S29 (2026-11-16 지시 7 — 본인확인 화면까지)
//
// 휴대폰 본인확인(S48)으로 찾는다. 🔴 본인확인이 **켜져 있을 때만**(GET /identity/status live) 두 칸이 열린다.
//   · 아이디 찾기 — 본인확인 → POST /auth/find-id → 가린 아이디(kim***n) · 가입일. 없으면 「이 번호로 가입한 아이디가 없어요」
//   · 비밀번호 재설정 — 아이디 + 본인확인 → POST /auth/identity-reset → 재설정 표 → 새 비밀번호 → POST /auth/reset-password
//     (아이디가 없든 사람이 다르든 서버는 같은 말 — 남의 아이디를 맞춰 보지 못하게)
// 꺼져 있으면(지금 운영) 예전 그대로 「준비 중」 안내 — 매장 문의.
//   - 예전 가짜 목업(클라 임시비번 생성/화면 노출/alert, localStorage 검색)은 이미 지웠다 — 실제 계정에 적용되지도 않던 동작이었다.
// 설계: docs/SHOP_IDENTITY_VERIFY.md
import { useState } from 'react';
import Icon from '../components/ui/Icon';
import { useDialog } from '../DialogContext';
import { findIdByIdentity, resetByIdentity, resetPassword } from '../api';
import IdentitySheet, { IdentityCard } from '../identity/IdentitySheet';
import useIdentityLive from '../identity/useIdentityLive';

// 서버 validatePassword 와 같은 규칙(가입 화면과 같다) — 판정은 서버가 하고, 화면은 안내만
const PW_KINDS = [['소문자', /[a-z]/], ['숫자', /[0-9]/], ['특수문자', /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/]];

function Header({ onBack }) {
  return (
    <header className="app-nav line">
      <div className="nav-row">
        <div className="nav-side"><button type="button" className="nav-btn" aria-label="로그인으로" onClick={onBack}><Icon name="chevL" /></button></div>
        <div className="nav-title">아이디·비밀번호 찾기</div>
        <div className="nav-side r" />
      </div>
    </header>
  );
}

function FindAccount({ onBack, onLogin, onSignup }) {
  const { notify } = useDialog();
  const [live] = useIdentityLive(true);
  const [tab, setTab] = useState(0);                 // 0 아이디 찾기 · 1 비밀번호 재설정
  const [sheet, setSheet] = useState(null);          // 'find_id' | 'reset_password'
  const [found, setFound] = useState(null);          // 아이디 찾기 결과 [{ username, joined }]
  const [username, setUsername] = useState('');
  const [reset, setReset] = useState(null);          // { token, username }
  const [pw, setPw] = useState({ next: '', confirm: '', show: false });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const goLogin = onLogin || onBack;

  if (live === null) {
    return <div className="v2 plain auth-v2"><Header onBack={onBack} /><div className="ui-empty"><span className="spin" /></div></div>;
  }
  if (!live) {
    return (
      <div className="v2 plain auth-v2">
        <Header onBack={onBack} />
        <div className="ui-empty">
          <div className="big g"><Icon name="shield" /></div>
          <h3>준비 중인 기능이에요</h3>
          <p>아이디·비밀번호 찾기는 휴대폰 본인확인이 열리면 바로 쓰실 수 있어요.<br />그 전까지는 가까운 매장으로 문의해 주세요.</p>
          <button type="button" className="ui-btn pri" onClick={onBack}>로그인으로 돌아가기</button>
        </div>
      </div>
    );
  }

  const onVerified = async (r) => {
    const purpose = sheet;
    setSheet(null);
    setBusy(true);
    try {
      if (purpose === 'find_id') {
        const res = await findIdByIdentity(r.token);
        setFound((res.data && res.data.accounts) || []);
      } else {
        const res = await resetByIdentity(r.token, username.trim());
        setReset({ token: res.data.resetToken, username: username.trim() });
        setPw({ next: '', confirm: '', show: false });
      }
    } catch (e) {
      const msg = (e.response && e.response.data && e.response.data.error) || '잠시 후 다시 시도해 주세요.';
      if (purpose === 'find_id') notify({ icon: 'alert', title: '아이디를 찾지 못했어요', message: msg });
      else setErr({ username: msg });
    } finally { setBusy(false); }
  };

  const startReset = () => {
    if (!username.trim()) { setErr({ username: '아이디를 넣어 주세요.' }); return; }
    setErr({}); setSheet('reset_password');
  };

  const pwProblem = (p) => {
    if (!p || p.length < 6) return '비밀번호는 6자 이상이어야 해요!';
    if (PW_KINDS.filter(([, re]) => re.test(p)).length < 2) return '소문자·숫자·특수문자 중 2가지 이상을 넣어 주세요!';
    return '';
  };
  const savePw = async () => {
    const e = {};
    const p1 = pwProblem(pw.next);
    if (p1) e.next = p1; else if (pw.next !== pw.confirm) e.confirm = '두 비밀번호가 달라요.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await resetPassword(reset.token, pw.next);
      await notify({ icon: 'check', title: '비밀번호를 바꿨어요', message: '새 비밀번호로 로그인해 주세요.' });
      goLogin();
    } catch (x) {
      setErr({ next: (x.response && x.response.data && x.response.data.error) || '비밀번호를 바꾸지 못했어요.' });
    } finally { setBusy(false); }
  };

  const switchTab = (i) => { setTab(i); setErr({}); };

  return (
    <div className="v2 plain auth-v2">
      <Header onBack={onBack} />
      <div className="auth-wrap">
        <div className="auth">
          <div className="seg" role="tablist" aria-label="찾기">
            {['아이디 찾기', '비밀번호 재설정'].map((l, i) => (
              <button key={l} type="button" role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => switchTab(i)}>{l}</button>
            ))}
          </div>

          {tab === 0 && (found === null ? (
            <IdentityCard why="가입할 때 본인확인한 휴대폰으로 아이디를 찾아요" disabled={busy} onStart={() => setSheet('find_id')} />
          ) : found.length ? (
            <>
              <div className="notice g idv-done"><Icon name="check" /><div>본인확인한 번호로 가입한 아이디예요</div></div>
              {found.map((a) => (
                <div key={a.username + a.joined} className="group pad found-id">
                  <b>{a.username}</b>
                  <div className="f-hint">{a.joined ? `${a.joined.replace(/-/g, '. ')}. 가입` : ''}</div>
                </div>
              ))}
              <div className="btn-row">
                <button type="button" className="ui-btn gray" onClick={() => switchTab(1)}>비밀번호 재설정</button>
                <button type="button" className="ui-btn pri" onClick={goLogin}>로그인</button>
              </div>
            </>
          ) : (
            <div className="ui-empty">
              <div className="big"><Icon name="user" /></div>
              <h3>이 번호로 가입한 아이디가 없어요</h3>
              <p>본인확인한 휴대폰 번호로 가입한 계정을 찾지 못했어요.</p>
              {onSignup && <button type="button" className="ui-btn pri" onClick={onSignup}>회원가입</button>}
            </div>
          ))}

          {tab === 1 && (!reset ? (
            <>
              <label className="f-lbl" htmlFor="fa-id">아이디</label>
              <div className={`field${err.username ? ' err' : ''}`}>
                <input id="fa-id" value={username} placeholder="아이디를 입력해 주세요" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  onChange={(e) => { setUsername(e.target.value); if (err.username) setErr({}); }} />
              </div>
              {err.username && <div className="f-err"><Icon name="alert" size="sm" />{err.username}</div>}
              <IdentityCard why="아이디의 가입 정보와 본인확인 결과가 같으면 새 비밀번호를 정할 수 있어요" disabled={busy} onStart={startReset} />
            </>
          ) : (
            <>
              <div className="notice g idv-done"><Icon name="check" /><div>본인확인을 마쳤어요 · <b>{reset.username}</b></div></div>
              <label className="f-lbl" htmlFor="fa-pw">새 비밀번호</label>
              <div className={`field${err.next ? ' err' : ''}`}>
                <input id="fa-pw" type={pw.show ? 'text' : 'password'} autoComplete="new-password" value={pw.next} placeholder="새 비밀번호"
                  onChange={(e) => { const v = e.target.value; setPw((p) => ({ ...p, next: v })); if (err.next) setErr({}); }} />
                <button type="button" className="trail" aria-label={pw.show ? '비밀번호 가리기' : '비밀번호 보기'} onClick={() => setPw((p) => ({ ...p, show: !p.show }))}><Icon name="eye" size="sm" /></button>
              </div>
              {err.next ? <div className="f-err"><Icon name="alert" size="sm" />{err.next}</div> : (
                <div className="pw-pills">
                  <span className={`pill${pw.next.length >= 6 ? ' g' : ''}`}>{pw.next.length >= 6 ? '✓' : '○'} 6자 이상</span>
                  {PW_KINDS.map(([l, re]) => <span key={l} className={`pill${re.test(pw.next) ? ' g' : ''}`}>{re.test(pw.next) ? '✓' : '○'} {l}</span>)}
                </div>
              )}
              <label className="f-lbl" htmlFor="fa-pw2">새 비밀번호 확인</label>
              <div className={`field${err.confirm ? ' err' : ''}`}>
                <input id="fa-pw2" type="password" autoComplete="new-password" value={pw.confirm} placeholder="새 비밀번호 다시 입력"
                  onChange={(e) => { const v = e.target.value; setPw((p) => ({ ...p, confirm: v })); if (err.confirm) setErr({}); }} />
              </div>
              {err.confirm && <div className="f-err"><Icon name="alert" size="sm" />{err.confirm}</div>}
              {!err.confirm && pw.confirm && pw.confirm === pw.next && <div className="f-ok"><Icon name="check" size="sm" />두 비밀번호가 같아요</div>}
              <button type="button" className={`ui-btn full ${busy ? 'dis' : 'pri'}`} style={{ marginTop: 'var(--sp-4)' }} disabled={busy} onClick={savePw}>{busy ? '바꾸는 중…' : '비밀번호 바꾸기'}</button>
            </>
          ))}
        </div>
      </div>
      {sheet && <IdentitySheet purpose={sheet} onClose={() => setSheet(null)} onDone={onVerified} />}
    </div>
  );
}

export default FindAccount;
