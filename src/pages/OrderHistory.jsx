// 주문내역 — 온라인·매장 한 곳 (목업 정본 v1 의 P01 · S15 · S17 · S18, 묶음 4 · 2026-11-12 밤)
//
// 결정 9·10(2026-11-12): 예전 「주문내역」(Orders.js, 온라인 + 환불·교환)과 「구매 내역」(Purchases.jsx, 온라인 + 매장 영수증)을
// **이 화면 하나가 대신한다.** 이름은 탭바·제목·마이 메뉴 모두 「주문내역」. 맨 위 「전체 / 온라인 / 매장」.
//   · 온라인 카드 — `GET /orders/my`(App 이 받아 둔 orders): 상태 · 환불·교환 진행 띠(반려면 사유 + 다시 요청하는 길) · 배송 추적 · 환불/교환(배송완료).
//     품목 요약(「○○ 외 2건」)은 `GET /me/purchases` 의 같은 주문 줄에서 온다(주문 목록에는 품목이 없다).
//     카드를 누르면 온라인 주문 상세(S18 — `GET /me/purchases/online/:id`).
//   · 매장 카드 — `GET /me/purchases` 의 매장 줄. 취소는 흐리게 + 「취소」, 「영수증 보기」 → 매장 영수증(S17).
//     지점 통합 이용에 동의하지 않았으면 매장 줄이 없고 「매장」 탭에 동의 안내(동의 팝업은 한 번 답하면 다시 안 뜨므로 스스로 켤 길이 여기 있어야 한다).
//   · 환불·교환 요청(S15) — 아래 시트. 🔴 서버가 주는 말을 그대로 쓴다(단계 뜻이 바뀔 때 화면과 서버가 갈라지지 않게).
// 전자영수증 알림을 눌러 들어오면(openSaleId) 그 영수증을 바로 편다 — 목록에서 다시 찾게 하면 알림을 누른 뜻이 없다.
import { useCallback, useEffect, useState } from 'react';
import { getMyPurchases, getStorePurchase, getOnlinePurchase, requestReturn, imgUrl } from '../api';
import { useDialog } from '../DialogContext';
import Code128 from '../components/Code128';
import Icon from '../components/ui/Icon';
import { BRAND } from '../brand';
import SellerTaxNote from '../components/SellerTaxNote';
import { pickupDeadlineLabel } from '../utils/pickupDeadline';
import { receiptTaxLines } from '../utils/receiptTax';

const won = (n) => `${Number(n || 0).toLocaleString('ko-KR')}원`;
const pts = (n) => `${Number(n || 0).toLocaleString('ko-KR')}P`;
const pad2 = (x) => String(x).padStart(2, '0');
const asDate = (v) => { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; };
const dayLabel = (v) => { const d = asDate(v); return d ? `${d.getMonth() + 1}월 ${d.getDate()}일` : String(v || ''); };
const fullDate = (v) => { const d = asDate(v); return d ? `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : String(v || ''); };

const METHOD = { cash: '현금', card: '카드', credit: '외상' };
const TABS = ['전체', '온라인', '매장'];
const REASONS = ['단순 변심', '상품 하자/파손', '오배송', '기타'];
const STEPS = ['결제완료', '상품준비', '배송중', '배송완료'];
// 주문 상태 딱지 색 — 끝난 것 초록 · 가는 중 파랑 · 준비 주황 · 취소·환불 빨강
const TONE = { 결제완료: 'b', 주문접수: '', 상품준비: 'o', 배송중: 'b', 배송완료: 'g', 취소: 'r', 환불완료: 'r' };
// 🔴 환불·교환 요청의 단계 — 주문 상태와 다른 것. 「승인」은 **아직 돈이 돌아오기 전**이다(그걸 안 적으면 손님이 환불된 줄 알고 기다린다).
const RETURN_TONE = { 대기: 'o', 승인: 'b', 완료: 'g', 반려: 'r' };

const TRACKING_URLS = {
  'CJ대한통운': 'https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=',
  '한진택배': 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillSch.do?mCode=MN038&schLang=KR&wblnumText2=',
  '롯데택배': 'https://www.lotteglogis.com/mobile/reservation/tracking/trackingDetail?InvNo=',
  '우체국택배': 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=',
};
const trackUrl = (o) => (o.courier && o.tracking_number && TRACKING_URLS[o.courier] ? TRACKING_URLS[o.courier] + o.tracking_number : null);
// 온라인 주문이 실제로 낸 돈 — 쿠폰·포인트·배송비가 반영된 final_amount(없으면 옛 주문이라 total_price)
const paidOf = (o) => Number(o.final_amount ?? o.total_price ?? o.totalPrice ?? 0);

function ReturnStrip({ o }) {
  if (!o.return_status) return null;
  const tone = RETURN_TONE[o.return_status] || 'o';
  return (
    <div className={`strip ${tone}`}>
      <b className={`t-${tone}`}>{o.return_type || '환불'} {o.return_status}</b>
      {o.return_message ? <> · {o.return_message}</> : null}
      {/* 🔴 반려는 이유와 다음 길을 같이 말한다 — 「반려됐어요」 한 줄은 막다른 문구다 */}
      {o.return_status === '반려' && (
        <>{o.return_note ? <><br />사유: {o.return_note}</> : null}<br />다시 요청하시려면 아래 버튼으로 새로 접수해 주세요.</>
      )}
    </div>
  );
}

function ReturnButtons({ o, onReturn }) {
  if (o.status !== '배송완료') return null;
  return (
    <div className="btn-row">
      <button className="ui-btn sm line" onClick={(e) => { e.stopPropagation(); onReturn(o, '환불'); }}>환불 요청</button>
      <button className="ui-btn sm line" onClick={(e) => { e.stopPropagation(); onReturn(o, '교환'); }}>교환 요청</button>
    </div>
  );
}

// 매장 픽업(주류) — 기한·수령. 서버 값(GET /orders/my 의 fulfillment_type · pickup_deadline · picked_up_at)만 쓴다(2026-11-17 낮 지시 5).
function pickupLine(o) {
  if (!o || o.fulfillment_type !== 'pickup') return '';
  if (o.picked_up_at) return `매장 픽업 · ${dayLabel(o.picked_up_at)} 찾아가셨어요`;
  const until = pickupDeadlineLabel(o.pickup_deadline);
  return until ? `매장 픽업 · ${until} 찾아가 주세요` : '매장 픽업';
}

// 카드의 품목 줄(목업 P01) — 주문 줄의 items 가 있을 때만(지금 서버 목록엔 없다 → 요약 한 줄). 앞 두 개 + 「외 N건」.
//   서버 모양(product_name · quantity · price)과 상세 모양(name · qty · line_total)을 다 받는다. 앱이 금액을 지어내지 않는다 — 없으면 금액 칸을 비운다.
export function cardItems(o) {
  const list = Array.isArray(o && o.items) ? o.items : [];
  return list.map((it) => {
    const qty = Number(it.qty ?? it.quantity) || 0;
    const amount = it.line_total != null ? Number(it.line_total) : it.price != null && qty ? Number(it.price) * qty : null;
    return { name: it.name || it.product_name || '', spec: it.spec || '', qty, amount, image: it.image || null };
  }).filter((it) => it.name);
}

function OnlineCard({ o, summary, onOpen, onReturn }) {
  const url = trackUrl(o);
  const items = cardItems(o);
  return (
    <div className="ocard">
      <button className="oh tap" onClick={() => onOpen(o)} aria-label={`${dayLabel(o.created_at)} 주문 상세`}>
        <div><b>{dayLabel(o.created_at)}</b><small>{o.id}</small></div>
        <span className={`pill ${TONE[o.status] ?? 'b'}`}>{o.status || '결제완료'}</span>
      </button>
      <ReturnStrip o={o} />
      {items.length > 0 && (
        <button className="oi tap oitems" onClick={() => onOpen(o)} aria-label="주문 상품 보기">
          <span style={{ flex: 1, minWidth: 0 }}>
            {items.slice(0, 2).map((it, i) => (
              <span className="prow" key={i}>
                <span className="pimg">{it.image ? <img src={imgUrl(it.image)} alt="" /> : <Icon name="box" />}</span>
                <span className="info">
                  <span className="nm">{it.name}</span>
                  <span className="spec">{it.spec ? `${it.spec} · ` : ''}{it.qty}개</span>
                  {it.amount != null && <span className="price">{won(it.amount)}</span>}
                </span>
              </span>
            ))}
            {items.length > 2 && <small className="more">외 {items.length - 2}건</small>}
          </span>
          <span className="chev"><Icon name="chevR" size="sm" /></span>
        </button>
      )}
      {!items.length && summary && (
        <button className="oi tap" onClick={() => onOpen(o)}>
          <span className="ricon t-gray"><Icon name="box" /></span><span className="lbl">{summary}</span><span className="chev"><Icon name="chevR" size="sm" /></span>
        </button>
      )}
      <div className="of">
        <div className="kv"><span>총 결제금액</span><b>{won(paidOf(o))}</b></div>
        {pickupLine(o) && <div className="kv ship"><span><Icon name="store" size="sm" /> {pickupLine(o)}</span></div>}
        {o.courier && o.tracking_number && (
          <div className="kv ship">
            <span><Icon name="truck" size="sm" /> {o.courier} {o.tracking_number}</span>
            {url && <a className="link" href={url} target="_blank" rel="noreferrer">배송 추적<Icon name="chevR" size="sm" /></a>}
          </div>
        )}
        <ReturnButtons o={o} onReturn={onReturn} />
      </div>
    </div>
  );
}

function StoreCard({ r, onOpen }) {
  const cancelled = !!r.voided;
  return (
    <div className={`ocard${cancelled ? ' dim' : ''}`}>
      <div className="oh">
        <div><b>{dayLabel(r.date)} · 매장 {r.store_name || ''}</b><small>{r.item_summary}</small></div>
        <span className={`pill ${cancelled || r.is_return ? 'r' : 'g'}`}>{cancelled ? '취소' : r.is_return ? '반품' : '매장 영수증'}</span>
      </div>
      <div className="of">
        <div className="kv"><span>{r.is_return ? '반품 금액' : '결제금액'}</span><b>{won(r.total)}</b></div>
        <button className="ui-btn sm gray full" onClick={() => onOpen(r)}><Icon name="receipt" size="sm" />영수증 보기</button>
      </div>
    </div>
  );
}

function Nav({ title, onBack, large }) {
  if (large) {
    return (
      <header className="app-nav">
        <div className="nav-row"><div className="nav-side" /><div className="nav-title" /><div className="nav-side r" /></div>
        <div className="large"><h1>{title}</h1></div>
      </header>
    );
  }
  return (
    <header className="app-nav line">
      <div className="nav-row">
        <div className="nav-side"><button className="nav-btn" aria-label="뒤로" onClick={onBack}><Icon name="chevL" /></button></div>
        <h2 className="nav-title">{title}</h2>
        <div className="nav-side r" />
      </div>
    </header>
  );
}

// ── 매장 영수증(S17) — 종이 영수증과 같은 내용·같은 순서를 폰 폭에 맞게 ──────────
function StoreReceipt({ d }) {
  const voided = !!d.voided;
  const taxLines = receiptTaxLines(d);
  const store = d.store || {};
  const pay = (d.payments || []).find((p) => p.cash_received != null);
  return (
    <div className="sec">
      {/* 🔴 취소 배너 — 맨 위에, 크게. 손님이 폰을 내밀었을 때 계산원이 한눈에 알아야 한다(아래 작은 표시로는 늦다) */}
      {voided && (
        <div className="void-banner" role="alert">
          <b>취소된 거래</b>
          <span>결제 효력 없음</span>
          {!!d.voided_at && <small>취소 {fullDate(d.voided_at)}</small>}
        </div>
      )}
      <div className="receipt">
        {voided && <div className="stamp" aria-hidden="true">취소됨</div>}
        <h2>{store.display_name ? `${BRAND.name} ${store.display_name}` : (store.name || BRAND.name)}</h2>
        <div className="c">{[store.address, fullDate(d.date), d.pos_number ? `POS ${d.pos_number}` : ''].filter(Boolean).join(' · ')}</div>
        {(store.business_number || store.phone) && <div className="c">{[store.business_number && `사업자번호 ${store.business_number}`, store.phone].filter(Boolean).join(' · ')}</div>}
        <div className="dash" />
        <table>
          <tbody>
            {(d.items || []).map((it, i) => (
              <tr key={i}>
                <td>{it.name}{it.tax_type === '면세' && <> <span className="pill">면세</span></>}<div className="sub">{it.spec ? `${it.spec} · ` : ''}{it.qty} × {Number(it.unit_price || 0).toLocaleString('ko-KR')}</div></td>
                <td className="n">{Number(it.line_total || 0).toLocaleString('ko-KR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="dash" />
        <div className="kv"><span>소계</span><span>{won(d.subtotal)}</span></div>
        {/* 세금 줄 — 종이 영수증과 같은 줄·숫자(utils/receiptTax.js · 2026-11-17 낮 지시 5). 과세 구분이 없는 옛 자료는 예전 한 줄 */}
        {taxLines ? taxLines.map((t) => <div className="kv" key={t.label}><span>{t.label}</span><span>{won(t.amount)}</span></div>)
          : <div className="kv"><span>부가세(포함)</span><span>{won(d.tax)}</span></div>}
        <div className="kv total"><span>{d.is_return ? '반품 총액' : '합계'}</span><span>{won(d.total)}</span></div>
        {(d.payments || []).length > 0 && (
          <>
            <div className="dash" />
            {/* 취소돼도 결제 내역은 남긴다 — 손님이 보려는 게 「무엇으로 결제했었나」다 */}
            {d.payments.map((p) => (
              <div className="kv" key={p.seq}><span>{`${METHOD[p.method] || p.method}${p.status === 'canceled' ? ' (취소됨)' : ''}`}</span><span>{won(p.amount)}</span></div>
            ))}
            {d.payment_method === 'cash' && pay && (
              <>
                <div className="kv"><span>받은 금액</span><span>{won(pay.cash_received)}</span></div>
                <div className="kv"><span>거스름돈</span><span>{won(pay.change_amount)}</span></div>
              </>
            )}
          </>
        )}
        {(d.earned_points > 0 || d.points_used > 0) && (
          <>
            <div className="dash" />
            {d.points_used > 0 && <div className="kv"><span>사용 포인트</span><span>{pts(d.points_used)}</span></div>}
            {d.earned_points > 0 && <div className="kv"><span>적립 포인트</span><span>{pts(d.earned_points)}</span></div>}
            {d.points_balance != null && <div className="kv"><span>남은 포인트</span><span>{pts(d.points_balance)}</span></div>}
          </>
        )}
        <div className="dash" />
        {/* 거래 바코드 — 반품·재출력 때 계산원이 스캔 한 번으로 이 거래를 찾는다. 숫자도 같이(스캐너가 폰 화면을 못 읽을 때 손으로 친다) */}
        <div className="bc"><Code128 value={d.code} height={96} dimmed={voided} /></div>
        {voided && <div className="c t-r">이 영수증은 취소된 거래의 사본이에요. 결제 효력이 없어요.</div>}
      </div>
    </div>
  );
}

// ── 온라인 주문 상세(S18) ─────────────────────────────────────────
function OnlineDetail({ d, o, onReturn, onList }) {
  const status = d.status || o?.status || '';
  const at = STEPS.indexOf(status);
  const url = trackUrl(d);
  return (
    <div className="tw">
      {at >= 0 ? (
        <div className="timeline">{STEPS.map((s, i) => <span key={s} className={i <= at ? 'on' : undefined}><i />{s}</span>)}</div>
      ) : (
        <div className="sec" style={{ marginTop: 'var(--sp-3)' }}><span className={`pill ${TONE[status] ?? 'b'}`}>{status}</span></div>
      )}
      {o && o.return_status && <section className="sec"><div className="ocard"><ReturnStrip o={o} /></div></section>}
      <section className="sec">
        <div className="group">
          <div className="row"><span className="lbl">주문번호</span><span className="val">{d.id}</span></div>
          <div className="row"><span className="lbl">주문 일시</span><span className="val">{fullDate(d.date)}</span></div>
        </div>
      </section>
      <section className="sec">
        <div className="sec-h">상품</div>
        <div className="group">
          {(d.items || []).map((it, i) => (
            <div className="row" key={i}>
              <div className="prow" style={{ flex: 1, minWidth: 0 }}>
                <div className="pimg">{it.image ? <img src={imgUrl(it.image)} alt={it.name} /> : <Icon name="box" />}</div>
                <div className="info">
                  <div className="nm">{it.name}</div>
                  {/* 규격 — 같은 이름에 용량만 다른 물건이 많다 */}
                  <div className="spec">{it.spec ? `${it.spec} · ` : ''}{it.qty}개</div>
                  <div className="price">{won(it.line_total)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="sec">
        <div className="sec-h">결제</div>
        <div className="group pad">
          <div className="kv"><span>상품 금액</span><span>{won(d.total_price)}</span></div>
          <div className="kv"><span>배송비</span><span>{d.delivery_fee > 0 ? won(d.delivery_fee) : '무료'}</span></div>
          {d.coupon_discount > 0 && <div className="kv"><span>쿠폰 할인</span><span className="minus">−{won(d.coupon_discount)}</span></div>}
          {d.points_used > 0 && <div className="kv"><span>포인트</span><span className="minus">−{won(d.points_used)}</span></div>}
          <div className="kv total"><span>결제금액</span><span>{won(d.total)}</span></div>
          {d.payment_method && <div className="kv"><span>결제수단</span><span>{d.payment_method}</span></div>}
          {/* 부가세·세금계산서 — 이 주문을 **판 때** 의 판매자 과세 유형(서버 seller_tax · 2026-11-15 지시 3). 없으면 안 그린다 */}
          <SellerTaxNote info={d.seller_tax} />
        </div>
      </section>
      {o && o.fulfillment_type === 'pickup' && (
        <section className="sec">
          <div className="sec-h">매장 픽업</div>
          <div className="group">
            <div className="row"><span className="ricon"><Icon name="store" /></span><span className="lbl">{o.picked_up_at ? '찾아가셨어요' : '찾아가는 기한'}</span><span className="val"><b>{o.picked_up_at ? fullDate(o.picked_up_at) : (pickupDeadlineLabel(o.pickup_deadline) || '알림으로 알려 드려요')}</b></span></div>
          </div>
          <div className="sec-f">받으실 때 신분증으로 나이를 확인해요 — 예약한 본인만 받을 수 있어요.</div>
        </section>
      )}
      {d.tracking_number && (
        <section className="sec">
          <div className="sec-h">배송</div>
          <div className="group">
            <div className="row">
              <span className="ricon"><Icon name="truck" /></span>
              <span className="lbl">{d.courier || '택배'}<small>{d.tracking_number}</small></span>
              {url && <a className="link" href={url} target="_blank" rel="noreferrer">배송 추적<Icon name="chevR" size="sm" /></a>}
            </div>
          </div>
        </section>
      )}
      <section className="sec" style={{ paddingBottom: 'var(--sp-5)' }}>
        {o && <ReturnButtons o={o} onReturn={onReturn} />}
        <button className="ui-btn full gray" style={{ marginTop: 'var(--sp-3)' }} onClick={onList}>주문내역으로</button>
      </section>
    </div>
  );
}

// ── 환불·교환 요청(S15) — 아래 시트 ───────────────────────────────
function ReturnSheet({ target, summary, onClose, onDone }) {
  const { notify } = useDialog();
  // 고른 사유와 직접 적은 말은 따로 든다 — 하나로 두면 사유를 고른 뒤 자세히 적는 순간 고른 것이 사라진다
  const [pick, setPick] = useState('');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const reason = [pick, detail.trim()].filter(Boolean).join(' — ');
  const submit = async () => {
    if (!reason) { notify('사유를 고르거나 적어 주세요.'); return; }
    setBusy(true);
    try {
      const res = await requestReturn(target.order.id, { type: target.type, reason });
      notify(res?.data?.message || `${target.type} 요청이 접수됐어요.`);
      onDone();
    } catch (err) { notify(err.response?.data?.error || '요청을 보내지 못했어요. 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby="return-sheet-title" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet v2">
        <div className="grabber" />
        <div className="sheet-h">
          <div className="nav-side"><button className="nav-btn" onClick={onClose}>취소</button></div>
          <div className="nav-title" id="return-sheet-title">{target.type} 요청</div>
          <div className="nav-side r"><button className="nav-btn b" disabled={busy} onClick={submit}>제출</button></div>
        </div>
        <div className="sheet-b">
          <section className="sec">
            <div className="group">
              <div className="row"><span className="ricon t-gray"><Icon name="box" /></span><span className="lbl">{summary || `주문 ${target.order.id}`}<small>{dayLabel(target.order.created_at)} · {won(paidOf(target.order))}</small></span></div>
            </div>
          </section>
          <section className="sec">
            <div className="sec-h">사유를 고르거나 직접 적어 주세요</div>
            <div className="group" role="radiogroup" aria-label="사유">
              {REASONS.map((r) => (
                <button key={r} className="row tap" role="radio" aria-checked={pick === r} onClick={() => setPick(pick === r ? '' : r)}>
                  <span className="lbl">{r}</span>
                  <span className={`check${pick === r ? ' on' : ''}`}>{pick === r && <Icon name="check" size="sm" />}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="sec">
            <textarea className="area" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="자세한 사유(선택)" aria-label="자세한 사유" />
          </section>
          <section className="sec" style={{ paddingBottom: 'var(--sp-5)' }}>
            <button className="ui-btn full pri" disabled={busy} onClick={submit}>{busy ? '보내는 중…' : '요청 제출'}</button>
          </section>
        </div>
      </div>
    </div>
  );
}

// onDetail(true|false) — 영수증·주문 상세를 여는 동안 App 이 탭바를 숨긴다(목업 S17·S18 은 탭바 없이 뒤로만)
export default function OrderHistory({ orders = [], onReloadOrders, onOpenConsent, openSaleId = null, onOpened, onShop, onDetail }) {
  const [tab, setTab] = useState('전체');
  const [rows, setRows] = useState([]);
  const [storeVisible, setStoreVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState(null);           // { kind:'store'|'online', id, order? }
  const [detail, setDetail] = useState(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [returnTarget, setReturnTarget] = useState(null);   // { order, type }

  const load = useCallback(() => {
    let alive = true;
    setLoading(true); setError('');
    getMyPurchases()
      .then((res) => { if (!alive) return; setRows(res.data?.purchases || []); setStoreVisible(res.data?.store_visible !== false); })
      .catch(() => alive && setError('매장 구매 내역을 불러오지 못했어요.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);
  useEffect(() => load(), [load]);
  useEffect(() => { onDetail?.(!!view); }, [view]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => onDetail?.(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = useCallback((v) => {
    setView(v); setDetail(null); setDetailError(''); setDetailBusy(true);
    (v.kind === 'store' ? getStorePurchase(v.id) : getOnlinePurchase(v.id))
      .then((res) => setDetail(res.data))
      .catch(() => setDetailError(v.kind === 'store' ? '영수증을 불러오지 못했어요.' : '주문 상세를 불러오지 못했어요.'))
      .finally(() => setDetailBusy(false));
    window.scrollTo(0, 0);
  }, []);

  // 전자영수증 알림으로 들어왔으면 그 영수증을 바로 편다(목록에 없어도 — 볼 수 없으면 서버가 404)
  useEffect(() => {
    if (!openSaleId) return;
    open({ kind: 'store', id: openSaleId });
    onOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSaleId]);

  const summaryOf = (id) => (rows.find((r) => r.kind === 'online' && String(r.id) === String(id)) || {}).item_summary || '';
  const onReturn = (order, type) => setReturnTarget({ order, type });
  const returnSheet = returnTarget && (
    <ReturnSheet target={returnTarget} summary={summaryOf(returnTarget.order.id)} onClose={() => setReturnTarget(null)}
      onDone={() => { setReturnTarget(null); onReloadOrders?.(); }} />
  );

  if (view) {
    const order = view.kind === 'online' ? (orders.find((o) => String(o.id) === String(view.id)) || view.order) : null;
    return (
      <div className="v2 orders-v2">
        <Nav title={view.kind === 'store' ? '매장 영수증' : '주문 상세'} onBack={() => setView(null)} />
        {detailBusy && <div className="ui-empty"><p>불러오는 중…</p></div>}
        {!detailBusy && detailError && (
          <div className="sec"><div className="notice r"><Icon name="alert" /><div style={{ flex: 1 }}>{detailError}<div style={{ marginTop: 'var(--sp-2)' }}><button className="ui-btn sm gray" onClick={() => open(view)}>다시 시도</button></div></div></div></div>
        )}
        {!detailBusy && !detailError && detail && (view.kind === 'store'
          ? <div className="tw"><StoreReceipt d={detail} /></div>
          : <OnlineDetail d={detail} o={order} onReturn={onReturn} onList={() => setView(null)} />)}
        {returnSheet}
      </div>
    );
  }

  const online = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const stores = rows.filter((r) => r.kind === 'store');
  const list = tab === '온라인' ? online.map((o) => ({ kind: 'online', at: o.created_at, o }))
    : tab === '매장' ? stores.map((r) => ({ kind: 'store', at: r.date, r }))
    : [...online.map((o) => ({ kind: 'online', at: o.created_at, o })), ...stores.map((r) => ({ kind: 'store', at: r.date, r }))]
      .sort((a, b) => new Date(b.at) - new Date(a.at));
  const consentNote = !storeVisible && (
    <div className="notice g">
      <Icon name="info" />
      <div style={{ flex: 1 }}>
        <b>매장에서 사신 내역은 아직 안 보여요.</b><br />
        {BRAND.name} 각 지점은 서로 다른 사업자라, 매장 구매 내역을 보시려면 지점 통합 이용에 동의가 필요해요.
        {onOpenConsent && <div style={{ marginTop: 'var(--sp-2)' }}><button className="ui-btn sm pri" onClick={onOpenConsent}>동의하고 매장 내역 보기</button></div>}
      </div>
    </div>
  );

  return (
    <div className="v2 orders-v2">
      <Nav title="주문내역" large />
      <div className="tw">
        <div className="sec" style={{ marginTop: 'var(--sp-2)' }}>
          <div className="seg" role="tablist" aria-label="주문내역 나누기">
            {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : undefined} onClick={() => setTab(t)}>{t}</button>)}
          </div>
        </div>
        <div className="sec olist">
          {tab === '매장' && consentNote}
          {tab !== '온라인' && error && (
            <div className="notice r"><Icon name="alert" /><div style={{ flex: 1 }}>{error}<div style={{ marginTop: 'var(--sp-2)' }}><button className="ui-btn sm gray" onClick={load}>다시 시도</button></div></div></div>
          )}
          {tab !== '온라인' && loading && !error ? <div className="ui-empty"><p>불러오는 중…</p></div>
            : list.length === 0 && !(tab === '매장' && !storeVisible) ? (
              <div className="ui-empty">
                <div className="big"><Icon name="receipt" /></div>
                <h3>{tab === '매장' ? '매장 영수증이 없어요' : tab === '온라인' ? '온라인 주문이 없어요' : '주문내역이 없어요'}</h3>
                <p>온라인 주문과 매장 영수증이 여기에 모여요.</p>
                {onShop && <button className="ui-btn md pri" onClick={onShop}>쇼핑하러 가기</button>}
              </div>
            ) : list.map((x) => (x.kind === 'online'
              ? <OnlineCard key={`o-${x.o.id}`} o={x.o} summary={summaryOf(x.o.id)} onOpen={(o) => open({ kind: 'online', id: o.id, order: o })} onReturn={onReturn} />
              : <StoreCard key={`s-${x.r.id}`} r={x.r} onOpen={(r) => open({ kind: 'store', id: r.id })} />))}
          {tab === '전체' && !storeVisible && !loading && <div className="sec-f">매장에서 사신 내역은 「매장」 탭에서 동의하면 같이 보여요.</div>}
        </div>
      </div>
      {returnSheet}
    </div>
  );
}
