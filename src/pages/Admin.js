import { useState } from 'react';
import CategoryManager from './CategoryManager';

function ImageUploadMulti({ images, onImagesChange }) {
  const handleAdd = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - images.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { alert('이미지 크기는 5MB 이하만 가능해요!'); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        onImagesChange((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemove = (index) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '8px' }}>
        상품 이미지 ({images.length}/5)
      </label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {images.map((img, index) => (
          <div key={index} style={{ position: 'relative' }}>
            <img src={img} alt={'상품' + (index + 1)} style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }} />
            {index === 0 && (
              <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: '#00c471', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>대표</span>
            )}
            <button onClick={() => handleRemove(index)} style={{ position: 'absolute', top: '3px', right: '3px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        ))}
        {images.length < 5 && (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', border: '2px dashed #dee2e6', borderRadius: '8px', cursor: 'pointer', background: '#f8f9fa' }}>
            <span style={{ fontSize: '24px' }}>📷</span>
            <span style={{ fontSize: '11px', color: '#adb5bd', marginTop: '4px' }}>추가</span>
            <input type="file" accept="image/*" multiple onChange={handleAdd} style={{ display: 'none' }} />
          </label>
        )}
      </div>
    </div>
  );
}

function Admin({ products, setProducts, categories, setCategories, messages, setMessages, goBack }) {
  const [tab, setTab] = useState('products');
  const [form, setForm] = useState({
    name: '',
    price: '',
    barcode: '',
    large: '',
    medium: '',
    small: '',
    images: [],
  });
  const [editId, setEditId] = useState(null);
  const [msgForm, setMsgForm] = useState({ ...messages });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'large') {
      setForm({ ...form, large: value, medium: '', small: '' });
    } else if (name === 'medium') {
      setForm({ ...form, medium: value, small: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleEdit = (product) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      price: product.price,
      barcode: product.barcode || '',
      large: product.large || '',
      medium: product.medium || '',
      small: product.small || '',
      images: product.images || (product.image ? [product.image] : []),
    });
    setTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setForm({ name: '', price: '', barcode: '', large: '', medium: '', small: '', images: [] });
  };

  const handleSubmit = () => {
    if (!form.name || !form.price || !form.large) {
      alert('상품명, 가격, 대분류는 필수예요!');
      return;
    }
    if (editId !== null) {
      setProducts(products.map((p) =>
        p.id === editId
          ? { ...p, name: form.name, price: Number(form.price), barcode: form.barcode, large: form.large, medium: form.medium, small: form.small, images: form.images, image: form.images[0] || null }
          : p
      ));
      alert('상품이 수정됐어요! 😊');
      setEditId(null);
    } else {
      const newProduct = {
        id: products.length + 1,
        name: form.name,
        price: Number(form.price),
        barcode: form.barcode,
        large: form.large,
        medium: form.medium,
        small: form.small,
        images: form.images,
        image: form.images[0] || null,
      };
      setProducts([...products, newProduct]);
      alert('상품이 등록됐어요! 😊');
    }
    setForm({ name: '', price: '', barcode: '', large: '', medium: '', small: '', images: [] });
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제할까요?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleMsgSave = () => {
    setMessages(msgForm);
    alert('문구가 저장됐어요! 😊');
  };

  const selectedLarge = categories.find((c) => c.name === form.large);
  const selectedMedium = selectedLarge && selectedLarge.children.find((m) => m.name === form.medium);

  return (
    <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ margin: 0, color: '#212529', fontSize: '20px', fontWeight: '800' }}>⚙️ 관리자 페이지</h2>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e9ecef', paddingBottom: '0' }}>
        {[
          { key: 'products', label: '📦 상품 관리' },
          { key: 'categories', label: '📂 카테고리 관리' },
          { key: 'messages', label: '✏️ 문구 관리' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              background: 'transparent',
              color: tab === t.key ? '#00c471' : '#868e96',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid #00c471' : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: tab === t.key ? '700' : '500',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 상품 관리 탭 */}
      {tab === 'products' && (
        <div>
          {/* 상품 등록/수정 폼 */}
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '14px', marginBottom: '24px', border: '1px solid #e9ecef' }}>
            <h3 style={{ marginBottom: '16px', color: '#212529', fontSize: '16px', fontWeight: '700' }}>
              {editId !== null ? '✏️ 상품 수정' : '➕ 상품 등록'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <ImageUploadMulti
                images={form.images}
                onImagesChange={(updater) => setForm((prev) => ({ ...prev, images: typeof updater === 'function' ? updater(prev.images) : updater }))}
              />
              <input name="name" value={form.name} onChange={handleChange} placeholder="상품명" style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', outline: 'none' }} />
              <input name="price" value={form.price} onChange={handleChange} placeholder="가격 (숫자만)" type="number" style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', outline: 'none' }} />
              <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="바코드 번호 (선택)" style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', outline: 'none' }} />
              <select name="large" value={form.large} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', outline: 'none', background: 'white' }}>
                <option value="">대분류 선택</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              {selectedLarge && selectedLarge.children.length > 0 && (
                <select name="medium" value={form.medium} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', outline: 'none', background: 'white' }}>
                  <option value="">중분류 선택</option>
                  {selectedLarge.children.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              )}
              {selectedMedium && selectedMedium.children.length > 0 && (
                <select name="small" value={form.small} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', outline: 'none', background: 'white' }}>
                  <option value="">소분류 선택</option>
                  {selectedMedium.children.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={handleSubmit}
                  style={{ flex: 1, padding: '13px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', fontWeight: '700' }}
                >
                  {editId !== null ? '✏️ 수정 완료' : '➕ 상품 등록'}
                </button>
                {editId !== null && (
                  <button onClick={handleCancelEdit} style={{ padding: '13px 20px', background: '#868e96', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}>
                    취소
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 상품 목록 - 카드형 */}
          <h3 style={{ marginBottom: '16px', color: '#212529', fontSize: '16px', fontWeight: '700' }}>
            등록된 상품 목록 ({products.length}개)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  background: editId === product.id ? '#f0fdf4' : 'white',
                  borderRadius: '14px',
                  border: editId === product.id ? '1.5px solid #00c471' : '1px solid #e9ecef',
                  padding: '16px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'flex-start',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}
              >
                {/* 이미지 */}
                <div style={{ flexShrink: 0 }}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: '76px', height: '76px', objectFit: 'contain', background: '#f8f9fa', borderRadius: '10px' }} />
                  ) : (
                    <div style={{ width: '76px', height: '76px', background: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>🛍️</div>
                  )}
                </div>

                {/* 상품 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '5px' }}>
                    <p style={{ fontWeight: '700', fontSize: '15px', color: '#212529', margin: 0 }}>{product.name}</p>
                    <p style={{ fontWeight: '800', fontSize: '15px', color: '#00c471', margin: 0, flexShrink: 0 }}>₩{product.price.toLocaleString()}</p>
                  </div>

                  {product.barcode && (
                    <p style={{ fontSize: '12px', color: '#adb5bd', margin: '0 0 6px', fontFamily: 'monospace' }}>바코드: {product.barcode}</p>
                  )}

                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {product.large && <span style={{ background: '#e8faf3', color: '#00a85e', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{product.large}</span>}
                    {product.medium && <span style={{ background: '#f1f3f5', color: '#495057', padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>{product.medium}</span>}
                    {product.small && <span style={{ background: '#f1f3f5', color: '#868e96', padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}>{product.small}</span>}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(product)}
                      style={{ padding: '7px 16px', background: '#1e90ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      ✏️ 수정
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      style={{ padding: '7px 16px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 카테고리 관리 탭 */}
      {tab === 'categories' && (
        <CategoryManager categories={categories} setCategories={setCategories} />
      )}

      {/* 문구 관리 탭 */}
      {tab === 'messages' && (
        <div style={{ background: '#f8f9fa', padding: '24px', borderRadius: '14px', border: '1px solid #e9ecef' }}>
          <h3 style={{ marginBottom: '20px', color: '#212529', fontSize: '16px', fontWeight: '700' }}>✏️ 문구 관리</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { key: 'banner', label: '🏠 메인 배너 제목', placeholder: 'SR Mart에 오신 것을 환영해요!' },
              { key: 'bannerSub', label: '🏠 메인 배너 부제목', placeholder: '신선하고 다양한 상품을 만나보세요' },
              { key: 'login', label: '🔑 로그인 환영 메시지', placeholder: '님, 환영해요! 즐거운 쇼핑 되세요 😊' },
              { key: 'welcome', label: '🎉 회원가입 환영 메시지', placeholder: '환영해요! SR Mart 가족이 되셨어요! 🎉' },
              { key: 'logout', label: '👋 로그아웃 메시지', placeholder: '로그아웃 됐어요. 이용해주셔서 감사합니다! 😊' },
            ].map((item) => (
              <div key={item.key}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>
                  {item.label}
                </label>
                <input
                  value={msgForm[item.key]}
                  onChange={(e) => setMsgForm({ ...msgForm, [item.key]: e.target.value })}
                  placeholder={item.placeholder}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}
            <button
              onClick={handleMsgSave}
              style={{ padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', fontWeight: '700', marginTop: '8px' }}
            >
              💾 문구 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;