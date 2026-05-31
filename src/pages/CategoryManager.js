import { useState } from 'react';

function CategoryManager({ categories, setCategories, darkMode }) {
  const cardBg      = darkMode ? '#2a2a2a' : 'white';
  const border      = darkMode ? '#3a3a3a' : '#f0faf5';
  const text        = darkMode ? '#f0f0f0' : '#212529';
  const sub         = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg     = darkMode ? '#1a1a1a' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';
  const medBg       = darkMode ? '#2e2e2e' : '#f0faf5';
  const medCardBg   = darkMode ? '#252525' : '#f8fffe';
  const medBorder   = darkMode ? '#3a3a3a' : '#e8faf3';
  const largeBg     = darkMode
    ? 'linear-gradient(135deg, #1a5c2a 0%, #0d4d2a 100%)'
    : 'linear-gradient(135deg, #00c471 0%, #00a85e 100%)';
  const largeShadow = '0 4px 16px rgba(0,0,0,0.15)';

  const [form, setForm]           = useState({ large: '', medium: '', small: '' });
  const [openLarge, setOpenLarge] = useState(null);
  const [openMedium, setOpenMedium] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editValue, setEditValue]   = useState('');

  const moveItem = (arr, index, direction) => {
    const newArr = [...arr];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newArr.length) return newArr;
    [newArr[index], newArr[swapIndex]] = [newArr[swapIndex], newArr[index]];
    return newArr;
  };

  const startEdit  = (target, value) => { setEditTarget(target); setEditValue(value); };
  const cancelEdit = () => { setEditTarget(null); setEditValue(''); };

  const saveEditLarge = (oldName) => {
    if (!editValue.trim()) { alert('이름을 입력해주세요!'); return; }
    setCategories(categories.map((c) => c.name === oldName ? { ...c, name: editValue.trim() } : c));
    if (openLarge === oldName) setOpenLarge(editValue.trim());
    cancelEdit();
  };

  const saveEditMedium = (largeName, oldName) => {
    if (!editValue.trim()) { alert('이름을 입력해주세요!'); return; }
    setCategories(categories.map((c) => c.name === largeName
      ? { ...c, children: c.children.map((m) => m.name === oldName ? { ...m, name: editValue.trim() } : m) } : c));
    const key = largeName + '-' + oldName;
    if (openMedium === key) setOpenMedium(largeName + '-' + editValue.trim());
    cancelEdit();
  };

  const saveEditSmall = (largeName, mediumName, oldName) => {
    if (!editValue.trim()) { alert('이름을 입력해주세요!'); return; }
    setCategories(categories.map((c) => c.name === largeName
      ? { ...c, children: c.children.map((m) => m.name === mediumName
          ? { ...m, children: m.children.map((s) => s === oldName ? editValue.trim() : s) } : m) } : c));
    cancelEdit();
  };

  const handleAddLarge = () => {
    if (!form.large.trim()) { alert('대분류를 입력해주세요!'); return; }
    if (categories.find((c) => c.name === form.large.trim())) { alert('이미 있는 대분류예요!'); return; }
    setCategories([...categories, { name: form.large.trim(), children: [] }]);
    setForm({ ...form, large: '' });
  };

  const handleDeleteLarge = (n) => {
    if (window.confirm(n + ' 대분류를 삭제할까요? 하위 카테고리도 모두 삭제돼요!')) {
      setCategories(categories.filter((c) => c.name !== n)); setOpenLarge(null);
    }
  };

  const handleMoveLarge   = (i, d) => setCategories(moveItem(categories, i, d));

  const handleAddMedium = (ln) => {
    if (!form.medium.trim()) { alert('중분류를 입력해주세요!'); return; }
    setCategories(categories.map((c) => c.name === ln
      ? { ...c, children: [...c.children, { name: form.medium.trim(), children: [] }] } : c));
    setForm({ ...form, medium: '' });
  };

  const handleDeleteMedium = (ln, mn) => {
    if (window.confirm(mn + ' 중분류를 삭제할까요?')) {
      setCategories(categories.map((c) => c.name === ln
        ? { ...c, children: c.children.filter((m) => m.name !== mn) } : c));
      setOpenMedium(null);
    }
  };

  const handleMoveMedium = (ln, i, d) =>
    setCategories(categories.map((c) => c.name === ln
      ? { ...c, children: moveItem(c.children, i, d) } : c));

  const handleAddSmall = (ln, mn) => {
    if (!form.small.trim()) { alert('소분류를 입력해주세요!'); return; }
    setCategories(categories.map((c) => c.name === ln
      ? { ...c, children: c.children.map((m) => m.name === mn
          ? { ...m, children: [...m.children, form.small.trim()] } : m) } : c));
    setForm({ ...form, small: '' });
  };

  const handleDeleteSmall = (ln, mn, sn) => {
    if (window.confirm(sn + ' 소분류를 삭제할까요?')) {
      setCategories(categories.map((c) => c.name === ln
        ? { ...c, children: c.children.map((m) => m.name === mn
            ? { ...m, children: m.children.filter((s) => s !== sn) } : m) } : c));
    }
  };

  const handleMoveSmall = (ln, mn, i, d) =>
    setCategories(categories.map((c) => c.name === ln
      ? { ...c, children: c.children.map((m) => m.name === mn
          ? { ...m, children: moveItem(m.children, i, d) } : m) } : c));

  const inputStyle = {
    flex: 1, padding: '10px 14px', borderRadius: '12px',
    border: `1.5px solid ${inputBorder}`, fontSize: '13px',
    outline: 'none', background: inputBg, color: text, fontFamily: 'inherit',
  };

  // 대분류 헤더 위의 ▲▼ 버튼
  const MoveBtn = ({ onClick, label, disabled }) => (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: 30, height: 30, borderRadius: 10, border: 'none',
        background: 'rgba(255,255,255,0.15)', color: 'white',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '12px', fontWeight: '700',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      {label}
    </button>
  );

  // 중/소분류 영역의 ▲▼ 버튼
  const SmallMoveBtn = ({ onClick, label, disabled }) => (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: 28, height: 28, borderRadius: 8, border: 'none',
        background: disabled ? (darkMode ? '#333' : '#f1f3f5') : (darkMode ? '#333' : '#f0faf5'),
        color: disabled ? (darkMode ? '#555' : '#dee2e6') : '#00a85e',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: '11px', fontWeight: '700',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
      {label}
    </button>
  );

  return (
    <div>
      {/* 대분류 추가 */}
      <div style={{ background: cardBg, padding: '16px', borderRadius: '16px', marginBottom: '16px', border: `1px solid ${border}`, boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#00a85e', margin: '0 0 10px' }}>대분류 추가</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={form.large} onChange={(e) => setForm({ ...form, large: e.target.value })}
            placeholder="대분류 이름 (예: 식품)" style={inputStyle}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddLarge(); }} />
          <button onClick={handleAddLarge}
            style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>
            추가
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: cardBg, borderRadius: '16px', border: `1px solid ${border}` }}>
          <div style={{ width: 60, height: 60, background: darkMode ? '#333' : '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p style={{ color: sub, fontSize: '14px', margin: 0 }}>아직 카테고리가 없어요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categories.map((large, largeIndex) => (
            <div key={large.name} style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: largeShadow }}>

              {/* 대분류 헤더 */}
              <div style={{ background: largeBg, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editTarget === 'large-' + large.name ? (
                  <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '13px', outline: 'none', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                      autoFocus />
                    <button onClick={() => saveEditLarge(large.name)}
                      style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.25)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                      저장
                    </button>
                    <button onClick={cancelEdit}
                      style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.2)', color: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px' }}>
                      취소
                    </button>
                  </div>
                ) : (
                  <span style={{ fontWeight: '700', cursor: 'pointer', fontSize: '16px', color: 'white', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => setOpenLarge(openLarge === large.name ? null : large.name)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: openLarge === large.name ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    {large.name}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <MoveBtn onClick={() => handleMoveLarge(largeIndex, 'up')} label="▲" disabled={largeIndex === 0} />
                  <MoveBtn onClick={() => handleMoveLarge(largeIndex, 'down')} label="▼" disabled={largeIndex === categories.length - 1} />
                  <button onClick={() => startEdit('large-' + large.name, large.name)}
                    style={{ padding: '5px 12px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                    수정
                  </button>
                  <button onClick={() => handleDeleteLarge(large.name)}
                    style={{ padding: '5px 12px', background: darkMode ? '#8b2a2a' : '#c92a3f', color: darkMode ? '#ffcccc' : 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                    삭제
                  </button>
                </div>
              </div>

              {/* 펼쳐진 영역 */}
              {openLarge === large.name && (
                <div style={{ padding: '14px 16px', background: cardBg, border: `1px solid ${border}`, borderTop: 'none', borderRadius: '0 0 16px 16px' }}>
                  {/* 중분류 추가 */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })}
                      placeholder="중분류 이름 (예: 신선식품)" style={inputStyle}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddMedium(large.name); }} />
                    <button onClick={() => handleAddMedium(large.name)}
                      style={{ padding: '10px 14px', background: darkMode ? '#1e3a2a' : '#f0faf5', color: '#00a85e', border: `1.5px solid ${inputBorder}`, borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      중분류 추가
                    </button>
                  </div>

                  {large.children.length === 0 ? (
                    <p style={{ color: sub, fontSize: '13px', margin: '8px 0', textAlign: 'center' }}>중분류가 없어요!</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {large.children.map((medium, mediumIndex) => (
                        <div key={medium.name} style={{ background: medCardBg, borderRadius: '12px', border: `1px solid ${medBorder}`, overflow: 'hidden' }}>

                          {/* 중분류 헤더 */}
                          <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: medBg }}>
                            {editTarget === 'medium-' + large.name + '-' + medium.name ? (
                              <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                                <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                  style={{ flex: 1, padding: '5px 10px', borderRadius: '8px', border: `1.5px solid ${inputBorder}`, fontSize: '13px', outline: 'none', background: inputBg, color: text }}
                                  autoFocus />
                                <button onClick={() => saveEditMedium(large.name, medium.name)}
                                  style={{ padding: '5px 10px', background: '#00c471', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                  저장
                                </button>
                                <button onClick={cancelEdit}
                                  style={{ padding: '5px 10px', background: darkMode ? '#444' : '#adb5bd', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px' }}>
                                  취소
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontWeight: '600', cursor: 'pointer', fontSize: '13px', color: '#00a85e', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => setOpenMedium(openMedium === large.name + '-' + medium.name ? null : large.name + '-' + medium.name)}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                  style={{ transform: openMedium === large.name + '-' + medium.name ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                                {medium.name}
                              </span>
                            )}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <SmallMoveBtn onClick={() => handleMoveMedium(large.name, mediumIndex, 'up')} label="▲" disabled={mediumIndex === 0} />
                              <SmallMoveBtn onClick={() => handleMoveMedium(large.name, mediumIndex, 'down')} label="▼" disabled={mediumIndex === large.children.length - 1} />
                              <button onClick={() => startEdit('medium-' + large.name + '-' + medium.name, medium.name)}
                                style={{ padding: '4px 10px', background: darkMode ? '#1a2a40' : '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                수정
                              </button>
                              <button onClick={() => handleDeleteMedium(large.name, medium.name)}
                                style={{ padding: '4px 10px', background: darkMode ? '#3a1010' : '#fff0f1', color: darkMode ? '#ff9999' : '#ff4757', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                삭제
                              </button>
                            </div>
                          </div>

                          {/* 소분류 영역 */}
                          {openMedium === large.name + '-' + medium.name && (
                            <div style={{ padding: '12px', background: darkMode ? '#1e1e1e' : 'white' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <input value={form.small} onChange={(e) => setForm({ ...form, small: e.target.value })}
                                  placeholder="소분류 이름 (예: 채소)" style={inputStyle}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSmall(large.name, medium.name); }} />
                                <button onClick={() => handleAddSmall(large.name, medium.name)}
                                  style={{ padding: '10px 12px', background: darkMode ? '#1e3a2a' : '#f0faf5', color: '#00a85e', border: `1.5px solid ${inputBorder}`, borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                  소분류 추가
                                </button>
                              </div>

                              {medium.children.length === 0 ? (
                                <p style={{ color: sub, fontSize: '13px', margin: 0, textAlign: 'center' }}>소분류가 없어요!</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {medium.children.map((small, smallIndex) => (
                                    <div key={small} style={{ background: darkMode ? '#2a2a2a' : 'white', border: `1px solid ${border}`, borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      {editTarget === 'small-' + large.name + '-' + medium.name + '-' + small ? (
                                        <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                            style={{ flex: 1, padding: '5px 10px', borderRadius: '8px', border: `1.5px solid ${inputBorder}`, fontSize: '13px', outline: 'none', background: inputBg, color: text }}
                                            autoFocus />
                                          <button onClick={() => saveEditSmall(large.name, medium.name, small)}
                                            style={{ padding: '5px 10px', background: '#00c471', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                            저장
                                          </button>
                                          <button onClick={cancelEdit}
                                            style={{ padding: '5px 10px', background: darkMode ? '#444' : '#adb5bd', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px' }}>
                                            취소
                                          </button>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '13px', color: text, fontWeight: '600' }}>{small}</span>
                                      )}
                                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <SmallMoveBtn onClick={() => handleMoveSmall(large.name, medium.name, smallIndex, 'up')} label="▲" disabled={smallIndex === 0} />
                                        <SmallMoveBtn onClick={() => handleMoveSmall(large.name, medium.name, smallIndex, 'down')} label="▼" disabled={smallIndex === medium.children.length - 1} />
                                        <button onClick={() => startEdit('small-' + large.name + '-' + medium.name + '-' + small, small)}
                                          style={{ padding: '4px 10px', background: darkMode ? '#1a2a40' : '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                          수정
                                        </button>
                                        <button onClick={() => handleDeleteSmall(large.name, medium.name, small)}
                                          style={{ padding: '4px 10px', background: darkMode ? '#3a1010' : '#fff0f1', color: darkMode ? '#ff9999' : '#ff4757', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                                          삭제
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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

export default CategoryManager;
