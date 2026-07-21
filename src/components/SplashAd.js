import { useState, useEffect, useRef } from 'react';
import { readSplashPointer, resolveSplashImage, loadActiveSplashAd } from '../utils/splashAdCache';

// 콜드스타트 2번째(대기) 화면 — 활성 광고를 표시.
// 표시 경로 2가지:
//  1) 캐시된 포인터(직전 회차) → 즉시 시도(있을 때만 세팅)
//  2) 라이브 fetch(loadActiveSplashAd) → 현재 활성 광고(진실). 캐시가 stale이어도 라이브가 덮어씀.
// 부팅시점 프리페치(index.html)로 이미지가 HTTP 캐시에 미리 워밍됨 → 저사양 기기도 마운트 시 즉시 표시.
//
// 최소 노출(MIN_MS): 광고 이미지가 뜬 시점부터 최소 1.4초는 유지(콘텐츠가 더 빨리 준비돼도).
//  · 빠른 기기: 광고가 ~1초만 뜨던 걸 1.4초 보장(그만큼만 콘텐츠 진입 지연).
//  · 느린 기기: 이미 오래 떠 있어 추가 지연 0(적응형).
//  · 이미지가 아예 안 뜬 경우(광고 없음/실패)엔 초록을 붙잡지 않고 즉시 dismiss.
const MIN_MS = 1400;

export default function SplashAd({ visible, storeId }) {
  const [img, setImg] = useState(null);
  const [fadeOut, setFadeOut] = useState(false);
  const [gone, setGone] = useState(false);
  const imgAtRef = useRef(0); // 광고 이미지 최초 표시 시각(ms). 0 = 아직 안 뜸.

  useEffect(() => {
    let alive = true;
    const objUrls = [];
    const track = (u) => { if (u && u.startsWith('blob:')) objUrls.push(u); };
    const mark = () => { if (!imgAtRef.current) imgAtRef.current = Date.now(); };
    const applyCached = (u) => { if (!alive || !u) return; track(u); setImg((prev) => prev || u); mark(); }; // 비어있을 때만
    const applyLive = (u) => { if (!alive || !u) return; track(u); setImg(u); mark(); };                     // 항상 우선(진실)

    const p = readSplashPointer();
    if (p && p.url) resolveSplashImage(p.url).then(applyCached);
    loadActiveSplashAd(storeId).then((absUrl) => { if (absUrl) resolveSplashImage(absUrl).then(applyLive); });
    return () => { alive = false; objUrls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 콘텐츠 준비(visible=false) → 최소 노출 보장 후 페이드아웃. 이미지 없으면 즉시.
  useEffect(() => {
    if (visible) return;
    const wait = imgAtRef.current ? Math.max(0, MIN_MS - (Date.now() - imgAtRef.current)) : 0;
    const t = setTimeout(() => setFadeOut(true), wait);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (fadeOut) { const t = setTimeout(() => setGone(true), 320); return () => clearTimeout(t); }
  }, [fadeOut]);

  if (gone) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100000, background: '#077D3C',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut ? 0 : 1, transition: 'opacity 0.3s ease', pointerEvents: fadeOut ? 'none' : 'auto',
    }}>
      {/* stale/실패 이미지는 onError로 비워 라이브가 대체하게 함 */}
      {img && <img src={img} alt="" onError={() => setImg(null)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
}
