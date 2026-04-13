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

  const startEdit = (target, value) => {
    setEditTarget(target);
    setEditValue(value);
  };

  const cancelEdit = () => {
    setEditTarget(null);
    setEditValue('');
  };

  const saveEditLarge = (oldName) => {
    if (!editValue.trim()) { alert('이름을 입력해주세요!'); return; }
    setCategories(categories.map((c) =>
      c.name === oldName ? { ...c, name: editValue.trim() } : c
    ));
    if (openLarge === oldName) setOpenLarge(editValue.trim());
    cancelEdit();
  };

  const saveEditMedium = (largeName, oldName) => {
    if (!editValue.trim()) { alert('이름을 입력해주세요!'); return; }
    setCategories(categories.map((c) =>
      c.name === largeName
        ? { ...c, children: c.children.map((m) => m.name === oldName ? { ...m, name: editValue.trim() } : m) }
        : c
    ));
    const key = largeName + '-' + oldName;
    if (openMedium === key) setOpenMedium(largeName + '-' + editValue.trim());
    cancelEdit();
  };

  const saveEditSmall = (largeName, mediumName, oldName) => {
    if (!editValue.trim()) { alert('이름을 입력해주세요!'); return; }
    setCategories(categories.map((c) =>
      c.name === largeName
        ? { ...c, children: c.children.map((m) =>
            m.name === mediumName
              ? { ...m, children: m.children.map((s) => s === oldName ? editValue.trim() : s) }
              : m
          )}
        : c
    ));
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

  const handleMoveLarge = (index, direction) => {
    setCategories(moveItem(categories, index, direction));
  };

  const handleAddMedium = (largeName) => {
    if (!form.medium.trim()) { alert('중분류를 입력해주세요!'); return; }
    setCategories(categories.map((c) =>
      c.name === largeName
        ? { ...c, children: [...c.children, { name: form.medium.trim(), children: [] }] }
        : c
    ));
    setForm({ ...form, medium: '' });
  };

  const handleDeleteMedium = (largeName, mediumName) => {
    if (window.confirm(mediumName + ' 중분류를 삭제할까요?')) {
      setCategories(categories.map((c) =>
        c.name === largeName
          ? { ...c, children: c.children.filter((m) => m.name !== mediumName) }
          : c
      ));
      setOpenMedium(null);
    }
  };

  const handleMoveMedium = (largeName, index, direction) => {
    setCategories(categories.map((c) =>
      c.name === largeName
        ? { ...c, children: moveItem(c.children, index, direction) }
        : c
    ));
  };

  const handleAddSmall = (largeName, mediumName) => {
    if (!form.small.trim()) { alert('소분류를 입력해주세요!'); return; }
    setCategories(categories.map((c) =>
      c.name === largeName
        ? { ...c, children: c.children.map((m) =>
            m.name === mediumName
              ? { ...m, children: [...m.children, form.small.trim()] }
              : m
          )}
        : c
    ));
    setForm({ ...form, small: '' });
  };

  const handleDeleteSmall = (largeName, mediumName, smallName) => {
    if (window.confirm(smallName + ' 소분류를 삭제할까요?')) {
      setCategories(categories.map((c) =>
        c.name === largeName
          ? { ...c, children: c.children.map((m) =>
              m.name === mediumName
                ? { ...m, children: m.children.filter((s) => s !== smallName) }
                : m
            )}
          : c
      ));
    }
  };

  const handleMoveSmall = (largeName, mediumName, index, direction) => {
    setCategories(categories.map((c) =>
      c.name === largeName
        ? { ...c, children: c.children.map((m) =>
            m.name === mediumName
              ? { ...m, children: moveItem(m.children, index, direction) }
              : m
          )}
        : c
    ));
  };

  const btnStyle = (color) => ({
    padding: '4px 10px', background: color, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
  });

  const moveBtn = (onClick, label, disabled) => (
    <button onClick={onClick} disabled={disabled} style={{ padding: '4px 8px', background: disabled ? '#e0e0e0' : '#607d8b', color: disabled ? '#aaa' : 'white', border: 'none', borderRadius: '6px', cursor: disabled ? 'default' : 'pointer', fontSize: '12px' }}>
      {label}
    </button>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#1b5e20' }}>📂 카테고리 관리</h2>

      {/* 대분류 추가 */}
      <div style={{ background: '#f1f8e9', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #c8e6c9' }}>
        <h3 style={{ marginBottom: '12px', color: '#2e7d32' }}>대분류 추가</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={form.large} onChange={(e) => setForm({ ...form, large: e.target.value })} placeholder="대분류 이름 (예: 식품)" style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }} />
          <button onClick={handleAddLarge} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>추가</button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📂</p>
          <p>아직 카테고리가 없어요!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categories.map((large, largeIndex) => (
            <div key={large.name} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>

              {/* 대분류 헤더 */}
              <div style={{ background: '#2e7d32', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {editTarget === 'large-' + large.name ? (
                  <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                    <input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: 'none', fontSize: '14px', color: '#1a1a1a' }} />
                    <button onClick={() => saveEditLarge(large.name)} style={btnStyle('#1565c0')}>저장</button>
                    <button onClick={cancelEdit} style={btnStyle('#888')}>취소</button>
                  </div>
                ) : (
                  <span style={{ fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }} onClick={() => setOpenLarge(openLarge === large.name ? null : large.name)}>
                    {openLarge === large.name ? '▼' : '▶'} 📁 {large.name}
                  </span>
                )}
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {moveBtn(() => handleMoveLarge(largeIndex, 'up'), '▲', largeIndex === 0)}
                  {moveBtn(() => handleMoveLarge(largeIndex, 'down'), '▼', largeIndex === categories.length - 1)}
                  <button onClick={() => startEdit('large-' + large.name, large.name)} style={btnStyle('#1565c0')}>✏️수정</button>
                  <button onClick={() => handleDeleteLarge(large.name)} style={btnStyle('#e53935')}>삭제</button>
                </div>
              </div>

              {openLarge === large.name && (
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} placeholder="중분류 이름 (예: 신선식품)" style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '13px' }} />
                    <button onClick={() => handleAddMedium(large.name)} style={{ padding: '8px 16px', background: '#388e3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>중분류 추가</button>
                  </div>

                  {large.children.length === 0 ? (
                    <p style={{ color: '#aaa', fontSize: '13px', margin: '8px 0' }}>중분류가 없어요!</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {large.children.map((medium, mediumIndex) => (
                        <div key={medium.name} style={{ background: '#f9fbe7', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>

                          {/* 중분류 헤더 */}
                          <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e8f5e9' }}>
                            {editTarget === 'medium-' + large.name + '-' + medium.name ? (
                              <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                                <input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #c8e6c9', fontSize: '13px' }} />
                                <button onClick={() => saveEditMedium(large.name, medium.name)} style={btnStyle('#1565c0')}>저장</button>
                                <button onClick={cancelEdit} style={btnStyle('#888')}>취소</button>
                              </div>
                            ) : (
                              <span style={{ fontWeight: '500', cursor: 'pointer', fontSize: '14px', color: '#2e7d32' }} onClick={() => setOpenMedium(openMedium === large.name + '-' + medium.name ? null : large.name + '-' + medium.name)}>
                                {openMedium === large.name + '-' + medium.name ? '▼' : '▶'} 📂 {medium.name}
                              </span>
                            )}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {moveBtn(() => handleMoveMedium(large.name, mediumIndex, 'up'), '▲', mediumIndex === 0)}
                              {moveBtn(() => handleMoveMedium(large.name, mediumIndex, 'down'), '▼', mediumIndex === large.children.length - 1)}
                              <button onClick={() => startEdit('medium-' + large.name + '-' + medium.name, medium.name)} style={btnStyle('#1565c0')}>✏️수정</button>
                              <button onClick={() => handleDeleteMedium(large.name, medium.name)} style={btnStyle('#e53935')}>삭제</button>
                            </div>
                          </div>

                          {openMedium === large.name + '-' + medium.name && (
                            <div style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                <input value={form.small} onChange={(e) => setForm({ ...form, small: e.target.value })} placeholder="소분류 이름 (예: 채소)" style={{ flex: 1, padding: '7px 12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '13px' }} />
                                <button onClick={() => handleAddSmall(large.name, medium.name)} style={{ padding: '7px 14px', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>소분류 추가</button>
                              </div>

                              {medium.children.length === 0 ? (
                                <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>소분류가 없어요!</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {medium.children.map((small, smallIndex) => (
                                    <div key={small} style={{ background: 'white', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      {editTarget === 'small-' + large.name + '-' + medium.name + '-' + small ? (
                                        <div style={{ display: 'flex', gap: '6px', flex: 1, marginRight: '8px' }}>
                                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{ flex: 1, padding: '4px 8px', borderRadius: '6px', border: '1px solid #c8e6c9', fontSize: '13px' }} />
                                          <button onClick={() => saveEditSmall(large.name, medium.name, small)} style={btnStyle('#1565c0')}>저장</button>
                                          <button onClick={cancelEdit} style={btnStyle('#888')}>취소</button>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '13px' }}>🏷️ {small}</span>
                                      )}
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        {moveBtn(() => handleMoveSmall(large.name, medium.name, smallIndex, 'up'), '▲', smallIndex === 0)}
                                        {moveBtn(() => handleMoveSmall(large.name, medium.name, smallIndex, 'down'), '▼', smallIndex === medium.children.length - 1)}
                                        <button onClick={() => startEdit('small-' + large.name + '-' + medium.name + '-' + small, small)} style={btnStyle('#1565c0')}>✏️수정</button>
                                        <button onClick={() => handleDeleteSmall(large.name, medium.name, small)} style={btnStyle('#e53935')}>삭제</button>
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