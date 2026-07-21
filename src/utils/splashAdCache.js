// 스플래시 광고 캐싱 — 콜드스타트마다 '즉시' 표시하기 위한 헬퍼.
// /uploads 는 서비스워커 스코프(/shop/) 밖이라 SW가 캐시하지 않으므로, 페이지에서 직접:
//  · 표시할 광고 포인터(id,url)를 localStorage에 저장 → 다음 콜드스타트에 네트워크 없이 바로 렌더
//  · 이미지 바이트는 Cache API에 저장 → caches.match로 즉시(blob) 로드
//  · 백그라운드로 활성 광고를 갱신해 '다음' 콜드스타트용 포인터/캐시를 최신화(이번 표시엔 영향 없음 → 로딩 지연 0)
import { getSplashAds, imgUrl } from '../api';

const CACHE = 'srmart-splash-ads-v1';
const LS_KEY = 'srmart_splash_ad';

export function readSplashPointer() {
  try { const v = localStorage.getItem(LS_KEY); return v ? JSON.parse(v) : null; } catch (e) { return null; }
}
function writePointer(p) { try { p ? localStorage.setItem(LS_KEY, JSON.stringify(p)) : localStorage.removeItem(LS_KEY); } catch (e) {} }

// 캐시(우선) 또는 네트워크에서 이미지 objectURL 확보. 실패 시 원본 URL(HTTP 캐시 경유) 반환.
// 반환이 blob:이면 호출측이 revoke 책임.
export async function resolveSplashImage(absUrl) {
  try {
    if ('caches' in window) {
      const c = await caches.open(CACHE);
      let res = await c.match(absUrl);
      if (!res) { await c.add(absUrl); res = await c.match(absUrl); }
      if (res) { const blob = await res.blob(); return URL.createObjectURL(blob); }
    }
  } catch (e) { /* 네이티브에선 CapacitorHttp가 가로채 caches.add가 실패할 수 있음 → 원본 URL 폴백 */ }
  return absUrl; // 폴백: 원본 URL 직접(HTTP 캐시 경유, 부팅시점 프리페치로 워밍됨)
}

// 활성 광고를 서버에서 조회 → 포인터/캐시 갱신 후 이미지 절대 URL 반환(없으면 null).
// SplashAd가 마운트 때 호출: 캐시가 없는 첫 콜드스타트에도 이 라이브 조회로 광고를 띄운다(다음번엔 캐시로 즉시).
// dismiss(콘텐츠 준비)와 무관하게 동작하므로 로딩 지연 0.
export async function loadActiveSplashAd(storeId) {
  try {
    const res = await getSplashAds(storeId);
    const ad = (res.data || [])[0]; // 노출순서 첫 활성 광고
    if (!ad || !ad.image_url) { writePointer(null); return null; }
    const absUrl = imgUrl(ad.image_url);
    writePointer({ id: ad.id, url: absUrl });
    if ('caches' in window) {
      try {
        const c = await caches.open(CACHE);
        const keys = await c.keys();
        await Promise.all(keys.filter(k => k.url !== absUrl).map(k => c.delete(k))); // 이전 광고 캐시 정리
        if (!(await c.match(absUrl))) await c.add(absUrl);
      } catch (e) { /* 캐시 실패해도 URL은 반환(HTTP 캐시로 표시) */ }
    }
    return absUrl;
  } catch (e) { return null; }
}
