import { useState } from 'react';

function Notice({ notices, setNotices, isAdmin, goBack, goToHome, darkMode }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';

  const handleAdd = () => {
    if (!form.title || !form.content) { alert('제목과 내용을 입력해주세요!'); return; }
    setNotices([{ id: Date.now(), title: form.title, content: form.content, date: new Date().toLocaleDateString('ko-KR') }, ...notices]);
    setForm({ title: '', content: '' });
    setShowForm(false);
    alert('공지사항이 등록됐어요! 😊');
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제할까요?')) setNotices(notices.filter((n) => n.id !== id));
  };

  const inputStyle = {
    padding: '13px 16px', borderRadius: '14px', border: `1.5px solid ${inputBorder}`,
    fontSize: '14px', outline: 'none', background: inputBg,
    fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
    transition: 'all 0.2s', color: textColor
  };
  const onFocus = (e) => { e.target.style.borderColor = '#00c471'; e.target.style.boxShadow = '0 0 0 3px rgba(0,196,113,0.1)'; };
  const onBlur = (e) => { e.target.style.borderColor = inputBorder; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: headerBg, borderBottom: `1px solid ${borderColor}`, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '38px', height: '38px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#f0f0f0' : '#1a1a1a'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: textColor }}>공지사항</h2>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: showForm ? (darkMode ? '#2e2e2e' : '#f0faf5') : 'linear-gradient(135deg, #00c471, #00a85e)', color: showForm ? '#00a85e' : 'white', border: showForm ? `1.5px solid ${borderColor}` : 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            {showForm ? '취소' : '+ 등록'}
          </button>
        )}
      </div>

      {/* 등록 폼 */}
      {isAdmin && showForm && (
        <div style={{ padding: '16px', background: cardBg, borderBottom: `8px solid ${bg}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="제목을 입력해주세요" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="내용을 입력해주세요" rows={4}
              style={{ ...inputStyle, resize: 'none' }} onFocus={onFocus} onBlur={onBlur} />
            <button onClick={handleAdd} style={{ padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              공지 등록
            </button>
          </div>
        </div>
      )}

      {/* 공지 목록 */}
      {notices.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div style={{ width: '80px', height: '80px', background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: textColor, margin: '0 0 6px' }}>등록된 공지사항이 없어요!</p>
          <p style={{ fontSize: '13px', color: subTextColor, margin: '0 0 20px' }}>새로운 소식을 기다려주세요</p>
          {goToHome && (
            <button onClick={goToHome} style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              쇼핑 계속하기
            </button>
          )}
        </div>
      ) : (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notices.map((notice) => (
            <div key={notice.id} style={{ background: cardBg, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: `1px solid ${borderColor}` }}>
              <div onClick={() => setExpanded(expanded === notice.id ? null : notice.id)}
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ background: darkMode ? '#2e2e2e' : '#f0faf5', color: '#00a85e', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px' }}>공지</span>
                    <p style={{ fontSize: '15px', fontWeight: '700', color: textColor, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notice.title}</p>
                  </div>
                  <p style={{ fontSize: '12px', color: subTextColor, margin: 0 }}>{notice.date}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={subTextColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '12px', flexShrink: 0, transform: expanded === notice.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {expanded === notice.id && (
                <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${borderColor}` }}>
                  <p style={{ fontSize: '14px', color: darkMode ? '#c0c0c0' : '#495057', margin: '14px 0', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{notice.content}</p>
                  {isAdmin && (
                    <button onClick={() => handleDelete(notice.id)} style={{ padding: '7px 16px', background: '#fff0f1', color: '#ff4757', border: '1px solid #ffd0d4', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                      삭제
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