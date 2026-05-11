import { useState } from 'react';
import Sidebar from '../layout/Sidebar';

const sg = '#00c471';
const sgd = '#009a58';
const sgl = '#e6f9f1';

const LIGHT = { bg: '#f5f5f3', cardBg: '#ffffff', cardBorder: '#e0e0e0', metricBg: '#efefed', textPrimary: '#1a1a1a', textSecondary: '#444444', textTertiary: '#777777', topbarBg: '#ffffff', topbarBorder: '#e0e0e0', theadBg: '#f0f0ee', inputBg: '#ffffff', inputBorder: '#dddddd', reviewBg: '#ffffff', replyBg: '#f5f5f3' };
const DARK  = { bg: '#111111', cardBg: '#1e1e1e', cardBorder: '#2e2e2e', metricBg: '#252525', textPrimary: '#f0f0f0', textSecondary: '#bbbbbb', textTertiary: '#777777', topbarBg: '#1a1a1a', topbarBorder: '#2e2e2e', theadBg: '#252525', inputBg: '#252525', inputBorder: '#3a3a3a', reviewBg: '#1e1e1e', replyBg: '#252525' };

function DarkToggle({ dark, setDark }) {
  return (
    <div onClick={() => setDark(!dark)} title={dark ? '라이트 모드' : '다크 모드'}
      style={{ width: 42, height: 24, borderRadius: 12, background: dark ? sg : '#ccc', cursor: 'pointer', position: 'relative', transition: 'background .25s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: dark ? 21 : 3, transition: 'left .25s', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
        {dark ? '🌙' : '☀️'}
      </div>
    </div>
  );
}

function makeStyles(c) {
  return {
    topbar: {
      background: c.topbarBg, borderBottom: `1px solid ${c.topbarBorder}`,
      paddingLeft: 24, paddingRight: 24,
      paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    },
    topbarTitle: { fontSize: 15, fontWeight: 600, color: c.textPrimary },
    content: { flex: 1, overflowY: 'auto', padding: '20px 24px' },
    sumCard: { background: c.metricBg, borderRadius: 8, padding: '10px 14px' },
    sumLabel: { fontSize: 10, color: c.textSecondary, marginBottom: 4 },
    card: { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: '16px 18px' },
    sectionCard: { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: '20px 22px', marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: 600, color: c.textPrimary, marginBottom: 14 },
    input: { padding: '7px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, outline: 'none', background: c.inputBg, color: c.textPrimary },
    select: { padding: '7px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, background: c.inputBg, color: c.textPrimary, outline: 'none', cursor: 'pointer' },
    tableCard: { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: c.textSecondary, borderBottom: `1px solid ${c.cardBorder}` },
    td: { padding: '10px 14px', borderBottom: `1px solid ${c.cardBorder}`, verticalAlign: 'middle', color: c.textPrimary },
    pill: { display: 'inline-block', fontSize: 10, padding: '2px 9px', borderRadius: 10, fontWeight: 500 },
    actionBtn: { background: 'none', border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: c.textSecondary, cursor: 'pointer' },
    btn: { padding: '6px 14px', borderRadius: 8, border: `1px solid ${c.cardBorder}`, background: c.metricBg, fontSize: 12, cursor: 'pointer', color: c.textPrimary },
    btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: sg, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: 24, width: 460 },
    formLabel: { fontSize: 12, color: c.textSecondary, marginBottom: 5 },
    formInput: { width: '100%', padding: '8px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: c.inputBg, color: c.textPrimary },
  };
}

// =============================================
// MemberManagement — 회원 관리 (✅ users props 연동)
// =============================================
const MEMBER_STATUS = { 활성: { bg: sgl, color: sgd }, 휴면: { bg: '#f1efe8', color: '#5f5e5a' }, 차단: { bg: '#fcebeb', color: '#a32d2d' } };
const GRADE_STYLE = { VIP: { bg: '#eeedfe', color: '#534ab7' }, 일반: { bg: '#f1efe8', color: '#5f5e5a' }, 관리자: { bg: '#e6f1fb', color: '#185fa5' } };
const AVATAR_COLORS = [{ bg: sgl, color: sgd }, { bg: '#e6f1fb', color: '#185fa5' }, { bg: '#faeeda', color: '#854f0b' }, { bg: '#fbeaf0', color: '#993556' }, { bg: '#eeedfe', color: '#534ab7' }];

export function MemberManagement({ setPage, dark, setDark, users = [], setUsers }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [selected, setSelected] = useState(null);

  // App.js users → 회원 목록 형식으로 변환
  const members = users.map((u, i) => ({
    id: u.id || i + 1,
    name: u.name,
    email: u.email,
    phone: u.phone || '-',
    grade: u.grade === '관리자' ? '관리자' : (u.grade || '일반'),
    orders: u.orders || 0,
    amount: u.amount || 0,
    joined: u.joined || '-',
    status: u.status || '활성',
  }));

  const filtered = members.filter(m => {
    if (statusFilter && m.status !== statusFilter) return false;
    if (gradeFilter && m.grade !== gradeFilter) return false;
    if (search && !m.name.includes(search) && !m.email.includes(search) && !m.phone.includes(search)) return false;
    return true;
  });

  // 상태 변경
  const changeStatus = (email, newStatus) => {
    if (setUsers) setUsers(prev => prev.map(u => u.email === email ? { ...u, status: newStatus } : u));
    setSelected(null);
  };

  const gradeList = ['관리자', 'VIP', '일반'];

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC_members" setPage={setPage} dark={dark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>회원 관리</div>
          <DarkToggle dark={dark} setDark={setDark} />
        </div>
        <div style={s.content}>
          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: '전체 회원', val: members.length, color: c.textPrimary },
              { label: '활성 회원', val: members.filter(m => m.status === '활성').length, color: sgd },
              { label: '관리자', val: members.filter(m => m.grade === '관리자').length, color: '#185fa5' },
              { label: '일반 회원', val: members.filter(m => m.grade === '일반').length, color: c.textSecondary },
            ].map(card => (
              <div key={card.label} style={s.sumCard}>
                <div style={s.sumLabel}>{card.label}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: card.color }}>{card.val}</div>
              </div>
            ))}
          </div>

          {/* 필터 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input style={{ ...s.input, flex: 1 }} placeholder="이름, 이메일 검색..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={s.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">전체 상태</option>
              {['활성','휴면','차단'].map(v => <option key={v}>{v}</option>)}
            </select>
            <select style={s.select} value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
              <option value="">전체 등급</option>
              {gradeList.map(g => <option key={g}>{g}</option>)}
            </select>
          </div>

          {/* 테이블 */}
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead style={{ background: c.theadBg }}>
                <tr>{['회원','등급','상태','관리'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: c.textTertiary, fontSize: 13 }}>
                    {members.length === 0 ? '등록된 회원이 없어요' : '검색 결과가 없어요'}
                  </td></tr>
                ) : filtered.map((m, i) => {
                  const av = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <tr key={m.email}>
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{m.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 12, color: c.textPrimary }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: c.textTertiary }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={s.td}><span style={{ ...s.pill, ...(GRADE_STYLE[m.grade] || GRADE_STYLE['일반']) }}>{m.grade}</span></td>
                      <td style={s.td}><span style={{ ...s.pill, ...(MEMBER_STATUS[m.status] || MEMBER_STATUS['활성']) }}>{m.status || '활성'}</span></td>
                      <td style={s.td}><button style={s.actionBtn} onClick={() => setSelected(m)}>상세</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div style={s.modalBg} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>회원 상세</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setSelected(null)}>✕</button>
            </div>
            {[['이름', selected.name], ['이메일', selected.email], ['연락처', selected.phone], ['등급', selected.grade], ['상태', selected.status || '활성']].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${c.cardBorder}` }}>
                <span style={{ color: c.textSecondary }}>{l}</span>
                <span style={{ fontWeight: 600, color: c.textPrimary }}>{v}</span>
              </div>
            ))}
            {/* 상태 변경 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8 }}>상태 변경</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['활성','휴면','차단'].map(st => (
                  <button key={st} onClick={() => changeStatus(selected.email, st)} style={{
                    flex: 1, padding: '6px 0', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 500,
                    border: `1px solid ${MEMBER_STATUS[st]?.bg || c.cardBorder}`,
                    background: (selected.status || '활성') === st ? MEMBER_STATUS[st]?.bg : 'transparent',
                    color: (selected.status || '활성') === st ? MEMBER_STATUS[st]?.color : c.textSecondary,
                  }}>{st}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
              <button style={s.btn} onClick={() => setSelected(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// ReviewManagement — 리뷰 관리 (샘플 데이터 유지 — DB 연동 전)
// =============================================
const INIT_REVIEWS = [
  { id: 1, name: '김지수', product: '유기농 사과', rating: 5, body: '정말 달고 신선해요! 포장도 꼼꼼하게 잘 돼있었고 배송도 빠르게 왔어요.', date: '2026.05.06', status: 'show', reply: '' },
  { id: 2, name: '이민준', product: '제주 삼다수 20L', rating: 4, body: '물 맛도 좋고 배송도 빨랐어요. 다만 박스가 살짝 찌그러져 왔는데 내용물은 이상 없었어요.', date: '2026.05.05', status: 'show', reply: '불편을 드려 죄송합니다. 다음에는 더 꼼꼼히 포장하겠습니다.' },
  { id: 3, name: '박서연', product: '한우 불고기 500g', rating: 5, body: '맛있어요!! 마트 가서 사는 것보다 훨씬 신선하고 좋은 것 같아요.', date: '2026.05.05', status: 'show', reply: '' },
  { id: 4, name: '최현우', product: '신선 딸기 1kg', rating: 3, body: '딸기가 생각보다 작고 몇 개는 짓눌려 왔어요. 맛은 괜찮지만 상태가 아쉬웠습니다.', date: '2026.05.04', status: 'show', reply: '' },
  { id: 5, name: '강민서', product: '계란 30구', rating: 2, body: '생각보다 많이 시들어 왔어요. 냉장 보관이 제대로 안 된 것 같습니다.', date: '2026.05.02', status: 'hidden', reply: '' },
];

export function ReviewManagement({ setPage, dark, setDark }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);
  const [reviews, setReviews] = useState(INIT_REVIEWS);
  const [search, setSearch] = useState('');
  const [starFilter, setStarFilter] = useState('');
  const [replyFilter, setReplyFilter] = useState('');
  const [replyInputs, setReplyInputs] = useState({});

  const filtered = reviews.filter(r => {
    if (starFilter === '5' && r.rating !== 5) return false;
    if (starFilter === '4' && r.rating !== 4) return false;
    if (starFilter === '3' && r.rating > 3) return false;
    if (replyFilter === 'no' && r.reply) return false;
    if (replyFilter === 'yes' && !r.reply) return false;
    if (search && !r.name.includes(search) && !r.body.includes(search)) return false;
    return true;
  });

  const submitReply = id => {
    const val = (replyInputs[id] || '').trim();
    if (!val) return;
    setReviews(rs => rs.map(r => r.id === id ? { ...r, reply: val } : r));
    setReplyInputs(p => ({ ...p, [id]: '' }));
  };
  const toggleHide = id => setReviews(rs => rs.map(r => r.id === id ? { ...r, status: r.status === 'show' ? 'hidden' : 'show' } : r));

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC_reviews" setPage={setPage} dark={dark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>리뷰 관리</div>
          <DarkToggle dark={dark} setDark={setDark} />
        </div>
        <div style={s.content}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[{ label: '전체 리뷰', val: reviews.length, color: c.textPrimary }, { label: '평균 별점', val: '4.6 ★', color: '#ba7517' }, { label: '미답변', val: reviews.filter(r => !r.reply).length, color: '#854f0b' }, { label: '숨김 처리', val: reviews.filter(r => r.status === 'hidden').length, color: '#5f5e5a' }].map(card => (
              <div key={card.label} style={s.sumCard}><div style={s.sumLabel}>{card.label}</div><div style={{ fontSize: 17, fontWeight: 600, color: card.color }}>{card.val}</div></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input style={{ ...s.input, flex: 1 }} placeholder="리뷰 내용, 회원명 검색..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={s.select} value={starFilter} onChange={e => setStarFilter(e.target.value)}><option value="">전체 별점</option><option value="5">5점</option><option value="4">4점</option><option value="3">3점 이하</option></select>
            <select style={s.select} value={replyFilter} onChange={e => setReplyFilter(e.target.value)}><option value="">전체</option><option value="no">미답변</option><option value="yes">답변 완료</option></select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: c.reviewBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, padding: '16px 18px', opacity: r.status === 'hidden' ? 0.55 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: sgl, color: sgd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>{r.name[0]}</div>
                    <div><div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{r.name}</div><div style={{ fontSize: 10, color: c.textTertiary }}>{r.product}</div></div>
                    <span style={{ color: '#ef9f27', fontSize: 13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: c.textTertiary }}>{r.date}</span>
                    {r.reply && <span style={{ ...s.pill, background: '#e6f1fb', color: '#185fa5' }}>답변완료</span>}
                    <span style={{ ...s.pill, background: r.status === 'show' ? sgl : '#f1efe8', color: r.status === 'show' ? sgd : '#5f5e5a' }}>{r.status === 'show' ? '노출' : '숨김'}</span>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: c.textSecondary, lineHeight: 1.6, marginBottom: 10 }}>{r.body}</div>
                {r.reply
                  ? <div style={{ background: c.replyBg, borderRadius: 8, padding: '10px 14px', borderLeft: `2px solid ${sg}`, fontSize: 12, color: c.textSecondary }}><div style={{ fontSize: 10, fontWeight: 600, color: sgd, marginBottom: 4 }}>관리자 답변</div>{r.reply}</div>
                  : <div style={{ display: 'flex', gap: 8 }}>
                      <input style={{ ...s.input, flex: 1 }} placeholder="답글을 입력하세요..." value={replyInputs[r.id] || ''} onChange={e => setReplyInputs(p => ({ ...p, [r.id]: e.target.value }))} />
                      <button style={s.btnPrimary} onClick={() => submitReply(r.id)}>답글 등록</button>
                    </div>
                }
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button style={{ ...s.actionBtn, borderColor: '#f09595', color: '#a32d2d' }} onClick={() => toggleHide(r.id)}>{r.status === 'show' ? '숨김 처리' : '노출 복구'}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// SalesStats — 매출 통계 (✅ orders props 연동)
// =============================================
const CATS = [{ icon: '🍎', name: '과일', pct: 32 }, { icon: '🥩', name: '육류', pct: 26 }, { icon: '🥦', name: '채소', pct: 19 }, { icon: '🥛', name: '유제품', pct: 13 }, { icon: '🧃', name: '음료', pct: 9 }];

export function SalesStats({ setPage, dark, setDark, orders = [] }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);
  const [period, setPeriod] = useState('month');

  // 실제 orders 데이터로 통계 계산
  const totalSales = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalOrders = orders.length;
  const avgOrder = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

  // 요일별 주문 집계 (이번 주)
  const dayLabels = ['일','월','화','수','목','금','토'];
  const weekBars = Array(7).fill(0);
  orders.forEach(o => {
    try {
      const d = new Date(o.date);
      if (!isNaN(d)) weekBars[d.getDay()] += o.totalPrice || 0;
    } catch {}
  });
  const maxBar = Math.max(...weekBars, 1);

  const summaryCards = [
    { label: '총 매출', val: `₩${totalSales.toLocaleString()}` },
    { label: '총 주문', val: `${totalOrders}건` },
    { label: '평균 주문액', val: `₩${avgOrder.toLocaleString()}` },
    { label: '완료 주문', val: `${orders.filter(o => o.status === '결제완료' || o.status === '배송완료').length}건` },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC_stats" setPage={setPage} dark={dark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>매출 통계</div>
          <DarkToggle dark={dark} setDark={setDark} />
        </div>
        <div style={s.content}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {summaryCards.map(m => (
              <div key={m.label} style={s.sumCard}><div style={s.sumLabel}>{m.label}</div><div style={{ fontSize: 20, fontWeight: 600, color: c.textPrimary }}>{m.val}</div></div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>요일별 매출 추이</div>
              {orders.length === 0 ? (
                <div style={{ textAlign: 'center', color: c.textTertiary, fontSize: 13, paddingTop: 40 }}>아직 주문 데이터가 없어요</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
                  {weekBars.map((v, i) => {
                    const h = v ? Math.max(4, Math.round((v / maxBar) * 130)) : 4;
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                          <div style={{ width: 14, height: h, borderRadius: '3px 3px 0 0', background: sg, opacity: v ? 0.85 : 0.2 }} />
                        </div>
                        <div style={{ fontSize: 9, color: c.textTertiary, marginTop: 3 }}>{dayLabels[i]}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div style={s.card}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 14 }}>카테고리별 매출</div>
              {CATS.map(cat => (
                <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${c.cardBorder}`, fontSize: 12 }}>
                  <div style={{ fontSize: 16 }}>{cat.icon}</div>
                  <div style={{ flex: 1, fontWeight: 600, color: c.textPrimary }}>{cat.name}</div>
                  <div style={{ width: 60 }}><div style={{ background: dark ? '#333' : '#eee', borderRadius: 2, height: 5 }}><div style={{ height: 5, borderRadius: 2, background: sg, width: `${cat.pct}%` }} /></div></div>
                  <div style={{ color: c.textSecondary, fontSize: 11, width: 28, textAlign: 'right' }}>{cat.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// KakaoPaySettlement — 카카오페이 정산 (✅ orders props 연동)
// =============================================
const PAY_STYLE = { 결제완료: { bg: '#faeeda', color: '#854f0b' }, 정산완료: { bg: sgl, color: sgd }, 취소: { bg: '#fcebeb', color: '#a32d2d' } };

export function KakaoPaySettlement({ setPage, dark, setDark, orders = [] }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);

  // 실제 orders에서 결제 데이터 추출
  const pays = orders.slice(0, 20).map(o => ({
    date: o.date || '-',
    oid: o.id,
    name: o.userId || '-',
    product: o.items ? (o.items[0]?.name || '-') : '-',
    amt: o.totalPrice || 0,
    status: o.status || '결제완료',
  }));

  const totalAmt = pays.reduce((sum, p) => sum + p.amt, 0);
  const fee = Math.round(totalAmt * 0.02);

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC_settlement" setPage={setPage} dark={dark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>카카오페이 정산</div>
          <DarkToggle dark={dark} setDark={setDark} />
        </div>
        <div style={s.content}>
          <div style={{ background: dark ? '#2a2600' : '#fffde6', border: '1px solid #fac775', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FEE500', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>K</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>SR마트 카카오페이 연동 중</div>
              <div style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>앱 ID: 1424384 · 가맹점 코드: SRMART-001 · 정산 주기: 매주 화요일</div>
            </div>
            <span style={{ ...s.pill, background: sgl, color: sgd }}>연동 정상</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: '총 결제액', val: `₩${totalAmt.toLocaleString()}`, color: c.textPrimary },
              { label: '정산 예정액', val: `₩${(totalAmt - fee).toLocaleString()}`, color: sgd },
              { label: '결제 건수', val: `${pays.length}건`, color: c.textPrimary },
              { label: '다음 정산일', val: '2026.05.12', color: c.textPrimary },
            ].map(m => (
              <div key={m.label} style={s.sumCard}><div style={s.sumLabel}>{m.label}</div><div style={{ fontSize: 18, fontWeight: 600, color: m.color }}>{m.val}</div></div>
            ))}
          </div>
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead style={{ background: c.theadBg }}>
                <tr>{['주문번호','고객','결제액','수수료','정산액','상태'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {pays.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: c.textTertiary, fontSize: 13 }}>아직 결제 내역이 없어요</td></tr>
                ) : pays.map(p => {
                  const f = Math.round(p.amt * 0.02);
                  return (
                    <tr key={p.oid}>
                      <td style={{ ...s.td, fontWeight: 600, fontSize: 11 }}>{p.oid}</td>
                      <td style={{ ...s.td, color: c.textSecondary }}>{p.name}</td>
                      <td style={{ ...s.td, fontWeight: 600 }}>₩{p.amt.toLocaleString()}</td>
                      <td style={{ ...s.td, color: '#a32d2d', fontSize: 11 }}>- ₩{f.toLocaleString()}</td>
                      <td style={{ ...s.td, fontWeight: 600, color: sgd }}>₩{(p.amt - f).toLocaleString()}</td>
                      <td style={s.td}><span style={{ ...s.pill, ...(PAY_STYLE[p.status] || PAY_STYLE['결제완료']) }}>{p.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Settings — 설정 (관리자 권한 관리 포함)
// =============================================
const SETTING_PAGES = ['쇼핑몰 기본정보', '배송 설정', '알림 설정', '관리자 계정', '위험 구역'];
const FEATURES = [
  { key: 'orders',     label: '주문 관리',      icon: '🛒', desc: '주문 조회 및 상태 변경' },
  { key: 'products',   label: '상품 관리',      icon: '📦', desc: '상품 등록·수정·삭제' },
  { key: 'inventory',  label: '재고 관리',      icon: '📊', desc: '재고 현황 및 입고 처리' },
  { key: 'members',    label: '회원 관리',      icon: '👥', desc: '회원 조회 및 상태 변경' },
  { key: 'reviews',    label: '리뷰 관리',      icon: '💬', desc: '리뷰 답변 및 숨김 처리' },
  { key: 'stats',      label: '매출 통계',      icon: '📈', desc: '매출 데이터 조회' },
  { key: 'settlement', label: '카카오페이 정산', icon: '💳', desc: '정산 내역 조회' },
  { key: 'settings',   label: '설정',           icon: '⚙️', desc: '쇼핑몰 설정 변경' },
];
const DEFAULT_PERMS = {
  슈퍼어드민: { orders: true, products: true, inventory: true, members: true, reviews: true, stats: true, settlement: true, settings: true },
  스태프:     { orders: true, products: true, inventory: true, members: false, reviews: true, stats: false, settlement: false, settings: false },
  뷰어:       { orders: true, products: false, inventory: true, members: false, reviews: false, stats: true, settlement: false, settings: false },
};
const ROLE_STYLE = {
  슈퍼어드민: { bg: '#eeedfe', color: '#534ab7' },
  스태프:     { bg: sgl, color: sgd },
  뷰어:       { bg: '#f1efe8', color: '#5f5e5a' },
};

function AdminAccountTab({ c, s, dark, users = [], setUsers }) {
  const INIT_ADMINS = [
    { id: 1, name: '이민우', email: 'admin@srmart.com', role: '슈퍼어드민', joined: '2024.01.01', lastLogin: '2026.05.09', perms: { ...DEFAULT_PERMS['슈퍼어드민'] } },
  ];
  const [admins, setAdmins] = useState(INIT_ADMINS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newForm, setNewForm] = useState({ name: '', email: '', password: '', role: '스태프' });
  const [newPerms, setNewPerms] = useState({ ...DEFAULT_PERMS['스태프'] });

  const handleRoleChange = (role) => { setNewForm(f => ({ ...f, role })); setNewPerms({ ...DEFAULT_PERMS[role] }); };

  const addAdmin = () => {
    if (!newForm.name.trim()) return alert('이름을 입력해주세요');
    if (!newForm.email.trim()) return alert('이메일을 입력해주세요');
    if (!newForm.password.trim()) return alert('비밀번호를 입력해주세요');
    const newAdmin = {
      id: Date.now(), name: newForm.name, email: newForm.email, role: newForm.role,
      joined: new Date().toLocaleDateString('ko-KR'), lastLogin: '-', perms: { ...newPerms },
    };
    setAdmins(prev => [...prev, newAdmin]);
    // App.js users에도 추가
    if (setUsers) setUsers(prev => [...prev, { name: newForm.name, email: newForm.email, password: newForm.password, grade: '관리자', status: '활성' }]);
    setNewForm({ name: '', email: '', password: '', role: '스태프' });
    setNewPerms({ ...DEFAULT_PERMS['스태프'] });
    setShowAddModal(false);
    alert('관리자가 추가되었어요!');
  };

  const savePerms = () => {
    setAdmins(prev => prev.map(a => a.id === selectedAdmin.id ? { ...a, perms: { ...selectedAdmin.perms }, role: selectedAdmin.role } : a));
    setShowPermModal(false);
    alert('권한이 저장되었어요!');
  };
  const deleteAdmin = (id) => { if (window.confirm('정말 삭제하시겠어요?')) setAdmins(prev => prev.filter(a => a.id !== id)); };
  const togglePerm = (key) => setSelectedAdmin(prev => ({ ...prev, perms: { ...prev.perms, [key]: !prev.perms[key] } }));

  const Checkbox = ({ checked, onChange }) => (
    <div onClick={onChange} style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? sg : (dark ? '#555' : '#ccc')}`, background: checked ? sg : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
      {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {[{ label: '전체 관리자', val: admins.length, color: c.textPrimary }, { label: '슈퍼어드민', val: admins.filter(a => a.role === '슈퍼어드민').length, color: '#534ab7' }, { label: '스태프/뷰어', val: admins.filter(a => a.role !== '슈퍼어드민').length, color: sgd }].map(card => (
          <div key={card.label} style={s.sumCard}><div style={s.sumLabel}>{card.label}</div><div style={{ fontSize: 22, fontWeight: 600, color: card.color }}>{card.val}</div></div>
        ))}
      </div>
      <div style={s.sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={s.sectionTitle}>관리자 목록</div>
          <button style={s.btnPrimary} onClick={() => { setNewForm({ name: '', email: '', password: '', role: '스태프' }); setNewPerms({ ...DEFAULT_PERMS['스태프'] }); setShowAddModal(true); }}>+ 관리자 추가</button>
        </div>
        <table style={s.table}>
          <thead style={{ background: c.theadBg }}>
            <tr>{['이름/이메일','역할','가입일','최근 로그인','권한 설정','관리'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {admins.map(a => (
              <tr key={a.id}>
                <td style={s.td}><div style={{ fontWeight: 600, fontSize: 12, color: c.textPrimary }}>{a.name}</div><div style={{ fontSize: 10, color: c.textTertiary }}>{a.email}</div></td>
                <td style={s.td}><span style={{ ...s.pill, ...ROLE_STYLE[a.role] }}>{a.role}</span></td>
                <td style={{ ...s.td, fontSize: 11, color: c.textTertiary }}>{a.joined}</td>
                <td style={{ ...s.td, fontSize: 11, color: c.textTertiary }}>{a.lastLogin}</td>
                <td style={s.td}>{a.role !== '슈퍼어드민' ? <button style={{ ...s.actionBtn, borderColor: '#6c5ce7', color: '#6c5ce7' }} onClick={() => { setSelectedAdmin({ ...a }); setShowPermModal(true); }}>권한 편집</button> : <span style={{ fontSize: 11, color: c.textTertiary }}>전체 권한</span>}</td>
                <td style={s.td}>{a.role !== '슈퍼어드민' ? <button style={{ ...s.actionBtn, color: '#a32d2d', borderColor: '#f09595' }} onClick={() => deleteAdmin(a.id)}>삭제</button> : <span style={{ fontSize: 11, color: c.textTertiary }}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={s.sectionCard}>
        <div style={s.sectionTitle}>역할별 기본 권한 안내</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[{ role: '슈퍼어드민', icon: '👑', desc: '모든 기능 사용 가능. 관리자 추가·삭제 권한 보유.', color: '#534ab7', bg: '#eeedfe' }, { role: '스태프', icon: '🔧', desc: '주문·상품·재고·리뷰 관리 가능. 매출·정산·설정은 제한.', color: sgd, bg: sgl }, { role: '뷰어', icon: '👁', desc: '주문·재고·매출 조회만 가능. 수정 권한 없음.', color: '#5f5e5a', bg: '#f1efe8' }].map(r => (
            <div key={r.role} style={{ background: r.bg, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: r.color, marginBottom: 4 }}>{r.role}</div>
              <div style={{ fontSize: 11, color: c.textSecondary, lineHeight: 1.5 }}>{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 관리자 추가 모달 */}
      {showAddModal && (
        <div style={s.modalBg} onClick={() => setShowAddModal(false)}>
          <div style={{ ...s.modal, width: 500, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>관리자 추가</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div style={{ marginBottom: 12 }}><div style={s.formLabel}>이름 *</div><input style={s.formInput} placeholder="홍길동" value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div style={{ marginBottom: 12 }}><div style={s.formLabel}>이메일 *</div><input style={s.formInput} type="email" placeholder="staff@srmart.co.kr" value={newForm.email} onChange={e => setNewForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div style={{ marginBottom: 12 }}><div style={s.formLabel}>비밀번호 *</div><input style={s.formInput} type="password" placeholder="초기 비밀번호 설정" value={newForm.password} onChange={e => setNewForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div style={{ marginBottom: 16 }}>
              <div style={s.formLabel}>역할</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['스태프','뷰어'].map(role => (
                  <div key={role} onClick={() => handleRoleChange(role)} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', border: `2px solid ${newForm.role === role ? sg : c.cardBorder}`, background: newForm.role === role ? sgl : c.metricBg, color: newForm.role === role ? sgd : c.textSecondary, fontWeight: newForm.role === role ? 600 : 400, fontSize: 13 }}>
                    {role === '스태프' ? '🔧 스태프' : '👁 뷰어'}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: c.cardBorder, margin: '4px 0 16px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>기능별 권한 설정</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {FEATURES.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: c.metricBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{f.icon}</span>
                    <div><div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{f.label}</div><div style={{ fontSize: 10, color: c.textTertiary }}>{f.desc}</div></div>
                  </div>
                  <Checkbox checked={newPerms[f.key]} onChange={() => setNewPerms(p => ({ ...p, [f.key]: !p[f.key] }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn} onClick={() => setShowAddModal(false)}>취소</button>
              <button style={s.btnPrimary} onClick={addAdmin}>추가 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 권한 편집 모달 */}
      {showPermModal && selectedAdmin && (
        <div style={s.modalBg} onClick={() => setShowPermModal(false)}>
          <div style={{ ...s.modal, width: 460, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>권한 편집</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setShowPermModal(false)}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 18 }}>{selectedAdmin.name} · <span style={{ ...s.pill, ...ROLE_STYLE[selectedAdmin.role] }}>{selectedAdmin.role}</span></div>
            <div style={{ marginBottom: 16 }}>
              <div style={s.formLabel}>역할 변경</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['스태프','뷰어'].map(role => (
                  <div key={role} onClick={() => setSelectedAdmin(prev => ({ ...prev, role, perms: { ...DEFAULT_PERMS[role] } }))} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', border: `2px solid ${selectedAdmin.role === role ? sg : c.cardBorder}`, background: selectedAdmin.role === role ? sgl : c.metricBg, color: selectedAdmin.role === role ? sgd : c.textSecondary, fontWeight: selectedAdmin.role === role ? 600 : 400, fontSize: 12 }}>
                    {role === '스태프' ? '🔧 스태프' : '👁 뷰어'}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: c.cardBorder, margin: '4px 0 14px' }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary, marginBottom: 12 }}>기능별 권한</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {FEATURES.map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: c.metricBg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{f.icon}</span>
                    <div><div style={{ fontSize: 12, fontWeight: 600, color: c.textPrimary }}>{f.label}</div><div style={{ fontSize: 10, color: c.textTertiary }}>{f.desc}</div></div>
                  </div>
                  <Checkbox checked={selectedAdmin.perms[f.key]} onChange={() => togglePerm(f.key)} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={s.btn} onClick={() => setShowPermModal(false)}>취소</button>
              <button style={s.btnPrimary} onClick={savePerms}>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Settings({ setPage, dark, setDark, users = [], setUsers }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);
  const [activePage, setActivePage] = useState(0);
  const [toggles, setToggles] = useState({ orderNoti: true, shipNoti: true, delivNoti: false, newOrder: true, lowStock: true, newReview: true, settlement: false, dailyReport: true, maintenanceMode: false, stopOrders: false });
  const toggle = key => setToggles(p => ({ ...p, [key]: !p[key] }));

  const Toggle = ({ k }) => (
    <div onClick={() => toggle(k)} style={{ width: 40, height: 22, borderRadius: 11, background: toggles[k] ? sg : (dark ? '#444' : '#ddd'), cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', background: '#fff', top: 3, left: toggles[k] ? 21 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
    </div>
  );
  const ToggleRow = ({ label, desc, k }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${c.cardBorder}` }}>
      <div><div style={{ fontSize: 13, fontWeight: 600, color: c.textPrimary }}>{label}</div><div style={{ fontSize: 11, color: c.textSecondary, marginTop: 2 }}>{desc}</div></div>
      <Toggle k={k} />
    </div>
  );
  const Field = ({ label, value, type = 'text' }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 5 }}>{label}</div>
      <input style={{ ...s.formInput }} type={type} defaultValue={value} />
    </div>
  );

  const pages = [
    <div key="store"><div style={s.sectionCard}><div style={s.sectionTitle}>쇼핑몰 기본 정보</div><Field label="쇼핑몰 이름" value="에스알마트 (SR Mart)" /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="대표 전화" value="032-555-1234" /><Field label="대표 이메일" value="srmart@srmart.co.kr" /></div><Field label="사업자등록번호" value="123-45-67890" /><Field label="사업장 주소" value="인천광역시 서구 검암동 123-45" /></div></div>,
    <div key="delivery"><div style={s.sectionCard}><div style={s.sectionTitle}>배송 기본 설정</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><Field label="기본 배송비 (원)" value="3000" type="number" /><Field label="무료배송 기준 (원)" value="30000" type="number" /></div></div><div style={s.sectionCard}><div style={s.sectionTitle}>배송 알림</div><ToggleRow label="주문 확인 알림" desc="결제 완료 시 카카오 알림톡 발송" k="orderNoti" /><ToggleRow label="배송 출발 알림" desc="배송 시작 시 운송장 번호 포함 발송" k="shipNoti" /><ToggleRow label="배송 완료 알림" desc="배송 완료 시 리뷰 작성 유도 발송" k="delivNoti" /></div></div>,
    <div key="notify"><div style={s.sectionCard}><div style={s.sectionTitle}>관리자 알림 설정</div><ToggleRow label="신규 주문 알림" desc="새 주문이 들어올 때마다 이메일 알림" k="newOrder" /><ToggleRow label="품절 임박 알림" desc="재고가 최소 기준 이하로 내려갈 때" k="lowStock" /><ToggleRow label="신규 리뷰 알림" desc="별점 3점 이하 리뷰 등록 시 즉시 알림" k="newReview" /><ToggleRow label="정산 완료 알림" desc="카카오페이 정산 완료 시 이메일 알림" k="settlement" /><ToggleRow label="일일 매출 리포트" desc="매일 오전 8시 전날 매출 요약 발송" k="dailyReport" /></div></div>,
    <AdminAccountTab key="admin" c={c} s={s} dark={dark} users={users} setUsers={setUsers} />,
    <div key="danger"><div style={{ ...s.sectionCard, borderColor: '#f09595' }}><div style={{ ...s.sectionTitle, color: '#a32d2d' }}>위험 구역</div><ToggleRow label="쇼핑몰 임시 점검 모드" desc="활성화 시 고객에게 점검 중 안내 페이지 표시" k="maintenanceMode" /><ToggleRow label="신규 주문 일시 중지" desc="활성화 시 장바구니 및 결제 기능 비활성화" k="stopOrders" /></div></div>,
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC_settings" setPage={setPage} dark={dark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>설정</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={s.btnPrimary} onClick={() => alert('저장되었습니다!')}>변경사항 저장</button>
            <DarkToggle dark={dark} setDark={setDark} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: 180, borderRight: `1px solid ${c.cardBorder}`, background: c.cardBg, padding: '16px 0', flexShrink: 0 }}>
            {SETTING_PAGES.map((p, i) => (
              <div key={p} onClick={() => setActivePage(i)} style={{ padding: '9px 20px', fontSize: 13, cursor: 'pointer', borderLeft: `2px solid ${activePage === i ? sg : 'transparent'}`, color: activePage === i ? sgd : c.textSecondary, fontWeight: activePage === i ? 600 : 400, background: activePage === i ? (dark ? '#1a3a2a' : sgl) : 'transparent' }}>{p}</div>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>{pages[activePage]}</div>
        </div>
      </div>
    </div>
  );
}
