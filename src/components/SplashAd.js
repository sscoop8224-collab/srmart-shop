import { useState, useEffect, useRef } from 'react';
import { readSplashPointer, resolveSplashImage, loadActiveSplashAd } from '../utils/splashAdCache';

// 콜드스타트 2번째(대기) 화면 — 활성 광고를 표시.
// 시퀀스: 네이티브 로고 스플래시(App이 유지) → 광고 이미지 준비되면 onReady()로 로고 내림 → 광고(최소 MIN_MS) → 콘텐츠.
//  · onReady: 광고 이미지가 실제 렌더(img onLoad)되거나, 광고가 없다고 판명되면 호출 → 로고에서 광고로 바로 전환(중간 녹색 제거).
//  · 최소 노출: 광고 이미지가 뜬 시점부터 최소 MIN_MS 유지. 콘텐츠가 이미지보다 먼저 준비돼도 이미지를 기다렸다 최소 노출 보장.
//  · 이미지 미표시(광고 없음/실패): 콘텐츠 준비 시 즉시(광고 없음) 또는 짧게 기다렸다(로드 중) dismiss.
const MIN_MS = 1400;

export default function SplashAd({ visible, storeId, onReady }) {
  const [img, setImg] = useState(null);
  const [imgShownAt, setImgShownAt] = useState(0);
  const [contentReady, setContentReady] = useState(false);
  const [noAd, setNoAd] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [gone, setGone] = useState(false);
  const readyRef = useRef(false);
  const signalReady = () => { if (!readyRef.current) { readyRef.current = true; if (onReady) onReady(); } };

  useEffect(() => {
    let alive = true;
    const objUrls = [];
    const track = (u) => { if (u && u.startsWith('blob:')) objUrls.push(u); };
    const applyCached = (u) => { if (!alive || !u) return; track(u); setImg((prev) => prev || u); };
    const applyLive = (u) => { if (!alive || !u) return; track(u); setImg(u); };

    const p = readSplashPointer();
    if (p && p.url) resolveSplashImage(p.url).then(applyCached);
    loadActiveSplashAd(storeId).then((absUrl) => {
      if (absUrl) resolveSplashImage(absUrl).then(applyLive);
      else if (!p || !p.url) { setNoAd(true); signalReady(); } // 광고 없음 + 캐시 없음 → 기다릴 것 없음(로고 즉시 내림)
    });
    return () => { alive = false; objUrls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!visible) setContentReady(true); }, [visible]);

  // dismiss 판정: 콘텐츠 준비 && 광고 이미지가 MIN_MS 이상 노출. 이미지가 콘텐츠보다 늦게 떠도 최소 노출 보장.
  useEffect(() => {
    if (!contentReady) return;
    if (imgShownAt) {
      const wait = Math.max(0, MIN_MS - (Date.now() - imgShownAt));
      const t = setTimeout(() => setFadeOut(true), wait);
      return () => clearTimeout(t);
    }
    // 이미지 아직 안 뜸: 광고 없음이면 즉시, 로드 중이면 잠깐 대기(뜨면 위 분기로 재실행 → 최소 노출).
    const t = setTimeout(() => setFadeOut(true), noAd ? 0 : 1200);
    return () => clearTimeout(t);
  }, [contentReady, imgShownAt, noAd]);

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
      {img && <img src={img} alt=""
        onLoad={() => { setImgShownAt((prev) => prev || Date.now()); signalReady(); }}   // 광고 렌더 완료 → 로고 내림 + 최소노출 기준시각
        onError={() => setImg(null)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
}
