import { useState } from 'react';

function Members({ users, setUsers, goBack, darkMode }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editGrade, setEditGrade] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const grades = ['일반', 'VIP', '장기미고객', '관리자'];

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';

  const filteredUsers = users.filter((u) =>
    u.name.includes(search) || u.email.includes(search)
  );

  const handleGradeEdit = (index) => {
    setEditId(index);
    setEditGrade(users[index].grade || '일반');
    setEditMemo(users[index].memo || '');
  };

  const handleGradeSave = (index) => {
    setUsers(users.map((u, i) => i === index ? { ...u, grade: editGrade, memo: editMemo } : u));
    setEditId(null);
  };

  const handleDelete = (index) => {
    if (users[index].grade === '관리자' || ['owner', 'store_manager'].includes(users[index].role)) { alert('관리자 계정은 삭제할 수 없어요!'); return; }
    if (window.confirm(users[index].name + '님을 삭제할까요?')) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const gradeColor = (grade) => {
    if (grade === 'VIP') return { bg: darkMode ? '#2a1e10' : '#fff3e0', color: '#e65100' };
    if (grade === '장기미고객') return { bg: darkMode ? '#2a1010' : '#fff0f1', color: '#ff4757' };
    if (grade === '관리자') return { bg: darkMode ? '#1e2e24' : '#f0faf5', color: '#00a85e' };
    return { bg: darkMode ? '#2e2e2e' : '#f1f3f5', color: '#868e96' };
  };

  const gradeIcon = (grade) => {
    if (grade === 'VIP') return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e65100" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    );
    if (grade === '관리자') return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    );
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#868e96" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    );
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: darkMode ? '#0d4d2a' : 'linear-gradient(135deg, #00c471, #00a85e)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: 40, height: 40, flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'white' }}>회원 관리</h2>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: '600' }}>{users.length}명</span>
      </div>

      {/* 통계 */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {[
          { label: '전체', value: users.length, bg: darkMode ? '#1e2e24' : '#f0faf5', color: '#00a85e' },
          { label: 'VIP', value: users.filter((u) => u.grade === 'VIP').length, bg: darkMode ? '#2a1e10' : '#fff3e0', color: '#e65100' },
          { label: '장기미고객', value: users.filter((u) => u.grade === '장기미고객').length, bg: darkMode ? '#2a1010' : '#fff0f1', color: '#ff4757' },
          { label: '일반', value: users.filter((u) => !u.grade || u.grade === '일반').length, bg: darkMode ? '#2e2e2e' : '#f1f3f5', color: '#868e96' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: '14px', padding: '12px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: subTextColor, margin: '0 0 4px', fontWeight: '700' }}>{stat.label}</p>
            <p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 검색 */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: cardBg, borderRadius: '14px', padding: '12px 16px', border: `1.5px solid ${inputBorder}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 이메일로 검색"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', fontFamily: 'inherit', color: textColor }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', cursor: 'pointer', color: '#00a85e', fontSize: '12px', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>지우기</button>
          )}
        </div>
      </div>

      {/* 회원 목록 */}
      {filteredUsers.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '15px', fontWeight: '700', color: textColor, margin: 0 }}>검색 결과가 없어요!</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.map((user, index) => {
            const gc = gradeColor(user.grade || '일반');
            return (
              <div key={user.email} style={{ background: user.grade === '장기미고객' ? (darkMode ? '#2a1010' : '#fff8f8') : cardBg, borderRadius: '18px', border: user.grade === '장기미고객' ? '1px solid #ffd0d4' : `1px solid ${borderColor}`, padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', background: gc.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {gradeIcon(user.grade)}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: textColor, margin: '0 0 3px' }}>{user.name}</p>
                      <p style={{ fontSize: '12px', color: subTextColor, margin: '0 0 2px' }}>{user.email}</p>
                      {user.phone && <p style={{ fontSize: '12px', color: subTextColor, margin: 0 }}>{user.phone}</p>}
                    </div>
                  </div>
                  <span style={{ background: gc.bg, color: gc.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                    {user.grade || '일반'}
                  </span>
                </div>

                {user.memo && (
                  <div style={{ background: darkMode ? '#2e2e2e' : '#f8fffe', borderRadius: '10px', padding: '8px 12px', marginBottom: '12px', border: `1px solid ${borderColor}` }}>
                    <p style={{ fontSize: '12px', color: darkMode ? '#c0c0c0' : '#495057', margin: 0 }}>📝 {user.memo}</p>
                  </div>
                )}

                {editId === index ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: `1.5px solid ${inputBorder}`, fontSize: '14px', outline: 'none', background: inputBg, fontFamily: 'inherit', color: textColor }}>
                      {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input value={editMemo} onChange={(e) => setEditMemo(e.target.value)}
                      placeholder="메모 (선택)"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: `1.5px solid ${inputBorder}`, fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: inputBg, color: textColor }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleGradeSave(index)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>저장</button>
                      <button onClick={() => setEditId(null)} style={{ padding: '10px 16px', background: inputBg, color: subTextColor, border: `1.5px solid ${inputBorder}`, borderRadius: '12px', cursor: 'pointer', fontSize: '14px' }}>취소</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleGradeEdit(index)} style={{ padding: '7px 14px', background: darkMode ? '#1a2030' : '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>등급 변경</button>
                    {user.grade !== '관리자' && !['owner', 'store_manager'].includes(user.role) && (
                      <button onClick={() => handleDelete(index)} style={{ padding: '7px 14px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>삭제</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Members;
