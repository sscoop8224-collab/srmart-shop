import { useState } from 'react';

function Notice({ notices, setNotices, isAdmin, goBack }) {
  const [form, setForm] = useState({ title: '', content: '' });
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
    setShowForm(false);
    alert('공지사항이 등록됐어요! 😊');
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제할까요?')) {
      setNotices(notices.filter((n) => n.id !== id));
    }
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>공지사항</h2>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            {showForm ? '취소' : '+ 등록'}
          </button>
        )}
      </div>

      {/* 관리자 등록 폼 */}
      {isAdmin && showForm && (
        <div style={{ padding: '16px', background: 'white', borderBottom: '8px solid #f8f9fa' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="제목을 입력해주세요"
              style={{ padding: '13px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', background: '#f8f9fa', fontFamily: 'inherit' }}
              onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }}
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="내용을 입력해주세요"
              rows={4}
              style={{ padding: '13px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', resize: 'none', fontFamily: 'inherit', background: '#f8f9fa' }}
              onFocus={(e) => { e.target.style.borderColor = '#00c471'; e.target.style.background = 'white'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.background = '#f8f9fa'; }}
            />
            <button onClick={handleAdd} style={{ padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
              📢 공지 등록
            </button>
          </div>
        </div>
      )}

      {/* 공지사항 목록 */}
      {notices.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent