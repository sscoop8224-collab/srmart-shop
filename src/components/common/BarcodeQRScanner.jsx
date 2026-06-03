import { useEffect, useRef, useState } from 'react';

const SCAN_ICON = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <line x1="7" y1="8" x2="7" y2="16"/>
    <line x1="11" y1="8" x2="11" y2="16"/>
    <line x1="15" y1="8" x2="15" y2="16"/>
    <line x1="17" y1="8" x2="17" y2="16"/>
  </svg>
);

function isUrl(str) {
  try { return Boolean(new URL(str)); } catch { return false; }
}

function isJson(str) {
  try { JSON.parse(str); return true; } catch { return false; }
}

function detectType(value) {
  // QR코드: URL, JSON, 또는 상당히 긴 텍스트
  if (isUrl(value) || isJson(value)) return 'qrcode';
  // 숫자만 8~13자리 → 바코드
  if (/^\d{8,13}$/.test(value)) return 'barcode';
  // 나머지는 QR코드로 간주
  return 'qrcode';
}

export default function BarcodeQRScanner({ onScanSuccess, onClose, darkMode }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [lastScan, setLastScan] = useState('');

  const safeStop = async (scanner) => {
    if (!scanner) return;
    try {
      const state = scanner.getState();
      if (state === 2) await scanner.stop();
      await scanner.clear();
    } catch (e) {
      console.log('스캐너 종료 (무시):', e?.message);
    }
  };

  useEffect(() => {
    let scanner;

    const start = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

        scanner = new Html5Qrcode('bqr-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          async (decodedText) => {
            if (decodedText === lastScan) return; // 연속 중복 방지
            setLastScan(decodedText);

            const type = detectType(decodedText);
            await safeStop(scanner);
            scannerRef.current = null;
            onScanSuccess({ type, value: decodedText });
          },
          () => {}
        );
      } catch (err) {
        if (err?.message?.toLowerCase().includes('permission')) {
          setError('카메라 권한이 필요해요. 휴대폰 설정에서 권한을 허용해주세요.');
        } else {
          setError('카메라를 시작할 수 없어요. 다른 앱이 카메라를 사용 중이거나 기기가 지원하지 않아요.');
        }
      }
    };

    const timer = setTimeout(start, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        safeStop(scannerRef.current).finally(() => { scannerRef.current = null; });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = async () => {
    await safeStop(scannerRef.current);
    scannerRef.current = null;
    onClose();
  };

  const green = '#00c471';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>

      {/* 상단 바 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: green }}>{SCAN_ICON}</span>
          <span style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>바코드 / QR 스캔</span>
        </div>
        <button onClick={handleClose}
          style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ✕
        </button>
      </div>

      {/* 카메라 뷰 */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <div id="bqr-reader" style={{ width: '100%', maxWidth: 480 }} />

        {/* 가이드 오버레이 */}
        {!error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 280, height: 170, position: 'relative' }}>
              {/* 어두운 외곽 */}
              <div style={{ position: 'absolute', inset: 0, boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)', borderRadius: 12 }} />
              {/* 테두리 */}
              <div style={{ position: 'absolute', inset: 0, border: `2px solid ${green}`, borderRadius: 12 }} />
              {/* 코너 강조 */}
              {[
                { top: -3, left: -3, borderTop: `4px solid ${green}`, borderLeft: `4px solid ${green}`, borderRadius: '4px 0 0 0' },
                { top: -3, right: -3, borderTop: `4px solid ${green}`, borderRight: `4px solid ${green}`, borderRadius: '0 4px 0 0' },
                { bottom: -3, left: -3, borderBottom: `4px solid ${green}`, borderLeft: `4px solid ${green}`, borderRadius: '0 0 0 4px' },
                { bottom: -3, right: -3, borderBottom: `4px solid ${green}`, borderRight: `4px solid ${green}`, borderRadius: '0 0 4px 0' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'absolute', width: 24, height: 24, ...s }} />
              ))}
              {/* 스캔 라인 */}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${green}, transparent)`, transform: 'translateY(-50%)' }} />
            </div>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div style={{ position: 'absolute', padding: '24px', background: 'rgba(0,0,0,0.85)', borderRadius: 16, margin: 20, textAlign: 'center', maxWidth: 320 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📵</div>
            <div style={{ color: 'white', fontSize: 14, lineHeight: 1.7 }}>{error}</div>
            <button onClick={handleClose}
              style={{ marginTop: 16, padding: '10px 28px', background: green, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              닫기
            </button>
          </div>
        )}
      </div>

      {/* 하단 안내 */}
      {!error && (
        <div style={{ padding: '14px 20px 36px', textAlign: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: '0 0 4px' }}>
            바코드 또는 QR코드를 화면에 비춰주세요
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
            자동 감지 · EAN-13, CODE-128, QR 등 지원
          </p>
        </div>
      )}
    </div>
  );
}

// 스캔 버튼 아이콘 (재사용용으로 export)
export function ScanButtonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      <line x1="7" y1="8" x2="7" y2="16"/>
      <line x1="11" y1="8" x2="11" y2="16"/>
      <line x1="15" y1="8" x2="15" y2="16"/>
      <line x1="17" y1="8" x2="17" y2="16"/>
    </svg>
  );
}
