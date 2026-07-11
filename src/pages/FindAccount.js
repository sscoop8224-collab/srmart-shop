// 아이디/비밀번호 찾기.
// Part 1(현재): 서버 인증(SMS/알림톡) 연동 전까지 "준비 중" 안내만 표시.
//   - 기존 가짜 목업 제거: 클라 임시비번 생성/화면 노출/alert, localStorage(users) 검색.
//   - 임시비번을 실제 계정에 적용하지도 않던(먹통) 동작이라 노출·오해 소지가 컸음.
// Part 2에서 서버 send-code/verify-code → reset-password 흐름으로 실제 연결.
//   설계: srmart-backend/SMS_AUTH_DESIGN.md
function FindAccount({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>

      {/* 상단 그린 영역 */}
      <div style={{ background: 'linear-gradient(160deg, #00c471 0%, #00a85e 100%)', padding: '40px 32px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <span style={{ fontSize: '48px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>🔍</span>
        <span style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: '28px', color: 'white', fontWeight: '700', position: 'relative', zIndex: 1 }}>아이디/비밀번호 찾기</span>
      </div>

      {/* 준비 중 안내 */}
      <div style={{ flex: 1, background: 'white', borderRadius: '28px 28px 0 0', marginTop: '-24px', padding: '32px 24px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: '#f1f3f5', borderRadius: '16px', padding: '28px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛠️</div>
          <p style={{ fontSize: '17px', fontWeight: '800', color: '#343a40', margin: '0 0 10px' }}>준비 중인 기능이에요</p>
          <p style={{ fontSize: '14px', color: '#868e96', margin: 0, lineHeight: 1.6 }}>
            아이디·비밀번호 찾기는 문자(SMS)/카카오 알림톡<br />본인 인증 연동 후 제공될 예정이에요.<br />
            <span style={{ fontWeight: '700', color: '#495057' }}>그 전까지는 가까운 매장으로 문의해주세요.</span>
          </p>
        </div>
        <button onClick={onBack} style={{ padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default FindAccount;
