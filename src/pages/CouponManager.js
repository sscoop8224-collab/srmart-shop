import { useState } from 'react';

const COUPON_TARGETS = [
  { value: 'all', label: '전체 회원' },
  { value: 'new', label: '신규 회원' },
  { value: 'vip', label: 'VIP 회원' },
  { value: 'first_order', label: '첫 주문 고객' },
];

const emptyForm = {
  code: '',
  discount: '',
  type: 'percent',
  description: '',
  target: 'all',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxDiscount: '',
  usageLimit: '',
};

function CouponManager({ coupons, setCoupons, goBack }) {
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);
  const [editCode, setEditCode] = useState(null);

  const handleAdd = () => {
    if (!form.code || !form.discount || !form.description) {
      alert('코드, 할인값, 설명은 필수예요!');
      return;
    }
    if (!editCode && coupons.find((c) => c.code === form.code.toUpperCase())) {
      alert('이미 존재하는 쿠폰 코드예요!');
      return;
    }
    const newCoupon = {
      code: form.code.toUpperCase(),
      discount: Number(form.discount),
      type: form.type,
      description: form.description,
      target: form.target,
      startDate: form.startDate,
      endDate: form.endDate,
      minAmount: form.minAmount ? Number(form.minAmount) : 0,
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
    setForm({ ...emptyForm });
    setShowForm(false);
    setEditCode(null);
  };

  const handleEdit = (coupon) => {
    setEditCode(coupon.code);
    setForm({
      code: coupon.code,
      discount: coupon.discount,
      type: coupon.type,
      description: coupon.description,
      target: coupon.target || 'all',
      startDate: coupon.startDate || '',
      endDate: coupon.endDate || '',
      minAmount: coupon.minAmount || '',
      maxDiscount: coupon.maxDiscount || '',
      usageLimit: coupon.usageLimit || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (code) => {
    if (window.confirm('정말 삭제할까요?')) {
      setCoupons(coupons.filter((c) => c.code !== code));
    }
  };

  const handleToggle = (code) => {
    setCoupons(coupons.map((c) => c.code === code ? { ...c, isActive: !c.isActive } : c));
  };

  const handleCancel = () => {
    setForm({ ...emptyForm });
    setShowForm(false);
    setEditCode(null);
  };

  const isExpired = (coupon) => {
    if (!coupon.endDate) return false;
    return new Date(coupon.endDate) < new Date();
  };

  const isNotStarted = (coupon) => {
    if (!coupon.startDate) return false;
    return new Date(coupon.startDate) > new Date();
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.isActive) return { label: '비활성', bg: '#f1f3f5', color: '#868e96' };
    if (isExpired(coupon)) return { label: '만료', bg: '#fff0f1', color: '#ff4757' };
    if (isNotStarted(coupon)) return { label: '예정', bg: '#fff3cd', color: '#f0a500' };
    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) return { label: '소진', bg: '#fff0f1', color: '#ff4757' };
    return { label: '사용중', bg: '#e8faf3', color: '#00a85e' };
  };

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e9ecef', fontSize: '14px', outline: 'none', fontFamily: 'inherit', background: '#f8f9fa', boxSizing: 'border-box' };

  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderBottom: '1px solid #f1f3f5', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: '36px', height: '36px', background: '#f1f3f5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#212529' }}>🎟️ 쿠폰 관리</h2>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (showForm) handleCancel(); }} style={{ padding: '8px 16px', background: showForm ? '#f1f3f5' : 'linear-gradient(135deg, #00c471, #00a85e)', color: showForm ? '#495057' : 'white', border: 'none', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          {showForm ? '취소' : '+ 추가'}
        </button>
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <div style={{ padding: '16px', background: 'white', borderBottom: '8px solid #f8f9fa' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#212529', margin: '0 0 16px' }}>
            {editCode ? '✏️ 쿠폰 수정' : '➕ 쿠폰 등록'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* 쿠폰 코드 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>쿠폰 코드</label>
              <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="예: SAVE10" readOnly={!!editCode} style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: '700', opacity: editCode ? 0.6 : 1 }} />
            </div>

            {/* 설명 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>쿠폰 설명</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="예: 신규 회원 10% 할인" style={inputStyle} />
            </div>

            {/* 할인 타입 + 값 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>할인 설정</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, width: 'auto', flexShrink: 0 }}>
                  <option value="percent">% 할인</option>
                  <option value="fixed">정액 할인</option>
                </select>
                <input value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} placeholder={form.type === 'percent' ? '할인율 (%)' : '할인금액 (원)'} type="number" style={inputStyle} />
              </div>
            </div>

            {/* 적용 대상 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>적용 대상</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {COUPON_TARGETS.map((t) => (
                  <button key={t.value} onClick={() => setForm({ ...form, target: t.value })} style={{ padding: '8px 14px', background: form.target === t.value ? '#00c471' : 'white', color: form.target === t.value ? 'white' : '#495057', border: form.target === t.value ? 'none' : '1.5px solid #e9ecef', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 사용 기간 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>사용 기간</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} type="date" style={inputStyle} />
                <span style={{ fontSize: '13px', color: '#868e96', flexShrink: 0 }}>~</span>
                <input value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} type="date" style={inputStyle} />
              </div>
            </div>

            {/* 최소 주문금액 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>최소 주문금액 (원, 선택)</label>
              <input value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} placeholder="예: 10000 (1만원 이상 주문 시)" type="number" style={inputStyle} />
            </div>

            {/* 최대 할인금액 (% 할인 시) */}
            {form.type === 'percent' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>최대 할인금액 (원, 선택)</label>
                <input value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="예: 5000 (최대 5천원 할인)" type="number" style={inputStyle} />
              </div>
            )}

            {/* 사용 횟수 제한 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#495057', display: 'block', marginBottom: '6px' }}>사용 횟수 제한 (선택)</label>
              <input value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="예: 100 (100명까지 사용 가능)" type="number" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleAdd} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                {editCode ? '✏️ 수정 완료' : '🎟️ 쿠폰 등록'}
              </button>
              <button onClick={handleCancel} style={{ padding: '14px 20px', background: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '12px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}>취소</button>
            </div>
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
          coupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            return (
              <div key={coupon.code} style={{ background: 'white', borderRadius: '16px', padding: '16px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: !coupon.isActive || isExpired(coupon) ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: '#212529', margin: '0 0 4px', fontFamily: 'monospace' }}>{coupon.code}</p>
                    <p style={{ fontSize: '13px', color: '#868e96', margin: 0 }}>{coupon.description}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{status.label}</span>
                    <div style={{ background: coupon.type === 'percent' ? '#e8faf3' : '#e8f0fe', color: coupon.type === 'percent' ? '#00a85e' : '#1a73e8', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '800' }}>
                      {coupon.type === 'percent' ? `-${coupon.discount}%` : `-₩${coupon.discount.toLocaleString()}`}
                    </div>
                  </div>
                </div>

                {/* 쿠폰 상세 정보 */}
                <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#868e96' }}>적용 대상</span>
                    <span style={{ fontWeight: '600', color: '#212529' }}>{COUPON_TARGETS.find((t) => t.value === (coupon.target || 'all'))?.label}</span>
                  </div>
                  {(coupon.startDate || coupon.endDate) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#868e96' }}>사용 기간</span>
                      <span style={{ fontWeight: '600', color: '#212529' }}>{coupon.startDate || '~'} ~ {coupon.endDate || '제한없음'}</span>
                    </div>
                  )}
                  {coupon.minAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#868e96' }}>최소 주문금액</span>
                      <span style={{ fontWeight: '600', color: '#212529' }}>₩{coupon.minAmount.toLocaleString()} 이상</span>
                    </div>
                  )}
                  {coupon.maxDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#868e96' }}>최대 할인금액</span>
                      <span style={{ fontWeight: '600', color: '#212529' }}>₩{coupon.maxDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {coupon.usageLimit > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#868e96' }}>사용 횟수</span>
                      <span style={{ fontWeight: '600', color: '#212529' }}>{coupon.usageCount || 0} / {coupon.usageLimit}회</span>
                    </div>
                  )}
                </div>

                {/* 버튼 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(coupon)} style={{ padding: '7px 14px', background: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>✏️ 수정</button>
                  <button onClick={() => handleToggle(coupon.code)} style={{ padding: '7px 14px', background: coupon.isActive ? '#fff3cd' : '#e8faf3', color: coupon.isActive ? '#f0a500' : '#00a85e', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                    {coupon.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button onClick={() => handleDelete(coupon.code)} style={{ padding: '7px 14px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>삭제</button>
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