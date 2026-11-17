// 휴대폰 본인확인 시트 — 목업 S48 (2026-11-16 지시 7). 가입 2단계 · 아이디 찾기 · 비밀번호 재설정 · 마이 「본인확인 하기」 · 번호 바꾸기가
// 모두 이 한 길을 쓴다. 흐름은 identityClient.verifyIdentity(상태 → 시작 → 업체 창 → 완료) 하나.
//
//   상태(목업 S48): 업체 창 · 확인 중 · 이미 가입한 번호(가입 목적만) · 실패·취소(「다시 하기」)
//   · 업체 창 — 🔴 진짜 업체가 정해지기 전에는 **시험용 창**(MockVendorForm)만 있다. 그것은 빌드 값 REACT_APP_IDENTITY_MOCK=1
//     일 때만 번들에 들어간다(아래 require 줄 — 운영 빌드는 .env.production 의 =0 으로 빌드 때 빠진다 · scripts/check-identity-mock.cjs).
//   · 진짜 업체 길(시험용이 아닐 때)은 「본인확인 창 열기」 단추 → 업체 팝업. 앱 안(Capacitor)의 인앱 브라우저는 업체 계약 뒤에 붙인다.
//   · 「이미 가입한 번호」 — 서버 완료 응답의 existing_accounts(가린 아이디). 가입 입구도 같은 판정으로 막는다(409).
import { useState } from 'react';
import Icon from '../components/ui/Icon';
import { useDialog } from '../DialogContext';
import { verifyIdentity } from './identityClient';

// 🔴 이 줄을 바꾸지 마라 — 빌드 때 조건이 정해져야 시험용 창이 운영 번들에서 빠진다(check-identity-mock ②)
const MockVendorForm = process.env.REACT_APP_IDENTITY_MOCK === '1' ? require('./MockVendorForm').default : null;

export default function IdentitySheet({ purpose, onClose, onDone, onFindId }) {
  const { confirm } = useDialog();
  const [busy, setBusy] = useState(false);

  const run = async (mockInput) => {
    setBusy(true);
    let r;
    try {
      r = await verifyIdentity(purpose, mockInput ? { mockInput } : {});
    } catch (e) {
      setBusy(false);
      const again = await confirm({
        icon: 'alert', title: '본인확인을 마치지 못했어요',
        message: e && e.code === 'IDENTITY_OFF' ? '본인확인이 아직 준비 중이에요.' : `${(e && e.message) || '창을 닫았거나 정보가 맞지 않았어요.'}`,
        cancelLabel: '닫기', okLabel: '다시 하기',
      });
      if (!again) onClose();
      return;
    }
    setBusy(false);
    if (purpose === 'signup' && r && Array.isArray(r.existing_accounts) && r.existing_accounts.length) {
      const ids = r.existing_accounts.map((a) => a.username).join(', ');
      const go = await confirm({
        icon: 'user', title: '이미 가입하셨어요',
        message: `본인확인한 분의 계정(${ids})이 있어요. 새로 가입하지 않고 그 계정으로 로그인해 주세요.`,
        cancelLabel: '닫기', okLabel: '아이디 찾기',
      });
      onClose();
      if (go && onFindId) onFindId();
      return;
    }
    onDone(r);
  };

  return (
    <>
      <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby="idv-sheet-title" onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
        <div className="sheet v2">
          <div className="grabber" />
          <div className="sheet-h">
            <div className="nav-side"><button type="button" className="nav-btn" disabled={busy} onClick={onClose}>닫기</button></div>
            <div className="nav-title" id="idv-sheet-title">휴대폰 본인확인</div>
            <div className="nav-side r" />
          </div>
          <div className="sheet-b">
            <div className="pad" style={{ paddingTop: 0 }}>
              {MockVendorForm ? (
                <MockVendorForm onSubmit={(input) => run(input)} />
              ) : (
                <div className="verify-win">
                  <div className="vw-h"><Icon name="lock" size="sm" />본인확인 업체 창</div>
                  <div className="pad">
                    <div className="f-hint">통신사 본인확인 창이 열려요. 이름·생년월일·휴대폰 번호를 확인한 뒤 이 화면으로 돌아와요.</div>
                    <button type="button" className="ui-btn full pri" style={{ marginTop: 'var(--sp-3)' }} disabled={busy} onClick={() => run(null)}>본인확인 창 열기</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {busy && (
        <div className="overlay center" role="alertdialog" aria-modal="true" aria-live="polite">
          <div className="alert"><div className="ab"><span className="spin" style={{ margin: '0 auto var(--sp-2)' }} /><b>본인확인 결과를 받는 중…</b><p>잠시만 기다려 주세요.</p></div></div>
        </div>
      )}
    </>
  );
}

/** 「휴대폰 본인확인」 카드 — 목업 verifyCard(전). 단추를 누르면 시트를 연다. */
export function IdentityCard({ why = '이름·생년월일·휴대폰 번호는 본인확인으로 채워져요', onStart, error, disabled = false }) {
  return (
    <>
      <div className="group pad idv-card">
        <b className="idv-t"><Icon name="shield" size="sm" /> 휴대폰 본인확인</b>
        <div className="f-hint">{why}</div>
        <button type="button" className={`ui-btn full ${disabled ? 'dis' : 'pri'}`} style={{ marginTop: 'var(--sp-3)' }} disabled={disabled} onClick={onStart}>휴대폰 본인확인</button>
        <div className="f-hint" style={{ textAlign: 'center', marginTop: 'var(--sp-2)' }}>본인확인 업체 창으로 갔다가 돌아와요</div>
      </div>
      {error && <div className="f-err"><Icon name="alert" size="sm" />{error}</div>}
    </>
  );
}

/** 본인확인을 마친 칸들 — 목업 verifyCard(후). 읽기 전용 · 「본인확인」 표. */
export function VerifiedFields({ result, title = '본인확인을 마쳤어요' }) {
  const birth = result && result.birthdate ? result.birthdate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1. $2. $3.') : '';
  return (
    <>
      <div className="notice g idv-done"><Icon name="check" /><div><b>{title}</b></div></div>
      <label className="f-lbl">이름</label>
      <div className="field ro"><span className="v">{result.name}</span><span className="ro-tag">본인확인</span></div>
      {birth && <><label className="f-lbl">생년월일</label><div className="field ro"><span className="v">{birth}</span><span className="ro-tag">본인확인</span></div></>}
      <label className="f-lbl">휴대폰 번호</label>
      <div className="field ro"><span className="v">{result.phone_masked}</span><span className="ro-tag">본인확인</span></div>
    </>
  );
}
