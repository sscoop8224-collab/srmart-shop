import { useState } from 'react';
import Sidebar from '../layout/Sidebar';

const sg = '#00c471';
const sgd = '#009a58';
const sgl = '#e6f9f1';

const STATUS_STYLE = {
  결제완료: { bg: sgl, color: sgd },
  배송중:   { bg: '#e6f1fb', color: '#185fa5' },
  배송완료: { bg: '#eaf3de', color: '#3b6d11' },
  입금대기: { bg: '#faeeda', color: '#854f0b' },
  취소:     { bg: '#fcebeb', color: '#a32d2d' },
};
const TABS = ['전체', '결제완료', '배송중', '배송완료', '입금대기', '취소'];

const LIGHT = { bg: '#f5f5f3', cardBg: '#ffffff', cardBorder: '#e0e0e0', metricBg: '#efefed', textPrimary: '#1a1a1a', textSecondary: '#444444', textTertiary: '#777777', topbarBg: '#ffffff', topbarBorder: '#e0e0e0', theadBg: '#f0f0ee', inputBg: '#ffffff', inputBorder: '#dddddd', modalBg2: '#ffffff' };
const DARK  = { bg: '#111111', cardBg: '#1e1e1e', cardBorder: '#2e2e2e', metricBg: '#252525', textPrimary: '#f0f0f0', textSecondary: '#bbbbbb', textTertiary: '#777777', topbarBg: '#1a1a1a', topbarBorder: '#2e2e2e', theadBg: '#252525', inputBg: '#252525', inputBorder: '#3a3a3a', modalBg2: '#1e1e1e' };

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
    sumCard: { background: c.metricBg, borderRadius: 8, padding: '10px 14px', textAlign: 'center' },
    sumLabel: { fontSize: 10, color: c.textSecondary, marginBottom: 4 },
    input: { padding: '7px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, outline: 'none', background: c.inputBg, color: c.textPrimary },
    select: { padding: '7px 10px', border: `1px solid ${c.inputBorder}`, borderRadius: 8, fontSize: 13, background: c.inputBg, color: c.textPrimary, outline: 'none', cursor: 'pointer' },
    tableCard: { background: c.cardBg, border: `1px solid ${c.cardBorder}`, borderRadius: 12, overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
    th: { padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: c.textSecondary, borderBottom: `1px solid ${c.cardBorder}` },
    td: { padding: '10px 14px', borderBottom: `1px solid ${c.cardBorder}`, verticalAlign: 'middle', color: c.textPrimary },
    pill: { display: 'inline-block', fontSize: 10, padding: '2px 9px', borderRadius: 10, fontWeight: 500 },
    actionBtn: { background: 'none', border: `1px solid ${c.cardBorder}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: c.textSecondary, cursor: 'pointer' },
    btn: { padding: '6px 14px', borderRadius: 8, border: `1px solid ${c.cardBorder}`, background: c.cardBg, fontSize: 12, cursor: 'pointer', color: c.textPrimary },
    btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: 'none', background: sg, color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 },
    modalBg: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal: { borderRadius: 12, padding: 24, width: 460 },
  };
}

// ✅ orders, setOrders → App.js 실제 데이터 사용
export default function OrderManagement({ setPage, dark, setDark, orders = [], setOrders }) {
  const c = dark ? DARK : LIGHT;
  const s = makeStyles(c);
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // App.js orders 데이터를 PC관리자 형식으로 변환
  const normalizedOrders = orders.map(o => ({
    id: o.id,
    name: o.userId || '-',
    product: o.items ? (o.items.length === 1 ? o.items[0].name : o.items[0].name + ' 외 ' + (o.items.length - 1) + '건') : '-',
    pay: '카카오페이',
    amount: o.totalPrice || 0,
    status: o.status || '결제완료',
    date: o.date || '-',
    phone: '-',
    addr: '-',
  }));

  const filtered = normalizedOrders.filter(o => {
    if (activeTab !== '전체' && o.status !== activeTab) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    if (payFilter && o.pay !== payFilter) return false;
    if (search && !o.id.includes(search) && !o.name.includes(search)) return false;
    return true;
  });

  // 상태별 카운트
  const counts = {
    전체: normalizedOrders.length,
    결제완료: normalizedOrders.filter(o => o.status === '결제완료').length,
    배송중: normalizedOrders.filter(o => o.status === '배송중').length,
    입금대기: normalizedOrders.filter(o => o.status === '입금대기').length,
    취소: normalizedOrders.filter(o => o.status === '취소').length,
  };

  // 주문 상태 변경
  const changeStatus = (orderId, newStatus) => {
    if (setOrders) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    }
    setSelectedOrder(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar currentPage="adminPC_orders" setPage={setPage} dark={dark} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={s.topbar}>
          <div style={s.topbarTitle}>주문 관리</div>
          <DarkToggle dark={dark} setDark={setDark} />
        </div>
        <div style={s.content}>
          {/* 요약 카드 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: '전체 주문', value: counts.전체, color: c.textPrimary },
              { label: '결제완료', value: counts.결제완료, color: sgd },
              { label: '배송 중', value: counts.배송중, color: '#185fa5' },
              { label: '입금대기', value: counts.입금대기, color: '#854f0b' },
              { label: '취소/환불', value: counts.취소, color: '#a32d2d' },
            ].map(card => (
              <div key={card.label} style={s.sumCard}>
                <div style={s.sumLabel}>{card.label}</div>
                <div style={{ fontSize: 17, fontWeight: 600, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* 탭 */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${c.cardBorder}`, marginBottom: 14 }}>
            {TABS.map(t => (
              <div key={t} onClick={() => setActiveTab(t)} style={{ padding: '8px 16px', fontSize: 12, cursor: 'pointer', color: activeTab === t ? sg : c.textSecondary, borderBottom: activeTab === t ? `2px solid ${sg}` : '2px solid transparent', fontWeight: activeTab === t ? 600 : 400, marginBottom: -1 }}>{t}</div>
            ))}
          </div>

          {/* 필터 */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input style={{ ...s.input, flex: 1 }} placeholder="주문번호, 고객명 검색..." value={search} onChange={e => setSearch(e.target.value)} />
            <select style={s.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">전체 상태</option>
              {['결제완료','배송중','배송완료','입금대기','취소'].map(v => <option key={v}>{v}</option>)}
            </select>
            <select style={s.select} value={payFilter} onChange={e => setPayFilter(e.target.value)}>
              <option value="">전체 결제</option>
              {['카카오페이','신용카드','무통장'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>

          {/* 테이블 */}
          <div style={s.tableCard}>
            <table style={s.table}>
              <thead style={{ background: c.theadBg }}>
                <tr>{['주문번호','고객','상품','결제수단','금액','상태','주문일시','관리'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: c.textTertiary, fontSize: 13 }}>
                    {normalizedOrders.length === 0 ? '아직 주문이 없어요' : '검색 결과가 없어요'}
                  </td></tr>
                ) : filtered.map(o => (
                  <tr key={o.id}>
                    <td style={{ ...s.td, fontWeight: 600, color: c.textPrimary, fontSize: 11 }}>{o.id}</td>
                    <td style={{ ...s.td, color: c.textSecondary }}>{o.name}</td>
                    <td style={{ ...s.td, color: c.textPrimary, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.product}</td>
                    <td style={{ ...s.td, color: c.textSecondary }}>{o.pay}</td>
                    <td style={{ ...s.td, fontWeight: 600, color: c.textPrimary }}>₩{o.amount.toLocaleString()}</td>
                    <td style={s.td}><span style={{ ...s.pill, background: STATUS_STYLE[o.status]?.bg, color: STATUS_STYLE[o.status]?.color }}>{o.status}</span></td>
                    <td style={{ ...s.td, color: c.textTertiary, fontSize: 11 }}>{o.date}</td>
                    <td style={s.td}><button style={s.actionBtn} onClick={() => setSelectedOrder(o)}>상세</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedOrder && (
        <div style={s.modalBg} onClick={() => setSelectedOrder(null)}>
          <div style={{ ...s.modal, background: c.modalBg2, border: `1px solid ${c.cardBorder}` }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>주문 상세</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textSecondary }} onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            {[['주문번호', selectedOrder.id], ['고객', selectedOrder.name], ['상품', selectedOrder.product], ['결제수단', selectedOrder.pay], ['결제금액', `₩${selectedOrder.amount.toLocaleString()}`], ['주문일시', selectedOrder.date]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: `1px solid ${c.cardBorder}` }}>
                <span style={{ color: c.textSecondary }}>{l}</span>
                <span style={{ fontWeight: 600, color: c.textPrimary }}>{v}</span>
              </div>
            ))}
            {/* 상태 변경 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: c.textSecondary, marginBottom: 8 }}>상태 변경</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['결제완료','배송중','배송완료','입금대기','취소'].map(st => (
                  <button key={st} onClick={() => changeStatus(selectedOrder.id, st)} style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer', fontWeight: 500,
                    border: `1px solid ${STATUS_STYLE[st]?.bg || c.cardBorder}`,
                    background: selectedOrder.status === st ? STATUS_STYLE[st]?.bg : 'transparent',
                    color: selectedOrder.status === st ? STATUS_STYLE[st]?.color : c.textSecondary,
                  }}>{st}</button>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={{ ...s.btn, background: c.metricBg, color: c.textPrimary, border: `1px solid ${c.cardBorder}` }} onClick={() => setSelectedOrder(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
