import { useState } from 'react';
import BarcodeQRScanner, { ScanButtonIcon } from '../components/common/BarcodeQRScanner';

function SimplePurchase({ products, setProducts, goBack, darkMode }) {
  const bg          = darkMode ? '#1a1a1a' : '#f8f9fa';
  const cardBg      = darkMode ? '#2a2a2a' : '#ffffff';
  const border      = darkMode ? '#3a3a3a' : '#dee2e6';
  const textColor   = darkMode ? '#f0f0f0' : '#212529';
  const subColor    = darkMode ? '#a0a0a0' : '#6c757d';
  const inputBg     = darkMode ? '#2a2a2a' : '#ffffff';
  const inputBorder = darkMode ? '#3a3a3a' : '#dee2e6';
  // 추가된 변수들 (darkMode 기반)
  const subTextColor = darkMode ? '#a0a0a0' : '#6c757d';
  const borderColor = darkMode ? '#3a3a3a' : '#dee2e6';
  const headerBg = darkMode
    ? 'linear-gradient(135deg, #0d4d2a 0%, #1a5c2a 100%)'
    : 'linear-gradient(135deg, #00c471 0%, #00a85e 100%)';

  const [tab, setTab] = useState('inspect'); // inspect | history | returns
  const [search, setSearch] = useState('');
  const [scanList, setScanList] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [payType, setPayType] = useState('매입');
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (result) => {
    setSearch(result.value);
    setShowScanner(false);
  };
  const [memo, setMemo] = useState('');
  const [history, setHistory] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState('불량품');
  const [showReturnModal, setShowReturnModal] = useState(false);

  const SUPPLIERS = ['(주)신선유통', '동신식품', '한국음료', '기타'];

  const searchResults = search.length >= 1
    ? products.filter(p => p.name.includes(search) || (p.barcode && p.barcode.includes(search)))
    : [];

  const addToList = (product) => {
    setScanList(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: product.id, name: product.name, costPrice: product.price, qty: 1 }];
    });
    setSearch('');
  };

  const updateQty = (id, val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 1) return;
    setScanList(prev => prev.map(i => i.id === id ? { ...i, qty: n } : i));
  };

  const updateCostPrice = (id, val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    setScanList(prev => prev.map(i => i.id === id ? { ...i, costPrice: n } : i));
  };

  const removeFromList = (id) => setScanList(prev => prev.filter(i => i.id !== id));

  const totalAmount = scanList.reduce((sum, i) => sum + i.costPrice * i.qty, 0);

  const saveInspect = () => {
    if (scanList.length === 0) return alert('검수 상품을 추가해주세요');
    if (!supplier) return alert('거래처를 선택해주세요');

    if (payType === '매입') {
      // 입고 처리 (재고 증가)
      setProducts(prev => prev.map(p => {
        const item = scanList.find(i => i.id === p.id);
        if (item) return { ...p, stock: (p.stock ?? 0) + item.qty, isSoldOut: false, status: '판매중', lastIn: new Date().toLocaleDateString('ko-KR') };
        return p;
      }));
      const record = {
        id: Date.now(),
        date: new Date().toLocaleString('ko-KR'),
        supplier, items: [...scanList], totalAmount, payType, memo, status: '완료',
      };
      setHistory(prev => [record, ...prev]);
      alert(`✅ 매입 입고 완료! ${scanList.length}개 품목, ₩${totalAmount.toLocaleString()}`);
    } else {
      // 반품 처리 (재고 차감)
      setProducts(prev => prev.map(p => {
        const item = scanList.find(i => i.id === p.id);
        if (item) return { ...p, stock: Math.max(0, (p.stock ?? 0) - item.qty) };
        return p;
      }));
      setReturnHistory(prev => [{
        id: Date.now(),
        date: new Date().toLocaleString('ko-KR'),
        supplier, items: [...scanList], totalAmount, reason: memo || '반품',
      }, ...prev]);
      alert(`✅ 반품 출고 완료! ${scanList.length}개 품목, ₩${totalAmount.toLocaleString()}`);
    }

    setScanList([]); setMemo(''); setSupplier(''); setPayType('매입');
  };

  const openReturn = (record) => {
    setSelectedHistory(record);
    setReturnItems(record.items.map(i => ({ ...i, returnQty: 0 })));
    setReturnReason('불량품');
    setShowReturnModal(true);
  };

  const updateReturnQty = (id, val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    setReturnItems(prev => prev.map(i => i.id === id ? { ...i, returnQty: Math.min(n, i.qty) } : i));
  };

  const saveReturn = () => {
    const hasReturn = returnItems.some(i => i.returnQty > 0);
    if (!hasReturn) return alert('반품 수량을 입력해주세요');
    const totalReturn = returnItems.reduce((sum, i) => sum + i.costPrice * i.returnQty, 0);
    if (!window.confirm(`₩${totalReturn.toLocaleString()} 반품 처리할까요?`)) return;
    setProducts(prev => prev.map(p => {
      const item = returnItems.find(i => i.id === p.id && i.returnQty > 0);
      if (item) return { ...p, stock: Math.max(0, (p.stock ?? 0) - item.returnQty) };
      return p;
    }));
    setReturnHistory(prev => [{
      id: Date.now(),
      date: new Date().toLocaleString('ko-KR'),
      supplier: selectedHistory.supplier,
      items: returnItems.filter(i => i.returnQty > 0),
      totalAmount: totalReturn,
      reason: returnReason,
    }, ...prev]);
    alert(`✅ 반품 완료! ₩${totalReturn.toLocaleString()}`);
    setShowReturnModal(false);
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: headerBg, position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: 40, height: 40, flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white' }}>검수 관리</h2>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', background: headerBg, borderBottom: `1px solid ${borderColor}` }}>
        {[{ key: 'inspect', label: '🔍 검수 입고' }, { key: 'history', label: '📋 매입 내역' }, { key: 'returns', label: '↩ 반품' }].map(t => (
          <div key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: '12px 0', textAlign: 'center', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#00a85e' : subTextColor, borderBottom: tab === t.key ? '2px solid #00c471' : '2px solid transparent', cursor: 'pointer' }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* 검수 입고 탭 */}
      {tab === 'inspect' && (
        <div style={{ padding: 16 }}>
          {/* 거래처 + 결제방식 */}
          <div style={{ background: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
            <div style={{ fontSize: 12, color: subColor, fontWeight: 600, marginBottom: 8 }}>거래처 *</div>
            <select style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 14, outline: 'none', marginBottom: 10, background: inputBg, color: textColor }}
              value={supplier} onChange={e => setSupplier(e.target.value)}>
              <option value="">거래처 선택...</option>
              {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: subColor, marginBottom: 5, fontWeight: 600 }}>매입 방식</div>
                <select style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 13, outline: 'none', background: inputBg, color: textColor }}
                  value={payType} onChange={e => setPayType(e.target.value)}>
                  <option value="매입">매입 (입고)</option>
                  <option value="반품">반품 (출고)</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: subColor, marginBottom: 5, fontWeight: 600 }}>메모</div>
                <input style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: inputBg, color: textColor }}
                  placeholder="메모..." value={memo} onChange={e => setMemo(e.target.value)} />
              </div>
            </div>
          </div>

          {/* 상품 검색 */}
          <div style={{ background: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
            <div style={{ fontSize: 12, color: subColor, fontWeight: 600, marginBottom: 8 }}>상품 검색</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: inputBg, color: textColor }}
                placeholder="상품명 또는 바코드 검색..."
                value={search} onChange={e => setSearch(e.target.value)}
              />
              <button onClick={() => setShowScanner(true)}
                style={{ width: 44, height: 44, flexShrink: 0, background: '#00c471', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <ScanButtonIcon />
              </button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {searchResults.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: inputBg, borderRadius: 10, border: `1px solid ${inputBorder}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#adb5bd' }}>재고 {p.stock ?? 0}개</div>
                    </div>
                    <button onClick={() => addToList(p)}
                      style={{ padding: '6px 12px', background: '#00c471', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      + 추가
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 검수 목록 */}
          {scanList.length > 0 && (
            <div style={{ background: cardBg, borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: textColor, marginBottom: 12 }}>
                검수 목록 ({scanList.length}개)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scanList.map(item => (
                  <div key={item.id} style={{ padding: '10px 12px', background: inputBg, borderRadius: 10, border: `1px solid ${inputBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{item.name}</span>
                      <button onClick={() => removeFromList(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: subColor }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: subColor, marginBottom: 4 }}>매입단가(원)</div>
                        <input type="number" value={item.costPrice}
                          onChange={e => updateCostPrice(item.id, e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: `1px solid ${inputBorder}`, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: cardBg, color: textColor }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: subColor, marginBottom: 4 }}>수량</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => updateQty(item.id, item.qty - 1)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${inputBorder}`, background: cardBg, color: textColor, cursor: 'pointer', fontSize: 14 }}>−</button>
                          <input type="number" value={item.qty} onChange={e => updateQty(item.id, e.target.value)}
                            style={{ width: 40, textAlign: 'center', padding: '4px', border: `1px solid ${inputBorder}`, borderRadius: 6, fontSize: 13, outline: 'none', background: cardBg, color: textColor }} />
                          <button onClick={() => updateQty(item.id, item.qty + 1)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${inputBorder}`, background: cardBg, color: textColor, cursor: 'pointer', fontSize: 14 }}>+</button>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#00a85e', marginTop: 6 }}>
                      소계: ₩{(item.costPrice * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${border}`, marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: subColor }}>총 매입 금액</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: textColor }}>₩{totalAmount.toLocaleString()}</div>
                  {payType === '외상' && <div style={{ fontSize: 11, color: '#ff4757', marginTop: 2 }}>⚠ 외상 처리</div>}
                </div>
                <button onClick={saveInspect}
                  style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                  {payType === '매입' ? '✅ 매입 입고' : '↩ 반품 출고'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 매입 내역 탭 */}
      {tab === 'history' && (
        <div style={{ padding: 16 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#adb5bd' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>매입 내역이 없어요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {history.map(r => (
                <div key={r.id} style={{ background: cardBg, borderRadius: 16, padding: '14px 16px', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{r.supplier}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: r.status === '완료' ? '#e8faf3' : '#fff0f1', color: r.status === '완료' ? '#00a85e' : '#ff4757' }}>{r.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#adb5bd', marginBottom: 4 }}>{r.date}</div>
                  <div style={{ fontSize: 12, color: '#868e96', marginBottom: 8 }}>{r.items.length}개 품목 · {r.payType}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: '#00c471' }}>₩{r.totalAmount.toLocaleString()}</span>
                    <button onClick={() => openReturn(r)}
                      style={{ padding: '6px 12px', background: '#fff0f1', color: '#ff4757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      ↩ 반품
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 반품 탭 */}
      {tab === 'returns' && (
        <div style={{ padding: 16 }}>
          {returnHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#adb5bd' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>↩</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>반품 내역이 없어요</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>매입 내역에서 반품 처리를 해요</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {returnHistory.map(r => (
                <div key={r.id} style={{ background: cardBg, borderRadius: 16, padding: '14px 16px', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)', border: darkMode ? `1px solid ${border}` : '1px solid #fff0f1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{r.supplier}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: '#fff0f1', color: '#ff4757' }}>반품완료</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#adb5bd', marginBottom: 4 }}>{r.date}</div>
                  <div style={{ fontSize: 12, color: '#868e96', marginBottom: 6 }}>사유: {r.reason}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#ff4757' }}>-₩{r.totalAmount.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: '#adb5bd', marginTop: 4 }}>
                    {r.items.map(i => `${i.name} ${i.returnQty}개`).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 반품 처리 모달 */}
      {showReturnModal && selectedHistory && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowReturnModal(false)}>
          <div style={{ background: cardBg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>↩ 반품 처리</span>
              <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: subColor }} onClick={() => setShowReturnModal(false)}>✕</button>
            </div>
            <div style={{ background: inputBg, borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: textColor }}>
              <strong>{selectedHistory.supplier}</strong> · {selectedHistory.date}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: subColor, fontWeight: 600, marginBottom: 6 }}>반품 사유</div>
              <select style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${inputBorder}`, fontSize: 14, outline: 'none', background: inputBg, color: textColor }}
                value={returnReason} onChange={e => setReturnReason(e.target.value)}>
                <option>불량품</option><option>오배송</option><option>유통기한 초과</option><option>파손</option><option>기타</option>
              </select>
            </div>
            <div style={{ fontSize: 12, color: subColor, fontWeight: 600, marginBottom: 8 }}>반품 수량 입력</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {returnItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: inputBg, borderRadius: 10, border: `1px solid ${inputBorder}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: subColor }}>매입 {item.qty}개</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => updateReturnQty(item.id, item.returnQty - 1)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${inputBorder}`, background: cardBg, color: textColor, cursor: 'pointer', fontSize: 13 }}>−</button>
                    <input type="number" value={item.returnQty} onChange={e => updateReturnQty(item.id, e.target.value)}
                      style={{ width: 36, textAlign: 'center', padding: '3px', border: `1px solid ${inputBorder}`, borderRadius: 6, fontSize: 13, outline: 'none', background: item.returnQty > 0 ? (darkMode ? '#3a1a1a' : '#fff0f1') : cardBg, color: item.returnQty > 0 ? '#ff4757' : textColor }} />
                    <button onClick={() => updateReturnQty(item.id, item.returnQty + 1)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${inputBorder}`, background: cardBg, color: textColor, cursor: 'pointer', fontSize: 13 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={saveReturn}
              style={{ width: '100%', padding: 14, background: '#ff4757', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
              ↩ 반품 처리
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <BarcodeQRScanner
          onScanSuccess={handleScan}
          onClose={() => setShowScanner(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

export default SimplePurchase;
