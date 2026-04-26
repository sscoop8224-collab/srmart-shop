import { useState } from 'react';

function Notice({ notices, setNotices, isAdmin, goBack }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [expanded, setExpanded] = useState(null);

  const handleAdd = () => {
    if (!form.title || !form.content) {
      alert('제목과 내용을 입력해주세요!');
      return;
    }
    const newNotice = {
      id: Date.now(),
      title: form.title,
      content: form.content,
      date: new Date().toLocaleDateString('ko-KR'),
    };
    setNotices([newNotice, ...notices]);
    setForm({ title: '', content: '' });
    alert('공지사항이 등록됐어요! 😊');
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제할까요?')) {
      setNotices(notices.filter((n) => n.id !== id));
    }
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#212529' }}>📢 공지사항</h2>
      </div>

      {/* 관리자 등록 폼 */}
      {isAdmin && (
        <div style={{ padding: '16px', background: '#f8f9fa', borderBottom: '1px solid #e9ecef' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#212529', margin: '0 0 12px' }}>📝 공지사항 등록</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="제목"
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #dee2e6', fontSize: '14px', outline: 'none' }}
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="내용"
              rows={3}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #dee2e6', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={handleAdd}
              style={{ padding: '12px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
            >
              📢 등록
            </button>
          </div>
        </div>
      )}

      {/* 공지사항 목록 */}
      {notices.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#adb5bd', gap: '12px' }}>
          <span style={{ fontSize: '52px' }}>📢</span>
          <span style={{ fontSize: '15px', fontWeight: '500' }}>등록된 공지사항이 없어요!</span>
        </div>
      ) : (
        <div style={{ padding: '16px' }}>
          {notices.map((notice) => (
            <div
              key={notice.id}
              style={{ background: 'white', borderRadius: '12px', border: '1px solid #e9ecef', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              <div
                onClick={() => setExpanded(expanded === notice.id ? null : notice.id)}
                style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: '#212529', margin: '0 0 4px' }}>{notice.title}</p>
                  <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{notice.date}</p>
                </div>
                <span style={{ fontSize: '18px', color: '#adb5bd' }}>{expanded === notice.id ? '▲' : '▼'}</span>
              </div>
              {expanded === notice.id && (
                <div style={{ padding: '0 16px 14px', borderTop: '1px solid #f1f3f5' }}>
                  <p style={{ fontSize: '14px', color: '#495057', margin: '12px 0', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{notice.content}</p>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(notice.id)}
                      style={{ padding: '6px 14px', background: '#fff0f1', color: '#ff4757', border: '1px solid #ffd0d4', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                    >
                      🗑️ 삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notice;