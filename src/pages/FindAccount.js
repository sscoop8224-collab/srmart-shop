import { useState } from 'react';

function FindAccount({ users, onBack }) {
  const [tab, setTab] = useState('id');
  const [form, setForm] = useState({ name: '', email: '', newPassword: '' });
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setResult(null);
  };

  const handleFindId = () => {
    if (!form.name.trim()) { alert('이름을 입력해주세요!'); return; }
    const user = users.find((u) => u.name === form.name.trim());
    if (user) {
      const email = user.email;
      const masked = email.substring(0, 3) + '****' + email.substring(email.indexOf('@'));
      setResult({ type: 'success', message: '찾은 이메일: ' + masked });
    } else {
      setResult({ type: 'error', message: '해당 이름으로 가입된 계정이 없어요!' });
    }
  };

  const handleFindPassword = () => {
    if (step === 1) {
      if (!form.email.trim()) { alert('이메일을 입력해주세요!'); return; }
      const user = users.find((u) => u.email === form.email.trim());
      if (user) {
        setStep(2);
        setResult({ type: 'success', message: '이메일이 확인됐어요! 새 비밀번호를 입력해주세요.' });
      } else {
        setResult({ type: 'error', message: '해당 이메일로 가입된 계정이 없어요!' });
      }
    } else {
      if (!form.newPassword.trim()) { alert('새 비밀번호를 입력해주세요!'); return; }
      if (form.newPassword.length < 4) { alert('비밀번호는 4자 이상이어야 해요!'); return; }
      const user = users.find((u) => u.email === form.email.trim());
      if (user) {
        user.password = form.newPassword;
        setResult({ type: 'success', message: '비밀번호가 변경됐어요! 새 비밀번호로 로그인해주세요.' });
        setStep(3);
      }
    }
  };

  const resetForm = () => {
    setForm({ name: '', email: '', newPassword: '' });
    setResult(null);
    setStep(1);
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#f1f8e9', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #c8e6c9' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#2e7d32' }}>🔍 계정 찾기</h2>

        {/* 탭 */}
        <div style={{ display: 'flex', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #c8e6c9' }}>
          {[{ key: 'id', label: '아이디 찾기' }, { key: 'password', label: '비밀번호 찾기' }].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); resetForm(); }}
              style={{ flex: 1, padding: '10px', background: tab === t.key ? '#2e7d32' : 'white', color: tab === t.key ? 'white' : '#2e7d32', border: 'none', cursor: 'pointer', fontWeight: tab === t.key ? 'bold' : 'normal', fontSize: '14px' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 아이디 찾기 */}
        {tab === 'id' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>가입 시 입력한 이름으로 아이디를 찾을 수 있어요.</p>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              onKeyDown={(e) => e.key === 'Enter' && handleFindId()}
              placeholder="이름 입력"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }}
            />
            <button onClick={handleFindId} style={{ padding: '12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
              아이디 찾기
            </button>
          </div>
        )}

        {/* 비밀번호 찾기 */}
        {tab === 'password' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {step === 1 && (
              <>
                <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>가입한 이메일로 비밀번호를 재설정할 수 있어요.</p>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleFindPassword()}
                  placeholder="이메일 입력"
                  type="email"
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }}
                />
                <button onClick={handleFindPassword} style={{ padding: '12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                  이메일 확인
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <input
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleFindPassword()}
                  placeholder="새 비밀번호 입력"
                  type="password"
                  style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }}
                />
                <button onClick={handleFindPassword} style={{ padding: '12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                  비밀번호 변경
                </button>
              </>
            )}
            {step === 3 && (
              <button onClick={() => { resetForm(); onBack(); }} style={{ padding: '12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                로그인 하러 가기
              </button>
            )}
          </div>
        )}

        {/* 결과 메시지 */}
        {result && (
          <div style={{ marginTop: '16px', padding: '12px', background: result.type === 'success' ? '#e8f5e9' : '#ffebee', borderRadius: '8px', border: '1px solid ' + (result.type === 'success' ? '#c8e6c9' : '#ffcdd2') }}>
            <p style={{ margin: 0, fontSize: '14px', color: result.type === 'success' ? '#2e7d32' : '#e53935' }}>{result.message}</p>
          </div>
        )}

        {/* 뒤로가기 */}
        {step !== 3 && (
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
            <span onClick={onBack} style={{ color: '#2e7d32', cursor: 'pointer', fontWeight: 'bold' }}>
              ← 로그인으로 돌아가기
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default FindAccount;