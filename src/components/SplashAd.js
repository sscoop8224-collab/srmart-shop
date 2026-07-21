import { useState, useEffect } from 'react';
import { readSplashPointer, resolveSplashImage, loadActiveSplashAd } from '../utils/splashAdCache';

// 콜드스타트 2번째(대기) 화면 — 활성 광고를 표시.
// 표시 경로 2가지:
//  1) 캐시된 포인터(직전 회차) → 즉시 시도(있을 때만 세팅)
//  2) 라이브 fetch(loadActiveSplashAd) → 현재 활성 광고(진실). 캐시가 stale이어도 라이브가 덮어씀.
// 부팅시점 프리페치(index.html)로 이미지가 HTTP 캐시에 미리 워밍됨 → 저사양 기기도 마운트 시 즉시 표시.
// visible=false(콘텐츠 준비)면 페이드아웃 후 제거. 이미지 로드와 dismiss는 무관 → 로딩 지연 0.
export default function SplashAd({ visible, storeId }) {
  const [img, setImg] = useState(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let alive = true;
    const objUrls = [];
    const track = (u) => { if (u && u.startsWith('blob:')) objUrls.push(u); };
    const applyCached = (u) => { if (!alive || !u) return; track(u); setImg((prev) => prev || u); }; // 비어있을 때만(빠른 첫 표시)
    const applyLive = (u) => { if (!alive || !u) return; track(u); setImg(u); };                     // 항상 우선(현재 활성 광고 = 진실)

    const p = readSplashPointer();
    if (p && p.url) resolveSplashImage(p.url).then(applyCached);
    loadActiveSplashAd(storeId).then((absUrl) => { if (absUrl) resolveSplashImage(absUrl).then(applyLive); });
    return () => { alive = false; objUrls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* stale/실패 이미지는 onError로 비워 라이브가 대체하게 함 */}
      {img && <img src={img} alt="" onError={() => setImg(null)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
}
