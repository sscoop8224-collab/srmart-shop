import { useState, useEffect, useRef } from 'react';
import { readSplashPointer, loadActiveSplashAd } from '../utils/splashAdCache';

// 콜드스타트 2번째(대기) 화면 — 활성 광고를 표시.
// 시퀀스: 네이티브 로고 스플래시(App 유지) → 광고 이미지가 실제 페인트되면 onReady()로 로고 내림 → 광고(최소 MIN_MS) → 콘텐츠.
//  · 이미지는 blob 대신 '원본 URL 직접' 사용 → 캐시/라이브가 같은 광고면 같은 URL(리로드·녹색 플래시 없음).
//    부팅시점 프리페치(index.html)가 HTTP 캐시를 워밍하므로 원본 URL도 즉시 로드됨.
//  · onReady는 img onLoad 후 '더블 rAF'(광고 프레임 합성 보장) 뒤 호출 → 로고 내릴 때 광고가 이미 화면에 있음(중간 녹색 제거).
//  · 최소 노출: 광고가 뜬 시점부터 최소 MIN_MS 유지. 콘텐츠가 이미지보다 먼저 준비돼도 이미지를 기다렸다 보장.
const MIN_MS = 1400;

export default function SplashAd({ visible, storeId, onReady }) {
  const [img, setImg] = useState(null);
  const [imgShownAt, setImgShownAt] = useState(0);
  const [contentReady, setContentReady] = useState(false);
  const [noAd, setNoAd] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [gone, setGone] = useState(false);
  const readyRef = useRef(false);
  const liveRef = useRef(null); // 라이브(현재 활성) 광고 URL — stale 캐시 onError 시 폴백
  const signalReady = () => { if (!readyRef.current) { readyRef.current = true; if (onReady) onReady(); } };

  useEffect(() => {
    let alive = true;
    const p = readSplashPointer();
    if (p && p.url) setImg((prev) => prev || p.url);          // 캐시 포인터 즉시(HTTP 캐시=프리페치 워밍)
    loadActiveSplashAd(storeId).then((absUrl) => {
      if (!alive) return;
      if (absUrl) { liveRef.current = absUrl; setImg((prev) => prev || absUrl); } // 같은 광고면 같은 URL→플래시 없음
      else if (!p || !p.url) { setNoAd(true); signalReady(); }                     // 광고 없음+캐시 없음 → 로고 즉시 내림
    });
    return () => { alive = false; };
  }, [storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!visible) setContentReady(true); }, [visible]);

  // dismiss 판정: 콘텐츠 준비 && 광고가 MIN_MS 이상 노출. 이미지가 콘텐츠보다 늦게 떠도 최소 노출 보장.
  useEffect(() => {
    if (!contentReady) return;
    if (imgShownAt) {
      const wait = Math.max(0, MIN_MS - (Date.now() - imgShownAt));
      const t = setTimeout(() => setFadeOut(true), wait);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setFadeOut(true), noAd ? 0 : 1200); // 광고 없으면 즉시, 로드 중이면 잠깐 대기
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
        onLoad={() => { setImgShownAt((prev) => prev || Date.now()); requestAnimationFrame(() => requestAnimationFrame(signalReady)); }}
        onError={() => setImg((cur) => (liveRef.current && liveRef.current !== cur) ? liveRef.current : null)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
    </div>
  );
}
