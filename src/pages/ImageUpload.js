import { useState } from 'react';

function ImageUpload({ onImageSelect, currentImage }) {
  const [preview, setPreview] = useState(currentImage || null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('이미지 크기는 5MB 이하만 가능해요!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onImageSelect(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onImageSelect(null);
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ fontSize: '14px', color: '#555', display: 'block', marginBottom: '8px' }}>
        상품 이미지
      </label>

      {preview ? (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={preview}
            alt="상품 미리보기"
            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <button
            onClick={handleRemove}
            style={{ position: 'absolute', top: '4px', right: '4px', background: '#e53935', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      ) : (
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px', border: '2px dashed #ddd', borderRadius: '8px', cursor: 'pointer', background: '#fafafa' }}>
          <span style={{ fontSize: '32px' }}>📷</span>
          <span style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>이미지 선택</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  );
}

export default ImageUpload;