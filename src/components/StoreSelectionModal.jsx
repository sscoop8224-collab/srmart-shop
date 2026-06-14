import { useState } from 'react';
import { useStore } from '../StoreContext';

export default function StoreSelectionModal({ onSelected }) {
  const { stores, storesLoading, setGuestStoreId } = useStore();
  const [selected, setSelected] = useState('');

  const handleConfirm = () => {
    if (!selected) {
      alert('점포를 선택해주세요!');
      return;
    }
    const storeId = Number(selected);
    setGuestStoreId(storeId);
    onSelected?.(storeId);
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>🏪</div>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, textAlign: 'center', color: '#14110F' }}>
          둘러보실 점포를 선택해주세요
        </h3>
        <p style={{ color: '#6B6259', fontSize: 13, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.5 }}>
          지역마다 가격과 취급 상품이 달라요.
        </p>
        {storesLoading ? (
          <p style={{ textAlign: 'center', color: '#B6ADA4' }}>점포 목록 불러오는 중...</p>
        ) : stores.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#E5484D' }}>현재 둘러볼 수 있는 점포가 없어요.</p>
        ) : (
          <>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              style={selectStyle}
            >
              <option value="">점포 선택</option>
              {stores.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.address ? ` (${s.address})` : ''}
                </option>
              ))}
            </select>
            <button onClick={handleConfirm} style={buttonStyle}>
              둘러보기 시작
            </button>
          </>
        )}
        <p style={{ fontSize: 12, color: '#B6ADA4', marginTop: 16, textAlign: 'center' }}>
          가입하시면 가입점포가 자동으로 적용돼요.
        </p>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999,
};
const modalStyle = {
  background: '#fff', padding: '28px 24px', borderRadius: 16,
  width: '90%', maxWidth: 360,
  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
};
const selectStyle = {
  width: '100%', padding: '12px 14px',
  borderRadius: 12, border: '1.5px solid rgba(31,169,56,0.18)',
  fontSize: 14, marginBottom: 12, outline: 'none',
  background: '#F2FBF4', color: '#14110F',
  fontFamily: 'inherit', cursor: 'pointer',
  boxSizing: 'border-box',
};
const buttonStyle = {
  width: '100%', padding: '14px',
  borderRadius: 12, border: 'none',
  background: 'linear-gradient(180deg, #2BC047 0%, #178A2D 100%)',
  color: '#fff', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', boxShadow: '0 6px 16px rgba(23,138,45,0.28)',
  fontFamily: 'inherit',
};
