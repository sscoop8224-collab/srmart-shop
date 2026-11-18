// 픽업 기한 표기 — 주문 완료(S53)와 주문내역이 같은 말로 (2026-11-17 낮 지시 5)
//
// 🔴 날짜는 **서버가 주문을 넣을 때 정한 값**(orders.pickup_deadline — 결제일 + 매장 보관일 · 23:59:59)만 쓴다.
//    앱이 「오늘 + 3일」을 따로 계산하면 자정 무렵이나 기기 시계가 틀린 폰에서 하루 어긋난다 — 손님이 하루 늦게 와서 헛걸음한다.
// 서버는 두 모양으로 준다: JSON 날짜(ISO · 주문 응답·내 주문 목록) 또는 'YYYY-MM-DD HH:mm:ss'(DATE_FORMAT). 둘 다 받는다.
const DOW = ['일', '월', '화', '수', '목', '금', '토'];

/** 값 → Date(그 지역 시각). 못 읽으면 null. */
export function pickupDeadlineDate(v) {
  if (!v) return null;
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})/);   // 'YYYY-MM-DD HH:mm…' — 서버 지역 시각 그대로
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 「11월 20일(금)까지」 — 기한은 그날 끝(23:59)이라 시각은 적지 않는다. 못 읽으면 ''. */
export function pickupDeadlineLabel(v) {
  const d = pickupDeadlineDate(v);
  return d ? `${d.getMonth() + 1}월 ${d.getDate()}일(${DOW[d.getDay()]})까지` : '';
}
