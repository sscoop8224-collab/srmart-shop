// 제3자 제공 동의 — 기존 회원에게 **딱 한 번** 묻는 팝업 (2026-09-11).
// 모양은 목업 정본 v1 의 S32(묶음 5 · 2026-11-12 밤): 제목 없는 시트 · 「동의하지 않으셔도 괜찮아요」를 먼저 크게 ·
// 세 갈래(동의하고 매장 이용 · 동의 안 함 · 나중에 할게요).
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
import Icon from './ui/Icon';
import { useCustomerBranchList, topicJosa } from '../utils/customerStores';
import { BRAND } from '../brand';

export default function ThirdPartyConsentModal({ onDone }) {
  const branches = useCustomerBranchList();
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
    <div className="overlay sheet-over tpc-over" role="dialog" aria-modal="true" aria-labelledby="tpc-title">
      <div className="sheet v2 plain">
        <div className="grabber" />
        <div className="sheet-h" />
        <div className="sheet-b">
          <div className="pad tpc">
            <h2 id="tpc-title">매장 이용도 함께 하시겠어요?</h2>
            <p>
              {/* 지점 이름은 손님에게 보이는 매장 목록(GET /api/stores?audience=customer)으로 만든다 —
                  utils/customerStores.js 머리말. 못 불러오면 목록 없이 「각 지점」. */}
              {branches
                ? <>{BRAND.name} <b>{branches}</b>{topicJosa(branches)} 각각 다른 사업자예요.</>
                : <>{BRAND.name} 각 지점은 각각 다른 사업자예요.</>}
              {' '}매장에서 포인트를 쌓고 쓰시고 <b>매장에서 사신 영수증을 앱에서 보시려면</b>,
              이름·연락처·회원번호·포인트 내역과 매장 구매 내역을 각 지점에 제공하는 데 동의가 필요해요.
            </p>
            <div className="notice g">
              <Icon name="info" />
              <div><b>동의하지 않으셔도 괜찮아요</b><br />온라인 주문과 온라인 포인트는 그대로 쓰실 수 있어요. 매장 적립과 매장 영수증 보기만 빠져요.</div>
            </div>
            <p className="f-hint">제공 항목 이름·연락처·회원번호·포인트 내역·매장 구매 내역 · 목적 지점 통합 회원·포인트 운영·구매 내역 표시 · 보유 기간 회원 탈퇴 시까지. 자세한 내용은 개인정보처리방침에서 보실 수 있어요.</p>
            {!!error && <div className="f-err"><Icon name="alert" size="sm" />{error}</div>}
            <button type="button" className={`ui-btn full ${saving ? 'dis' : 'pri'}`} disabled={saving} onClick={() => answer(true)}>
              {saving ? '저장 중…' : '동의하고 매장 이용'}
            </button>
            <button type="button" className="ui-btn full gray" disabled={saving} onClick={() => answer(false)}>동의 안 함</button>
            {/* 보류 — 서버에 아무것도 보내지 않는다(위 주석 참고). */}
            <button type="button" className="later" disabled={saving} onClick={() => onDone(null)}>나중에 할게요</button>
          </div>
        </div>
      </div>
    </div>
  );
}
