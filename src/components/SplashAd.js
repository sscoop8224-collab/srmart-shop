import { useState, useEffect } from 'react';
import { readSplashPointer, resolveSplashImage } from '../utils/splashAdCache';

// 콜드스타트 2번째(대기) 화면 — 캐시된 활성 광고를 즉시 표시.
// visible=false가 되면(콘텐츠 준비 완료) 페이드아웃 후 제거. 이미지 로드 여부와 dismiss는 무관 → 로딩 지연 0.
// 캐시된 광고가 없으면(최초 1회) 초록 배경만 표시하고, 백그라운드 갱신이 다음 콜드스타트용으로 캐싱.
export default function SplashAd({ visible }) {
  const [img, setImg] = useState(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let objUrl = null, alive = true;
    const p = readSplashPointer();
    if (p && p.url) {
      resolveSplashImage(p.url).then((u) => {
        if (!alive) { if (u && u.startsWith('blob:')) URL.revokeObjectURL(u); return; }
        if (u && u.startsWith('blob:')) objUrl = u;
        setImg(u);
      });
    }
    return () => { alive = false; if (objUrl) URL.revokeObjectURL(objUrl); };
  }, []);

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
