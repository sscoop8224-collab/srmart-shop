import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '../layout/Sidebar';

const sg = '#00c471';
const sgd = '#009a58';
const sgl = '#e6f9f1';

const CAT_ICON_LARGE = { '식품': '🥬', '음료': '🧃', '생활용품': '🧴', '간식/과자': '🍿', '주류': '🍺' };

const STATUS_STYLE = {
  판매중:   { bg: sgl, color: sgd, label: '판매 중' },
  품절임박: { bg: '#faeeda', color: '#854f0b', label: '품절 임박' },
  판매중지: { bg: '#f1efe8', color: '#5f5e5a', label: '판매 중지' },
};

const LIGHT = { bg: '#f5f5f3', cardBg: '#ffffff', cardBorder: '#e0e0e0', metricBg: '#efefed', textPrimary: '#1a1a1a', textSecondary: '#444444', textTertiary: '#777777', topbarBg: '#ffffff', topbarBorder: '#e0e0e0', theadBg: '#f0f0ee', inputBg: '#ffffff', inputBorder: '#dddddd', thumbBg: '#efefed' };
const DARK  = { bg: '#111111', cardBg: '#1e1e1e', cardBorder: '#2e2e2e', metricBg: '#252525', textPrimary: '#f0f0f0', textSecondary: '#bbbbbb', textTertiary: '#777777', topbarBg: '#1a1a1a', topbarBorder: '#2e2e2e', theadBg: '#252525', inputBg: '#252525', inputBorder: '#3a3a3a', thumbBg: '#333333' };

function DarkToggle({ dark, setDark }) {
  return (
    <div onClick={() => setDark(!dark)} title={dark ? '라이트 모드' : '다크 모드'}
      style={{ width: 42, height: 24, borderRadius: 12, background: dark ? sg : '#ccc', cursor: 'pointer', position: 'relative', transition: 'background .25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: dark ? 21 : 3, transition: 'left .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
        {dark ? '🌙' : '☀️'}
      </div>
    </div>
  );
}

function makeStyles(c) {
  return {
    topbar: {
      background: c.topbarBg, borderBottom: `1px solid ${c.topbarBorder}`,
      paddingLeft: 24, paddingRight: 24,
      paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    },
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
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0', overflowY: 'auto' },
    modal: { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 24, width: 520, maxHeight: '90vh', overflowY: 'auto', margin: 'auto' },
    formLabel: { fontSize: 12, color: c.textSecondary, marginBottom: 5 },
    formInput: { width: '100%', padding: '8px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: c.inputBg, color: c.textPrimary },
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
    divider: { height: 1, background: c.cardBorder, margin: '16px 0' },
  };
}

function normalizeProduct(p) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku || `SKU-${String(p.id).padStart(3, '0')}`,
    barcode: p.barcode || '',
    cat: p.small || p.medium || p.large || '기타',
    price: p.price,
    stock: p.stock ?? 0,
    sold: p.sold ?? 0,
    rating: p.rating ?? 0,
    status: p.status || (p.isSoldOut ? '판매중지' : '판매중'),
    images: p.images || (p.image ? [{ url: p.image, name: 'image' }] : []),
    large: p.large || '',
    isSoldOut: p.isSoldOut || false,
    min: p.min || 20,
    lastIn: p.lastIn || '-',
  };
}

// =============================================
// 카메라 스캔 컴포넌트 — html5-qrcode 사용
// =============================================
function CameraScanner({ onDetected, onError, c, s }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const SCANNER_ID = 'srmart-barcode-scanner';

  const startScanner = async () => {
    setError('');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 120 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          // 스캔 성공
          if (navigator.vibrate) navigator.vibrate(100);
          onDetected(decodedText);
        },
        () => {
          // 스캔 중 오류 무시 (매 프레임마다 발생)
        }
      );
      setActive(true);
    } catch (err) {
      const msg = err.message || String(err);
      if (msg.includes('permission') || msg.includes('Permission')) {
        setError('카메라 권한이 없어요. 브라우저 설정에서 카메라를 허용해주세요.');
      } else {
        setError('카메라를 시작할 수 없어요: ' + msg);
      }
      onError && onError(msg);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setActive(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div>
      {!active ? (
        <div>
          <div style={{ background: '#e6f1fb', border: '1px solid #85b7eb', borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12, color: '#185fa5', lineHeight: 1.7 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>📷 카메라 바코드 스캔</div>
            <div>카메라로 상품 바코드를 비추면 자동으로 인식해요</div>
            <div>EAN-13, EAN-8, Code-128, UPC 등 지원</div>
            <div style={{ marginTop: 6, fontSize: 11, color: '#444' }}>※ 카메라 권한 허용이 필요해요</div>
          </div>
          {error && (
            <div style={{ background: '#fcebeb', border: '1px solid #f09595', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#a32d2d', marginBottom: 12 }}>
              ⚠️ {error}
            </div>
          )}
          <button style={{ ...s.btnPrimary, width: '100%', justifyContent: 'center', padding: '12px' }} onClick={startScanner}>
            📷 카메라 시작
          </button>
        </div>
      ) : (
        <div>
          {/* html5-qrcode가 여기에 카메라를 렌더링해요 */}
          <div
            id={SCANNER_ID}
            style={{ width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}
          />
          <button style={{ ...s.btn, width: '100%', justifyContent: 'center' }} onClick={stopScanner}>
            ⏹ 카메라 종료
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================
// 재고 실사 모드 컴포넌트
// =============================================
function StockTakingMode({ c, s, dark, inv, rawProducts, setRawProducts, onClose }) {
  const [scanMode, setScanMode] = useState('barcode');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [manualSearch, setManualSearch] = useState('');
  const [scanList, setScanList] = useState([]);
  const [scanMsg, setScanMsg] = useState('');
  const barcodeInputRef = useRef(null);

  const findByBarcode = useCallback((code) => {
    if (!code.trim()) return null;
    return rawProducts.find(p =>
      p.barcode === code.trim() ||
      p.sku === code.trim() ||
      String(p.id) === code.trim()
    );
  }, [rawProducts]);

  const findByName = (keyword) => {
    if (!keyword.trim()) return [];
    return rawProducts.filter(p =>
      p.name.includes(keyword) || (p.barcode && p.barcode.includes(keyword))
    );
  };

  const addToScanList = useCallback((product) => {
    setScanList(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        setScanMsg(`✅ ${product.name} — 누적 ${exists.newStock + 1}개`);
        return prev.map(i => i.id === product.id ? { ...i, newStock: i.newStock + 1 } : i);
      } else {
        setScanMsg(`✅ ${product.name} — 추가됨`);
        return [...prev, {
          id: product.id,
          name: product.name,
          barcode: product.barcode || '-',
          sku: product.sku || '-',
          prevStock: product.stock ?? 0,
          newStock: 1,
        }];
      }
    });
    setTimeout(() => setScanMsg(''), 2000);
  }, []);

  // 카메라 스캔 성공 콜백
  const handleCameraDetected = useCallback((code) => {
    const found = findByBarcode(code);
    if (found) {
      addToScanList(found);
    } else {
      setScanMsg(`❌ '${code}' — 등록되지 않은 바코드예요`);
      setTimeout(() => setScanMsg(''), 2500);
    }
  }, [findByBarcode, addToScanList]);

  const handleBarcodeEnter = (e) => {
    if (e.key === 'Enter') {
      const code = barcodeInput.trim();
      if (!code) return;
      const found = findByBarcode(code);
      if (found) {
        addToScanList(found);
      } else {
        setScanMsg(`❌ '${code}' — 등록되지 않은 바코드예요`);
        setTimeout(() => setScanMsg(''), 2500);
      }
      setBarcodeInput('');
    }
  };

  useEffect(() => {
    if (scanMode === 'barcode') setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, [scanMode]);

  const updateQty = (id, val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    setScanList(prev => prev.map(i => i.id === id ? { ...i, newStock: n } : i));
  };

  const removeFromList = (id) => setScanList(prev => prev.filter(i => i.id !== id));

  const saveAll = () => {
    if (scanList.length === 0) return alert('실사된 상품이 없어요');
    if (!window.confirm(`총 ${scanList.length}개 상품의 재고를 업데이트하시겠어요?`)) return;
    if (setRawProducts) {
      setRawProducts(prev => prev.map(p => {
        const scanned = scanList.find(i => i.id === p.id);
        if (scanned) {
          return {
            ...p,
            stock: scanned.newStock,
            lastIn: new Date().toLocaleDateString('ko-KR'),
            status: scanned.newStock === 0 ? '판매중지' : '판매중',
            isSoldOut: scanned.newStock === 0,
          };
        }
        return p;
      }));
    }
    alert(`✅ 실사 완료! ${scanList.length}개 상품 재고가 업데이트됐어요.`);
    onClose();
  };

  const manualResults = manualSearch.length >= 1 ? findByName(manualSearch) : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: c.bg, zIndex: 200, display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* 헤더 */}
      <div style={{ background: c.topbarBg, borderBottom: `1px solid ${c.topbarBorder}`, paddingLeft: 24, paddingRight: 24, paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>📋 재고 실사 모드</div>
          {scanList.length > 0 && <span style={{ fontSize: 11, background: sg, color: '#fff', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{scanList.length}개 스캔됨</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {scanList.length > 0 && <button style={s.btnPrimary} onClick={saveAll}>💾 저장 ({scanList.length})</button>}
          <button style={s.btn} onClick={onClose}>✕ 닫기</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* 왼쪽 — 스캔 영역 */}
        <div style={{ width: 360, borderRight: `1px solid ${c.cardBorder}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          {/* 탭 */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${c.cardBorder}`, background: c.cardBg }}>
            {[
              { key: 'barcode', label: '📡 스캐너/PDA', desc: '방법 1·3' },
              { key: 'camera',  label: '📷 카메라',     desc: '방법 2' },
              { key: 'manual',  label: '🔍 수동검색',   desc: '직접입력' },
            ].map(tab => (
              <div key={tab.key} onClick={() => setScanMode(tab.key)} style={{ flex: 1, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', borderBottom: scanMode === tab.key ? `2px solid ${sg}` : '2px solid transparent', background: scanMode === tab.key ? sgl : 'transparent', marginBottom: -1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: scanMode === tab.key ? sgd : c.textSecondary }}>{tab.label}</div>
                <div style={{ fontSize: 9, color: c.textTertiary, marginTop: 2 }}>{tab.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {/* 스캐너/PDA */}
            {scanMode === 'barcode' && (
              <div>
                <div style={{ background: dark ? '#1a3a2a' : sgl, border: `1px solid ${sg}`, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12, color: sgd, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>📡 블루투스 스캐너 / PDA 연결 방법</div>
                  <div>① 블루투스 스캐너를 기기에 페어링해요</div>
                  <div>② 아래 입력란을 클릭해 포커스를 맞춰요</div>
                  <div>③ 상품 바코드를 스캔하면 자동 입력돼요</div>
                  <div style={{ marginTop: 6, color: c.textSecondary, fontSize: 11 }}>※ PDA는 크롬 브라우저에서 이 페이지를 열면 동일하게 작동해요</div>
                </div>
                <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 6 }}>바코드 입력 (스캔 또는 직접 입력 후 Enter)</div>
                <input
                  ref={barcodeInputRef}
                  style={{ ...s.formInput, fontSize: 16, padding: '12px 14px', border: `2px solid ${sg}` }}
                  placeholder="바코드를 스캔하세요..."
                  value={barcodeInput}
                  onChange={e => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeEnter}
                  autoFocus
                />
                {scanMsg && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: scanMsg.startsWith('✅') ? sgl : '#fcebeb', color: scanMsg.startsWith('✅') ? sgd : '#a32d2d', fontSize: 12, fontWeight: 500, marginTop: 10 }}>
                    {scanMsg}
                  </div>
                )}
                <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 8 }}>스캔할 때마다 실사 목록에 자동으로 추가돼요</div>
              </div>
            )}

            {/* ✅ 카메라 — html5-qrcode */}
            {scanMode === 'camera' && (
              <div>
                <CameraScanner
                  onDetected={handleCameraDetected}
                  c={c} s={s}
                />
                {scanMsg && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: scanMsg.startsWith('✅') ? sgl : '#fcebeb', color: scanMsg.startsWith('✅') ? sgd : '#a32d2d', fontSize: 12, fontWeight: 500, marginTop: 10 }}>
                    {scanMsg}
                  </div>
                )}
              </div>
            )}

            {/* 수동검색 */}
            {scanMode === 'manual' && (
              <div>
                <div style={{ background: dark ? '#252525' : '#f5f5f3', border: `1px solid ${c.cardBorder}`, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 12, color: c.textSecondary, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 600, color: c.textPrimary, marginBottom: 6 }}>🔍 상품명 검색</div>
                  <div>상품명 또는 바코드 번호로 검색해서 추가해요</div>
                </div>
                <input
                  style={{ ...s.formInput, marginBottom: 10 }}
                  placeholder="상품명 검색..."
                  value={manualSearch}
                  onChange={e => setManualSearch(e.target.value)}
                  autoFocus
                />
                {manualResults.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {manualResults.map(p => (
                      <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: c.metricBg, borderRadius: 8, border: `1px solid ${c.cardBorder}` }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: c.textTertiary }}>재고 {p.stock ?? 0}개 · {p.barcode || '바코드없음'}</div>
                        </div>
                        <button style={{ ...s.actionBtn, borderColor: sg, color: sgd, fontSize: 11 }} onClick={() => { addToScanList(normalizeProduct(p)); setManualSearch(''); }}>
                          + 추가
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {manualSearch && manualResults.length === 0 && (
                  <div style={{ textAlign: 'center', color: c.textTertiary, fontSize: 12, padding: 20 }}>검색 결과가 없어요</div>
                )}
                {scanMsg && (
                  <div style={{ padding: '8px 12px', borderRadius: 8, background: scanMsg.startsWith('✅') ? sgl : '#fcebeb', color: scanMsg.startsWith('✅') ? sgd : '#a32d2d', fontSize: 12, fontWeight: 500, marginTop: 10 }}>
                    {scanMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 — 실사 목록 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: `1px solid ${c.cardBorder}`, background: c.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>실사 목록 <span style={{ color: c.textTertiary, fontWeight: 400, fontSize: 12 }}>({scanList.length}개)</span></div>
            {scanList.length > 0 && (
              <button style={{ ...s.actionBtn, color: '#a32d2d', borderColor: '#f09595', fontSize: 11 }} onClick={() => { if (window.confirm('실사 목록을 초기화하시겠어요?')) setScanList([]); }}>
                목록 초기화
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {scanList.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 60, color: c.textTertiary }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: c.textSecondary, marginBottom: 6 }}>스캔된 상품이 없어요</div>
                <div style={{ fontSize: 12 }}>왼쪽에서 바코드를 스캔하거나 상품을 검색해서 추가해요</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {scanList.map((item, idx) => {
                  const diff = item.newStock - item.prevStock;
                  return (
                    <div key={item.id} style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: c.metricBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: c.textTertiary, fontWeight: 600, flexShrink: 0 }}>{idx + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontSize: 10, color: c.textTertiary, marginTop: 2 }}>기존 재고: {item.prevStock}개</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => updateQty(item.id, item.newStock - 1)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${c.cardBorder}`, background: c.metricBg, color: c.textPrimary, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <input type="number" value={item.newStock} onChange={e => updateQty(item.id, e.target.value)} style={{ width: 52, textAlign: 'center', padding: '4px 6px', border: `1px solid ${c.inputBorder}`, borderRadius: 6, fontSize: 13, fontWeight: 600, background: c.inputBg, color: c.textPrimary, outline: 'none' }} />
                        <button onClick={() => updateQty(item.id, item.newStock + 1)} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${c.cardBorder}`, background: c.metricBg, color: c.textPrimary, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                        <span style={{ fontSize: 11, color: c.textTertiary, width: 20 }}>개</span>
                      </div>
                      <div style={{ width: 50, textAlign: 'center', fontSize: 11, fontWeight: 600, color: diff > 0 ? sgd : diff < 0 ? '#a32d2d' : c.textTertiary, flexShrink: 0 }}>
                        {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '±0'}
                      </div>
                      <button onClick={() => removeFromList(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: c.textTertiary, padding: 4, flexShrink: 0 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {scanList.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${c.cardBorder}`, background: c.cardBg, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <div style={{ flex: 1, fontSize: 12, color: c.textSecondary, display: 'flex', alignItems: 'center' }}>총 {scanList.length}개 상품 · 재고 변경 예정</div>
              <button style={s.btn} onClick={() => { if (window.confirm('실사 목록을 초기화하시겠어요?')) setScanList([]); }}>초기화</button>
              <button style={s.btnPrimary} onClick={saveAll}>💾 실사 결과 저장</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================
// ProductManagement — 상품 관리
// =============================================
export function ProductManagement({ setPage, dark, setDark, products: rawProducts = [], setProducts: setRawProducts, categories = [] }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);
  const fileInputRef = useRef(null);

  const products = rawProducts.map(normalizeProduct);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', large: '식품', price: '', stock: '', status: '판매중', barcode: '', images: [] });

  const largeCategories = categories.length > 0 ? categories.map(c2 => c2.name) : ['식품','음료','생활용품','간식/과자','주류'];

  const filtered = products.filter(p => {
    if (catFilter && p.large !== catFilter) return false;
    if (statusFilter && p.status !== statusFilter) return false;
    if (search && !p.name.includes(search) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => { setEditing(null); setForm({ name: '', large: largeCategories[0] || '식품', price: '', stock: '', status: '판매중', barcode: '', images: [] }); setShowModal(true); };
  const openEdit = p => { setEditing(p.id); setForm({ name: p.name, large: p.large || largeCategories[0], price: p.price, stock: p.stock, status: p.status, barcode: p.barcode || '', images: p.images || [] }); setShowModal(true); };

  const save = () => {
    if (!form.name.trim()) return alert('상품명을 입력해주세요');
    if (!form.price) return alert('판매가를 입력해주세요');
    if (setRawProducts) {
      if (editing) {
        setRawProducts(prev => prev.map(p => p.id === editing ? { ...p, name: form.name, price: Number(form.price), stock: Number(form.stock), large: form.large, status: form.status, isSoldOut: form.status === '판매중지', barcode: form.barcode, images: form.images, image: form.images.length > 0 ? form.images[0].url : p.image } : p));
      } else {
        setRawProducts(prev => [...prev, { id: Date.now(), name: form.name, price: Number(form.price), large: form.large, medium: '', small: '', stock: Number(form.stock), status: form.status, isSoldOut: form.status === '판매중지', barcode: form.barcode, images: form.images, image: form.images.length > 0 ? form.images[0].url : null, sold: 0, rating: 0 }]);
      }
    }
    setShowModal(false);
  };

  const del = id => { if (window.confirm('삭제하시겠습니까?')) { if (setRawProducts) setRawProducts(prev => prev.filter(p => p.id !== id)); } };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 5 - form.images.length;
    if (remaining <= 0) return alert('이미지는 최대 5장까지 등록할 수 있어요');
    files.slice(0, remaining).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setForm(prev => ({ ...prev, images: [...prev.images, { url: ev.target.result, name: file.name }] }));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeImage = idx => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC_products" setPage={setPage} dark={dark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>상품 관리</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={s.btnPrimary} onClick={openAdd}>+ 상품 등록</button>
            <DarkToggle dark={dark} setDark={setDark} />
          </div>
        </div>
        <div style={s.content}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[{ label: '전체 상품', val: products.length, color: c.textPrimary }, { label: '판매 중', val: products.filter(p => p.status === '판매중').length, color: sgd }, { label: '품절 임박', val: products.filter(p => p.status === '품절임박').length, color: '#854f0b' }, { label: '판매 중지', val: products.filter(p => p.status === '판매중지').length, color: '#5f5e5a' }].map(card => (
              <div key={card.label} style={s.sumCard}><div style={s.sumLabel}>{card.label}</div><div style={{ fontSize: 17, fontWeight: 600, color: card.color }}>{card.val}</div></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input style={{ ...s.input, flex: 1 }} placeholder="상품명, SKU 검색..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={s.select} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">전체 카테고리</option>
              {largeCategories.map(c2 => <option key={c2}>{c2}</option>)}
            </select>
            <select style={s.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">전체 상태</option>
              {Object.entries(STATUS_STYLE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead style={{ background: c.theadBg }}>
                <tr>{['상품','카테고리','바코드','판매가','재고','상태','관리'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: c.textTertiary, fontSize: 13 }}>{products.length === 0 ? '등록된 상품이 없어요' : '검색 결과가 없어요'}</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td style={s.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: c.thumbBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, overflow: 'hidden', flexShrink: 0 }}>
                          {p.images && p.images.length > 0 ? <img src={p.images[0].url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : CAT_ICON_LARGE[p.large] || '📦'}
                        </div>
                        <div><div style={{ fontWeight: 600, fontSize: 12, color: c.textPrimary }}>{p.name}</div><div style={{ fontSize: 10, color: c.textTertiary }}>{p.sku}</div></div>
                      </div>
                    </td>
                    <td style={{ ...s.td, color: c.textSecondary }}>{p.large}</td>
                    <td style={{ ...s.td, color: c.textTertiary, fontSize: 11 }}>{p.barcode || '-'}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: c.textPrimary }}>₩{p.price.toLocaleString()}</td>
                    <td style={{ ...s.td, color: p.stock < 20 ? '#854f0b' : c.textPrimary }}>{p.stock}개</td>
                    <td style={s.td}><span style={{ ...s.pill, background: STATUS_STYLE[p.status]?.bg, color: STATUS_STYLE[p.status]?.color }}>{STATUS_STYLE[p.status]?.label || p.status}</span></td>
                    <td style={s.td}>
                      <button style={s.actionBtn} onClick={() => openEdit(p)}>수정</button>
                      <button style={{ ...s.actionBtn, borderColor: '#f09595', color: '#a32d2d', marginLeft: 4 }} onClick={() => del(p.id)}>삭제</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={s.modalBg} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>{editing ? '상품 수정' : '상품 등록'}</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}><div style={s.formLabel}>상품명 *</div><input style={s.formInput} placeholder="예: 신선 사과 1kg" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div style={s.row2}>
              <div><div style={s.formLabel}>카테고리</div><select style={s.formInput} value={form.large} onChange={e => setForm(p => ({ ...p, large: e.target.value }))}>{largeCategories.map(c2 => <option key={c2}>{c2}</option>)}</select></div>
              <div><div style={s.formLabel}>상태</div><select style={s.formInput} value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}><option value="판매중">판매 중</option><option value="판매중지">판매 중지</option></select></div>
            </div>
            <div style={s.row2}>
              <div><div style={s.formLabel}>판매가 (원) *</div><input style={s.formInput} type="number" placeholder="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} /></div>
              <div><div style={s.formLabel}>재고 수량</div><input style={s.formInput} type="number" placeholder="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><div style={s.formLabel}>바코드 번호</div><input style={s.formInput} placeholder="예: 8801234567890" value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} /></div>
            <div style={s.divider} />
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={s.formLabel}>상품 이미지 <span style={{ color: c.textTertiary, fontWeight: 400 }}>(최대 5장)</span></div>
                <span style={{ fontSize: 11, color: form.images.length >= 5 ? '#a32d2d' : c.textTertiary }}>{form.images.length} / 5</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {form.images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: 72, height: 72 }}>
                    <img src={img.url} alt={img.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: `1px solid ${c.cardBorder}` }} />
                    <button onClick={() => removeImage(idx)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#e24b4a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                {form.images.length < 5 && (
                  <div onClick={() => fileInputRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 8, border: `2px dashed ${c.inputBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.textTertiary, fontSize: 11, background: c.metricBg, gap: 2 }}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>+</span><span>사진 추가</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleImageUpload} />
              <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 6 }}>JPG, PNG, WEBP · 장당 최대 10MB</div>
            </div>
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
// InventoryManagement — 재고 관리
// =============================================
function getStockStatus(item) {
  if (item.stock === 0) return 'out';
  if (item.stock < (item.min || 20)) return 'low';
  return 'ok';
}
const STOCK_STYLE = {
  ok:  { bg: sgl, color: sgd, label: '정상' },
  low: { bg: '#faeeda', color: '#854f0b', label: '품절 임박' },
  out: { bg: '#fcebeb', color: '#a32d2d', label: '품절' },
};

export function InventoryManagement({ setPage, dark, setDark, products: rawProducts = [], setProducts: setRawProducts }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);

  const inv = rawProducts.map(p => ({
    id: p.id, name: p.name,
    sku: p.sku || `SKU-${String(p.id).padStart(3, '0')}`,
    cat: p.large || '기타',
    stock: p.stock ?? 0, min: p.min || 20,
    lastIn: p.lastIn || '-',
    status: p.status || '판매중',
    isSoldOut: p.isSoldOut || false,
  }));

  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalTab, setModalTab] = useState('receive');
  const [qty, setQty] = useState('');
  const [soldoutReason, setSoldoutReason] = useState('');
  const [showStockTaking, setShowStockTaking] = useState(false);

  const filtered = inv.filter(p => {
    if (stockFilter && getStockStatus(p) !== stockFilter) return false;
    if (search && !p.name.includes(search) && !p.sku.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const maxStock = Math.max(...inv.map(p => p.stock), 1);
  const lowStockCount = inv.filter(p => getStockStatus(p) !== 'ok').length;

  const processReceive = () => {
    const q = parseInt(qty);
    if (!q || q <= 0) return alert('수량을 입력해주세요');
    if (setRawProducts) {
      setRawProducts(prev => prev.map(p =>
        p.id === selected.id ? { ...p, stock: (p.stock ?? 0) + q, lastIn: new Date().toLocaleDateString('ko-KR'), status: '판매중', isSoldOut: false } : p
      ));
    }
    setSelected(null); setQty('');
    alert(`✅ 입고 처리 완료! (+${q}개)`);
  };

  const processSoldout = () => {
    if (window.confirm(`'${selected.name}'을(를) 강제 품절 처리하시겠어요?\n재고가 0으로 변경되고 모바일 앱에서 품절로 표시됩니다.`)) {
      if (setRawProducts) {
        setRawProducts(prev => prev.map(p =>
          p.id === selected.id ? { ...p, stock: 0, isSoldOut: true, status: '판매중지', soldoutReason: soldoutReason || '재고 소진' } : p
        ));
      }
      setSelected(null); setSoldoutReason('');
      alert(`⛔ 품절 처리 완료!\n모바일 앱에 즉시 반영됩니다.`);
    }
  };

  const cancelSoldout = (item) => {
    if (window.confirm(`'${item.name}' 품절을 해제하시겠어요?`)) {
      if (setRawProducts) setRawProducts(prev => prev.map(p => p.id === item.id ? { ...p, isSoldOut: false, status: '판매중' } : p));
    }
  };

  const openModal = (p) => { setSelected(p); setModalTab('receive'); setQty(''); setSoldoutReason(''); };

  return (
    <>
      {showStockTaking && (
        <StockTakingMode
          c={c} s={s} dark={dark}
          inv={inv} rawProducts={rawProducts} setRawProducts={setRawProducts}
          onClose={() => setShowStockTaking(false)}
        />
      )}
      <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <Sidebar currentPage="adminPC_inventory" setPage={setPage} dark={dark} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={s.topbar}>
            <div style={s.topbarTitle}>재고 관리</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button style={{ ...s.btnPrimary, background: '#534ab7' }} onClick={() => setShowStockTaking(true)}>📋 재고 실사</button>
              <DarkToggle dark={dark} setDark={setDark} />
            </div>
          </div>
          <div style={s.content}>
            {lowStockCount > 0 && (
              <div style={{ background: '#faeeda', border: '1px solid #fac775', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#854f0b' }}>
                ⚠️ 품절 임박 또는 품절 상품이 {lowStockCount}개 있어요.
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <input style={{ ...s.input, flex: 1 }} placeholder="상품명, SKU 검색..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={s.select} value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
                <option value="">전체 재고</option>
                <option value="ok">정상</option>
                <option value="low">품절 임박</option>
                <option value="out">품절</option>
              </select>
            </div>
            <div style={s.tableCard}>
              <table style={s.table}>
                <thead style={{ background: c.theadBg }}>
                  <tr>{['상품','현재 재고','재고 현황','최소 기준','최근 입고일','상태','관리'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: c.textTertiary, fontSize: 13 }}>
                      {inv.length === 0 ? '등록된 상품이 없어요' : '검색 결과가 없어요'}
                    </td></tr>
                  ) : filtered.map(p => {
                    const st = getStockStatus(p);
                    const pct = Math.round((p.stock / maxStock) * 100);
                    const barColor = st === 'ok' ? sg : st === 'low' ? '#ef9f27' : '#e24b4a';
                    const isSoldOut = p.isSoldOut || p.status === '판매중지';
                    return (
                      <tr key={p.id}>
                        <td style={s.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: c.thumbBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{CAT_ICON_LARGE[p.cat] || '📦'}</div>
                            <div><div style={{ fontWeight: 600, fontSize: 12, color: c.textPrimary }}>{p.name}</div><div style={{ fontSize: 10, color: c.textTertiary }}>{p.sku}</div></div>
                          </div>
                        </td>
                        <td style={{ ...s.td, fontWeight: 600, color: st === 'out' ? '#a32d2d' : st === 'low' ? '#854f0b' : c.textPrimary }}>{p.stock}개</td>
                        <td style={s.td}><div style={{ background: dark ? '#333' : '#eee', borderRadius: 3, height: 6, width: 80 }}><div style={{ height: 6, borderRadius: 3, background: barColor, width: `${pct}%` }} /></div></td>
                        <td style={{ ...s.td, color: c.textSecondary }}>{p.min}개</td>
                        <td style={{ ...s.td, color: c.textTertiary, fontSize: 11 }}>{p.lastIn}</td>
                        <td style={s.td}>
                          <span style={{ ...s.pill, background: STOCK_STYLE[st].bg, color: STOCK_STYLE[st].color }}>{STOCK_STYLE[st].label}</span>
                          {isSoldOut && <span style={{ ...s.pill, background: '#fcebeb', color: '#a32d2d', marginLeft: 4 }}>품절</span>}
                        </td>
                        <td style={s.td}>
                          <button style={{ ...s.actionBtn, borderColor: sg, color: sgd }} onClick={() => openModal(p)}>관리</button>
                          {isSoldOut && <button style={{ ...s.actionBtn, borderColor: sgd, color: sgd, marginLeft: 4 }} onClick={() => cancelSoldout(p)}>품절해제</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selected && (
          <div style={s.modalBg} onClick={() => setSelected(null)}>
            <div style={{ ...s.modal, width: 460 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>재고 관리</span>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ background: c.metricBg, borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: c.cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{CAT_ICON_LARGE[selected.cat] || '📦'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>{selected.name}</div>
                  <div style={{ fontSize: 11, color: c.textTertiary, marginTop: 2 }}>{selected.sku} · 현재 재고 <span style={{ fontWeight: 600, color: selected.stock === 0 ? '#a32d2d' : selected.stock < selected.min ? '#854f0b' : sgd }}>{selected.stock}개</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', borderBottom: `1px solid ${c.cardBorder}`, marginBottom: 18 }}>
                <div onClick={() => setModalTab('receive')} style={{ flex: 1, padding: '9px 0', textAlign: 'center', fontSize: 13, cursor: 'pointer', fontWeight: modalTab === 'receive' ? 600 : 400, color: modalTab === 'receive' ? sgd : c.textSecondary, borderBottom: modalTab === 'receive' ? `2px solid ${sg}` : '2px solid transparent', marginBottom: -1 }}>📦 입고 처리</div>
                <div onClick={() => setModalTab('soldout')} style={{ flex: 1, padding: '9px 0', textAlign: 'center', fontSize: 13, cursor: 'pointer', fontWeight: modalTab === 'soldout' ? 600 : 400, color: modalTab === 'soldout' ? '#a32d2d' : c.textSecondary, borderBottom: modalTab === 'soldout' ? '2px solid #e24b4a' : '2px solid transparent', marginBottom: -1 }}>⛔ 강제 품절 처리</div>
              </div>
              {modalTab === 'receive' && (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 5 }}>입고 수량</div>
                    <input style={{ width: '100%', padding: '8px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: c.inputBg, color: c.textPrimary }} type="number" placeholder="추가할 수량 입력" value={qty} onChange={e => setQty(e.target.value)} autoFocus />
                  </div>
                  {qty && Number(qty) > 0 && (
                    <div style={{ background: sgl, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: sgd, marginBottom: 12 }}>
                      입고 후 재고: {selected.stock} + {qty} = <strong>{selected.stock + Number(qty)}개</strong>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: c.textTertiary, marginBottom: 18 }}>입고 처리 시 재고 수량이 증가하고 품절 상태가 자동 해제돼요.</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={s.btn} onClick={() => setSelected(null)}>취소</button>
                    <button style={s.btnPrimary} onClick={processReceive}>입고 처리</button>
                  </div>
                </div>
              )}
              {modalTab === 'soldout' && (
                <div>
                  <div style={{ background: '#fff3f3', border: '1px solid #f09595', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#a32d2d', lineHeight: 1.6 }}>
                    ⚠️ 강제 품절 처리하면<br/>• 재고가 <strong>0개</strong>로 변경돼요<br/>• 모바일 앱에서 <strong>즉시 품절</strong>로 표시돼요
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 5 }}>품절 사유 <span style={{ color: c.textTertiary }}>(선택)</span></div>
                    <select style={{ width: '100%', padding: '8px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: c.inputBg, color: c.textPrimary }} value={soldoutReason} onChange={e => setSoldoutReason(e.target.value)}>
                      <option value="">사유 선택...</option>
                      <option value="재고 소진">재고 소진 (매장 판매로 인한 품절)</option>
                      <option value="입고 지연">입고 지연</option>
                      <option value="상품 불량">상품 불량</option>
                      <option value="시즌 종료">시즌 종료</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div style={{ fontSize: 11, color: c.textTertiary, marginBottom: 18 }}>품절 해제는 목록에서 <strong>품절해제</strong> 버튼을 누르거나 입고 처리를 하면 돼요.</div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={s.btn} onClick={() => setSelected(null)}>취소</button>
                    <button style={s.btnDanger} onClick={processSoldout}>⛔ 품절 처리</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
