// 홈 종(공지) 위 빨간 점 — 「마지막으로 본 공지」보다 새 공지가 있나 (개발 표 #22 · 2026-11-17 낮 지시 5)
//
//   서버 자료: GET /api/shop/notices?store_id= (전 매장 공지 + 그 매장 공지 · created_at 'YYYY-MM-DD HH:mm' 글자).
//   읽음 기록은 서버에 없다 — 이 기기·이 브랜드에 「본 공지 중 가장 늦은 시각」만 둔다(글자 비교 · 날짜 밀림 없음).
//   🔴 브랜드마다 따로: /srm · /aram 이 같은 출처라 localStorage 를 같이 쓴다(GUEST_STORE_KEY 와 같은 까닭).
//   🔴 오래된 공지로는 점을 켜지 않는다(RECENT_DAYS) — 처음 깐 손님에게 몇 달 전 공지로 점이 늘 켜져 있으면 점을 무시하게 된다.
import { BRAND } from '../brand';

export const NOTICE_SEEN_KEY = BRAND.code === 'srm' ? 'srmart_notice_seen' : `srmart_notice_seen:${BRAND.code}`;
export const RECENT_DAYS = 14;

const pad = (n) => String(n).padStart(2, '0');
/** Date → 'YYYY-MM-DD HH:mm'(그 지역 시각 — 서버 글자와 같은 모양) */
export const stamp = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function readSeen() {
  try { return localStorage.getItem(NOTICE_SEEN_KEY) || ''; } catch (e) { return ''; }
}

/** 가장 늦은 공지 시각. 없으면 '' */
export function latestOf(list) {
  return (Array.isArray(list) ? list : []).reduce((m, n) => (n && String(n.created_at || '') > m ? String(n.created_at) : m), '');
}

/** 점을 켤까 — 본 것보다 늦고, 최근 RECENT_DAYS 안의 공지가 있으면 */
export function hasNewNotice(list, seen = readSeen(), now = new Date()) {
  const from = stamp(new Date(now.getTime() - RECENT_DAYS * 86400000));
  const floor = seen > from ? seen : from;
  return (Array.isArray(list) ? list : []).some(n => n && String(n.created_at || '') > floor);
}

/** 공지 화면에서 목록을 받았을 때 — 본 것으로 적는다(뒤로 가지 않는다) */
export function markSeen(list) {
  const latest = latestOf(list);
  if (!latest || latest <= readSeen()) return;
  try { localStorage.setItem(NOTICE_SEEN_KEY, latest); } catch (e) { /* 저장 못 하면 다음에 점이 다시 켜질 뿐 */ }
}
