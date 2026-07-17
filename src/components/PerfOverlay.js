import { useState, useEffect } from 'react';

// [임시 계측] 스플래시~홈 구간 소요시간 오버레이. 네이티브 앱에서만 표시.
// navigationStart(=웹뷰가 URL 로드 시작)=0 기준 ms. 탭하면 닫힘, 15초 후 자동 숨김.
// 측정 끝나면 이 컴포넌트+마크 제거.
export default function PerfOverlay() {
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(true);

  useEffect(() => {
    const collect = () => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const t = (window.__perf && window.__perf.t) || {};
      const r = [];
      const push = (label, v) => { if (v != null && !isNaN(v) && v >= 0) r.push([label, Math.round(v)]); };
      push('HTML 응답', nav.responseEnd);          // 원격 페이지 수신 완료
      push('DOM 파싱', nav.domInteractive);         // HTML+동기 스크립트 실행
      push('React 시작', t.reactStart);
      push('App 마운트', t.appMount);
      push('첫 상품데이터', t.firstData);
      push('스플래시 hide', t.splashHide);
      setRows(r);
    };
    collect();
    const id = setInterval(collect, 400);
    const off = setTimeout(() => setShow(false), 15000);
    return () => { clearInterval(id); clearTimeout(off); };
  }, []);

  if (!show || !rows.length) return null;
  return (
    <div onClick={() => setShow(false)}
      style={{ position: 'fixed', top: 8, left: 8, zIndex: 99999, background: 'rgba(0,0,0,0.82)', color: '#fff',
        fontSize: 11, fontFamily: 'monospace', padding: '8px 10px', borderRadius: 8, lineHeight: 1.55, maxWidth: 230 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#00e28a' }}>⏱ 스플래시 구간(ms) · 탭=닫기</div>
      {rows.map((r, i) => (
        <div key={r[0]} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <span>{r[0]}</span>
          <span>{r[1]}{i > 0 ? ` (+${r[1] - rows[i - 1][1]})` : ''}</span>
        </div>
      ))}
    </div>
  );
}
