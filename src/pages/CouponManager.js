import { useState } from 'react';

const COUPON_TARGETS = [
  { value: 'all', label: '전체 회원' },
  { value: 'new', label: '신규 회원' },
  { value: 'vip', label: 'VIP 회원' },
  { value: 'first_order', label: '첫 주문 고객' },
];

const emptyForm = {
  code: '', discount: '', type: 'percent', description: '',
  target: 'all', startDate: '', endDate: '',
  minAmount: '', maxDiscount: '', usageLimit: '',
};

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '12px',
  border: '1.5px solid #e8faf3', fontSize: '14px', outline: 'none',
  fontFamily: 'inherit', background: '#f8fffe', boxSizing: 'border-box'
};

function CouponManager({ coupons, setCoupons, goBack }) {
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);
  const [editCode, setEditCode] = useState(null);

  const handleAdd = () => {
    if (!form.code || !form.discount || !form.description) { alert('코드, 할인값, 설명은 필수예요!'); return; }
    if (!editCode && coupons.find((c) => c.code === form.code.toUpperCase())) { alert('이미 존재하는 쿠폰 코드예요!'); return; }
    const newCoupon = {
      code: form.code.toUpperCase(), discount: Number(form.discount), type: form.type,
      description: form.description, target: form.target, startDate: form.startDate,
      endDate: form.endDate, minAmount: form.minAmount ? Number(form.minAmount) : 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
      usageCount: editCode ? (coupons.find((c) => c.code === editCode)?.usageCount || 0) : 0,
      isActive: true,
    };
    if (editCode) {
      setCoupons(coupons.map((c) => c.code === editCode ? newCoupon : c));
      alert('쿠폰이 수정됐어요! 😊');
    } else {
      setCoupons([...coupons, newCoupon]);
      alert('쿠폰이 등록됐어요! 😊');
    }
    setForm({ ...emptyForm }); setShowForm(false); setEditCode(null);
  };

  const handleEdit = (coupon) => {
    setEditCode(coupon.code);
    setForm({ code: coupon.code, discount: coupon.discount, type: coupon.type, description: coupon.description, target: coupon.target || 'all', startDate: coupon.startDate || '', endDate: coupon.endDate || '', minAmount: coupon.minAmount || '', maxDiscount: coupon.maxDiscount || '', usageLimit: coupon.usageLimit || '' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => { setForm({ ...emptyForm }); setShowForm(false); setEditCode(null); };
  const handleDelete = (code) => { if (window.confirm('정말 삭제할까요?')) setCoupons(coupons.filter((c) => c.code !== code)); };
  const handleToggle = (code) => { setCoupons(coupons.map((c) => c.code === code ? { ...c, isActive: !c.isActive } : c)); };

  const isExpired = (coupon) => coupon.endDate && new Date(coupon.endDate) < new Date();
  const isNotStarted = (coupon) => coupon.startDate && new Date(coupon.startDate) > new Date();

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return { label: '비활성', bg: '#f1f3f5', color: '#868e96' };
    if (isExpired(coupon)) return { label: '만료', bg: '#fff0f1', color: '#ff4757' };
    if (isNotStarted(coupon)) return { label: '예정', bg: '#fff3cd', color: '#f0a500' };
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) return { label: '소진', bg: '#fff0f1', color: '#ff4757' };
    return { label: '사용중', bg: '#f0faf5', color: '#00a85e' };
  };

  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a85e' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>쿠폰 관리</h2>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (showForm) handleCancel(); }}
          style={{ padding: '8px 16px', background: showForm ? '#f0faf5' : 'linear-gradient(135deg, #00c471, #00a85e)', color: showForm ? '#00a85e' : 'white', border: showForm ? '1.5px solid #e8faf3' : 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          {showForm ? '취소' : '+ 추가'}
        </button>
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <div style={{ padding: '16px', background: 'white', borderBottom: '8px solid #f8fffe' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 16px' }}>
            {editCode ? '쿠폰 수정' : '쿠폰 등록'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>쿠폰 코드</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="예: SAVE10" readOnly={!!editCode}
                style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: '700', opacity: editCode ? 0.6 : 1 }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>쿠폰 설명</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="예: 신규 회원 10% 할인" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>할인 설정</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, width: 'auto', flexShrink: 0 }}>
                  <option value="percent">% 할인</option>
                  <option value="fixed">정액 할인</option>
                </select>
                <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  placeholder={form.type === 'percent' ? '할인율 (%)' : '할인금액 (원)'} type="number" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>적용 대상</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {COUPON_TARGETS.map((t) => (
                  <button key={t.value} onClick={() => setForm({ ...form, target: t.value })}
                    style={{ padding: '7px 14px', background: form.target === t.value ? '#00c471' : 'white', color: form.target === t.value ? 'white' : '#495057', border: form.target === t.value ? 'none' : '1.5px solid #e8faf3', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>사용 기간</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" style={inputStyle} />
                <span style={{ fontSize: '13px', color: '#adb5bd', flexShrink: 0 }}>~</span>
                <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} type="date" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>최소 주문금액 (선택)</label>
              <input value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder="예: 10000" type="number" style={inputStyle} />
            </div>
            {form.type === 'percent' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>최대 할인금액 (선택)</label>
                <input value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="예: 5000" type="number" style={inputStyle} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>사용 횟수 제한 (선택)</label>
              <input value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="예: 100" type="number" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleAdd} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,196,113,0.3)' }}>
                {editCode ? '수정 완료' : '쿠폰 등록'}
              </button>
              <button onClick={handleCancel} style={{ padding: '14px 20px', background: '#f8fffe', color: '#adb5bd', border: '1.5px solid #e8faf3', borderRadius: '14px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 쿠폰 목록 */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {coupons.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
            <div style={{ width: '72px', height: '72px', background: '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>등록된 쿠폰이 없어요!</p>
          </div>
        ) : (
          coupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <div key={coupon.code} style={{ background: 'white', borderRadius: '18px', padding: '16px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f0faf5', opacity: !coupon.isActive || isExpired(coupon) ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px', fontFamily: 'monospace' }}>{coupon.code}</p>
                    <p style={{ fontSize: '13px', color: '#adb5bd', margin: 0 }}>{coupon.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{status.label}</span>
                    <span style={{ background: coupon.type === 'percent' ? '#f0faf5' : '#e8f0fe', color: coupon.type === 'percent' ? '#00a85e' : '#1a73e8', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '800' }}>
                      {coupon.type === 'percent' ? `-${coupon.discount}%` : `-₩${coupon.discount.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div style={{ background: '#f8fffe', borderRadius: '12px', padding: '10px 12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #f0faf5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#adb5bd' }}>적용 대상</span>
                    <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{COUPON_TARGETS.find((t) => t.value === (coupon.target || 'all'))?.label}</span>
                  </div>
                  {(coupon.startDate || coupon.endDate) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#adb5bd' }}>사용 기간</span>
                      <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{coupon.startDate || '~'} ~ {coupon.endDate || '제한없음'}</span>
                    </div>
                  )}
                  {coupon.minAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#adb5bd' }}>최소 주문금액</span>
                      <span style={{ fontWeight: '600', color: '#1a1a1a' }}>₩{coupon.minAmount.toLocaleString()} 이상</span>
                    </div>
                  )}
                  {coupon.usageLimit > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#adb5bd' }}>사용 횟수</span>
                      <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{coupon.usageCount || 0} / {coupon.usageLimit}회</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleEdit(coupon)} style={{ padding: '7px 12px', background: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>수정</button>
                  <button onClick={() => handleToggle(coupon.code)} style={{ padding: '7px 12px', background: coupon.isActive ? '#fff3cd' : '#f0faf5', color: coupon.isActive ? '#f0a500' : '#00a85e', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                    {coupon.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button onClick={() => handleDelete(coupon.code)} style={{ padding: '7px 12px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>삭제</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CouponManager;