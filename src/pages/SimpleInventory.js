import { useState, useRef } from 'react';
import BarcodeQRScanner, { ScanButtonIcon } from '../components/common/BarcodeQRScanner';

function SimpleInventory({ products, setProducts, goBack, darkMode }) {
  const bg        = darkMode ? '#1a1a1a' : '#f8fffe';
  const cardBg    = darkMode ? '#2a2a2a' : 'white';
  const headerBg  = darkMode ? '#222' : 'white';
  const border    = darkMode ? '#3a3a3a' : '#f0faf5';
  const textColor = darkMode ? '#f0f0f0' : '#1a1a1a';
  const subColor  = darkMode ? '#9e9e9e' : '#adb5bd';
  const inputBg   = darkMode ? '#2a2a2a' : 'white';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('전체');
  const [showScanner, setShowScanner] = useState(false);

  // PDA 스캐너 빠른 입력 감지
  const lastInputTimeRef = useRef(0);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  const handleSearchChange = (e) => {
    lastInputTimeRef.current = Date.now();
    setSearch(e.target.value);
  };

  const handleScan = (result) => {
    if (result.type === 'qrcode') {
      const { value } = result;
      if (/^https?:\/\//.test(value)) {
        if (window.confirm(`QR 링크: ${value}\n\n해당 URL로 이동할까요?`)) {
          window.open(value, '_blank');
        }
        return;
      }
      try {
        const parsed = JSON.parse(value);
        if (parsed.barcode) { setSearch(parsed.barcode); return; }
        if (parsed.name) { setSearch(parsed.name); return; }
      } catch {}
      setSearch(value);
    } else {
      setSearch(result.value);
    }
    setShowScanner(false);
  };
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState('');
  const [mode, setMode] = useState('receive'); // receive | soldout

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.includes(search) || (p.barcode && p.barcode.includes(search));
    const stock = p.stock ?? 0;
    if (filter === '품절') return matchSearch && (p.isSoldOut || stock === 0);
    if (filter === '품절임박') return matchSearch && stock > 0 && stock < 20;
    if (filter === '정상') return matchSearch && stock >= 20;
    return matchSearch;
  });

  const getStatus = (p) => {
    const stock = p.stock ?? 0;
    if (p.isSoldOut || stock === 0) return { label: '품절', color: darkMode ? '#ff8888' : '#ff4757', bg: darkMode ? '#3d1a1a' : '#fff0f1' };
    if (stock < 20) return { label: '임박', color: darkMode ? '#ffb84d' : '#f0a500', bg: darkMode ? '#3d2818' : '#fff3cd' };
    return { label: '정상', color: darkMode ? '#4caf50' : '#00c471', bg: darkMode ? '#1a4a2a' : '#e8faf3' };
  };

  const handleReceive = () => {
    const q = parseInt(qty);
    if (!q || q <= 0) return alert('수량을 입력해주세요');
    setProducts(prev => prev.map(p =>
      p.id === selected.id ? { ...p, stock: (p.stock ?? 0) + q, isSoldOut: false, status: '판매중', lastIn: new Date().toLocaleDateString('ko-KR') } : p
    ));
    alert(`✅ ${selected.name} +${q}개 입고 완료!`);
    setSelected(null); setQty('');
  };

  const handleSoldout = () => {
    if (!window.confirm(`'${selected.name}'을 품절 처리할까요?`)) return;
    setProducts(prev => prev.map(p =>
      p.id === selected.id ? { ...p, stock: 0, isSoldOut: true, status: '판매중지' } : p
    ));
    alert(`⛔ ${selected.name} 품절 처리됐어요!`);
    setSelected(null);
  };

  const handleCancelSoldout = (p) => {
    if (!window.confirm(`'${p.name}' 품절을 해제할까요?`)) return;
    setProducts(prev => prev.map(pr =>
      pr.id === p.id ? { ...pr, isSoldOut: false, status: '판매중' } : pr
    ));
  };

  const lowCount = products.filter(p => { const s = p.stock ?? 0; return s === 0 || p.isSoldOut; }).length;
  const nearCount = products.filter(p => { const s = p.stock ?? 0; return s > 0 && s < 20 && !p.isSoldOut; }).length;

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: darkMode ? '#0d4d2a' : 'linear-gradient(135deg, #00c471, #00a85e)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack} style={{ width: 40, height: 40, flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white' }}>재고 관리</h2>
      </div>

      {/* 요약 */}
      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[
          { label: '전체', val: products.length, color: textColor, bg: darkMode ? '#2a2a2a' : 'white' },
          { label: '품절', val: lowCount, color: darkMode ? '#ff8888' : '#ff4757', bg: darkMode ? '#3d1a1a' : '#ffe5e5' },
          { label: '품절임박', val: nearCount, color: darkMode ? '#ffb84d' : '#f0a500', bg: darkMode ? '#3d2818' : '#fff8e0' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: '12px', textAlign: 'center', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 11, color: subColor, fontWeight: 600, marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* 검색 + 필터 */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box', background: inputBg, color: textColor }}
            placeholder="상품명 또는 바코드 검색... (PDA 스캐너 사용 가능)"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          <button onClick={() => setShowScanner(true)}
            style={{ width: 48, height: 48, flexShrink: 0, background: '#00c471', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#00a85e'}
            onMouseLeave={e => e.currentTarget.style.background = '#00c471'}>
            <ScanButtonIcon />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['전체', '정상', '품절임박', '품절'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: filter === f ? '#00c471' : cardBg, color: filter === f ? 'white' : subColor, boxShadow: darkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.08)' }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 상품 목록 */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#adb5bd' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>해당하는 상품이 없어요</div>
          </div>
        ) : filtered.map(p => {
          const st = getStatus(p);
          return (
            <div key={p.id} style={{ background: cardBg, borderRadius: 16, padding: '14px 16px', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#adb5bd' }}>
                    재고 <span style={{ fontWeight: 700, color: st.color }}>{p.stock ?? 0}개</span>
                    {p.spec && <span> · {p.spec}{p.unit}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10, background: st.bg, color: st.color, marginLeft: 8, flexShrink: 0 }}>{st.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setSelected(p); setMode('receive'); setQty(''); }}
                  style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: darkMode ? '#1a4a2a' : '#e8faf3', color: darkMode ? '#66bb6a' : '#00c471', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  📦 입고
                </button>
                {p.isSoldOut || (p.stock ?? 0) === 0 ? (
                  <button onClick={() => handleCancelSoldout(p)}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: darkMode ? '#1a3a4a' : '#e3f2fd', color: darkMode ? '#5dade2' : '#1976d2', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    품절해제
                  </button>
                ) : (
                  <button onClick={() => { setSelected(p); setMode('soldout'); }}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: darkMode ? '#3d1a1a' : '#fff5f5', color: darkMode ? '#ff8888' : '#dc3545', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    ⛔ 품절처리
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 입고/품절 모달 */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setSelected(null)}>
          <div style={{ background: cardBg, borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: textColor }}>
                {mode === 'receive' ? '📦 입고 처리' : '⛔ 품절 처리'}
              </span>
              <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: subColor }} onClick={() => setSelected(null)}>✕</button>
            </div>
            <div style={{ background: bg, borderRadius: 12, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: subColor, marginTop: 4 }}>현재 재고: <strong style={{ color: '#00c471' }}>{selected.stock ?? 0}개</strong></div>
            </div>
            {mode === 'receive' ? (
              <>
                <div style={{ fontSize: 12, color: subColor, marginBottom: 8, fontWeight: 600 }}>입고 수량</div>
                <input
                  type="number"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${border}`, fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 12, background: inputBg, color: textColor }}
                  placeholder="추가할 수량 입력"
                  value={qty} onChange={e => setQty(e.target.value)} autoFocus
                />
                {qty && Number(qty) > 0 && (
                  <div style={{ background: '#e8faf3', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#00a85e', fontWeight: 600, marginBottom: 16 }}>
                    입고 후 재고: {selected.stock ?? 0} + {qty} = <strong>{(selected.stock ?? 0) + Number(qty)}개</strong>
                  </div>
                )}
                <button onClick={handleReceive}
                  style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #00c471, #00a85e)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                  입고 처리
                </button>
              </>
            ) : (
              <>
                <div style={{ background: '#fff0f1', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#ff4757', marginBottom: 16 }}>
                  ⚠️ 재고가 0으로 변경되고 앱에서 품절로 표시돼요.
                </div>
                <button onClick={handleSoldout}
                  style={{ width: '100%', padding: 14, background: '#ff4757', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
                  품절 처리
                </button>
              </>
            )}
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

export default SimpleInventory;
