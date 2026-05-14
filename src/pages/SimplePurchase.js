import { useState } from 'react';

function SimplePurchase({ products, setProducts, goBack }) {
  const [tab, setTab] = useState('inspect'); // inspect | history | returns
  const [search, setSearch] = useState('');
  const [scanList, setScanList] = useState([]);
  const [supplier, setSupplier] = useState('');
  const [payType, setPayType] = useState('현금');
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
    setProducts(prev => prev.map(p => {
      const item = scanList.find(i => i.id === p.id);
      if (item) return { ...p, stock: (p.stock ?? 0) + item.qty, isSoldOut: false, status: '판매중', lastIn: new Date().toLocaleDateString('ko-KR') };
      return p;
    }));
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString('ko-KR'),
      supplier, items: [...scanList], totalAmount, payType, memo,
      status: payType === '외상' ? '미수금' : '완료',
    };
    setHistory(prev => [record, ...prev]);
    alert(`✅ 입고 완료! ${scanList.length}개 품목, ₩${totalAmount.toLocaleString()}`);
    setScanList([]); setMemo(''); setSupplier(''); setPayType('현금');
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
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: 100 }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'white', borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: 38, height: 38, background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00a85e' }}>←</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1a1a1a' }}>검수 매입</h2>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid #f0faf5' }}>
        {[{ key: 'inspect', label: '🔍 검수 입고' }, { key: 'history', label: '📋 매입 내역' }, { key: 'returns', label: '↩ 반품' }].map(t => (
          <div key={t.key} onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: '12px 0', textAlign: 'center', fontSize: 13, fontWeight: tab === t.key ? 700 : 400, color: tab === t.key ? '#00a85e' : '#adb5bd', borderBottom: tab === t.key ? '2px solid #00c471' : '2px solid transparent', cursor: 'pointer' }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* 검수 입고 탭 */}
      {tab === 'inspect' && (
        <div style={{ padding: 16 }}>
          {/* 거래처 + 결제방식 */}
          <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, color: '#495057', fontWeight: 600, marginBottom: 8 }}>거래처 *</div>
            <select style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e8faf3', fontSize: 14, outline: 'none', marginBottom: 10, background: '#f8fffe' }}
              value={supplier} onChange={e => setSupplier(e.target.value)}>
              <option value="">거래처 선택...</option>
              {SUPPLIERS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: '#868e96', marginBottom: 5, fontWeight: 600 }}>결제 방식</div>
                <select style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #e8faf3', fontSize: 13, outline: 'none', background: '#f8fffe' }}
                  value={payType} onChange={e => setPayType(e.target.value)}>
                  <option>현금</option><option>계좌이체</option><option>외상</option><option>카드</option>
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#868e96', marginBottom: 5, fontWeight: 600 }}>메모</div>
                <input style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid #e8faf3', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#f8fffe' }}
                  placeholder="메모..." value={memo} onChange={e => setMemo(e.target.value)} />
              </div>
            </div>
          </div>

          {/* 상품 검색 */}
          <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 12, color: '#495057', fontWeight: 600, marginBottom: 8 }}>상품 검색</div>
            <input
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e8faf3', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f8fffe' }}
              placeholder="상품명 검색..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                {searchResults.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fffe', borderRadius: 10, border: '1px solid #e8faf3' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{p.name}</div>
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
            <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
                검수 목록 ({scanList.length}개)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scanList.map(item => (
                  <div key={item.id} style={{ padding: '10px 12px', background: '#f8fffe', borderRadius: 10, border: '1px solid #e8faf3' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{item.name}</span>
                      <button onClick={() => removeFromList(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#adb5bd' }}>✕</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#868e96', marginBottom: 4 }}>매입단가(원)</div>
                        <input type="number" value={item.costPrice}
                          onChange={e => updateCostPrice(item.id, e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid #e8faf3', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: '#868e96', marginBottom: 4 }}>수량</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => updateQty(item.id, item.qty - 1)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e8faf3', background: 'white', cursor: 'pointer', fontSize: 14 }}>−</button>
                          <input type="number" value={item.qty} onChange={e => updateQty(item.id, e.target.value)}
                            style={{ width: 40, textAlign: 'center', padding: '4px', border: '1px solid #e8faf3', borderRadius: 6, fontSize: 13, outline: 'none' }} />
                          <button onClick={() => updateQty(item.id, item.qty + 1)}
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e8faf3', background: 'white', cursor: 'pointer', fontSize: 14 }}>+</button>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: '#00a85e', marginTop: 6 }}>
                      소계: ₩{(item.costPrice * item.qty).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #e8faf3', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#adb5bd' }}>총 매입 금액</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#1a1a1a' }}>₩{totalAmount.toLocaleString()}</div>
                  {payType === '외상' && <div style={{ fontSize: 11, color: '#ff4757', marginTop: 2 }}>⚠ 외상 처리</div>}
                </div>
                <button onClick={saveInspect}
                  style={{ padding: '12px 20px', background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                  ✅ 입고 처리
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
                <div key={r.id} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f0faf5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{r.supplier}</span>
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
                <div key={r.id} style={{ background: 'white', borderRadius: 16, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #fff0f1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{r.supplier}</span>
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
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>↩ 반품 처리</span>
              <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#adb5bd' }} onClick={() => setShowReturnModal(false)}>✕</button>
            </div>
            <div style={{ background: '#f8fffe', borderRadius: 12, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
              <strong>{selectedHistory.supplier}</strong> · {selectedHistory.date}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#495057', fontWeight: 600, marginBottom: 6 }}>반품 사유</div>
              <select style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #e8faf3', fontSize: 14, outline: 'none', background: '#f8fffe' }}
                value={returnReason} onChange={e => setReturnReason(e.target.value)}>
                <option>불량품</option><option>오배송</option><option>유통기한 초과</option><option>파손</option><option>기타</option>
              </select>
            </div>
            <div style={{ fontSize: 12, color: '#495057', fontWeight: 600, marginBottom: 8 }}>반품 수량 입력</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {returnItems.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fffe', borderRadius: 10, border: '1px solid #e8faf3' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#adb5bd' }}>매입 {item.qty}개</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => updateReturnQty(item.id, item.returnQty - 1)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #e8faf3', background: 'white', cursor: 'pointer', fontSize: 13 }}>−</button>
                    <input type="number" value={item.returnQty} onChange={e => updateReturnQty(item.id, e.target.value)}
                      style={{ width: 36, textAlign: 'center', padding: '3px', border: '1px solid #e8faf3', borderRadius: 6, fontSize: 13, outline: 'none', background: item.returnQty > 0 ? '#fff0f1' : 'white', color: item.returnQty > 0 ? '#ff4757' : '#1a1a1a' }} />
                    <button onClick={() => updateReturnQty(item.id, item.returnQty + 1)}
                      style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #e8faf3', background: 'white', cursor: 'pointer', fontSize: 13 }}>+</button>
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
    </div>
  );
}

export default SimplePurchase;
