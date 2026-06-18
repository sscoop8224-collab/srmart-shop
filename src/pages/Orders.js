import { useState } from 'react';
import { requestReturn } from '../api';

const getCategoryImage = (large) => {
  switch(large) {
    case '식품': return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80';
    case '음료': return 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&q=80';
    case '생활용품': return 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&q=80';
    case '간식/과자': return 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&q=80';
    case '주류': return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80';
    default: return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';
  }
};

const statusStyle = (status) => {
  const map = {
    '주문접수': { bg: '#f5f5f5', color: '#777' },
    '결제완료': { bg: '#e8f0fe', color: '#1a73e8' },
    '상품준비': { bg: '#fff3e0', color: '#e65100' },
    '배송중':   { bg: '#ede7f6', color: '#7c4dff' },
    '배송완료': { bg: '#e6f9f1', color: '#009a58' },
    '취소':     { bg: '#fff0f1', color: '#ff4757' },
    '환불완료': { bg: '#fde8e8', color: '#c62828' },
  };
  return map[status] || { bg: '#f0faf5', color: '#00a85e' };
};

const TRACKING_URLS = {
  'CJ대한통운': 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=',
  '한진택배': 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillSch.do?mCode=MN038&schLang=KR&wblnumText2=',
  '롯데택배': 'https://www.lotteglogis.com/mobile/reservation/tracking/trackingDetail?InvNo=',
  '우체국택배': 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=',
};

function Orders({ orders, goBack }) {
  const [returnModal, setReturnModal] = useState(null); // { order, type }
  const [returnReason, setReturnReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReturnSubmit = async () => {
    if (!returnReason.trim()) { alert('사유를 입력해주세요!'); return; }
    setSubmitting(true);
    try {
      await requestReturn(returnModal.order.id, { type: returnModal.type, reason: returnReason });
      alert(`${returnModal.type} 요청이 접수됐어요!`);
      setReturnModal(null); setReturnReason('');
    } catch (err) { alert(err.response?.data?.error || '요청 실패'); }
    finally { setSubmitting(false); }
  };
  return (
    <div style={{ background: '#f8fffe', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px 20px', background: 'white',
        borderBottom: '1px solid #f0faf5', position: 'sticky', top: 0, zIndex: 10
      }}>
        <button onClick={goBack} style={{ width: '38px', height: '38px', background: '#f0faf5', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>주문내역</h2>
      </div>

      {orders.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <div style={{ width: '80px', height: '80px', background: '#f0faf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00c471" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px' }}>주문내역이 없어요!</p>
          <p style={{ fontSize: '13px', color: '#adb5bd', margin: 0 }}>첫 주문을 해보세요</p>
        </div>
      ) : (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {orders.map((order) => {
            const sc = statusStyle(order.status);
            return (
              <div key={order.id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid #f0faf5' }}>

                {/* 주문 헤더 */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f8fffe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#adb5bd', margin: '0 0 3px', fontFamily: 'monospace' }}>{order.id}</p>
                    <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{order.date}</p>
                  </div>
                  <span style={{ background: sc.bg, color: sc.color, padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                    {order.status || '결제완료'}
                  </span>
                </div>

                {/* 상품 목록 */}
                <div style={{ padding: '12px 18px' }}>
                  {order.items.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: index < order.items.length - 1 ? '1px solid #f8fffe' : 'none' }}>
                      <div style={{ width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                        <img
                          src={item.image || getCategoryImage(item.large)}
                          alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 3px' }}>{item.name}</p>
                        <p style={{ fontSize: '12px', color: '#adb5bd', margin: 0 }}>{item.quantity}개</p>
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: '800', color: '#1a1a1a', margin: 0 }}>₩{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* 합계 */}
                <div style={{ padding: '14px 18px', background: '#f8fffe', borderTop: '1px solid #f0faf5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#adb5bd', fontWeight: '600' }}>총 결제금액</span>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#00c471' }}>₩{order.totalPrice.toLocaleString()}</span>
                </div>

                {/* 송장 + 환불/교환 버튼 */}
                {(order.status === '배송중' || order.status === '배송완료') && (
                  <div style={{ padding: '10px 18px', background: '#f8fffe', borderTop: '1px solid #f0faf5', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {order.courier && order.tracking_number && (
                      <div style={{ fontSize: '12px', color: '#666', flex: 1 }}>
                        {order.courier} · {order.tracking_number}
                        {TRACKING_URLS[order.courier] && (
                          <a href={TRACKING_URLS[order.courier] + order.tracking_number} target="_blank" rel="noreferrer"
                            style={{ marginLeft: 8, color: '#7c4dff', fontWeight: 600, fontSize: 11 }}>배송 추적 →</a>
                        )}
                      </div>
                    )}
                    {order.status === '배송완료' && (
                      <>
                        <button onClick={() => { setReturnModal({ order, type: '환불' }); setReturnReason(''); }}
                          style={{ padding: '5px 12px', background: '#fde8e8', color: '#c62828', border: 'none', borderRadius: 20, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                          환불 요청
                        </button>
                        <button onClick={() => { setReturnModal({ order, type: '교환' }); setReturnReason(''); }}
                          style={{ padding: '5px 12px', background: '#fff8e1', color: '#f57c00', border: 'none', borderRadius: 20, fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                          교환 요청
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 환불/교환 요청 모달 */}
      {returnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}
          onClick={e => { if (e.target === e.currentTarget) setReturnModal(null); }}>
          <div style={{ background: 'white', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#1a1a1a', marginBottom: 16 }}>{returnModal.type} 요청</div>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: 12 }}>사유를 선택하거나 직접 입력해주세요</div>
            {['단순 변심', '상품 하자/파손', '오배송', '기타'].map(r => (
              <button key={r} onClick={() => setReturnReason(r)}
                style={{ margin: '0 6px 6px 0', padding: '6px 14px', background: returnReason === r ? '#00c471' : '#f0faf5', color: returnReason === r ? 'white' : '#333', border: 'none', borderRadius: 20, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                {r}
              </button>
            ))}
            <textarea value={returnReason} onChange={e => setReturnReason(e.target.value)} placeholder="상세 사유를 입력해주세요"
              style={{ width: '100%', marginTop: 10, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #e8faf3', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: 72 }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setReturnModal(null)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #eee', background: 'transparent', color: '#666', fontSize: 14, cursor: 'pointer' }}>취소</button>
              <button onClick={handleReturnSubmit} disabled={submitting}
                style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#00c471,#00a85e)', color: 'white', fontSize: 14, fontWeight: 800, cursor: submitting ? 'default' : 'pointer' }}>
                {submitting ? '제출 중...' : '요청 제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;