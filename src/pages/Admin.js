import { useState } from 'react';
import CategoryManager from './CategoryManager';
import BarcodeQRScanner, { ScanButtonIcon } from '../components/common/BarcodeQRScanner';

function ImageUploadMulti({ images, onImagesChange, darkMode }) {
  const handleAdd = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - images.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { alert('이미지 크기는 5MB 이하만 가능해요!'); return; }
      const reader = new FileReader();
      reader.onloadend = () => { onImagesChange((prev) => [...prev, reader.result]); };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemove = (index) => { onImagesChange(images.filter((_, i) => i !== index)); };

  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '8px' }}>상품 이미지 ({images.length}/5)</label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {images.map((img, index) => (
          <div key={index} style={{ position: 'relative' }}>
            <img src={img} alt={'상품' + (index + 1)} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #e8faf3' }} />
            {index === 0 && <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: '#00c471', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>대표</span>}
            <button onClick={() => handleRemove(index)} style={{ position: 'absolute', top: '3px', right: '3px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        ))}
        {images.length < 5 && (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', border: `2px dashed ${darkMode ? '#444' : '#e8faf3'}`, borderRadius: '12px', cursor: 'pointer', background: darkMode ? '#2a2a2a' : '#f8fffe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ fontSize: '11px', color: '#00a85e', marginTop: '4px', fontWeight: '600' }}>추가</span>
            <input type="file" accept="image/*" multiple onChange={handleAdd} style={{ display: 'none' }} />
          </label>
        )}
      </div>
    </div>
  );
}

const emptyForm = {
  name: '', price: '', barcode: '', large: '', medium: '', small: '',
  images: [], description: '', nutritionImage: null, stock: '', isSoldOut: false,
};

const inputStyle = {
  padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e8faf3',
  fontSize: '14px', outline: 'none', background: '#f8fffe',
  fontFamily: 'inherit', width: '100%', boxSizing: 'border-box'
};

const selectStyle = {
  padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #e8faf3',
  fontSize: '14px', outline: 'none', background: '#f8fffe',
  fontFamily: 'inherit', width: '100%', boxSizing: 'border-box'
};

function Admin({ products, setProducts, categories, setCategories, messages, setMessages, goBack, darkMode }) {
  const bg        = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg    = darkMode ? '#2a2a2a' : '#ffffff';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subColor  = darkMode ? '#9e9e9e' : '#adb5bd';
  const border    = darkMode ? '#3a3a3a' : '#f0faf5';
  const inputBg   = darkMode ? '#2a2a2a' : '#ffffff';
  const inputBorder = darkMode ? '#3a3a3a' : '#dee2e6';

  const dynInputStyle  = { ...inputStyle,  background: inputBg, border: `1.5px solid ${inputBorder}`, color: textColor };
  const dynSelectStyle = { ...selectStyle, background: inputBg, border: `1.5px solid ${inputBorder}`, color: textColor };

  const [tab, setTab] = useState('products');
  const [showScanner, setShowScanner] = useState(false);

  const handleBarcodeScan = (result) => {
    setForm(prev => ({ ...prev, barcode: result.value }));
    setShowScanner(false);
  };
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [msgForm, setMsgForm] = useState({ ...messages });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'large') setForm({ ...form, large: value, medium: '', small: '' });
    else if (name === 'medium') setForm({ ...form, medium: value, small: '' });
    else setForm({ ...form, [name]: value });
  };

  const handleEdit = (product) => {
    setEditId(product.id);
    setForm({
      name: product.name, price: product.price, barcode: product.barcode || '',
      large: product.large || '', medium: product.medium || '', small: product.small || '',
      images: product.images || (product.image ? [product.image] : []),
      description: product.description || '', nutritionImage: product.nutritionImage || null,
      stock: product.stock || '', isSoldOut: product.isSoldOut || false,
    });
    setTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => { setEditId(null); setForm({ ...emptyForm }); };

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.large) { alert('상품명, 가격, 대분류는 필수예요!'); return; }
    const productData = {
      name: form.name, price: Number(form.price), barcode: form.barcode,
      large: form.large, medium: form.medium, small: form.small,
      images: form.images, image: form.images[0] || null,
      description: form.description, nutritionImage: form.nutritionImage,
      stock: form.stock, isSoldOut: form.isSoldOut,
    };
    if (editId !== null) {
      setProducts(products.map((p) => p.id === editId ? { ...p, ...productData } : p));
      alert('상품이 수정됐어요! 😊');
      setEditId(null);
    } else {
      setProducts([...products, { id: Date.now(), ...productData }]);
      alert('상품이 등록됐어요! 😊');
    }
    setForm({ ...emptyForm });
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제할까요?')) setProducts(products.filter((p) => p.id !== id));
  };

  const handleToggleSoldOut = (id) => {
    setProducts(products.map((p) => p.id === id ? { ...p, isSoldOut: !p.isSoldOut } : p));
  };

  const handleMsgSave = () => { setMessages(msgForm); alert('문구가 저장됐어요! 😊'); };

  const selectedLarge = categories.find((c) => c.name === form.large);
  const selectedMedium = selectedLarge && selectedLarge.children.find((m) => m.name === form.medium);

  const tabs = [
    { key: 'products', label: '상품 관리',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
    { key: 'categories', label: '카테고리',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
    { key: 'messages', label: '문구 관리',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
  ];

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ background: darkMode ? '#0d4d2a' : 'linear-gradient(135deg, #00c471, #00a85e)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: 40, height: 40, flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style={{ margin: 0, color: 'white', fontSize: '18px', fontWeight: '800' }}>관리자 페이지</h2>
      </div>

      {/* 탭 */}
      <div style={{ background: cardBg, display: 'flex', borderBottom: `1px solid ${border}`, padding: '0 16px' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '14px 8px', background: 'transparent', color: tab === t.key ? '#00c471' : subColor, border: 'none', borderBottom: tab === t.key ? '2px solid #00c471' : '2px solid transparent', cursor: 'pointer', fontWeight: tab === t.key ? '700' : '500', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontFamily: 'inherit' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* 상품 관리 탭 */}
        {tab === 'products' && (
          <div>
            {/* 등록/수정 폼 */}
            <div style={{ background: cardBg, padding: '18px', borderRadius: '18px', marginBottom: '16px', border: `1px solid ${border}`, boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginBottom: '16px', color: textColor, fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editId !== null ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>상품 수정</>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>상품 등록</>
                )}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <ImageUploadMulti
                  images={form.images}
                  onImagesChange={(updater) => setForm((prev) => ({ ...prev, images: typeof updater === 'function' ? updater(prev.images) : updater }))}
                  darkMode={darkMode}
                />
                <input name="name" value={form.name} onChange={handleChange} placeholder="상품명 *" style={dynInputStyle} />
                <input name="price" value={form.price} onChange={handleChange} placeholder="가격 (숫자만) *" type="number" style={dynInputStyle} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="바코드 번호 (선택)" style={{ ...dynInputStyle, flex: 1 }} />
                  <button type="button" onClick={() => setShowScanner(true)}
                    style={{ width: 48, height: 48, flexShrink: 0, background: '#00c471', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <ScanButtonIcon />
                  </button>
                </div>
                <input name="stock" value={form.stock} onChange={handleChange} placeholder="재고 수량 (선택)" type="number" style={dynInputStyle} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: darkMode ? '#3a1a1a' : '#fff5f5', borderRadius: '12px', border: `1.5px solid ${darkMode ? '#5a2a2a' : '#ffcdd2'}` }}>
                  <input type="checkbox" id="isSoldOut" checked={form.isSoldOut} onChange={(e) => setForm({ ...form, isSoldOut: e.target.checked })} style={{ width: '16px', height: '16px', accentColor: '#ff4757', cursor: 'pointer' }} />
                  <label htmlFor="isSoldOut" style={{ fontSize: '14px', color: darkMode ? '#ff8888' : '#c62828', cursor: 'pointer', fontWeight: '700' }}>품절 처리</label>
                </div>

                <textarea name="description" value={form.description} onChange={handleChange} placeholder="상품 상세 설명 (선택)" rows={3} style={{ ...dynInputStyle, resize: 'none' }} />

                {/* 영양정보 이미지 */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '8px' }}>영양정보 이미지 (선택)</label>
                  {form.nutritionImage && (
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <img src={form.nutritionImage} alt="영양정보" style={{ width: '100%', borderRadius: '12px', border: '1px solid #e8faf3' }} />
                      <button onClick={() => setForm({ ...form, nutritionImage: null })} style={{ position: 'absolute', top: '8px', right: '8px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                    </div>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: inputBg, borderRadius: '12px', border: `1.5px dashed ${inputBorder}`, cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span style={{ fontSize: '13px', color: '#00a85e', fontWeight: '600' }}>영양정보 이미지 추가</span>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => setForm({ ...form, nutritionImage: reader.result });
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* 카테고리 */}
                <select name="large" value={form.large} onChange={handleChange} style={dynSelectStyle}>
                  <option value="">대분류 선택 *</option>
                  {categories.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                {selectedLarge && selectedLarge.children.length > 0 && (
                  <select name="medium" value={form.medium} onChange={handleChange} style={dynSelectStyle}>
                    <option value="">중분류 선택</option>
                    {selectedLarge.children.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                  </select>
                )}
                {selectedMedium && selectedMedium.children.length > 0 && (
                  <select name="small" value={form.small} onChange={handleChange} style={dynSelectStyle}>
                    <option value="">소분류 선택</option>
                    {selectedMedium.children.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={handleSubmit} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
                    {editId !== null ? '수정 완료' : '상품 등록'}
                  </button>
                  {editId !== null && (
                    <button onClick={handleCancelEdit} style={{ padding: '14px 20px', background: inputBg, color: subColor, border: `1.5px solid ${inputBorder}`, borderRadius: '14px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}>취소</button>
                  )}
                </div>
              </div>
            </div>

            {/* 상품 목록 */}
            <h3 style={{ marginBottom: '12px', color: textColor, fontSize: '15px', fontWeight: '800' }}>등록된 상품 ({products.length}개)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {products.map((product) => (
                <div key={product.id} style={{ background: editId === product.id ? (darkMode ? '#1e3a2a' : '#f0faf5') : cardBg, borderRadius: '16px', border: editId === product.id ? '1.5px solid #00c471' : `1px solid ${border}`, padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.04)', opacity: product.isSoldOut ? 0.8 : 1 }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                    {product.image ? (
                      <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: darkMode ? '#333' : '#f0faf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={{ fontWeight: '700', fontSize: '14px', color: textColor, margin: 0 }}>{product.name}</p>
                        {product.isSoldOut && <span style={{ background: '#ff4757', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '8px', fontWeight: '700' }}>품절</span>}
                      </div>
                      <p style={{ fontWeight: '800', fontSize: '14px', color: '#00c471', margin: 0, flexShrink: 0 }}>₩{product.price.toLocaleString()}</p>
                    </div>
                    {product.stock && <p style={{ fontSize: '12px', color: subColor, margin: '0 0 3px' }}>재고: {product.stock}개</p>}
                    {product.barcode && <p style={{ fontSize: '11px', color: subColor, margin: '0 0 6px', fontFamily: 'monospace' }}>{product.barcode}</p>}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {product.large && <span style={{ background: darkMode ? '#1e3a2a' : '#f0faf5', color: '#00a85e', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{product.large}</span>}
                      {product.medium && <span style={{ background: darkMode ? '#333' : '#f1f3f5', color: darkMode ? '#ccc' : '#495057', padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}>{product.medium}</span>}
                      {product.small && <span style={{ background: darkMode ? '#333' : '#f1f3f5', color: subColor, padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}>{product.small}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button onClick={() => handleEdit(product)} style={{ padding: '7px 12px', background: darkMode ? '#1a2a40' : '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>수정</button>
                      <button onClick={() => handleToggleSoldOut(product.id)} style={{ padding: '7px 12px', background: product.isSoldOut ? (darkMode ? '#1e3a2a' : '#f0faf5') : (darkMode ? '#3a1a1a' : '#fff0f1'), color: product.isSoldOut ? '#00a85e' : '#ff4757', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                        {product.isSoldOut ? '품절해제' : '품절처리'}
                      </button>
                      <button onClick={() => handleDelete(product.id)} style={{ padding: '7px 12px', background: darkMode ? '#333' : '#f1f3f5', color: subColor, border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'categories' && <CategoryManager categories={categories} setCategories={setCategories} darkMode={darkMode} />}

        {tab === 'messages' && (
          <div style={{ background: cardBg, padding: '18px', borderRadius: '18px', border: `1px solid ${border}`, boxShadow: darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginBottom: '16px', color: textColor, fontSize: '15px', fontWeight: '800' }}>문구 관리</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'banner', label: '메인 배너 제목' },
                { key: 'bannerSub', label: '메인 배너 부제목' },
                { key: 'login', label: '로그인 환영 메시지' },
                { key: 'welcome', label: '회원가입 환영 메시지' },
                { key: 'logout', label: '로그아웃 메시지' },
              ].map((item) => (
                <div key={item.key}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>{item.label}</label>
                  <input value={msgForm[item.key]} onChange={(e) => setMsgForm({ ...msgForm, [item.key]: e.target.value })} style={dynInputStyle} />
                </div>
              ))}
              <button onClick={handleMsgSave} style={{ padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
                문구 저장
              </button>
            </div>
          </div>
        )}
      </div>

      {showScanner && (
        <BarcodeQRScanner
          onScanSuccess={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

export default Admin;