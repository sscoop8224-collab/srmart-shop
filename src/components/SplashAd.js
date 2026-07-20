import { useState, useEffect } from 'react';
import { readSplashPointer, resolveSplashImage, loadActiveSplashAd } from '../utils/splashAdCache';

// 콜드스타트 2번째(대기) 화면 — 활성 광고를 표시.
// 표시 경로 2가지(먼저 준비되는 것으로 표시):
//  1) 캐시된 포인터 → Cache API에서 즉시(blob) — 2회차부터 즉시 표시
//  2) 라이브 fetch(loadActiveSplashAd) → 캐시 없는 첫 콜드스타트에도 표시(+다음번 캐시 갱신)
// visible=false(콘텐츠 준비)면 페이드아웃 후 제거. 이미지 로드와 dismiss는 무관 → 로딩 지연 0.
export default function SplashAd({ visible, storeId }) {
  const [img, setImg] = useState(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let alive = true;
    const objUrls = [];
    const apply = (u) => {
      if (!alive || !u) { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); return; }
      if (u.startsWith('blob:')) objUrls.push(u);
      setImg((prev) => prev || u); // 먼저 준비된 이미지로 표시(중복 교체 방지 → 깜빡임 없음)
    };
    // 1) 캐시된 포인터 즉시 시도
    const p = readSplashPointer();
    if (p && p.url) resolveSplashImage(p.url).then(apply);
    // 2) 라이브 조회 — 첫 콜드스타트(캐시 없음)에도 표시 + 다음번 캐시 갱신
    loadActiveSplashAd(storeId).then((absUrl) => {
      if (absUrl) resolveSplashImage(absUrl).then(apply);
    });
    return () => { alive = false; objUrls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [storeId]);

  useEffect(() => {
    if (!visible) { const t = setTimeout(() => setGone(true), 320); return () => clearTimeout(t); }
  }, [visible]);

  if (gone) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000, background: '#077D3C',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: visible ? 'auto' : 'none',
    }}>
      {img && <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
}
