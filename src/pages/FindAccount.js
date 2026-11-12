// 아이디/비밀번호 찾기 (목업 정본 v1 의 S29 자리, 묶음 5 · 2026-11-12 밤).
// 목업은 「휴대폰 본인확인(S48)으로 찾는다」 — 그런데 본인확인이 운영에 아직 꺼져 있다(서버 /api/auth/find-id 가
// IDENTITY_OFF 로 돌려준다). 그래서 지금은 **「준비 중」 안내만** 목업 모양(가운데 빈 화면)으로 보여 준다.
//   - 예전 가짜 목업(클라 임시비번 생성/화면 노출/alert, localStorage 검색)은 이미 지웠다 — 실제 계정에
//     적용되지도 않던(먹통) 동작이라 노출·오해 소지가 컸다.
//   - 본인확인이 켜지면 목업 S29 그대로(아이디 찾기 · 비밀번호 재설정 두 칸) 바꾼다. 설계: docs/SHOP_IDENTITY_VERIFY.md
import Icon from '../components/ui/Icon';

function FindAccount({ onBack }) {
  return (
    <div className="v2 plain auth-v2">
      <header className="app-nav line">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" onClick={onBack}><Icon name="chevL" />로그인</button></div>
          <div className="nav-title">아이디·비밀번호 찾기</div>
          <div className="nav-side r" />
        </div>
      </header>
      <div className="ui-empty">
        <div className="big g"><Icon name="shield" /></div>
        <h3>준비 중인 기능이에요</h3>
        <p>아이디·비밀번호 찾기는 휴대폰 본인확인이 열리면 바로 쓰실 수 있어요.<br />그 전까지는 가까운 매장으로 문의해 주세요.</p>
        <button type="button" className="ui-btn pri" onClick={onBack}>로그인으로 돌아가기</button>
      </div>
    </div>
  );
}

export default FindAccount;
