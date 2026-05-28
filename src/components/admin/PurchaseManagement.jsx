import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '../layout/Sidebar';

const sg = '#00c471';
const sgd = '#009a58';
const sgl = '#e6f9f1';

const LIGHT = { bg: '#f5f5f3', cardBg: '#ffffff', cardBorder: '#e0e0e0', metricBg: '#efefed', textPrimary: '#1a1a1a', textSecondary: '#444444', textTertiary: '#777777', topbarBg: '#ffffff', topbarBorder: '#e0e0e0', theadBg: '#f0f0ee', inputBg: '#ffffff', inputBorder: '#dddddd', thumbBg: '#efefed' };
const DARK  = { bg: '#111111', cardBg: '#1e1e1e', cardBorder: '#2e2e2e', metricBg: '#252525', textPrimary: '#f0f0f0', textSecondary: '#bbbbbb', textTertiary: '#777777', topbarBg: '#1a1a1a', topbarBorder: '#2e2e2e', theadBg: '#252525', inputBg: '#252525', inputBorder: '#3a3a3a', thumbBg: '#333333' };

function DarkToggle({ dark, setDark }) {
  return (
    <div onClick={() => setDark(!dark)} style={{ width: 42, height: 24, borderRadius: 12, background: dark ? sg : '#ccc', cursor: 'pointer', position: 'relative', transition: 'background .25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: dark ? 21 : 3, transition: 'left .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
        {dark ? '🌙' : '☀️'}
      </div>
    </div>
  );
}

function makeStyles(c) {
  return {
    topbar: { background: c.topbarBg, borderBottom: `1px solid ${c.topbarBorder}`, paddingLeft: 24, paddingRight: 24, paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    topbarTitle: { fontSize: 15, fontWeight: 600, color: c.textPrimary },
    content: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
    sumCard: { background: c.metricBg, borderRadius: 8, padding: '10px 14px' },
    sumLabel: { fontSize: 10, color: c.textSecondary, marginBottom: 4 },
    input: { padding: '7px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, outline: 'none', background: c.inputBg, color: c.textPrimary },
    select: { padding: '7px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, background: c.inputBg, color: c.textPrimary, outline: 'none', cursor: 'pointer' },
    tableCard: { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: c.textSecondary, borderBottom: `1px solid ${c.cardBorder}` },
    td: { padding: '10px 14px', borderBottom: `1px solid ${c.cardBorder}`, verticalAlign: 'middle', color: c.textPrimary },
    pill: { display: 'inline-block', fontSize: 10, padding: '2px 9px', borderRadius: 10, fontWeight: 500 },
    actionBtn: { background: 'none', border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: c.textSecondary, cursor: 'pointer' },
    btn: { padding: '6px 14px', borderRadius: 8, border: `1px solid ${c.cardBorder}`, background: c.metricBg, fontSize: 12, cursor: 'pointer', color: c.textPrimary },
    btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: sg, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
    btnDanger: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#e24b4a', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' },
    modal: { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 24, width: 560, maxHeight: '90vh', overflowY: 'auto', margin: 'auto' },
    formLabel: { fontSize: 12, color: c.textSecondary, marginBottom: 5 },
    formInput: { width: '100%', padding: '8px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: c.inputBg, color: c.textPrimary },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
    divider: { height: 1, background: c.cardBorder, margin: '16px 0' },
  };
}

// ✅ 탭 목록 — 반품 추가
const TABS = [
  { key: 'inspect',    label: '🔍 검수 입고',  desc: '납품 바코드 스캔' },
  { key: 'suppliers',  label: '🏢 거래처 관리', desc: '거래처 목록' },
  { key: 'history',    label: '📋 매입 내역',   desc: '날짜별 기록' },
  { key: 'returns',    label: '↩ 반품 관리',    desc: '반품 처리' },
  { key: 'settlement', label: '💰 정산 관리',   desc: '미수금/외상' },
];

// =============================================
// 검수 입고 탭
// =============================================
function InspectTab({ c, s, products, setProducts, suppliers, setPurchaseHistory }) {
  const [scanMode, setScanMode] = useState('barcode');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [scanList, setScanList] = useState([]);
  const [scanMsg, setScanMsg] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [memo, setMemo] = useState('');
  const [payType, setPayType] = useState('현금');
  const barcodeInputRef = useRef(null);

  const findByBarcode = useCallback((code) => {
    if (!code.trim()) return null;
    return products.find(p => p.barcode === code.trim() || String(p.id) === code.trim());
  }, [products]);

  const findByName = (keyword) => {
    if (!keyword.trim()) return [];
    return products.filter(p => p.name.includes(keyword));
  };

  const addToList = useCallback((product) => {
    setScanList(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        setScanMsg(`✅ ${product.name} — 누적 ${exists.qty + 1}개`);
        return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      } else {
        setScanMsg(`✅ ${product.name} — 추가됨`);
        return [...prev, { id: product.id, name: product.name, barcode: product.barcode || '-', price: product.price, costPrice: 0, qty: 1 }];
      }
    });
    setTimeout(() => setScanMsg(''), 2000);
  }, []);

  const handleBarcodeEnter = (e) => {
    if (e.key === 'Enter') {
      const code = barcodeInput.trim();
      if (!code) return;
      const found = findByBarcode(code);
      if (found) { addToList(found); }
      else { setScanMsg(`❌ '${code}' — 등록되지 않은 바코드예요`); setTimeout(() => setScanMsg(''), 2500); }
      setBarcodeInput('');
    }
  };

  useEffect(() => {
    if (scanMode === 'barcode') setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, [scanMode]);

  const updateQty = (id, val) => { const n = parseInt(val); if (isNaN(n) || n < 0) return; setScanList(prev => prev.map(i => i.id === id ? { ...i, qty: n } : i)); };
  const updateCostPrice = (id, val) => { const n = parseInt(val); if (isNaN(n) || n < 0) return; setScanList(prev => prev.map(i => i.id === id ? { ...i, costPrice: n } : i)); };
  const removeFromList = (id) => setScanList(prev => prev.filter(i => i.id !== id));
  const totalAmount = scanList.reduce((sum, i) => sum + i.costPrice * i.qty, 0);

  const saveInspect = () => {
    if (scanList.length === 0) return alert('검수 상품이 없어요');
    if (!selectedSupplier) return alert('거래처를 선택해주세요');
    if (!window.confirm(`총 ${scanList.length}개 품목을 입고 처리하시겠어요?`)) return;
    setProducts(prev => prev.map(p => {
      const item = scanList.find(i => i.id === p.id);
      if (item) return { ...p, stock: (p.stock ?? 0) + item.qty, lastIn: new Date().toLocaleDateString('ko-KR'), status: '판매중', isSoldOut: false };
      return p;
    }));
    const record = {
      id: Date.now(), date: new Date().toLocaleString('ko-KR'),
      supplier: selectedSupplier, items: [...scanList],
      totalAmount, payType, memo,
      status: payType === '외상' ? '미수금' : '완료',
    };
    setPurchaseHistory(prev => [record, ...prev]);
    alert(`✅ 입고 완료! ${scanList.length}개 품목, 총 ${totalAmount.toLocaleString()}원`);
    setScanList([]); setMemo(''); setBarcodeInput('');
  };

  const manualResults = manualSearch.length >= 1 ? findByName(manualSearch) : [];

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8 }}>거래처 선택 *</div>
          <select style={{ ...s.formInput }} value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
            <option value="">거래처 선택...</option>
            {suppliers.map(s2 => <option key={s2.id} value={s2.name}>{s2.name}</option>)}
          </select>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: c.textSecondary, marginBottom: 4 }}>결제 방식</div>
              <select style={{ ...s.formInput, fontSize: 12 }} value={payType} onChange={e => setPayType(e.target.value)}>
                <option>현금</option><option>계좌이체</option><option>외상</option><option>카드</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: c.textSecondary, marginBottom: 4 }}>메모</div>
              <input style={{ ...s.formInput, fontSize: 12 }} placeholder="메모 입력..." value={memo} onChange={e => setMemo(e.target.value)} />
            </div>
          </div>
        </div>
        <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, overflow: 'hidden', flex: 1 }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${c.cardBorder}` }}>
            {[{ key: 'barcode', label: '📡 스캐너' }, { key: 'manual', label: '🔍 수동검색' }].map(tab => (
              <div key={tab.key} onClick={() => setScanMode(tab.key)} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: scanMode === tab.key ? 600 : 400, color: scanMode === tab.key ? sgd : c.textSecondary, borderBottom: scanMode === tab.key ? `2px solid ${sg}` : '2px solid transparent', background: scanMode === tab.key ? sgl : 'transparent' }}>
                {tab.label}
              </div>
            ))}
          </div>
          <div style={{ padding: 14 }}>
            {scanMode === 'barcode' && (
              <div>
                <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 6 }}>바코드 스캔 (Enter)</div>
                <input ref={barcodeInputRef} style={{ ...s.formInput, fontSize: 15, padding: '10px 12px', border: `2px solid ${sg}` }} placeholder="바코드를 스캔하세요..." value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeEnter} autoFocus />
                {scanMsg && <div style={{ padding: '8px 12px', borderRadius: 8, background: scanMsg.startsWith('✅') ? sgl : '#fcebeb', color: scanMsg.startsWith('✅') ? sgd : '#a32d2d', fontSize: 12, fontWeight: 500, marginTop: 8 }}>{scanMsg}</div>}
                <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 8 }}>블루투스 스캐너 연결 후 바코드를 스캔해요</div>
              </div>
            )}
            {scanMode === 'manual' && (
              <div>
                <input style={{ ...s.formInput, marginBottom: 8 }} placeholder="상품명 검색..." value={manualSearch} onChange={e => setManualSearch(e.target.value)} autoFocus />
                {manualResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
                    {manualResults.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: c.metricBg, borderRadius: 8 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: c.textTertiary }}>재고 {p.stock ?? 0}개</div>
                        </div>
                        <button style={{ ...s.actionBtn, borderColor: sg, color: sgd, fontSize: 11 }} onClick={() => { addToList(p); setManualSearch(''); }}>+ 추가</button>
                      </div>
                    ))}
                  </div>
                )}
                {scanMsg && <div style={{ padding: '8px 12px', borderRadius: 8, background: scanMsg.startsWith('✅') ? sgl : '#fcebeb', color: scanMsg.startsWith('✅') ? sgd : '#a32d2d', fontSize: 12, fontWeight: 500, marginTop: 8 }}>{scanMsg}</div>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>검수 목록 <span style={{ fontSize: 12, color: c.textTertiary, fontWeight: 400 }}>({scanList.length}개 품목)</span></div>
          {scanList.length > 0 && <button style={{ ...s.actionBtn, color: '#a32d2d', borderColor: '#f09595', fontSize: 11 }} onClick={() => { if (window.confirm('목록을 초기화할까요?')) setScanList([]); }}>초기화</button>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {scanList.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 60, color: c.textTertiary }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.textSecondary, marginBottom: 4 }}>검수 상품이 없어요</div>
              <div style={{ fontSize: 12 }}>왼쪽에서 바코드를 스캔하거나 검색해서 추가해요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 60px 30px', gap: 8, padding: '4px 8px', fontSize: 10, color: c.textTertiary, fontWeight: 600 }}>
                <div>상품명</div><div>매입단가(원)</div><div>수량</div><div>소계</div><div></div>
              </div>
              {scanList.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 60px 30px', gap: 8, alignItems: 'center', padding: '8px', background: c.metricBg, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: c.textTertiary }}>{item.barcode}</div>
                  </div>
                  <input type="number" value={item.costPrice} onChange={e => updateCostPrice(item.id, e.target.value)} style={{ width: '100%', padding: '4px 6px', border: `1px solid ${c.inputBorder}`, borderRadius: 6, fontSize: 12, background: c.inputBg, color: c.textPrimary, outline: 'none', boxSizing: 'border-box' }} placeholder="단가" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${c.cardBorder}`, background: c.cardBg, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textPrimary }}>−</button>
                    <input type="number" value={item.qty} onChange={e => updateQty(item.id, e.target.value)} style={{ width: 36, textAlign: 'center', padding: '3px 4px', border: `1px solid ${c.inputBorder}`, borderRadius: 4, fontSize: 12, background: c.inputBg, color: c.textPrimary, outline: 'none' }} />
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${c.cardBorder}`, background: c.cardBg, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textPrimary }}>+</button>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: c.textPrimary }}>{(item.costPrice * item.qty).toLocaleString()}</div>
                  <button onClick={() => removeFromList(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: c.textTertiary }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        {scanList.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.cardBorder}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: c.textSecondary }}>총 매입 금액</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: c.textPrimary }}>₩{totalAmount.toLocaleString()}</div>
              {payType === '외상' && <div style={{ fontSize: 10, color: '#a32d2d', marginTop: 2 }}>⚠ 외상 — 미수금으로 기록돼요</div>}
            </div>
            <button style={s.btnPrimary} onClick={saveInspect}>✅ 입고 처리</button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// 거래처 관리 탭
// =============================================
function SuppliersTab({ c, s, suppliers, setSuppliers }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', address: '', memo: '' });

  const openAdd = () => { setEditing(null); setForm({ name: '', contact: '', phone: '', email: '', address: '', memo: '' }); setShowModal(true); };
  const openEdit = (s2) => { setEditing(s2.id); setForm({ name: s2.name, contact: s2.contact, phone: s2.phone, email: s2.email, address: s2.address, memo: s2.memo }); setShowModal(true); };

  const save = () => {
    if (!form.name.trim()) return alert('거래처명을 입력해주세요');
    if (editing) {
      setSuppliers(prev => prev.map(s2 => s2.id === editing ? { ...s2, ...form } : s2));
    } else {
      setSuppliers(prev => [...prev, { id: Date.now(), ...form, createdAt: new Date().toLocaleDateString('ko-KR') }]);
    }
    setShowModal(false);
  };

  const del = (id) => { if (window.confirm('삭제하시겠어요?')) setSuppliers(prev => prev.filter(s2 => s2.id !== id)); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
        <button style={s.btnPrimary} onClick={openAdd}>+ 거래처 등록</button>
      </div>
      {suppliers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textTertiary }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🏢</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textSecondary }}>등록된 거래처가 없어요</div>
        </div>
      ) : (
        <div style={s.tableCard}>
          <table style={s.table}>
            <thead style={{ background: c.theadBg }}>
              <tr>{['거래처명', '담당자', '연락처', '이메일', '주소', '관리'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {suppliers.map(s2 => (
                <tr key={s2.id}>
                  <td style={{ ...s.td, fontWeight: 600 }}>{s2.name}</td>
                  <td style={{ ...s.td, color: c.textSecondary }}>{s2.contact || '-'}</td>
                  <td style={{ ...s.td, color: c.textSecondary }}>{s2.phone || '-'}</td>
                  <td style={{ ...s.td, color: c.textTertiary, fontSize: 11 }}>{s2.email || '-'}</td>
                  <td style={{ ...s.td, color: c.textTertiary, fontSize: 11 }}>{s2.address || '-'}</td>
                  <td style={s.td}>
                    <button style={s.actionBtn} onClick={() => openEdit(s2)}>수정</button>
                    <button style={{ ...s.actionBtn, borderColor: '#f09595', color: '#a32d2d', marginLeft: 4 }} onClick={() => del(s2.id)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showModal && (
        <div style={s.modalBg} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>{editing ? '거래처 수정' : '거래처 등록'}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}><div style={s.formLabel}>거래처명 *</div><input style={s.formInput} placeholder="예: (주)신선유통" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div style={s.row2}>
              <div><div style={s.formLabel}>담당자</div><input style={s.formInput} placeholder="홍길동" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} /></div>
              <div><div style={s.formLabel}>연락처</div><input style={s.formInput} placeholder="010-0000-0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><div style={s.formLabel}>이메일</div><input style={s.formInput} placeholder="example@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div style={{ marginBottom: 12 }}><div style={s.formLabel}>주소</div><input style={s.formInput} placeholder="서울시 강남구..." value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} /></div>
            <div style={{ marginBottom: 18 }}><div style={s.formLabel}>메모</div><textarea style={{ ...s.formInput, height: 60, resize: 'vertical' }} placeholder="특이사항, 거래 조건 등..." value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn} onClick={() => setShowModal(false)}>취소</button>
              <button style={s.btnPrimary} onClick={save}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// 매입 내역 탭
// =============================================
function HistoryTab({ c, s, purchaseHistory, suppliers }) {
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const filtered = purchaseHistory.filter(r => {
    if (supplierFilter && r.supplier !== supplierFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (search && !r.supplier.includes(search) && !r.memo?.includes(search)) return false;
    return true;
  });

  const totalAmount = filtered.reduce((sum, r) => sum + r.totalAmount, 0);
  const unpaidAmount = filtered.filter(r => r.status === '미수금').reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '총 매입 건수', val: `${filtered.length}건`, color: c.textPrimary },
          { label: '총 매입 금액', val: `₩${totalAmount.toLocaleString()}`, color: sgd },
          { label: '미수금', val: `₩${unpaidAmount.toLocaleString()}`, color: unpaidAmount > 0 ? '#a32d2d' : c.textTertiary },
        ].map(card => (
          <div key={card.label} style={s.sumCard}>
            <div style={s.sumLabel}>{card.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: card.color }}>{card.val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <input style={{ ...s.input, flex: 1 }} placeholder="거래처, 메모 검색..." value={search} onChange={e => setSearch(e.target.value)} />
        <select style={s.select} value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="">전체 거래처</option>
          {suppliers.map(s2 => <option key={s2.id} value={s2.name}>{s2.name}</option>)}
        </select>
        <select style={s.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">전체 상태</option>
          <option value="완료">완료</option>
          <option value="미수금">미수금</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textTertiary }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textSecondary }}>매입 내역이 없어요</div>
        </div>
      ) : (
        <div style={s.tableCard}>
          <table style={s.table}>
            <thead style={{ background: c.theadBg }}>
              <tr>{['날짜', '거래처', '품목수', '매입금액', '결제방식', '상태', '상세'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ ...s.td, fontSize: 11, color: c.textTertiary }}>{r.date}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{r.supplier}</td>
                  <td style={{ ...s.td, color: c.textSecondary }}>{r.items.length}개</td>
                  <td style={{ ...s.td, fontWeight: 600, color: c.textPrimary }}>₩{r.totalAmount.toLocaleString()}</td>
                  <td style={{ ...s.td, color: c.textSecondary }}>{r.payType}</td>
                  <td style={s.td}>
                    <span style={{ ...s.pill, background: r.status === '완료' ? sgl : '#fcebeb', color: r.status === '완료' ? sgd : '#a32d2d' }}>{r.status}</span>
                  </td>
                  <td style={s.td}>
                    <button style={s.actionBtn} onClick={() => setSelectedRecord(r)}>상세</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {selectedRecord && (
        <div style={s.modalBg} onClick={() => setSelectedRecord(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>매입 상세</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setSelectedRecord(null)}>✕</button>
            </div>
            <div style={{ background: c.metricBg, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12, lineHeight: 1.8 }}>
              <div><span style={{ color: c.textSecondary }}>날짜:</span> <strong style={{ color: c.textPrimary }}>{selectedRecord.date}</strong></div>
              <div><span style={{ color: c.textSecondary }}>거래처:</span> <strong style={{ color: c.textPrimary }}>{selectedRecord.supplier}</strong></div>
              <div><span style={{ color: c.textSecondary }}>결제방식:</span> <strong style={{ color: c.textPrimary }}>{selectedRecord.payType}</strong></div>
              <div><span style={{ color: c.textSecondary }}>상태:</span> <span style={{ color: selectedRecord.status === '완료' ? sgd : '#a32d2d', fontWeight: 600 }}>{selectedRecord.status}</span></div>
              {selectedRecord.memo && <div><span style={{ color: c.textSecondary }}>메모:</span> {selectedRecord.memo}</div>}
            </div>
            <div style={s.tableCard}>
              <table style={s.table}>
                <thead style={{ background: c.theadBg }}>
                  <tr>{['상품명', '매입단가', '수량', '소계'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {selectedRecord.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={s.td}>{item.name}</td>
                      <td style={s.td}>₩{item.costPrice.toLocaleString()}</td>
                      <td style={s.td}>{item.qty}개</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>₩{(item.costPrice * item.qty).toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ background: c.metricBg }}>
                    <td colSpan={3} style={{ ...s.td, fontWeight: 700, textAlign: 'right' }}>합계</td>
                    <td style={{ ...s.td, fontWeight: 700, color: sgd, fontSize: 14 }}>₩{selectedRecord.totalAmount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// ✅ 반품 관리 탭 — 신규
// =============================================
function ReturnsTab({ c, s, products, setProducts, purchaseHistory, suppliers, setReturnHistory, returnHistory }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('불량품');
  const [returnMemo, setReturnMemo] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  // 매입 내역에서 반품 가능한 것만 (완료 또는 미수금)
  const availableRecords = purchaseHistory.filter(r =>
    !supplierFilter || r.supplier === supplierFilter
  );

  const openReturn = (record) => {
    setSelectedRecord(record);
    setReturnItems(record.items.map(i => ({ ...i, returnQty: 0 })));
    setReturnReason('불량품');
    setReturnMemo('');
    setShowModal(true);
  };

  const updateReturnQty = (id, val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    setReturnItems(prev => prev.map(i => {
      if (i.id === id) {
        const max = i.qty;
        return { ...i, returnQty: Math.min(n, max) };
      }
      return i;
    }));
  };

  const totalReturnAmount = returnItems.reduce((sum, i) => sum + i.costPrice * i.returnQty, 0);

  const saveReturn = () => {
    const hasReturn = returnItems.some(i => i.returnQty > 0);
    if (!hasReturn) return alert('반품 수량을 입력해주세요');
    if (!window.confirm(`반품 처리하시겠어요? 총 ₩${totalReturnAmount.toLocaleString()} 반품됩니다.`)) return;

    // 재고 차감
    setProducts(prev => prev.map(p => {
      const item = returnItems.find(i => i.id === p.id && i.returnQty > 0);
      if (item) return { ...p, stock: Math.max(0, (p.stock ?? 0) - item.returnQty) };
      return p;
    }));

    // 반품 내역 저장
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString('ko-KR'),
      supplier: selectedRecord.supplier,
      originalId: selectedRecord.id,
      items: returnItems.filter(i => i.returnQty > 0).map(i => ({ ...i, qty: i.returnQty })),
      totalAmount: totalReturnAmount,
      reason: returnReason,
      memo: returnMemo,
      status: '반품완료',
    };
    setReturnHistory(prev => [record, ...prev]);

    alert(`✅ 반품 완료! ₩${totalReturnAmount.toLocaleString()} 반품 처리됐어요.`);
    setShowModal(false);
  };

  return (
    <div>
      {/* 반품 내역 요약 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: '총 반품 건수', val: `${returnHistory.length}건`, color: c.textPrimary },
          { label: '총 반품 금액', val: `₩${returnHistory.reduce((s, r) => s + r.totalAmount, 0).toLocaleString()}`, color: '#e24b4a' },
          { label: '이번 달 반품', val: `${returnHistory.filter(r => r.date.includes(new Date().toLocaleDateString('ko-KR').slice(0, 7))).length}건`, color: c.textSecondary },
        ].map(card => (
          <div key={card.label} style={s.sumCard}>
            <div style={s.sumLabel}>{card.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: card.color }}>{card.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        {/* 왼쪽 — 매입 내역에서 반품 선택 */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>매입 내역에서 반품 선택</div>
            <select style={{ ...s.select, marginLeft: 'auto' }} value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
              <option value="">전체 거래처</option>
              {suppliers.map(s2 => <option key={s2.id} value={s2.name}>{s2.name}</option>)}
            </select>
          </div>
          {availableRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: c.textTertiary }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13, color: c.textSecondary }}>매입 내역이 없어요</div>
            </div>
          ) : (
            <div style={s.tableCard}>
              <table style={s.table}>
                <thead style={{ background: c.theadBg }}>
                  <tr>{['날짜', '거래처', '품목수', '매입금액', '반품'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {availableRecords.map(r => (
                    <tr key={r.id}>
                      <td style={{ ...s.td, fontSize: 11, color: c.textTertiary }}>{r.date}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{r.supplier}</td>
                      <td style={{ ...s.td, color: c.textSecondary }}>{r.items.length}개</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>₩{r.totalAmount.toLocaleString()}</td>
                      <td style={s.td}>
                        <button style={{ ...s.btnDanger, padding: '4px 10px', fontSize: 11 }} onClick={() => openReturn(r)}>
                          반품 처리
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 오른쪽 — 반품 완료 내역 */}
        <div style={{ width: 340, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>반품 완료 내역</div>
          {returnHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: c.textTertiary, background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>↩</div>
              <div style={{ fontSize: 12, color: c.textSecondary }}>반품 내역이 없어요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {returnHistory.map(r => (
                <div key={r.id} style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 10, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{r.supplier}</span>
                    <span style={{ ...s.pill, background: '#fff3f3', color: '#a32d2d' }}>반품완료</span>
                  </div>
                  <div style={{ fontSize: 11, color: c.textTertiary, marginBottom: 4 }}>{r.date}</div>
                  <div style={{ fontSize: 11, color: c.textSecondary, marginBottom: 4 }}>사유: {r.reason}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e24b4a' }}>-₩{r.totalAmount.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: c.textTertiary, marginTop: 4 }}>
                    {r.items.map(i => `${i.name} ${i.qty}개`).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 반품 처리 모달 */}
      {showModal && selectedRecord && (
        <div style={s.modalBg} onClick={() => setShowModal(false)}>
          <div style={{ ...s.modal, width: 620 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>↩ 반품 처리</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* 원본 매입 정보 */}
            <div style={{ background: c.metricBg, borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, lineHeight: 1.8 }}>
              <div><span style={{ color: c.textSecondary }}>거래처:</span> <strong style={{ color: c.textPrimary }}>{selectedRecord.supplier}</strong></div>
              <div><span style={{ color: c.textSecondary }}>매입일:</span> <span style={{ color: c.textPrimary }}>{selectedRecord.date}</span></div>
            </div>

            {/* 반품 사유 */}
            <div style={s.row2}>
              <div>
                <div style={s.formLabel}>반품 사유 *</div>
                <select style={s.formInput} value={returnReason} onChange={e => setReturnReason(e.target.value)}>
                  <option>불량품</option>
                  <option>오배송</option>
                  <option>유통기한 초과</option>
                  <option>파손</option>
                  <option>주문 취소</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <div style={s.formLabel}>메모</div>
                <input style={s.formInput} placeholder="추가 메모..." value={returnMemo} onChange={e => setReturnMemo(e.target.value)} />
              </div>
            </div>

            {/* 반품 수량 입력 */}
            <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8 }}>반품할 수량 입력 (최대: 매입 수량)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, maxHeight: 260, overflowY: 'auto' }}>
              {returnItems.map(item => (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: 8, alignItems: 'center', padding: '8px 10px', background: c.metricBg, borderRadius: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: c.textTertiary }}>매입 {item.qty}개 · ₩{item.costPrice.toLocaleString()}/개</div>
                  </div>
                  <div style={{ fontSize: 11, color: c.textSecondary, textAlign: 'center' }}>최대 {item.qty}개</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <button onClick={() => updateReturnQty(item.id, item.returnQty - 1)} style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${c.cardBorder}`, background: c.cardBg, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textPrimary }}>−</button>
                    <input type="number" value={item.returnQty} onChange={e => updateReturnQty(item.id, e.target.value)} style={{ width: 32, textAlign: 'center', padding: '2px', border: `1px solid ${c.inputBorder}`, borderRadius: 4, fontSize: 12, background: item.returnQty > 0 ? '#fff3f3' : c.inputBg, color: item.returnQty > 0 ? '#a32d2d' : c.textPrimary, outline: 'none' }} />
                    <button onClick={() => updateReturnQty(item.id, item.returnQty + 1)} style={{ width: 20, height: 20, borderRadius: 4, border: `1px solid ${c.cardBorder}`, background: c.cardBg, cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textPrimary }}>+</button>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: item.returnQty > 0 ? '#e24b4a' : c.textTertiary, textAlign: 'right' }}>
                    {item.returnQty > 0 ? `-₩${(item.costPrice * item.returnQty).toLocaleString()}` : '-'}
                  </div>
                </div>
              ))}
            </div>

            {/* 합계 + 처리 버튼 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 12, borderTop: `1px solid ${c.cardBorder}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: c.textSecondary }}>총 반품 금액</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: totalReturnAmount > 0 ? '#e24b4a' : c.textTertiary }}>
                  {totalReturnAmount > 0 ? `-₩${totalReturnAmount.toLocaleString()}` : '₩0'}
                </div>
              </div>
              <button style={s.btn} onClick={() => setShowModal(false)}>취소</button>
              <button style={s.btnDanger} onClick={saveReturn}>↩ 반품 처리</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// 정산 관리 탭
// =============================================
function SettlementTab({ c, s, purchaseHistory, setPurchaseHistory, suppliers }) {
  const [supplierFilter, setSupplierFilter] = useState('');

  const unpaid = purchaseHistory.filter(r => r.status === '미수금');
  const filtered = unpaid.filter(r => !supplierFilter || r.supplier === supplierFilter);

  const markAsPaid = (id) => {
    if (window.confirm('이 항목을 완료 처리하시겠어요?')) {
      setPurchaseHistory(prev => prev.map(r => r.id === id ? { ...r, status: '완료', paidAt: new Date().toLocaleString('ko-KR') } : r));
    }
  };

  const totalUnpaid = filtered.reduce((sum, r) => sum + r.totalAmount, 0);

  const bySupplier = {};
  unpaid.forEach(r => {
    if (!bySupplier[r.supplier]) bySupplier[r.supplier] = 0;
    bySupplier[r.supplier] += r.totalAmount;
  });

  return (
    <div>
      {Object.keys(bySupplier).length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {Object.entries(bySupplier).map(([name, amount]) => (
            <div key={name} style={{ background: '#fff3f3', border: '1px solid #f09595', borderRadius: 10, padding: '10px 16px', minWidth: 140 }}>
              <div style={{ fontSize: 11, color: '#a32d2d', marginBottom: 4 }}>{name}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#a32d2d' }}>₩{amount.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: c.textPrimary }}>
          미수금 <span style={{ color: '#a32d2d' }}>₩{totalUnpaid.toLocaleString()}</span>
        </div>
        <select style={s.select} value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}>
          <option value="">전체 거래처</option>
          {suppliers.map(s2 => <option key={s2.id} value={s2.name}>{s2.name}</option>)}
        </select>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: c.textTertiary }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: sgd }}>미수금이 없어요!</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>모든 매입 대금이 정산됐어요</div>
        </div>
      ) : (
        <div style={s.tableCard}>
          <table style={s.table}>
            <thead style={{ background: c.theadBg }}>
              <tr>{['날짜', '거래처', '품목수', '미수금액', '결제방식', '처리'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ ...s.td, fontSize: 11, color: c.textTertiary }}>{r.date}</td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{r.supplier}</td>
                  <td style={{ ...s.td, color: c.textSecondary }}>{r.items.length}개</td>
                  <td style={{ ...s.td, fontWeight: 700, color: '#a32d2d' }}>₩{r.totalAmount.toLocaleString()}</td>
                  <td style={{ ...s.td, color: c.textSecondary }}>{r.payType}</td>
                  <td style={s.td}>
                    <button style={{ ...s.btnPrimary, padding: '4px 10px', fontSize: 11 }} onClick={() => markAsPaid(r.id)}>완료 처리</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================
// PurchaseManagement — 메인
// =============================================
export default function PurchaseManagement({ setPage, dark, setDark, products, setProducts, user }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);

  const [activeTab, setActiveTab] = useState('inspect');
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: '(주)신선유통', contact: '김유통', phone: '010-1234-5678', email: 'fresh@dist.com', address: '서울시 강남구', memo: '', createdAt: '2026-01-01' },
    { id: 2, name: '동신식품', contact: '이식품', phone: '010-9876-5432', email: 'ds@food.com', address: '인천시 계양구', memo: '주 2회 납품', createdAt: '2026-01-15' },
  ]);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]); // ✅ 반품 내역

  const totalPurchase = purchaseHistory.reduce((sum, r) => sum + r.totalAmount, 0);
  const unpaidCount = purchaseHistory.filter(r => r.status === '미수금').length;
  const totalReturn = returnHistory.reduce((sum, r) => sum + r.totalAmount, 0); // ✅ 총 반품액

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC_purchase" setPage={setPage} dark={dark} user={user} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>🚚 검수 매입 관리</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {unpaidCount > 0 && (
              <div style={{ fontSize: 12, color: '#a32d2d', background: '#fff3f3', border: '1px solid #f09595', borderRadius: 8, padding: '4px 10px', fontWeight: 600 }}>
                미수금 {unpaidCount}건
              </div>
            )}
            <DarkToggle dark={dark} setDark={setDark} />
          </div>
        </div>

        {/* ✅ 요약 카드 — 반품액 추가 */}
        <div style={{ padding: '12px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {[
            { label: '거래처 수', val: `${suppliers.length}개`, color: c.textPrimary },
            { label: '총 매입 건수', val: `${purchaseHistory.length}건`, color: c.textPrimary },
            { label: '총 매입 금액', val: `₩${totalPurchase.toLocaleString()}`, color: sgd },
            { label: '총 반품 금액', val: `₩${totalReturn.toLocaleString()}`, color: totalReturn > 0 ? '#e24b4a' : c.textTertiary },
            { label: '미수금 건수', val: `${unpaidCount}건`, color: unpaidCount > 0 ? '#a32d2d' : c.textTertiary },
          ].map(card => (
            <div key={card.label} style={s.sumCard}>
              <div style={s.sumLabel}>{card.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: card.color }}>{card.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', borderBottom: `1px solid ${c.cardBorder}`, padding: '0 24px', marginTop: 12, background: c.topbarBg }}>
          {TABS.map(tab => (
            <div key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400, color: activeTab === tab.key ? sgd : c.textSecondary, borderBottom: activeTab === tab.key ? `2px solid ${sg}` : '2px solid transparent', marginBottom: -1, whiteSpace: 'nowrap' }}>
              {tab.label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {activeTab === 'inspect' && (
            <InspectTab c={c} s={s} products={products} setProducts={setProducts} suppliers={suppliers} setPurchaseHistory={setPurchaseHistory} />
          )}
          {activeTab === 'suppliers' && (
            <SuppliersTab c={c} s={s} suppliers={suppliers} setSuppliers={setSuppliers} />
          )}
          {activeTab === 'history' && (
            <HistoryTab c={c} s={s} purchaseHistory={purchaseHistory} suppliers={suppliers} />
          )}
          {/* ✅ 반품 탭 */}
          {activeTab === 'returns' && (
            <ReturnsTab
              c={c} s={s}
              products={products} setProducts={setProducts}
              purchaseHistory={purchaseHistory}
              suppliers={suppliers}
              returnHistory={returnHistory}
              setReturnHistory={setReturnHistory}
            />
          )}
          {activeTab === 'settlement' && (
            <SettlementTab c={c} s={s} purchaseHistory={purchaseHistory} setPurchaseHistory={setPurchaseHistory} suppliers={suppliers} />
          )}
        </div>
      </div>
    </div>
  );
}
