import { useState, useEffect, useMemo, useCallback } from 'react';
import API from '../api';

const PAYMENT_METHODS = ['현금', '카드', '계좌이체'];
const VIEW_OPTIONS = [
  { key: 'daily', label: '일별' },
  { key: 'weekly', label: '주별' },
  { key: 'monthly', label: '월별' },
];

const formatDate = (date) => date.toISOString().slice(0, 10);
const parseAmount = (value) => Number(value || 0);

function SalesManagement({ goBack, darkMode }) {
  const bg = darkMode ? '#1a1a1a' : '#f8f9fa';
  const cardBg = darkMode ? '#2a2a2a' : '#ffffff';
  const textColor = darkMode ? '#f0f0f0' : '#212529';
  const subTextColor = darkMode ? '#a0a0a0' : '#6c757d';
  const borderColor = darkMode ? '#3a3a3a' : '#dee2e6';
  const headerBg = darkMode
    ? 'linear-gradient(135deg, #0d4d2a 0%, #1a5c2a 100%)'
    : 'linear-gradient(135deg, #00c471 0%, #00a85e 100%)';

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ total: 0, count: 0, payment: {}, category: {} });
  const [viewType, setViewType] = useState('daily');
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState(() => formatDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)));
  const [endDate, setEndDate] = useState(() => formatDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [editForm, setEditForm] = useState({ sale_date: '', product_name: '', quantity: '', unit_price: '', total_price: '', payment_method: '현금', category: '', memo: '' });
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ sale_date: formatDate(new Date()), product_name: '', quantity: '', unit_price: '', total_price: '', payment_method: '현금', category: '', memo: '' });
  const [adding, setAdding] = useState(false);

  const filteredSales = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return sales.filter((sale) => {
      if (!lowerQuery) return true;
      return [sale.order_number, sale.orderNumber, sale.description, sale.paymentMethod, sale.payment_method]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(lowerQuery));
    });
  }, [sales, query]);

  const paymentTotals = useMemo(() => {
    return PAYMENT_METHODS.reduce((acc, method) => {
      acc[method] = filteredSales.reduce((sum, sale) => {
        const paymentMethod = sale.payment_method || sale.paymentMethod || '';
        return paymentMethod === method ? sum + parseAmount(sale.amount) : sum;
      }, 0);
      return acc;
    }, {});
  }, [filteredSales]);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get('/sales', { params: { start: startDate, end: endDate } });
      setSales(res.data || []);
    } catch (error) {
      console.error('[SalesManagement] sales fetch failed', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await API.get('/sales/summary', { params: { start: startDate, end: endDate } });
      setSummary(res.data || { total: 0, count: 0, payment: {}, category: {} });
    } catch (error) {
      console.error('[SalesManagement] summary fetch failed', error);
      setSummary({ total: 0, count: 0, payment: {}, category: {} });
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadSales();
    loadSummary();
  }, [loadSales, loadSummary]);

  const exportCsv = () => {
    const rows = [
      ['날짜', '주문번호', '상품', '금액', '결제수단'],
      ...filteredSales.map((sale) => [
        sale.date || sale.createdAt || '',
        sale.order_number || sale.orderNumber || '',
        Array.isArray(sale.items) ? sale.items.map((item) => item.name).join(' / ') : sale.description || sale.product || '',
        parseAmount(sale.amount),
        sale.payment_method || sale.paymentMethod || '',
      ]),
    ];

    const csvContent = rows.map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales-management-${startDate}-${endDate}.csv`;
    link.click();
  };

  const handleDelete = async (saleId) => {
    if (!window.confirm('선택한 매출 기록을 삭제하시겠어요?')) return;
    try {
      await API.delete(`/sales/${saleId}`);
      setSales((prev) => prev.filter((sale) => sale.id !== saleId));
    } catch (error) {
      console.error('[SalesManagement] delete failed', error);
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleEditOpen = (sale) => {
    setEditSale(sale);
    setEditForm({
      sale_date:      (sale.sale_date || '').slice(0, 10),
      product_name:   sale.product_name || '',
      quantity:       sale.quantity ?? '',
      unit_price:     sale.unit_price ?? '',
      total_price:    sale.total_price ?? '',
      payment_method: sale.payment_method || '현금',
      category:       sale.category || '',
      memo:           sale.memo || '',
    });
  };

  const handleEditSave = async () => {
    if (!editSale) return;
    setSaving(true);
    try {
      const payload = {
        sale_date:      editForm.sale_date,
        product_name:   editForm.product_name,
        quantity:       Number(editForm.quantity)    || null,
        unit_price:     Number(editForm.unit_price)  || null,
        total_price:    Number(editForm.total_price) || (Number(editForm.quantity) * Number(editForm.unit_price)) || null,
        payment_method: editForm.payment_method,
        category:       editForm.category,
        memo:           editForm.memo,
      };
      await API.put(`/sales/${editSale.id}`, payload);
      setSales((prev) => prev.map((sale) => (sale.id === editSale.id ? { ...sale, ...payload } : sale)));
      setEditSale(null);
      loadSummary();
    } catch (error) {
      console.error('[SalesManagement] edit failed', error);
      alert('수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!addForm.product_name.trim()) { alert('상품명을 입력해주세요.'); return; }
    setAdding(true);
    try {
      await API.post('/sales', {
        ...addForm,
        quantity:    Number(addForm.quantity)    || null,
        unit_price:  Number(addForm.unit_price)  || null,
        total_price: Number(addForm.total_price) || (Number(addForm.quantity) * Number(addForm.unit_price)) || null,
      });
      setShowAddModal(false);
      setAddForm({ sale_date: formatDate(new Date()), product_name: '', quantity: '', unit_price: '', total_price: '', payment_method: '현금', category: '', memo: '' });
      loadSales();
      loadSummary();
    } catch (error) {
      console.error('[SalesManagement] create failed', error);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', maxWidth: 480, margin: '0 auto', paddingBottom: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: headerBg, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>매출 관리</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>일별/주별/월별 매출 조회</div>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + 수기 등록
        </button>
        <button onClick={exportCsv} style={{ padding: '10px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          CSV
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: subTextColor, fontSize: 12 }}>시작일</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: subTextColor, fontSize: 12 }}>종료일</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {VIEW_OPTIONS.map((option) => (
            <button key={option.key} onClick={() => setViewType(option.key)} style={{ flex: 1, minWidth: 100, padding: '10px 12px', borderRadius: 14, border: 'none', cursor: 'pointer', background: viewType === option.key ? '#00c471' : cardBg, color: viewType === option.key ? 'white' : textColor, boxShadow: viewType === option.key ? '0 8px 18px rgba(0,196,113,0.18)' : 'none' }}>
              {option.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: subTextColor, marginBottom: 8 }}>기간 총 매출</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#00c471' }}>₩{(summary.total || 0).toLocaleString()}</div>
          </div>
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: subTextColor, marginBottom: 8 }}>현금 매출</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: textColor }}>₩{(summary.payment?.['현금'] || paymentTotals['현금'] || 0).toLocaleString()}</div>
          </div>
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: subTextColor, marginBottom: 8 }}>카드 매출</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: textColor }}>₩{(summary.payment?.['카드'] || paymentTotals['카드'] || 0).toLocaleString()}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: subTextColor, marginBottom: 8 }}>계좌이체</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: textColor }}>₩{(summary.payment?.['계좌이체'] || paymentTotals['계좌이체'] || 0).toLocaleString()}</div>
          </div>
          <div style={{ background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, padding: 14 }}>
            <div style={{ fontSize: 11, color: subTextColor, marginBottom: 8 }}>총 매출 건수</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: textColor }}>{filteredSales.length}건</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="주문번호, 상품, 결제수단 검색" style={{ flex: 1, padding: '12px 14px', borderRadius: 16, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
          <button onClick={loadSales} style={{ padding: '12px 14px', borderRadius: 16, border: 'none', background: '#00c471', color: 'white', cursor: 'pointer' }}>새로고침</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: subTextColor }}>기간: {startDate} ~ {endDate}</div>
          <div style={{ fontSize: 12, color: subTextColor }}>조회: {filteredSales.length}건</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 12, color: subTextColor, marginBottom: 4 }}>
            <div style={{ flex: 1 }}>날짜</div>
            <div style={{ width: 70, textAlign: 'right' }}>금액</div>
            <div style={{ width: 90, textAlign: 'center' }}>결제수단</div>
            <div style={{ width: 76, textAlign: 'center' }}>작업</div>
          </div>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: subTextColor }}>불러오는 중...</div>
          ) : filteredSales.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', background: cardBg, borderRadius: 16, border: `1px solid ${borderColor}`, color: subTextColor }}>조회된 매출이 없습니다.</div>
          ) : (
            filteredSales.map((sale) => (
              <div key={sale.id} style={{ background: cardBg, borderRadius: 18, border: `1px solid ${borderColor}`, padding: 14, color: textColor }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 110 }}>
                    <div style={{ fontSize: 12, color: subTextColor, marginBottom: 4 }}>{(sale.sale_date || sale.date || '').slice(0, 10) || '-'}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{sale.product_name || sale.description || '상품명 없음'}</div>
                    <div style={{ fontSize: 12, color: subTextColor, marginTop: 4 }}>{sale.category || ''}</div>
                  </div>
                  <div style={{ width: 70, textAlign: 'right', fontWeight: 700, color: '#00c471' }}>₩{parseAmount(sale.total_price || sale.amount).toLocaleString()}</div>
                  <div style={{ width: 90, textAlign: 'center', fontSize: 12, color: subTextColor }}>{sale.payment_method || sale.paymentMethod || '-'}</div>
                  <div style={{ width: 76, display: 'flex', gap: 6, justifyContent: 'center' }}>
                    <button onClick={() => handleEditOpen(sale)} style={{ flex: 1, borderRadius: 12, border: `1px solid ${darkMode ? '#3a3a3a' : '#dee2e6'}`, background: 'transparent', color: '#00a85e', padding: '8px 0', cursor: 'pointer', fontSize: 12 }}>수정</button>
                    <button onClick={() => handleDelete(sale.id)} style={{ flex: 1, borderRadius: 12, border: 'none', background: '#ff4757', color: 'white', padding: '8px 0', cursor: 'pointer', fontSize: 12 }}>삭제</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }} onClick={() => setShowAddModal(false)}>
          <div style={{ width: '100%', maxWidth: 480, background: cardBg, borderRadius: '24px 24px 0 0', padding: 20, boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: textColor, marginBottom: 16 }}>수기 매출 등록</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ fontSize: 12, color: subTextColor }}>날짜</label>
              <input type="date" value={addForm.sale_date} onChange={(e) => setAddForm((p) => ({ ...p, sale_date: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
              <label style={{ fontSize: 12, color: subTextColor }}>상품명 *</label>
              <input value={addForm.product_name} onChange={(e) => setAddForm((p) => ({ ...p, product_name: e.target.value }))} placeholder="상품명" style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: subTextColor }}>수량</label>
                  <input type="number" value={addForm.quantity} onChange={(e) => setAddForm((p) => ({ ...p, quantity: e.target.value }))} placeholder="0" style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none', marginTop: 6 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: subTextColor }}>단가</label>
                  <input type="number" value={addForm.unit_price} onChange={(e) => setAddForm((p) => ({ ...p, unit_price: e.target.value }))} placeholder="0" style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none', marginTop: 6 }} />
                </div>
              </div>
              <label style={{ fontSize: 12, color: subTextColor }}>합계 (미입력 시 수량×단가 자동)</label>
              <input type="number" value={addForm.total_price} onChange={(e) => setAddForm((p) => ({ ...p, total_price: e.target.value }))} placeholder={addForm.quantity && addForm.unit_price ? String(Number(addForm.quantity) * Number(addForm.unit_price)) : '0'} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
              <label style={{ fontSize: 12, color: subTextColor }}>결제수단</label>
              <select value={addForm.payment_method} onChange={(e) => setAddForm((p) => ({ ...p, payment_method: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <label style={{ fontSize: 12, color: subTextColor }}>카테고리</label>
              <input value={addForm.category} onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))} placeholder="식품, 음료 등" style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
              <label style={{ fontSize: 12, color: subTextColor }}>메모</label>
              <input value={addForm.memo} onChange={(e) => setAddForm((p) => ({ ...p, memo: e.target.value }))} placeholder="메모" style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '14px 16px', borderRadius: 14, border: `1px solid ${borderColor}`, background: 'transparent', color: subTextColor, cursor: 'pointer' }}>취소</button>
              <button onClick={handleCreate} disabled={adding} style={{ flex: 1, padding: '14px 16px', borderRadius: 14, border: 'none', background: adding ? '#888' : '#00c471', color: 'white', cursor: adding ? 'default' : 'pointer' }}>{adding ? '등록 중...' : '등록'}</button>
            </div>
          </div>
        </div>
      )}

      {editSale && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16 }} onClick={() => setEditSale(null)}>
          <div style={{ width: '100%', maxWidth: 480, background: cardBg, borderRadius: '24px 24px 0 0', padding: 20, boxSizing: 'border-box' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: textColor, marginBottom: 16 }}>매출 수정</div>
            <div style={{ display: 'grid', gap: 10 }}>
              <label style={{ fontSize: 12, color: subTextColor }}>날짜</label>
              <input type="date" value={editForm.sale_date} onChange={(e) => setEditForm((p) => ({ ...p, sale_date: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
              <label style={{ fontSize: 12, color: subTextColor }}>상품명</label>
              <input value={editForm.product_name} onChange={(e) => setEditForm((p) => ({ ...p, product_name: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: subTextColor }}>수량</label>
                  <input type="number" value={editForm.quantity} onChange={(e) => setEditForm((p) => ({ ...p, quantity: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none', marginTop: 6 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: subTextColor }}>단가</label>
                  <input type="number" value={editForm.unit_price} onChange={(e) => setEditForm((p) => ({ ...p, unit_price: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none', marginTop: 6 }} />
                </div>
              </div>
              <label style={{ fontSize: 12, color: subTextColor }}>합계</label>
              <input type="number" value={editForm.total_price} onChange={(e) => setEditForm((p) => ({ ...p, total_price: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
              <label style={{ fontSize: 12, color: subTextColor }}>결제수단</label>
              <select value={editForm.payment_method} onChange={(e) => setEditForm((p) => ({ ...p, payment_method: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }}>
                {PAYMENT_METHODS.map((method) => <option key={method} value={method}>{method}</option>)}
              </select>
              <label style={{ fontSize: 12, color: subTextColor }}>카테고리</label>
              <input value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
              <label style={{ fontSize: 12, color: subTextColor }}>메모</label>
              <input value={editForm.memo} onChange={(e) => setEditForm((p) => ({ ...p, memo: e.target.value }))} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, border: `1px solid ${borderColor}`, background: cardBg, color: textColor, outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button onClick={() => setEditSale(null)} style={{ flex: 1, padding: '14px 16px', borderRadius: 14, border: `1px solid ${borderColor}`, background: 'transparent', color: subTextColor, cursor: 'pointer' }}>취소</button>
              <button onClick={handleEditSave} disabled={saving} style={{ flex: 1, padding: '14px 16px', borderRadius: 14, border: 'none', background: saving ? '#888' : '#00c471', color: 'white', cursor: saving ? 'default' : 'pointer' }}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesManagement;
