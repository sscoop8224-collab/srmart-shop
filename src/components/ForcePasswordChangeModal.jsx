import { useState } from 'react';
import API from '../api';
import { useDialog } from '../DialogContext';

// Y5 강제 비밀번호 변경(임시비번, must_change_password=1) — shop 앱 전용 신설 화면.
// srmart-admin 의 Login.js '강제 비밀번호 변경 모달'과 동일한 흐름을 그대로 미러링한다:
//   - 이 화면이 뜬 시점엔 mcp 토큰만 localStorage(srmart_token) 에 저장돼 있고
//     정식 로그인(setUser/authLogin)은 보류된 상태(App.js handleLogin 참조)
//   - POST /api/auth/admin-change-password 는 role 무관 범용 엔드포인트(인증만 요구,
//     req.user 본인 비밀번호를 바꿈) — index.js AI_ENC_KEY 앞단 authMiddleware 의
//     MCP_ALLOWED_PATHS 에 이미 등록돼 있어 mcp 토큰으로도 호출 가능. 백엔드 변경 불필요.
//   - 성공 시 admin 과 동일하게 토큰을 비우고 재로그인을 유도(서버가 주는 새 정식 토큰을
//     바로 쓰지 않음 — admin 패턴을 그대로 따라가 로그인 상태 관리 두 갈래를 만들지 않음)
export default function ForcePasswordChangeModal({ onDone }) {
  const { notify } = useDialog();
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (newPw.length < 6) {
      setError('새 비밀번호는 6자 이상(소문자·숫자·특수문자 중 2종 이상)이어야 해요.');
      return;
    }
    if (newPw !== newPw2) {
      setError('새 비밀번호가 일치하지 않아요.');
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/admin-change-password', { newPassword: newPw });
      await notify('비밀번호가 변경됐어요! 새 비밀번호로 다시 로그인해주세요.');
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || '변경에 실패했어요. 잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🔒</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, textAlign: 'center', color: '#14110F' }}>
          새 비밀번호 설정
        </h3>
        <p style={{ color: '#6B6259', fontSize: 13, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.5 }}>
          임시 비밀번호로 로그인하셨어요. 보안을 위해 새 비밀번호를 설정해주세요.
        </p>
        <input
          type={showPw ? 'text' : 'password'}
          placeholder="새 비밀번호"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          style={inputStyle}
        />
        <input
          type={showPw ? 'text' : 'password'}
          placeholder="새 비밀번호 확인"
          value={newPw2}
          onChange={(e) => setNewPw2(e.target.value)}
          style={inputStyle}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6B6259', marginBottom: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
          비밀번호 표시
        </label>
        {error && <p style={{ color: '#E5484D', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
          {loading ? '변경 중...' : '비밀번호 변경'}
        </button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: 20,
};
const modalStyle = {
  background: '#fff', padding: '28px 24px', borderRadius: 16,
  width: '100%', maxWidth: 360,
  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  boxSizing: 'border-box',
};
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  border: '1.5px solid rgba(31,169,56,0.18)', fontSize: 14,
  marginBottom: 10, outline: 'none', background: '#F2FBF4',
  color: '#14110F', fontFamily: 'inherit', boxSizing: 'border-box',
};
const buttonStyle = {
  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(180deg, #2BC047 0%, #178A2D 100%)',
  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 6px 16px rgba(23,138,45,0.28)', fontFamily: 'inherit',
};
