import { useState } from 'react';

function Members({ users, setUsers, goBack }) {
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [editGrade, setEditGrade] = useState('');

  const grades = ['일반', 'VIP', '블랙리스트', '관리자'];

  const filteredUsers = users.filter((u) =>
    u.name.includes(search) || u.email.includes(search)
  );

  const handleGradeEdit = (index) => {
    setEditId(index);
    setEditGrade(users[index].grade || '일반');
  };

  const handleGradeSave = (index) => {
    setUsers(users.map((u, i) =>
      i === index ? { ...u, grade: editGrade } : u
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
    if (grade === 'VIP') return { bg: '#fff3e0', color: '#e65100' };
    if (grade === '블랙리스트') return { bg: '#ffebee', color: '#c62828' };
    if (grade === '관리자') return { bg: '#e8faf3', color: '#00a85e' };
    return { bg: '#f1f3f5', color: '#868e96' };
  };

  return (
    <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, color: '#212529', fontSize: '20px', fontWeight: '800' }}>👥 회원 관리</h2>
      </div>

      {/* 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 2fr)', gap: '8px', marginBottom: '20px' }}>
        {[
          { label: '전체', value: users.length, color: '#e8faf3', text: '#00a85e' },
          { label: 'VIP', value: users.filter((u) => u.grade === 'VIP').length, color: '#fff3e0', text: '#e65100' },
          { label: '블랙리스트', value: users.filter((u) => u.grade === '블랙리스트').length, color: '#ffebee', text: '#c62828' },
          { label: '일반', value: users.filter((u) => !u.grade || u.grade === '일반').length, color: '#f1f3f5', text: '#868e96' },
        ].map((stat) => (
          <div key={stat.label} style={{ background: stat.color, borderRadius: '12px', padding: '12px 6px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#868e96', margin: '0 0 4px', fontWeight: '600', whiteSpace: 'nowrap' }}>{stat.label}</p>
            <p style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: stat.text }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 검색 */}
      <div style={{ marginBottom: '16px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름 또는 이메일로 검색"
          style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {/* 회원 목록 카드형 */}
      {filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>👥</p>
          <p>검색 결과가 없어요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredUsers.map((user, index) => (
            <div key={user.email} style={{ background: 'white', borderRadius: '14px', border: '1px solid #e9ecef', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>

              {/* 회원 정보 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontWeight: '700', fontSize: '15px', color: '#212529', margin: '0 0 4px' }}>{user.name}</p>
                  <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>{user.email}</p>
                </div>
                <span style={{ background: gradeColor(user.grade || '일반').bg, color: gradeColor(user.grade || '일반').color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>
                  {user.grade || '일반'}
                </span>
              </div>

              {/* 등급 수정 */}
              {editId === index ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #dee2e6', fontSize: '13px', outline: 'none' }}
                  >
                    {grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <button onClick={() => handleGradeSave(index)} style={{ padding: '8px 16px', background: '#00c471', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>저장</button>
                  <button onClick={() => setEditId(null)} style={{ padding: '8px 16px', background: '#868e96', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>취소</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleGradeEdit(index)} style={{ padding: '7px 16px', background: '#1e90ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>✏️ 등급 변경</button>
                  <button onClick={() => handleDelete(index)} style={{ padding: '7px 16px', background: '#fff0f1', color: '#ff4757', border: '1px solid #ffd0d4', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>🗑️ 삭제</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Members;