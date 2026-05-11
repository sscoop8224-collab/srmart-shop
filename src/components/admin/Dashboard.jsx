// ✅ localStorage 완전 제거 — dark/setDark 는 App.js props 만 사용
import Sidebar from '../layout/Sidebar';

const sg = '#00c471';
const sgd = '#009a58';
const sgl = '#e6f9f1';

const LIGHT = {
  bg: '#f5f5f3', cardBg: '#ffffff', cardBorder: '#e0e0e0',
  metricBg: '#efefed', textPrimary: '#1a1a1a', textSecondary: '#444444',
  textTertiary: '#777777', topbarBg: '#ffffff', topbarBorder: '#e0e0e0', barEmpty: '#e0e0e0',
};
const DARK = {
  bg: '#111111', cardBg: '#1e1e1e', cardBorder: '#2e2e2e',
  metricBg: '#252525', textPrimary: '#f0f0f0', textSecondary: '#bbbbbb',
  textTertiary: '#777777', topbarBg: '#1a1a1a', topbarBorder: '#2e2e2e', barEmpty: '#333333',
};

const WEEKLY = [
  { day: '월', orders: 68 }, { day: '화', orders: 82 }, { day: '수', orders: 74 },
  { day: '목', orders: 91 }, { day: '금', orders: 88 }, { day: '토', orders: 95 },
  { day: '오늘', orders: 84 },
];
const TOP_PRODUCTS = [
  { icon: '🍎', name: '유기농 사과', sales: 142, pct: 100 },
  { icon: '🥩', name: '한우 불고기', sales: 98, pct: 69 },
  { icon: '🥛', name: '서울우유 1L', sales: 87, pct: 61 },
  { icon: '🥚', name: '계란 30구', sales: 76, pct: 54 },
  { icon: '🍓', name: '신선 딸기', sales: 64, pct: 45 },
];
const RECENT_ORDERS = [
  { id: '#ORD-1048', name: '김지수', product: '유기농 사과 외 2', amount: 34500, status: '결제완료' },
  { id: '#ORD-1047', name: '이민준', product: '제주 삼다수 20L', amount: 15900, status: '배송중' },
  { id: '#ORD-1046', name: '박서연', product: '한우 불고기 500g', amount: 52000, status: '입금대기' },
  { id: '#ORD-1045', name: '최현우', product: '신선 딸기 1kg', amount: 18800, status: '결제완료' },
  { id: '#ORD-1044', name: '정유나', product: '계란 30구', amount: 8500, status: '취소' },
];
const STATUS_COLOR = {
  결제완료: { bg: sgl, color: sgd },
  배송중: { bg: '#e6f1fb', color: '#185fa5' },
  입금대기: { bg: '#faeeda', color: '#854f0b' },
  취소: { bg: '#fcebeb', color: '#a32d2d' },
};

export default function Dashboard({ setPage, dark, setDark }) {
  // ✅ dark 는 오직 props 에서만 받음 — useState/localStorage 없음
  const c = dark ? DARK : LIGHT;

  const today = new Date();
  const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')} (${'일월화수목금토'[today.getDay()]})`;
  const maxOrders = Math.max(...WEEKLY.map(w => w.orders));

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC" setPage={setPage} dark={dark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ✅ 상단바 — paddingTop으로 상태바 겹침 방지 */}
        <div style={{
          background: c.topbarBg,
          borderBottom: `1px solid ${c.topbarBorder}`,
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>대시보드</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: c.textSecondary, background: c.metricBg, padding: '4px 10px', borderRadius: 8, border: `1px solid ${c.cardBorder}` }}>
              {dateStr}
            </div>
            {/* ✅ 다크모드 토글 — App.js 의 setDark 직접 호출 */}
            <div
              onClick={() => setDark(!dark)}
              title={dark ? '라이트 모드' : '다크 모드'}
              style={{ width: 42, height: 24, borderRadius: 12, background: dark ? sg : '#ccc', cursor: 'pointer', position: 'relative', transition: 'background .25s', flexShrink: 0 }}
            >
              <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: dark ? 21 : 3, transition: 'left .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                {dark ? '🌙' : '☀️'}
              </div>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* 지표 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: '오늘 매출', value: '₩2,847,500', change: '▲ 어제보다 12.4% 증가', up: true },
              { label: '오늘 주문', value: '84건', change: '▲ 어제보다 7건 증가', up: true },
              { label: '신규 회원', value: '12명', change: '▲ 이번 주 평균 대비 +3', up: true },
              { label: '처리 대기', value: '7건', change: '▼ 처리 필요', up: false },
            ].map((m) => (
              <div key={m.label} style={{ background: c.metricBg, borderRadius: 8, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: c.textSecondary, marginBottom: 6 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px', color: c.textPrimary }}>{m.value}</div>
                <div style={{ fontSize: 11, marginTop: 4, color: m.up ? sgd : '#e24b4a' }}>{m.change}</div>
              </div>
            ))}
          </div>

          {/* 차트 + 결제 수단 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 16 }}>
            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>주간 매출 추이</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130 }}>
                {WEEKLY.map((w, i) => {
                  const h = Math.round((w.orders / maxOrders) * 120);
                  const isToday = i === WEEKLY.length - 1;
                  return (
                    <div key={w.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{ width: 18, height: h, borderRadius: '3px 3px 0 0', background: sg, opacity: isToday ? 1 : 0.75 }} />
                      </div>
                      <div style={{ fontSize: 10, color: isToday ? sgd : c.textTertiary, marginTop: 4 }}>{w.day}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>결제 수단</div>
              <svg width="80" height="80" viewBox="0 0 80 80" style={{ display: 'block', margin: '0 auto 12px' }}>
                <circle cx="40" cy="40" r="30" fill="none" stroke={c.barEmpty} strokeWidth="14" />
                <circle cx="40" cy="40" r="30" fill="none" stroke={sg} strokeWidth="14" strokeDasharray="113 75" strokeDashoffset="24" />
                <circle cx="40" cy="40" r="30" fill="none" stroke="#FAC775" strokeWidth="14" strokeDasharray="45 143" strokeDashoffset="-89" />
                <circle cx="40" cy="40" r="30" fill="none" stroke="#85B7EB" strokeWidth="14" strokeDasharray="30 158" strokeDashoffset="-134" />
              </svg>
              {[{ color: sg, label: '카카오페이', pct: '60%' }, { color: '#FAC775', label: '신용카드', pct: '24%' }, { color: '#85B7EB', label: '무통장', pct: '16%' }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.textSecondary, marginBottom: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />{l.label} {l.pct}
                </div>
              ))}
            </div>
          </div>

          {/* 최근 주문 + 인기 상품 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>최근 주문</div>
              {RECENT_ORDERS.map(o => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${c.cardBorder}`, fontSize: 12 }}>
                  <div style={{ fontWeight: 600, width: 80, color: c.textPrimary }}>{o.id}</div>
                  <div style={{ flex: 1, color: c.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.name} · {o.product}</div>
                  <div style={{ fontWeight: 600, color: c.textPrimary }}>₩{o.amount.toLocaleString()}</div>
                  <div style={{ fontSize: 10, padding: '2px 9px', borderRadius: 10, fontWeight: 500, background: STATUS_COLOR[o.status]?.bg, color: STATUS_COLOR[o.status]?.color }}>{o.status}</div>
                </div>
              ))}
            </div>
            <div style={{ background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>인기 상품 TOP 5</div>
              {TOP_PRODUCTS.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${c.cardBorder}`, fontSize: 12 }}>
                  <div style={{ width: 16, fontSize: 10, color: c.textTertiary, textAlign: 'center' }}>{i + 1}</div>
                  <div style={{ fontSize: 18 }}>{p.icon}</div>
                  <div style={{ flex: 1, fontWeight: 600, color: c.textPrimary }}>{p.name}</div>
                  <div style={{ color: c.textSecondary, width: 42, textAlign: 'right' }}>{p.sales}개</div>
                  <div style={{ width: 60 }}>
                    <div style={{ background: c.barEmpty, borderRadius: 2, height: 4 }}>
                      <div style={{ width: `${p.pct}%`, height: 4, borderRadius: 2, background: sg }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
