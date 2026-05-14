import { useState } from 'react';

function CategoryManager({ categories, setCategories }) {
  const [form, setForm] = useState({ large: '', medium: '', small: '' });
  const [openLarge, setOpenLarge] = useState(null);
  const [openMedium, setOpenMedium] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editValue, setEditValue] = useState('');

  const moveItem = (arr, index, direction) => {
    const newArr = [...arr];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newArr.length) return newArr;
    [newArr[index], newArr[swapIndex]] = [newArr[swapIndex], newArr[index]];
    return newArr;
  };

  const startEdit = (target, value) => { setEditTarget(target); setEditValue(value); };
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

  const handleDeleteLarge = (largeName) => {
    if (window.confirm(largeName + ' 대분류를 삭제할까요? 하위 카테고리도 모두 삭제돼요!')) {
      setCategories(categories.filter((c) => c.name !== largeName));
      setOpenLarge(null);
    }
  };

  const handleMoveLarge = (index, direction) => setCategories(moveItem(categories, index, direction));

  const handleAddMedium = (largeName) => {
    if (!form.medium.trim()) { alert('중분류를 입력해주세요!'); return; }
    setCategories(categories.map((c) => c.name === largeName
      ? { ...c, children: [...c.children, { name: form.medium.trim(), children: [] }] } : c));
    setForm({ ...form, medium: '' });
  };

  const handleDeleteMedium = (largeName, mediumName) => {
    if (window.confirm(mediumName + ' 중분류를 삭제할까요?')) {
      setCategories(categories.map((c) => c.name === largeName
        ? { ...c, children: c.children.filter((m) => m.name !== mediumName) } : c));
      setOpenMedium(null);
    }
  };

  const handleMoveMedium = (largeName, index, direction) => {
    setCategories(categories.map((c) => c.name === largeName
      ? { ...c, children: moveItem(c.children, index, direction) } : c));
  };

  const handleAddSmall = (largeName, mediumName) => {
    if (!form.small.trim()) { alert('소분류를 입력해주세요!'); return; }
    setCategories(categories.map((c) => c.name === largeName
      ? { ...c, children: c.children.map((m) => m.name === mediumName
          ? { ...m, children: [...m.children, form.small.trim()] } : m) } : c));
    setForm({ ...form, small: '' });
  };

  const handleDeleteSmall = (largeName, mediumName, smallName) => {
    if (window.confirm(smallName + ' 소분류를 삭제할까요?')) {
      setCategories(categories.map((c) => c.name === largeName
        ? { ...c, children: c.children.map((m) => m.name === mediumName
            ? { ...m, children: m.children.filter((s) => s !== smallName) } : m) } : c));
    }
  };

  const handleMoveSmall = (largeName, mediumName, index, direction) => {
    setCategories(categories.map((c) => c.name === largeName
      ? { ...c, children: c.children.map((m) => m.name === mediumName
          ? { ...m, children: moveItem(m.children, index, direction) } : m) } : c));
  };

  const inputStyle = {
    flex: 1, padding: '10px 14px', borderRadius: '12px',
    border: '1.5px solid #e8faf3', fontSize: '13px',
    outline: 'none', background: '#f8fffe', fontFamily: 'inherit'
  };

  const MoveBtn = ({ onClick, label, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{ width: '28px', height: '28px', background: disabled ? '#f1f3f5' : '#f0faf5', color: disabled ? '#dee2e6' : '#00a85e', border: 'none', borderRadius: '8px', cursor: disabled ? 'default' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
      {label}
    </button>
  );

  return (
    <div>
      {/* 대분류 추가 */}
      <div style={{ background: 'white', padding: '16px', borderRadius: '16px', marginBottom: '16px', border: '1px solid #f0faf5', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#00a85e', margin: '0 0 10px' }}>대분류 추가</p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={form.large} onChange={(e) => setForm({ ...form, large: e.target.value })}
            placeholder="대분류 이름 (예: 식품)" style={inputStyle}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddLarge(); }} />
          <button onClick={handleAddLarge} style={{ padding: '10px 16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', whiteSpace: 'nowrap' }}>추가</button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', border: '1px solid #f0faf5' }}>
          <div style={{ width: '60px', height: '60px', background: '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p style={{ color: '#adb5bd', fontSize: '14px', margin: 0 }}>아직 카테고리가 없어요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {categories.map((large, largeIndex) => (
            <div key={large.name} style={{ background: 'white', borderRadius: '16px', border: '1px solid #f0faf5', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

              {/* 대분류 헤더 */}
              <div style={{ background: 'linear-gradient(135deg, #00c471, #00a85e)', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editTarget === 'large-' + large.name ? (
                  <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: 'none', fontSize: '13px', outline: 'none' }} />
                    <button onClick={() => saveEditLarge(large.name)} style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.3)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>저장</button>
                    <button onClick={cancelEdit} style={{ padding: '6px 10px', background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>취소</button>
                  </div>
                ) : (
                  <span style={{ fontWeight: '700', cursor: 'pointer', fontSize: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setOpenLarge(openLarge === large.name ? null : large.name)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openLarge === large.name ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                    {large.name}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <MoveBtn onClick={() => handleMoveLarge(largeIndex, 'up')} label="▲" disabled={largeIndex === 0} />
                  <MoveBtn onClick={() => handleMoveLarge(largeIndex, 'down')} label="▼" disabled={largeIndex === categories.length - 1} />
                  <button onClick={() => startEdit('large-' + large.name, large.name)} style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>수정</button>
                  <button onClick={() => handleDeleteLarge(large.name)} style={{ padding: '5px 10px', background: 'rgba(255,75,87,0.8)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>삭제</button>
                </div>
              </div>

              {openLarge === large.name && (
                <div style={{ padding: '14px' }}>
                  {/* 중분류 추가 */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })}
                      placeholder="중분류 이름 (예: 신선식품)" style={inputStyle}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddMedium(large.name); }} />
                    <button onClick={() => handleAddMedium(large.name)} style={{ padding: '10px 14px', background: '#f0faf5', color: '#00a85e', border: '1.5px solid #e8faf3', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>중분류 추가</button>
                  </div>

                  {large.children.length === 0 ? (
                    <p style={{ color: '#adb5bd', fontSize: '13px', margin: '8px 0', textAlign: 'center' }}>중분류가 없어요!</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {large.children.map((medium, mediumIndex) => (
                        <div key={medium.name} style={{ background: '#f8fffe', borderRadius: '12px', border: '1px solid #e8faf3', overflow: 'hidden' }}>

                          {/* 중분류 헤더 */}
                          <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0faf5' }}>
                            {editTarget === 'medium-' + large.name + '-' + medium.name ? (
                              <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                                <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                  style={{ flex: 1, padding: '5px 10px', borderRadius: '8px', border: '1.5px solid #e8faf3', fontSize: '13px', outline: 'none', background: 'white' }} />
                                <button onClick={() => saveEditMedium(large.name, medium.name)} style={{ padding: '5px 10px', background: '#00c471', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>저장</button>
                                <button onClick={cancelEdit} style={{ padding: '5px 10px', background: '#adb5bd', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>취소</button>
                              </div>
                            ) : (
                              <span style={{ fontWeight: '600', cursor: 'pointer', fontSize: '13px', color: '#00a85e', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => setOpenMedium(openMedium === large.name + '-' + medium.name ? null : large.name + '-' + medium.name)}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00a85e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openMedium === large.name + '-' + medium.name ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                                  <polyline points="9 18 15 12 9 6"/>
                                </svg>
                                {medium.name}
                              </span>
                            )}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <MoveBtn onClick={() => handleMoveMedium(large.name, mediumIndex, 'up')} label="▲" disabled={mediumIndex === 0} />
                              <MoveBtn onClick={() => handleMoveMedium(large.name, mediumIndex, 'down')} label="▼" disabled={mediumIndex === large.children.length - 1} />
                              <button onClick={() => startEdit('medium-' + large.name + '-' + medium.name, medium.name)} style={{ padding: '4px 8px', background: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>수정</button>
                              <button onClick={() => handleDeleteMedium(large.name, medium.name)} style={{ padding: '4px 8px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>삭제</button>
                            </div>
                          </div>

                          {openMedium === large.name + '-' + medium.name && (
                            <div style={{ padding: '12px' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <input value={form.small} onChange={(e) => setForm({ ...form, small: e.target.value })}
                                  placeholder="소분류 이름 (예: 채소)" style={inputStyle}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddSmall(large.name, medium.name); }} />
                                <button onClick={() => handleAddSmall(large.name, medium.name)} style={{ padding: '10px 12px', background: '#f0faf5', color: '#00a85e', border: '1.5px solid #e8faf3', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>소분류 추가</button>
                              </div>

                              {medium.children.length === 0 ? (
                                <p style={{ color: '#adb5bd', fontSize: '13px', margin: 0, textAlign: 'center' }}>소분류가 없어요!</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {medium.children.map((small, smallIndex) => (
                                    <div key={small} style={{ background: 'white', border: '1px solid #f0faf5', borderRadius: '10px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      {editTarget === 'small-' + large.name + '-' + medium.name + '-' + small ? (
                                        <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                            style={{ flex: 1, padding: '5px 10px', borderRadius: '8px', border: '1.5px solid #e8faf3', fontSize: '13px', outline: 'none', background: '#f8fffe' }} />
                                          <button onClick={() => saveEditSmall(large.name, medium.name, small)} style={{ padding: '5px 10px', background: '#00c471', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>저장</button>
                                          <button onClick={cancelEdit} style={{ padding: '5px 10px', background: '#adb5bd', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>취소</button>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '13px', color: '#495057', fontWeight: '600' }}>{small}</span>
                                      )}
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <MoveBtn onClick={() => handleMoveSmall(large.name, medium.name, smallIndex, 'up')} label="▲" disabled={smallIndex === 0} />
                                        <MoveBtn onClick={() => handleMoveSmall(large.name, medium.name, smallIndex, 'down')} label="▼" disabled={smallIndex === medium.children.length - 1} />
                                        <button onClick={() => startEdit('small-' + large.name + '-' + medium.name + '-' + small, small)} style={{ padding: '4px 8px', background: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>수정</button>
                                        <button onClick={() => handleDeleteSmall(large.name, medium.name, small)} style={{ padding: '4px 8px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>삭제</button>
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