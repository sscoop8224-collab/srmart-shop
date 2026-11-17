// 약관·동의 전문 보기 (목업 정본 v1 의 S49 · 2026-11-17 밤샘 지시 6)
//
// 가입 3단계(P04) 동의 줄마다 「보기」 → 이 시트. 위에서 내려 읽고 「확인」으로 닫는다(닫으면 동의 화면 그대로 · 체크는 안 바뀐다).
// 🔴 문안은 **자리표시**다 — 확정 문안은 대표님·자문(개인정보 처리방침 초안: docs/PRIVACY_SIGNUP_KEY_DRAFT.md).
//    문안을 지어 넣지 않는다: 법적 효력이 있는 글이라, 확정 전 글이 손님 눈에 「약관」으로 보이면 그 자체가 문제다.
//    문안이 정해지면 TERMS 의 body 만 채운다(제목 구조는 목업 S49 그대로).
import Icon from './ui/Icon';

const TODO = '문안 자리 — 대표님·자문 확정 뒤 넣어요.';
export const TERMS = {
  privacy: {
    title: '개인정보 수집·이용',
    parts: [['수집 항목', TODO], ['이용 목적', TODO], ['보유 기간', TODO], ['동의를 거부할 권리', TODO]],
  },
  thirdParty: {
    title: '지점 통합 회원·포인트·구매 내역 이용',
    parts: [['제공받는 자', TODO], ['제공 항목', TODO], ['이용 목적', TODO], ['보유 기간', TODO], ['동의하지 않으면', TODO]],
  },
  marketing: {
    title: '혜택 알림 수신',
    parts: [['받는 것', TODO], ['이용 항목', TODO], ['보유 기간', TODO], ['거부해도', TODO]],
  },
};

function TermsSheet({ kind, onClose }) {
  const t = TERMS[kind];
  if (!t) return null;
  return (
    <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby="terms-sheet-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet v2 plain" data-testid={`terms:${kind}`}>
        <div className="grabber" />
        <div className="sheet-h">
          <div className="nav-side" />
          <div className="nav-title" id="terms-sheet-title">{t.title}</div>
          <div className="nav-side r"><button className="nav-btn b" onClick={onClose}>닫기</button></div>
        </div>
        <div className="sheet-b">
          <div className="pad" style={{ paddingTop: 0 }}>
            <div className="notice o"><Icon name="info" /><div style={{ flex: 1 }}>문안 확정 전이에요 — 아래는 자리만 잡아 두었어요.</div></div>
            {t.parts.map(([h, body]) => (
              <div key={h} style={{ marginTop: 'var(--sp-4)' }}>
                <h4 style={{ margin: 0, fontSize: 'var(--fs-subhead)', fontWeight: 'var(--fw-semibold)' }}>{h}</h4>
                <p className="f-hint" style={{ marginTop: 'var(--sp-1)' }}>{body}</p>
              </div>
            ))}
            <button className="ui-btn pri" style={{ width: '100%', marginTop: 'var(--sp-5)' }} onClick={onClose}>확인</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsSheet;
