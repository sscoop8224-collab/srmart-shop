import { useState } from 'react';

function FindAccount({ users, onBack }) {
  const [tab, setTab] = useState('id');
  const [form, setForm] = useState({ name: '', phone: '' });
  const [result, setResult] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);

  const handleFindId = () => {
    if (!form.name || !form.phone) {
      alert('이름과 휴대폰 번호를 입력해주세요!');
      return;
    }
    const user = users.find((u) => u.name === form.name && u.phone === form.phone);
    if (user) {
      setResult({ type: 'id', value: user.email });
    } else {
      alert('일치하는 회원 정보가 없어요!');
    }
  };

  const handleFindPassword = () => {
    if (!form.name || !form.phone) {
      alert('이름과 휴대폰 번호를 입력해주세요!');
      return;
    }
    const user = users.find((u) => u.name === form.name && u.phone === form.phone);
    if (user) {
      const temp = 'temp' + Math.random().toString(36).slice(2, 8).toUpperCase();
      setTempPassword(temp);
      setResult({ type: 'password', value: temp, userId: user.email });
      alert('임시 비밀번호가 발급됐어요!\n실제 서비스에서는 문자로 발송됩니다 😊');
    } else {
      alert('일치하는 회원 정보가 없어요!');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'white' }}>

      {/* 상단 그린 영역 */}
      <div style={{ background: 'linear-gradient(160deg, #00c471 0%, #00a85e 100%)', padding: '40px 32px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
        <span style={{ fontSize: '48px', marginBottom: '8px', position: 'relative', zIndex: 1 }}>🔍</span>
        <span style={{ fontFamily: "'Nanum Pen Script', cursive", fontSize: '28px', color: 'white', fontWeight: '700', position: 'relative', zIndex: 1 }}>아이디/비밀번호 찾기</span>
      </div>

      {/* 폼 영역 */}
      <div style={{ flex: 1, background: 'white', borderRadius: '28px 28px 0 0', marginTop: '-24px', padding: '32px 24px', position: 'relative', zIndex: 2 }}>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e9ecef', paddingBottom: '0' }}>
          {[
            { key: 'id', label: '아이디 찾기' },
            { key: 'password', label: '비밀번호 찾기' },
          ].map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setResult(null); setForm({ name: '', phone: '' }); }} style={{ padding: '10px 20px', background: 'transparent', color: tab === t.key ? '#00c471' : '#868e96', border: 'none', borderBottom: tab === t.key ? '2px solid #00c471' : '2px solid transparent', cursor: 'pointer', fontWeight: tab === t.key ? '700' : '500', fontSize: '15px', fontFamily: 'inherit' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 결과 화면 */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#e8faf3', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
              {result.type === 'id' ? (
                <>
                  <p style={{ fontSize: '14px', color: '#495057', margin: '0 0 8px' }}>회원님의 아이디는</p>
                  <p style={{ fontSize: '20px', fontWeight: '900', color: '#00c471', margin: '0 0 8px' }}>{result.value}</p>
                  <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>입니다 😊</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: '14px', color: '#495057', margin: '0 0 8px' }}>임시 비밀번호가 발급됐어요!</p>
                  <p style={{ fontSize: '24px', fontWeight: '900', color: '#00c471', margin: '0 0 8px', letterSpacing: '2px' }}>{result.value}</p>
                  <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>로그인 후 비밀번호를 변경해주세요!</p>
                </>
              )}
            </div>
            <button onClick={onBack} style={{ padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              로그인하러 가기
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>이름</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름을 입력해주세요" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8f9fa' }} onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }} onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>휴대폰 번호</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="010-0000-0000" type="tel" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#f8f9fa' }} onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }} onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }} />
            </div>
            <button onClick={tab === 'id' ? handleFindId : handleFindPassword} style={{ padding: '16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '16px', cursor: 'pointer', fontWeight: '800', marginTop: '8px', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              {tab === 'id' ? '아이디 찾기' : '임시 비밀번호 발급'}
            </button>
            <button onClick={onBack} style={{ padding: '14px', background: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '14px', fontSize: '15px', cursor: 'pointer', fontWeight: '700' }}>
              로그인으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FindAccount;