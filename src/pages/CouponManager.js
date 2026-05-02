import { useState } from 'react';

function CouponManager({ coupons, setCoupons, goBack }) {
  const [form, setForm] = useState({ code: '', discount: '', type: 'percent', description: '' });
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    if (!form.code || !form.discount || !form.description) {
      alert('모든 항목을 입력해주세요!');
      return;
    }
    const newCoupon = {
      code: form.code.toUpperCase(),
      discount: Number(form.discount),
      type: form.type,
      description: form.description,
      isActive: true,
    };
    if (coupons.find((c) => c.code === newCoupon.code)) {
      alert('이미 존재하는 쿠폰 코드예요!');
      return;
    }
    setCoupons([...coupons, newCoupon]);
    setForm({ code: '', discount: '', type: 'percent', description: '' });
    setShowForm(false);
    alert('쿠폰이 등록됐어요! 😊');
  };

  const handleDelete = (code) => {
    if (window.confirm('정말 삭제할까요?')) {
      setCoupons(coupons.filter((c) => c.code !== code));
    }
  };

  const handleToggle = (code) => {
    setCoupons(coupons.map((c) => c.code === code ? { ...c, isActive: !c.isActive } : c));
  };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>🎟️ 쿠폰 관리</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          {showForm ? '취소' : '+ 추가'}
        </button>
      </div>

      {/* 등록 폼 */}
      {showForm && (
        <div style={{ padding: '16px', background: 'white', borderBottom: '8px solid #f8f9fa' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="쿠폰 코드 (예: SAVE10)" style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'monospace', fontWeight: '700' }} />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="쿠폰 설명" style={{ padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', background: 'white', fontFamily: 'inherit' }}>
                <option value="percent">% 할인</option>
                <option value="fixed">정액 할인</option>
              </select>
              <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder={form.type === 'percent' ? '할인율 (%)' : '할인금액 (원)'} type="number" style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <button onClick={handleAdd} style={{ padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
              🎟️ 쿠폰 등록
            </button>
          </div>
        </div>
      )}

      {/* 쿠폰 목록 */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {coupons.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', color: '#adb5bd' }}>
            <span style={{ fontSize: '52px', marginBottom: '12px' }}>🎟️</span>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#495057', margin: 0 }}>등록된 쿠폰이 없어요!</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon.code} style={{ background: 'white', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: coupon.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '800', color: '#212529', margin: '0 0 4px', fontFamily: 'monospace' }}>{coupon.code}</p>
                  <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>{coupon.description}</p>
                </div>
                <div style={{ background: coupon.type === 'percent' ? '#e8faf3' : '#e8f0fe', color: coupon.type === 'percent' ? '#00a85e' : '#1a73e8', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '800' }}>
                  {coupon.type === 'percent' ? `-${coupon.discount}%` : `-₩${coupon.discount.toLocaleString()}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleToggle(coupon.code)} style={{ padding: '7px 14px', background: coupon.isActive ? '#fff3cd' : '#e8faf3', color: coupon.isActive ? '#f0a500' : '#00a85e', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                  {coupon.isActive ? '비활성화' : '활성화'}
                </button>
                <button onClick={() => handleDelete(coupon.code)} style={{ padding: '7px 14px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CouponManager;