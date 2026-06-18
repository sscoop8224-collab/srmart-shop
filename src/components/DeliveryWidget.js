import { useState } from 'react';
import API from '../api';

const LS_KEY = 'srmart_delivery_check';

function loadCached() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; }
}

export default function DeliveryWidget({ dark, totalAmount = 0 }) {
  const [zipcode, setZipcode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(loadCached);
  const [error, setError] = useState('');

  const check = async () => {
    const zc = zipcode.trim();
    if (!zc || zc.length < 5) { setError('5자리 우편번호를 입력해주세요'); return; }
    setError('');
    setChecking(true);
    try {
      const res = await API.get('/delivery/check', { params: { zipcode: zc, total_amount: totalAmount } });
      const data = { ...res.data, checkedZipcode: zc };
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      setResult(data);
    } catch {
      setError('배송 확인 중 오류가 발생했어요');
    } finally { setChecking(false); }
  };

  const reset = () => {
    setResult(null); setZipcode(''); setError('');
    localStorage.removeItem(LS_KEY);
  };

  const bg        = dark ? '#0d2a1a' : '#f0faf5';
  const border    = dark ? '#1e3a28' : '#b8eacc';
  const failBg    = dark ? '#2a0d0d' : '#fff5f5';
  const failBorder= dark ? '#3a1e1e' : '#ffd5d5';
  const inputBg   = dark ? '#1e1e2e' : '#f8f9fa';
  const inputBord = dark ? '#2e2e3e' : '#dee2e6';

  if (result?.available === true) {
    return (
      <div style={{ margin: '8px 16px', padding: '10px 14px', background: bg, border: `1.5px solid ${border}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <span style={{ fontSize: 14 }}>📍</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#00a85e' }}>{result.store_name}</span>
          <span style={{ fontSize: 12, color: dark ? '#9abad0' : '#444' }}>배송 가능</span>
          {result.is_free ? (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#00c471', background: dark ? '#1e3a28' : '#e6f9f0', padding: '1px 7px', borderRadius: 10 }}>무료배송</span>
          ) : (
            <span style={{ fontSize: 12, color: dark ? '#ccc' : '#333', fontWeight: 600 }}>배송비 {Number(result.delivery_fee).toLocaleString()}원</span>
          )}
          {result.free_delivery_min && !result.is_free && (
            <span style={{ fontSize: 11, color: dark ? '#777' : '#999' }}>({Number(result.free_delivery_min).toLocaleString()}원↑ 무료)</span>
          )}
        </div>
        <button onClick={reset}
          style={{ fontSize: 11, padding: '3px 10px', background: 'transparent', color: dark ? '#666' : '#aaa', border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
          변경
        </button>
      </div>
    );
  }

  if (result?.available === false) {
    return (
      <div style={{ margin: '8px 16px', padding: '10px 14px', background: failBg, border: `1.5px solid ${failBorder}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <span style={{ fontSize: 14 }}>📍 </span>
          <span style={{ fontSize: 12, color: dark ? '#ccc' : '#555' }}>{result.checkedZipcode} — </span>
          <span style={{ fontSize: 12, color: '#e53935', fontWeight: 700 }}>배송 불가 지역</span>
        </div>
        <button onClick={reset}
          style={{ fontSize: 11, padding: '3px 10px', background: 'transparent', color: '#e53935', border: `1px solid ${failBorder}`, borderRadius: 6, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
          다시 확인
        </button>
      </div>
    );
  }

  return (
    <div style={{ margin: '8px 16px', padding: '10px 14px', background: inputBg, border: `1.5px solid ${inputBord}`, borderRadius: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: dark ? '#8090a0' : '#555', marginBottom: 8 }}>
        📍 배송 가능 지역 확인
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={zipcode}
          onChange={e => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="우편번호 5자리"
          maxLength={5}
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: `1px solid ${inputBord}`, fontSize: 13, background: dark ? '#2a2a3e' : 'white', color: dark ? '#e0e0f0' : '#333', outline: 'none', fontFamily: 'monospace', letterSpacing: 2 }} />
        <button onClick={check} disabled={checking}
          style={{ padding: '8px 16px', background: checking ? '#aaa' : 'linear-gradient(135deg,#00c471,#00a85e)', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: checking ? 'default' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          {checking ? '확인 중' : '확인'}
        </button>
      </div>
      {error && <div style={{ fontSize: 11, color: '#e53935', marginTop: 6 }}>{error}</div>}
    </div>
  );
}
