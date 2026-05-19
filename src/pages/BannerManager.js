import { useState } from 'react';

const BG_OPTIONS = [
  { label: '그린', value: 'linear-gradient(135deg, #00c471, #00a85e)' },
  { label: '레드', value: 'linear-gradient(135deg, #ff6b6b, #ee5a24)' },
  { label: '퍼플', value: 'linear-gradient(135deg, #a29bfe, #6c5ce7)' },
  { label: '오렌지', value: 'linear-gradient(135deg, #fdcb6e, #e17055)' },
  { label: '블루', value: 'linear-gradient(135deg, #74b9ff, #0984e3)' },
  { label: '핑크', value: 'linear-gradient(135deg, #fd79a8, #e84393)' },
];

function BannerManager({ banners, setBanners, categories, goBack, darkMode }) {
  const [form, setForm] = useState({ label: '', title: '', sub: '', emoji: '🛒', bg: BG_OPTIONS[0].value, filter: '' });
  const [showForm, setShowForm] = useState(false);

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';

  const inputStyle = {
    padding: '12px 14px', borderRadius: '14px', border: `1.5px solid ${inputBorder}`,
    fontSize: '14px', outline: 'none', fontFamily: 'inherit',
    background: inputBg, width: '100%', boxSizing: 'border-box', color: textColor
  };

  const handleAdd = () => {
    if (!form.label || !form.title) { alert('라벨과 제목을 입력해주세요!'); return; }
    setBanners([...banners, { id: Date.now(), label: form.label, title: form.title, sub: form.sub, emoji: form.emoji, bg: form.bg, filter: form.filter || null }]);
    setForm({ label: '', title: '', sub: '', emoji: '🛒', bg: BG_OPTIONS[0].value, filter: '' });
    setShowForm(false);
    alert('배너가 등록됐어요! 😊');
  };

  const handleDelete = (id) => {
    if (banners.length <= 1) { alert('배너는 최소 1개 이상 있어야 해요!'); return; }
    if (window.confirm('정말 삭제할까요?')) setBanners(banners.filter((b) => b.id !== id));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const n = [...banners];
    [n[index - 1], n[index]] = [n[index], n[index - 1]];
    setBanners(n);
  };

  const moveDown = (index) => {
    if (index === banners.length - 1) return;
    const n = [...banners];
    [n[index], n[index + 1]] = [n[index + 1], n[index]];
    setBanners(n);
  };

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
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: textColor }}>배너 관리</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: showForm ? (darkMode ? '#2e2e2e' : '#f0faf5') : 'linear-gradient(135deg, #00c471, #00a85e)', color: showForm ? '#00a85e' : 'white', border: showForm ? `1.5px solid ${inputBorder}` : 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          {showForm ? '취소' : '+ 추가'}
        </button>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div style={{ padding: '16px', background: cardBg, borderBottom: `8px solid ${bg}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="라벨 (예: 특별 할인)" style={inputStyle} />
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="제목" style={inputStyle} />
            <input value={form.sub} onChange={(e) => setForm({ ...form, sub: e.target.value })} placeholder="부제목" style={inputStyle} />
            <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="이모지 (예: 🛒)" style={inputStyle} />

            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', margin: '0 0 8px' }}>배경색</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {BG_OPTIONS.map((bgOpt) => (
                  <button key={bgOpt.value} onClick={() => setForm({ ...form, bg: bgOpt.value })}
                    style={{ padding: '7px 14px', background: bgOpt.value, color: 'white', border: form.bg === bgOpt.value ? '3px solid #1a1a1a' : '3px solid transparent', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                    {bgOpt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', margin: '0 0 8px' }}>카테고리 연결 (선택)</p>
              <select value={form.filter} onChange={(e) => setForm({ ...form, filter: e.target.value })} style={inputStyle}>
                <option value="">없음</option>
                {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', margin: '0 0 8px' }}>미리보기</p>
              <div style={{ background: form.bg, borderRadius: '16px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', margin: '0 0 3px', fontWeight: '600' }}>{form.label || '라벨'}</p>
                  <p style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: '0 0 4px' }}>{form.title || '제목'}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', margin: 0 }}>{form.sub || '부제목'}</p>
                </div>
                <span style={{ fontSize: '40px' }}>{form.emoji}</span>
              </div>
            </div>

            <button onClick={handleAdd} style={{ padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              배너 등록
            </button>
          </div>
        </div>
      )}

      {/* 배너 목록 */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {banners.map((banner, index) => (
          <div key={banner.id} style={{ background: cardBg, borderRadius: '18px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: `1px solid ${borderColor}` }}>
            <div style={{ background: banner.bg, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', margin: '0 0 2px', fontWeight: '600' }}>{banner.label}</p>
                <p style={{ fontSize: '15px', fontWeight: '800', color: 'white', margin: 0 }}>{banner.title}</p>
                {banner.sub && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)', margin: '2px 0 0' }}>{banner.sub}</p>}
              </div>
              <span style={{ fontSize: '32px' }}>{banner.emoji}</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: subTextColor, fontWeight: '600' }}>
                {banner.filter ? '→ ' + banner.filter : '링크 없음'}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => moveUp(index)} style={{ width: '32px', height: '32px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#00a85e', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                <button onClick={() => moveDown(index)} style={{ width: '32px', height: '32px', background: darkMode ? '#2e2e2e' : '#f0faf5', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', color: '#00a85e', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
                <button onClick={() => handleDelete(banner.id)} style={{ padding: '6px 12px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BannerManager;
