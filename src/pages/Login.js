import { useState } from 'react';

function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [users, setUsers] = useState([
    { name: '관리자', email: 'admin@srmart.com', password: '1234' }
  ]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = () => {
    const user = users.find(
      (u) => u.email === form.email && u.password === form.password
    );
    if (user) {
      alert(`환영해요, ${user.name}님! 😊`);
      onLogin(user);
    } else {
      alert('이메일 또는 비밀번호가 틀렸어요!');
    }
  };

  const handleSignup = () => {
    if (!form.name || !form.email || !form.password) {
      alert('모든 항목을 입력해주세요!');
      return;
    }
    const existing = users.find((u) => u.email === form.email);
    if (existing) {
      alert('이미 가입된 이메일이에요!');
      return;
    }
    const newUser = { name: form.name, email: form.email, password: form.password };
    setUsers([...users, newUser]);
    alert(`${form.name}님 가입을 축하해요! 🎉 로그인해주세요!`);
    setIsSignup(false);
    setForm({ name: '', email: '', password: '' });
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#f5f5f5', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#1a73e8' }}>
          {isSignup ? '🛒 SR Mart 회원가입' : '🛒 SR Mart 로그인'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isSignup && (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름"
              style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
            />
          )}
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="이메일"
            type="email"
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
          />
          <input
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호"
            type="password"
            style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '14px' }}
          />
          <button
            onClick={isSignup ? handleSignup : handleLogin}
            style={{ padding: '12px', background: '#1a73e8', color: 'white', border: 'none', borderRadius: '4px', fontSize: '15px', cursor: 'pointer', marginTop: '8px' }}
          >
            {isSignup ? '회원가입' : '로그인'}
          </button>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#666' }}>
          {isSignup ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}
          <span
            onClick={() => { setIsSignup(!isSignup); setForm({ name: '', email: '', password: '' }); }}
            style={{ color: '#1a73e8', cursor: 'pointer', marginLeft: '8px', fontWeight: 'bold' }}
          >
            {isSignup ? '로그인' : '회원가입'}
          </span>
        </p>

        {!isSignup && (
          <div style={{ marginTop: '20px', background: '#e3f2fd', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#555' }}>
            <p style={{ margin: '0 0 4px', fontWeight: 'bold' }}>테스트 계정</p>
            <p style={{ margin: 0 }}>이메일: admin@srmart.com</p>
            <p style={{ margin: 0 }}>비밀번호: 1234</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;