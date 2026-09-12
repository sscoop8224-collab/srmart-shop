// 제3자 제공 동의 — 기존 회원에게 **딱 한 번** 묻는 팝업 (2026-09-11).
//
// ── 왜 팝업인가 ──────────────────────────────────────────────────────────
//
// 동의 항목이 나중에 생겼다. 새로 가입하는 사람은 가입 화면에서 고르지만, 이미 가입한 회원은
// 고를 기회가 없었다. 그렇다고 조용히 동의한 것으로 처리할 수는 없다 — 5개 지점이 서로 다른
// 사업자라 동의 없이 회원 정보를 넘기는 것 자체가 문제가 된다.
//
// ── 한 번만 묻는다 ───────────────────────────────────────────────────────
//
// 거절해도 다시 묻지 않는다(서버가 asked_at 을 남긴다). 볼 때마다 다시 뜨는 동의 창은 동의를
// 받는 게 아니라 지쳐서 누르게 만드는 것이고, 그렇게 받은 동의는 동의가 아니다.
//
// ── 닫기를 막지 않는다 ───────────────────────────────────────────────────
//
// 선택 항목이므로 "나중에" 로 넘어갈 수 있어야 한다. 다만 그건 답이 아니라 보류라서 서버에
// 아무것도 보내지 않는다 — 다음 로그인 때 다시 뜬다. 답(동의/거절)을 해야만 끝난다.
import { useState } from 'react';
import API from '../api';

export default function ThirdPartyConsentModal({ onDone }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const answer = async (agree) => {
    setSaving(true);
    setError('');
    try {
      const res = await API.post('/users/third-party-consent', { agree });
      onDone(res.data?.thirdPartyConsent === 1);
    } catch {
      // 저장에 실패하면 **닫지 않는다.** 닫아버리면 회원은 답했다고 생각하는데 서버에는
      // 아무것도 안 남아, 다음 로그인 때 같은 창이 또 떠서 이유를 알 수 없게 된다.
      setError('저장하지 못했어요. 잠시 후 다시 시도해주세요.');
      setSaving(false);
    }
  };

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="tpc-title">
      <div style={sheet}>
        <div id="tpc-title" style={title}>매장 이용도 함께 하시겠어요?</div>

        <p style={body}>
          에스알마트 <b>검암점·왕길점·신흥점·고촌점·승학점</b>은 각각 다른 사업자예요.
          매장에서 포인트를 쌓고 쓰시고 <b>매장에서 사신 영수증을 앱에서 보시려면</b>,
          이름·연락처·회원번호·포인트 내역과 매장 구매 내역을 각 지점에 제공하는 데
          동의가 필요해요.
        </p>

        <div style={noteBox}>
          <div style={noteTitle}>동의하지 않으셔도 괜찮아요</div>
          <div style={noteBody}>
            온라인 주문과 온라인 포인트는 그대로 쓰실 수 있어요. 매장 적립과 매장
            영수증 보기만 빠져요.
          </div>
        </div>

        <p style={fine}>
          제공 항목 이름·연락처·회원번호·포인트 내역·매장 구매 내역 · 목적 지점 통합 회원·
          포인트 운영·구매 내역 표시 · 보유 기간 회원 탈퇴 시까지. 자세한 내용은
          개인정보처리방침에서 보실 수 있어요.
        </p>

        {!!error && <div style={errorText}>{error}</div>}

        <div style={btnRow}>
          <button type="button" style={{ ...btn, ...btnGhost }} disabled={saving} onClick={() => answer(false)}>
            동의 안 함
          </button>
          <button type="button" style={{ ...btn, ...btnPrimary, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={() => answer(true)}>
            {saving ? '저장 중...' : '동의하고 매장 이용'}
          </button>
        </div>

        {/* 보류 — 서버에 아무것도 보내지 않는다(위 주석 참고). */}
        <button type="button" style={laterBtn} disabled={saving} onClick={() => onDone(null)}>
          나중에 할게요
        </button>
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10000,
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 0,
};
const sheet = {
  background: 'var(--bg-card, #fff)', color: 'var(--text-primary, #111)',
  width: '100%', maxWidth: 480, borderRadius: '20px 20px 0 0', padding: '24px 20px 20px',
  boxShadow: '0 -8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 12,
};
const title = { fontSize: 18, fontWeight: 800, lineHeight: 1.4 };
const body = { fontSize: 14, lineHeight: 1.7, margin: 0, color: 'var(--text-secondary, #444)' };
const noteBox = { background: 'var(--gray-100, #f4f6f5)', borderRadius: 12, padding: '12px 14px' };
const noteTitle = { fontSize: 13, fontWeight: 700, marginBottom: 4 };
const noteBody = { fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary, #555)' };
const fine = { fontSize: 11, lineHeight: 1.7, color: 'var(--gray-400, #888)', margin: 0 };
const errorText = { fontSize: 13, color: '#d92d20' };
const btnRow = { display: 'flex', gap: 8, marginTop: 4 };
const btn = {
  flex: 1, padding: '14px 12px', borderRadius: 12, fontSize: 15, fontWeight: 700,
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
};
const btnGhost = { background: 'var(--gray-100, #eef0ef)', color: 'var(--text-secondary, #555)' };
const btnPrimary = { background: 'linear-gradient(180deg, #2BC047 0%, #178a2d 100%)', color: '#fff' };
const laterBtn = {
  background: 'none', border: 'none', color: 'var(--gray-400, #999)', fontSize: 13,
  padding: '6px 0 0', cursor: 'pointer', fontFamily: 'inherit',
};
