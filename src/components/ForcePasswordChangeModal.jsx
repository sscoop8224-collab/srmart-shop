import { useState } from 'react';
import API from '../api';
import { useDialog } from '../DialogContext';
import Icon from './ui/Icon';

// Y5 강제 비밀번호 변경(임시비번, must_change_password=1) — 목업 정본 v1 의 S31(묶음 5 · 2026-11-12 밤).
// 닫을 수 없는 창: 새 비밀번호 · 확인 · 「비밀번호 표시」 · 비밀번호 변경. 흐름은 그대로다:
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
  const [error, setError] = useState({ at: '', msg: '' });   // at: 'pw' | 'confirm' — 그 칸 아래에 쓴다

  const handleSubmit = async () => {
    setError({ at: '', msg: '' });
    if (newPw.length < 6) {
      setError({ at: 'pw', msg: '새 비밀번호는 6자 이상(소문자·숫자·특수문자 중 2종 이상)이어야 해요.' });
      return;
    }
    if (newPw !== newPw2) {
      setError({ at: 'confirm', msg: '새 비밀번호가 일치하지 않아요.' });
      return;
    }
    setLoading(true);
    try {
      await API.post('/auth/admin-change-password', { newPassword: newPw });
      await notify({ icon: 'check', title: '비밀번호를 바꿨어요', message: '새 비밀번호로 다시 로그인해 주세요.' });
      onDone();
    } catch (err) {
      setError({ at: 'pw', msg: err.response?.data?.error || '변경에 실패했어요. 잠시 후 다시 시도해주세요.' });
      setLoading(false);
    }
  };

  const err = (at) => (error.at === at && error.msg
    ? <div className="f-err"><Icon name="alert" size="sm" />{error.msg}</div> : null);

  return (
    <div className="overlay center" role="dialog" aria-modal="true" aria-labelledby="mcp-title">
      <div className="alert v2 mcp-alert">
        <div className="ab">
          <Icon name="lock" size="lg" />
          <b id="mcp-title">새 비밀번호 설정</b>
          <p>임시 비밀번호로 로그인하셨어요. 보안을 위해 새 비밀번호를 설정해 주세요.</p>
          <div className={`field${error.at === 'pw' ? ' err' : ''}`}>
            <input id="mcp-pw" aria-label="새 비밀번호" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="새 비밀번호"
              value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          {err('pw')}
          <div style={{ height: 'var(--sp-2)' }} />
          <div className={`field${error.at === 'confirm' ? ' err' : ''}`}>
            <input id="mcp-pw2" aria-label="새 비밀번호 확인" type={showPw ? 'text' : 'password'} autoComplete="new-password" placeholder="새 비밀번호 확인"
              value={newPw2} onChange={(e) => setNewPw2(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} />
          </div>
          {err('confirm')}
          <label className="f-hint chk">
            <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
            <span className={`check sq${showPw ? ' on' : ''}`}>{showPw && <Icon name="check" size="sm" />}</span>비밀번호 표시
          </label>
          <button type="button" className={`ui-btn full ${loading ? 'dis' : 'pri'}`} disabled={loading} onClick={handleSubmit}>
            {loading ? '변경 중…' : '비밀번호 변경'}
          </button>
        </div>
      </div>
    </div>
  );
}
