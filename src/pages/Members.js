import { useState } from 'react';

function Members({ users, setUsers, goBack }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editGrade, setEditGrade] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const grades = ['일반', 'VIP', '장기미고객', '관리자'];

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
    if (users[index].email === 'admin@srmart.com') { alert('관리자 계정은 삭제할 수 없어요!'); return; }
    if (window.confirm(users[index].name + '님을 삭제할까요?')) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const gradeColor = (grade) => {
    if (grade === 'VIP') return { bg: '#fff3e0', color: '#e65100' };
    if (grade === '장기미고객') return { bg: '#fff0f1', color: '#ff4757' };
    if (grade === '관리자') return { bg: '#f0faf5', color: '#00a85e' };
    return { bg: '#f1f3f5', color: '#868e96' };
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
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a85e' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>회원 관리</h2>
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#adb5bd', fontWeight: '600' }}>{users.length}명</span>
      </div>

      {/* 통계 */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {[
          { label: '전체', value: users.length, bg: '#f0faf5', color: '#00a85e' },
          { label: 'VIP', value: users.filter((u) => u.grade === 'VIP').length, bg: '#fff3e0', color: '#e65100' },
          { label: '장기미고객', value: users.filter((u) => u.grade === '장기미고객').length, bg: '#fff0f1', color: '#ff4757' },
          { label: '일반', value: users.filter((u) => !u.grade || u.grade === '일반').length, bg: '#f1f3f5', color: '#868e96' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: '14px', padding: '12px 8px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: '10px', color: '#adb5bd', margin: '0 0 4px', fontWeight: '700' }}>{stat.label}</p>
            <p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 검색 */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', borderRadius: '14px', padding: '12px 16px', border: '1.5px solid #e8faf3' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 이메일로 검색"
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', fontFamily: 'inherit', color: '#1a1a1a' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: '#f0faf5', border: 'none', cursor: 'pointer', color: '#00a85e', fontSize: '12px', padding: '4px 8px', borderRadius: '8px', fontWeight: '700' }}>지우기</button>
          )}
        </div>
      </div>

      {/* 회원 목록 */}
      {filteredUsers.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
          <div style={{ width: '72px', height: '72px', background: '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>검색 결과가 없어요!</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.map((user, index) => {
            const gc = gradeColor(user.grade || '일반');
            return (
              <div key={user.email} style={{ background: user.grade === '장기미고객' ? '#fff8f8' : 'white', borderRadius: '18px', border: user.grade === '장기미고객' ? '1px solid #ffd0d4' : '1px solid #f0faf5', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

                {/* 회원 정보 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', background: gc.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {gradeIcon(user.grade)}
                    </div>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a', margin: '0 0 3px' }}>{user.name}</p>
                      <p style={{ fontSize: '12px', color: '#adb5bd', margin: '0 0 2px' }}>{user.email}</p>
                      {user.phone && <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{user.phone}</p>}
                    </div>
                  </div>
                  <span style={{ background: gc.bg, color: gc.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                    {user.grade || '일반'}
                  </span>
                </div>

                {/* 메모 */}
                {user.memo && (
                  <div style={{ background: '#f8fffe', borderRadius: '10px', padding: '8px 12px', marginBottom: '12px', border: '1px solid #f0faf5' }}>
                    <p style={{ fontSize: '12px', color: '#495057', margin: 0 }}>📝 {user.memo}</p>
                  </div>
                )}

                {/* 등급 수정 폼 */}
                {editId === index ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e8faf3', fontSize: '14px', outline: 'none', background: '#f8fffe', fontFamily: 'inherit' }}>
                      {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input value={editMemo} onChange={(e) => setEditMemo(e.target.value)}
                      placeholder="메모 (선택)"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e8faf3', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#f8fffe' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleGradeSave(index)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,196,113,0.3)' }}>저장</button>
                      <button onClick={() => setEditId(null)} style={{ padding: '10px 16px', background: '#f8fffe', color: '#adb5bd', border: '1.5px solid #e8faf3', borderRadius: '12px', cursor: 'pointer', fontSize: '14px' }}>취소</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleGradeEdit(index)} style={{ padding: '7px 14px', background: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>등급 변경</button>
                    {user.email !== 'admin@srmart.com' && (
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