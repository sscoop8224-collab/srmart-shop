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
              <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: '#2e7d32', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>대표</span>
            )}
            <button onClick={() => handleRemove(index)} style={{ position: 'absolute', top: '3px', right: '3px', background: '#e53935', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        ))}
        {images.length < 5 && (
          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '90px', height: '90px', border: '2px dashed #c8e6c9', borderRadius: '8px', cursor: 'pointer', background: '#f9fbe7' }}>
            <span style={{ fontSize: '24px' }}>📷</span>
            <span style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>추가</span>
            <input type="file" accept="image/*" multiple onChange={handleAdd} style={{ display: 'none' }} />
          </label>
        )}
      </div>
    </div>
  );
}

function Admin({ products, setProducts, categories, setCategories, messages, setMessages }) {
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
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '24px', color: '#1b5e20' }}>⚙️ 관리자 페이지</h2>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'products', label: '📦 상품 관리' },
          { key: 'categories', label: '📂 카테고리 관리' },
          { key: 'messages', label: '✏️ 문구 관리' },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 24px', background: tab === t.key ? '#2e7d32' : '#f1f8e9', color: tab === t.key ? 'white' : '#2e7d32', border: '1px solid #c8e6c9', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 상품 관리 탭 */}
      {tab === 'products' && (
        <div>
          <div style={{ background: '#f1f8e9', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid #c8e6c9' }}>
            <h3 style={{ marginBottom: '16px', color: '#2e7d32' }}>
              {editId !== null ? '✏️ 상품 수정' : '➕ 상품 등록'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <ImageUploadMulti
                images={form.images}
                onImagesChange={(updater) => setForm((prev) => ({ ...prev, images: typeof updater === 'function' ? updater(prev.images) : updater }))}
              />
              <input name="name" value={form.name} onChange={handleChange} placeholder="상품명" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }} />
              <input name="price" value={form.price} onChange={handleChange} placeholder="가격 (숫자만)" type="number" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }} />
              <input name="barcode" value={form.barcode} onChange={handleChange} placeholder="바코드 번호 (선택)" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }} />
              <select name="large" value={form.large} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }}>
                <option value="">대분류 선택</option>
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              {selectedLarge && selectedLarge.children.length > 0 && (
                <select name="medium" value={form.medium} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }}>
                  <option value="">중분류 선택</option>
                  {selectedLarge.children.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              )}
              {selectedMedium && selectedMedium.children.length > 0 && (
                <select name="small" value={form.small} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px' }}>
                  <option value="">소분류 선택</option>
                  {selectedMedium.children.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleSubmit} style={{ flex: 1, padding: '12px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {editId !== null ? '✏️ 수정 완료' : '➕ 상품 등록'}
                </button>
                {editId !== null && (
                  <button onClick={handleCancelEdit} style={{ padding: '12px 20px', background: '#888', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
                    취소
                  </button>
                )}
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: '16px', color: '#1b5e20' }}>등록된 상품 목록 ({products.length}개)</h3>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#2e7d32', color: 'white' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>이미지</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>상품명</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>바코드</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>가격</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left' }}>카테고리</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #e0e0e0', background: editId === product.id ? '#f1f8e9' : 'white' }}>
                    <td style={{ padding: '12px 16px' }}>
                      {product.image ? (
                        <img src={product.image} alt={product.name} style={{ width: '52px', height: '52px', objectFit: 'contain', background: '#f5f5f5', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ width: '52px', height: '52px', background: '#f1f8e9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛍️</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{product.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#666' }}>{product.barcode || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#2e7d32', fontWeight: 'bold' }}>₩{product.price.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                      {product.large && <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '20px', marginRight: '4px' }}>{product.large}</span>}
                      {product.medium && <span style={{ background: '#f1f8e9', color: '#388e3c', padding: '3px 8px', borderRadius: '20px', marginRight: '4px' }}>{product.medium}</span>}
                      {product.small && <span style={{ background: '#f9fbe7', color: '#4caf50', padding: '3px 8px', borderRadius: '20px' }}>{product.small}</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(product)} style={{ padding: '7px 14px', background: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>✏️ 수정</button>
                        <button onClick={() => handleDelete(product.id)} style={{ padding: '7px 14px', background: '#e53935', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>🗑️ 삭제</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 카테고리 관리 탭 */}
      {tab === 'categories' && (
        <CategoryManager categories={categories} setCategories={setCategories} />
      )}

      {/* 문구 관리 탭 */}
      {tab === 'messages' && (
        <div style={{ background: '#f1f8e9', padding: '24px', borderRadius: '12px', border: '1px solid #c8e6c9' }}>
          <h3 style={{ marginBottom: '20px', color: '#2e7d32' }}>✏️ 문구 관리</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {[
              { key: 'banner', label: '🏠 메인 배너 제목', placeholder: 'SR Mart에 오신 것을 환영해요!' },
              { key: 'bannerSub', label: '🏠 메인 배너 부제목', placeholder: '신선하고 다양한 상품을 만나보세요' },
              { key: 'login', label: '🔑 로그인 환영 메시지', placeholder: '님, 환영해요! 즐거운 쇼핑 되세요 😊' },
              { key: 'welcome', label: '🎉 회원가입 환영 메시지', placeholder: '환영해요! SR Mart 가족이 되셨어요! 🎉' },
              { key: 'logout', label: '👋 로그아웃 메시지', placeholder: '로그아웃 됐어요. 이용해주셔서 감사합니다! 😊' },
            ].map((item) => (
              <div key={item.key}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#2e7d32', display: 'block', marginBottom: '6px' }}>
                  {item.label}
                </label>
                <input
                  value={msgForm[item.key]}
                  onChange={(e) => setMsgForm({ ...msgForm, [item.key]: e.target.value })}
                  placeholder={item.placeholder}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            ))}

            <button onClick={handleMsgSave} style={{ padding: '14px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold', marginTop: '8px' }}>
              💾 문구 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;