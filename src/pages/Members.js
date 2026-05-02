import { useState } from 'react';

function Members({ users, setUsers, goBack }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editGrade, setEditGrade] = useState('');
  const [editMemo, setEditMemo] = useState('');

  const grades = ['일반', 'VIP', '블랙리스트', '관리자'];

  const filteredUsers = users.filter((u) =>
    u.name.includes(search) || u.email.includes(search)
  );

  const handleGradeEdit = (index) => {
    setEditId(index);
    setEditGrade(users[index].grade || '일반');
    setEditMemo(users[index].memo || '');
  };

  const handleGradeSave = (index) => {
    setUsers(users.map((u, i) =>
      i === index ? { ...u, grade: editGrade, memo: editMemo } : u
    ));
    setEditId(null);
  };

  const handleDelete = (index) => {
    if (users[index].email === 'admin@srmart.com') {
      alert('관리자 계정은 삭제할 수 없어요!');
      return;
    }
    if (window.confirm(users[index].name + '님을 삭제할까요?')) {
      setUsers(users.filter((_, i) => i !== index));
    }
  };

  const gradeColor = (grade) => {
    if (grade === 'VIP') return { bg: '#fff3e0', color: '#e65100', icon: '⭐' };
    if (grade === '블랙리스트') return { bg: '#ffebee', color: '#c62828', icon: '🚫' };
    if (grade === '관리자') return { bg: '#e8faf3', color: '#00a85e', icon: '👑' };
    return { bg: '#f1f3f5', color: '#868e96', icon: '👤' };
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>👥 회원 관리</h2>
      </div>

      {/* 통계 */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        {[
          { label: '전체', value: users.length, bg: '#e8faf3', color: '#00a85e' },
          { label: 'VIP', value: users.filter((u) => u.grade === 'VIP').length, bg: '#fff3e0', color: '#e65100' },
          { label: '블랙', value: users.filter((u) => u.grade === '블랙리스트').length, bg: '#ffebee', color: '#c62828' },
          { label: '일반', value: users.filter((u) => !u.grade || u.grade === '일반').length, bg: '#f1f3f5', color: '#868e96' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.bg, borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: '#868e96', margin: '0 0 4px', fontWeight: '600' }}>{stat.label}</p>
            <p style={{ fontSize: '20px', fontWeight: '900', margin: 0, color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 검색 */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', borderRadius: '14px', padding: '12px 16px', border: '1.5px solid #e9ecef' }}>
          <span style={{ fontSize: '18px' }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="이름 또는 이메일로 검색" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* 회원 목록 */}
      {filteredUsers.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', color: '#adb5bd' }}>
          <span style={{ fontSize: '52px', marginBottom: '12px' }}>👥</span>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#495057', margin: 0 }}>검색 결과가 없어요!</p>
        </div>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.map((user, index) => {
            const gc = gradeColor(user.grade || '일반');
            return (
              <div key={user.email} style={{ background: user.grade === '블랙리스트' ? '#fff5f5' : 'white', borderRadius: '16px', border: user.grade === '블랙리스트' ? '1px solid #ffd0d4' : '1px solid #e9ecef', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

                {/* 회원 정보 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', background: gc.bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{gc.icon}</div>
                    <div>
                      <p style={{ fontWeight: '700', fontSize: '15px', color: '#212529', margin: '0 0 3px' }}>{user.name}</p>
                      <p style={{ fontSize: '12px', color: '#868e96', margin: 0 }}>{user.email}</p>
                    </div>
                  </div>
                  <span style={{ background: gc.bg, color: gc.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                    {user.grade || '일반'}
                  </span>
                </div>

                {/* 메모 */}
                {user.memo && (
                  <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '8px 12px', marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#495057', margin: 0 }}>📝 {user.memo}</p>
                  </div>
                )}

                {/* 등급 수정 폼 */}
                {editId === index ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', background: 'white', fontFamily: 'inherit' }}>
                      {grades.map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                    <input value={editMemo} onChange={(e) => setEditMemo(e.target.value)} placeholder="메모 (선택)" style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleGradeSave(index)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700' }}>저장</button>
                      <button onClick={() => setEditId(null)} style={{ padding: '10px 16px', background: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>취소</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleGradeEdit(index)} style={{ padding: '7px 14px', background: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>✏️ 등급 변경</button>
                    {user.email !== 'admin@srmart.com' && (
                      <button onClick={() => handleDelete(index)} style={{ padding: '7px 14px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>🗑️ 삭제</button>
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