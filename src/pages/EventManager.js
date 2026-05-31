import { useState } from 'react';

const EVENT_TYPES = [
  { value: '1+1', label: '1+1', desc: '1개 구매시 1개 무료' },
  { value: '2+1', label: '2+1', desc: '2개 구매시 1개 무료' },
  { value: '묶음가', label: '묶음가', desc: '일정 수량 구매시 특별가' },
  { value: '퍼센트할인', label: '% 할인', desc: '퍼센트 할인' },
  { value: '정액할인', label: '정액 할인', desc: '금액 할인' },
];

const emptyForm = {
  name: '',
  type: '단일',
  eventType: '1+1',
  products: [],
  bundleQty: '',
  bundlePrice: '',
  discountValue: '',
  startDate: '',
  endDate: '',
  memo: '',
};

function EventManager({ products, goBack, darkMode, events, setEvents }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editId, setEditId] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  const bg = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg = darkMode ? '#242424' : 'white';
  const headerBg = darkMode ? '#1a1a1a' : 'white';
  const borderColor = darkMode ? '#2e2e2e' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subTextColor = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg = darkMode ? '#2e2e2e' : '#f8fffe';
  const inputBorder = darkMode ? '#3a3a3a' : '#e8faf3';

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '12px',
    border: `1.5px solid ${inputBorder}`, fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', background: inputBg, boxSizing: 'border-box', color: textColor
  };

  const isExpired = (event) => event.endDate && new Date(event.endDate) < new Date();
  const isNotStarted = (event) => event.startDate && new Date(event.startDate) > new Date();

  const getStatus = (event) => {
    if (!event.isActive) return { label: '비활성', bg: darkMode ? '#2e2e2e' : '#f1f3f5', color: '#868e96' };
    if (isExpired(event)) return { label: '종료', bg: darkMode ? '#2a1010' : '#fff0f1', color: '#ff4757' };
    if (isNotStarted(event)) return { label: '예정', bg: darkMode ? '#2a2010' : '#fff3cd', color: '#f0a500' };
    return { label: '진행중', bg: darkMode ? '#1e2e24' : '#f0faf5', color: '#00a85e' };
  };

  const handleAddProduct = (product) => {
    if (form.type === '단일' && form.products.length >= 1) {
      setForm({ ...form, products: [product] });
    } else if (form.type === '교차' && form.products.find(p => p.id === product.id)) {
      return;
    } else {
      setForm({ ...form, products: [...form.products, product] });
    }
    setProductSearch('');
  };

  const handleRemoveProduct = (id) => {
    setForm({ ...form, products: form.products.filter(p => p.id !== id) });
  };

  const handleSave = () => {
    if (!form.name) { alert('행사명을 입력해주세요!'); return; }
    if (form.products.length === 0) { alert('상품을 선택해주세요!'); return; }
    if (!form.startDate || !form.endDate) { alert('행사 기간을 설정해주세요!'); return; }
    if (form.eventType === '묶음가' && (!form.bundleQty || !form.bundlePrice)) {
      alert('묶음 수량과 가격을 입력해주세요!'); return;
    }
    if ((form.eventType === '퍼센트할인' || form.eventType === '정액할인') && !form.discountValue) {
      alert('할인값을 입력해주세요!'); return;
    }

    const newEvent = {
      id: editId || Date.now(),
      ...form,
      isActive: true,
    };

    if (editId) {
      setEvents(events.map(e => e.id === editId ? newEvent : e));
      alert('행사가 수정됐어요! 😊');
    } else {
      setEvents([newEvent, ...events]);
      alert('행사가 등록됐어요! 😊');
    }

    setForm({ ...emptyForm });
    setShowForm(false);
    setEditId(null);
  };

  const handleEdit = (event) => {
    setEditId(event.id);
    setForm({ ...event });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setForm({ ...emptyForm });
    setShowForm(false);
    setEditId(null);
  };

  const handleToggle = (id) => {
    setEvents(events.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e));
  };

  const handleDelete = (id) => {
    if (window.confirm('정말 삭제할까요?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleEndNow = (id) => {
    if (window.confirm('행사를 즉시 종료할까요?')) {
      setEvents(events.map(e => e.id === id ? { ...e, endDate: new Date().toISOString().split('T')[0], isActive: false } : e));
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.large && p.large.includes(productSearch))
  ).filter(p => !form.products.find(fp => fp.id === p.id));

  const activeEvents = events.filter(e => e.isActive && !isExpired(e) && !isNotStarted(e));
  const otherEvents = events.filter(e => !e.isActive || isExpired(e) || isNotStarted(e));

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: darkMode ? 'linear-gradient(135deg, #0d4d2a 0%, #1a5c2a 100%)' : 'linear-gradient(135deg, #00c471 0%, #00a85e 100%)', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={goBack} style={{ width: 40, height: 40, flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'white' }}>행사 관리</h2>
        </div>
        <button onClick={() => { setShowForm(!showForm); if (showForm) handleCancel(); }}
          style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
          {showForm ? '취소' : '+ 행사 등록'}
        </button>
      </div>

      {/* 통계 */}
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { label: '전체', value: events.length, color: '#00a85e', bg: darkMode ? '#1e2e24' : '#f0faf5' },
          { label: '진행중', value: activeEvents.length, color: '#1a73e8', bg: darkMode ? '#1a2030' : '#e8f0fe' },
          { label: '종료/예정', value: otherEvents.length, color: '#868e96', bg: darkMode ? '#2e2e2e' : '#f1f3f5' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '22px', fontWeight: '900', color: s.color, margin: '0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: subTextColor, margin: 0, fontWeight: '600' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* 등록/수정 폼 */}
      {showForm && (
        <div style={{ margin: '0 16px 16px', background: cardBg, borderRadius: '18px', padding: '16px', border: `1px solid ${borderColor}` }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: textColor, margin: '0 0 16px' }}>
            {editId ? '행사 수정' : '행사 등록'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* 행사명 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>행사명</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 봄맞이 특가 행사" style={inputStyle} />
            </div>

            {/* 행사 유형 (단일/교차) */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>행사 종류</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['단일', '교차'].map(t => (
                  <button key={t} onClick={() => setForm({ ...form, type: t, products: [] })}
                    style={{ flex: 1, padding: '10px', borderRadius: '12px', border: form.type === t ? '2px solid #00c471' : `1.5px solid ${inputBorder}`, background: form.type === t ? (darkMode ? '#1e2e24' : '#f0faf5') : cardBg, color: form.type === t ? '#00a85e' : subTextColor, fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                    {t === '단일' ? '단일 상품' : '교차 상품'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: subTextColor, margin: '6px 0 0' }}>
                {form.type === '단일' ? '같은 상품끼리 행사 (콜라 1+1 등)' : '다른 상품끼리 행사 (콜라+과자 구매시 할인 등)'}
              </p>
            </div>

            {/* 이벤트 타입 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>행사 방식</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {EVENT_TYPES.map(t => (
                  <button key={t.value} onClick={() => setForm({ ...form, eventType: t.value })}
                    style={{ padding: '8px 14px', background: form.eventType === t.value ? '#00c471' : cardBg, color: form.eventType === t.value ? 'white' : textColor, border: form.eventType === t.value ? 'none' : `1.5px solid ${inputBorder}`, borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: subTextColor, margin: '6px 0 0' }}>
                {EVENT_TYPES.find(t => t.value === form.eventType)?.desc}
              </p>
            </div>

            {/* 묶음가 설정 */}
            {form.eventType === '묶음가' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>묶음 수량</label>
                  <input value={form.bundleQty} onChange={e => setForm({ ...form, bundleQty: e.target.value })} placeholder="예: 5" type="number" style={inputStyle} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>묶음 가격 (원)</label>
                  <input value={form.bundlePrice} onChange={e => setForm({ ...form, bundlePrice: e.target.value })} placeholder="예: 10000" type="number" style={inputStyle} />
                </div>
              </div>
            )}

            {/* 할인값 설정 */}
            {(form.eventType === '퍼센트할인' || form.eventType === '정액할인') && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>
                  {form.eventType === '퍼센트할인' ? '할인율 (%)' : '할인금액 (원)'}
                </label>
                <input value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                  placeholder={form.eventType === '퍼센트할인' ? '예: 20' : '예: 1000'} type="number" style={inputStyle} />
              </div>
            )}

            {/* 상품 선택 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>
                상품 선택 {form.type === '단일' ? '(1개)' : '(여러 개 가능)'}
              </label>

              {/* 선택된 상품 */}
              {form.products.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                  {form.products.map(p => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: darkMode ? '#1e2e24' : '#f0faf5', borderRadius: '20px', padding: '6px 12px', border: `1px solid ${inputBorder}` }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e' }}>{p.name}</span>
                      <button onClick={() => handleRemoveProduct(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4757', fontSize: '14px', padding: 0, lineHeight: 1 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* 상품 검색 */}
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
                placeholder="상품명으로 검색" style={inputStyle} />

              {productSearch && (
                <div style={{ background: cardBg, borderRadius: '12px', border: `1px solid ${borderColor}`, marginTop: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                  {filteredProducts.length === 0 ? (
                    <p style={{ padding: '12px', fontSize: '13px', color: subTextColor, margin: 0, textAlign: 'center' }}>검색 결과가 없어요</p>
                  ) : (
                    filteredProducts.map(p => (
                      <div key={p.id} onClick={() => handleAddProduct(p)}
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: '700', color: textColor, margin: '0 0 2px' }}>{p.name}</p>
                          <p style={{ fontSize: '11px', color: subTextColor, margin: 0 }}>{p.large} · ₩{p.price.toLocaleString()}</p>
                        </div>
                        <span style={{ fontSize: '12px', color: '#00a85e', fontWeight: '700' }}>+ 추가</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 기간 설정 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>행사 기간</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} type="date" style={inputStyle} />
                <span style={{ color: subTextColor, flexShrink: 0 }}>~</span>
                <input value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} type="date" style={inputStyle} />
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#00a85e', display: 'block', marginBottom: '6px' }}>메모 (선택)</label>
              <input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} placeholder="행사 관련 메모" style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white', border: 'none', borderRadius: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>
                {editId ? '수정 완료' : '행사 등록'}
              </button>
              <button onClick={handleCancel} style={{ padding: '14px 20px', background: inputBg, color: subTextColor, border: `1.5px solid ${inputBorder}`, borderRadius: '14px', fontSize: '15px', cursor: 'pointer', fontWeight: '600' }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 진행중 행사 */}
      {activeEvents.length > 0 && (
        <div style={{ padding: '0 16px 8px' }}>
          <p style={{ fontSize: '14px', fontWeight: '800', color: '#00a85e', margin: '0 0 10px' }}>🔥 진행중 행사</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeEvents.map(event => {
              const status = getStatus(event);
              return (
                <EventCard key={event.id} event={event} status={status} darkMode={darkMode}
                  cardBg={cardBg} borderColor={borderColor} textColor={textColor} subTextColor={subTextColor}
                  inputBorder={inputBorder} inputBg={inputBg}
                  onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete} onEndNow={handleEndNow} />
              );
            })}
          </div>
        </div>
      )}

      {/* 기타 행사 */}
      {otherEvents.length > 0 && (
        <div style={{ padding: '8px 16px' }}>
          <p style={{ fontSize: '14px', fontWeight: '800', color: subTextColor, margin: '0 0 10px' }}>종료/예정/비활성 행사</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {otherEvents.map(event => {
              const status = getStatus(event);
              return (
                <EventCard key={event.id} event={event} status={status} darkMode={darkMode}
                  cardBg={cardBg} borderColor={borderColor} textColor={textColor} subTextColor={subTextColor}
                  inputBorder={inputBorder} inputBg={inputBg}
                  onEdit={handleEdit} onToggle={handleToggle} onDelete={handleDelete} onEndNow={handleEndNow} />
              );
            })}
          </div>
        </div>
      )}

      {events.length === 0 && !showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px' }}>
          <div style={{ width: '72px', height: '72px', background: darkMode ? '#2e2e2e' : '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: '700', color: textColor, margin: 0 }}>등록된 행사가 없어요!</p>
          <p style={{ fontSize: '13px', color: subTextColor, margin: '6px 0 0' }}>위 버튼으로 행사를 등록해보세요</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, status, darkMode, cardBg, borderColor, textColor, subTextColor, inputBorder, inputBg, onEdit, onToggle, onDelete, onEndNow }) {
  const eventTypeLabel = {
    '1+1': '1+1',
    '2+1': '2+1',
    '묶음가': `${event.bundleQty}개 ₩${Number(event.bundlePrice).toLocaleString()}`,
    '퍼센트할인': `${event.discountValue}% 할인`,
    '정액할인': `₩${Number(event.discountValue).toLocaleString()} 할인`,
  }[event.eventType] || event.eventType;

  return (
    <div style={{ background: cardBg, borderRadius: '18px', padding: '16px', border: `1px solid ${borderColor}`, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: '800', color: textColor, margin: '0 0 4px' }}>{event.name}</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ background: darkMode ? '#1e2e24' : '#f0faf5', color: '#00a85e', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px' }}>{event.type}</span>
            <span style={{ background: darkMode ? '#1a2030' : '#e8f0fe', color: '#1a73e8', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '10px' }}>{eventTypeLabel}</span>
          </div>
        </div>
        <span style={{ background: status.bg, color: status.color, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{status.label}</span>
      </div>

      {/* 상품 목록 */}
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '11px', color: subTextColor, margin: '0 0 6px', fontWeight: '600' }}>대상 상품</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {event.products.map(p => (
            <span key={p.id} style={{ background: darkMode ? '#2e2e2e' : '#f8fffe', border: `1px solid ${borderColor}`, color: textColor, fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>{p.name}</span>
          ))}
        </div>
      </div>

      {/* 기간 */}
      <div style={{ background: darkMode ? '#1e1e1e' : '#f8fffe', borderRadius: '10px', padding: '8px 12px', marginBottom: '12px', border: `1px solid ${borderColor}` }}>
        <p style={{ fontSize: '12px', color: subTextColor, margin: 0 }}>
          📅 {event.startDate} ~ {event.endDate}
        </p>
        {event.memo && <p style={{ fontSize: '12px', color: subTextColor, margin: '4px 0 0' }}>📝 {event.memo}</p>}
      </div>

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button onClick={() => onEdit(event)} style={{ padding: '7px 12px', background: darkMode ? '#1a2030' : '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>수정</button>
        <button onClick={() => onToggle(event.id)} style={{ padding: '7px 12px', background: event.isActive ? (darkMode ? '#2a2010' : '#fff3cd') : (darkMode ? '#1e2e24' : '#f0faf5'), color: event.isActive ? '#f0a500' : '#00a85e', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
          {event.isActive ? '비활성화' : '활성화'}
        </button>
        {event.isActive && (
          <button onClick={() => onEndNow(event.id)} style={{ padding: '7px 12px', background: darkMode ? '#2a1010' : '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>즉시 종료</button>
        )}
        <button onClick={() => onDelete(event.id)} style={{ padding: '7px 12px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>삭제</button>
      </div>
    </div>
  );
}

export default EventManager;
