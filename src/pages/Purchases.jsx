// 구매 내역 — 온라인 주문과 매장 구매를 한 목록으로, 매장 구매는 전자영수증까지 (2026-09-12).
//
// ── 이 화면이 생긴 이유 ──────────────────────────────────────────────────
//
// 계산대는 이미 "전자영수증 발송"(푸시)을 하고 있었는데 **받는 쪽이 없었다.** 알림은 뜨는데
// 눌러도 열 곳이 없었다. 여기가 그 열 곳이다.
//
// ── 왜 42칸 영수증을 그대로 안 그리나 ────────────────────────────────────
//
// 종이 영수증은 고정폭 42칸으로 조판돼 있다. 폰에서 그대로 그리면 글자가 깨알같아지거나
// 가로 스크롤이 생긴다. 그리고 그 조판은 POS 앱(receiptFormat.ts)에 있어서 웹에서 쓰려면
// **세 번째 구현**이 생긴다 — 미리보기와 실물이 어긋나는 사고를 겨우 하나로 합친 참이다.
// 그래서 **같은 내용, 같은 순서**로 읽기 좋게 그린다. 손님이 확인하려는 건 조판이 아니라
// 무엇을 얼마에 샀는지다.
import { useCallback, useEffect, useState } from 'react';
import { getMyPurchases, getStorePurchase, getOnlinePurchase } from '../api';
import Code128 from '../components/Code128';

const won = (n) => '₩' + Number(n || 0).toLocaleString('ko-KR');

const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const METHOD = { cash: '현금', card: '카드', credit: '외상' };

const STATUS_STYLE = {
  취소: { bg: '#fde8e8', color: '#c62828' },
  반품: { bg: '#fde8e8', color: '#c62828' },
  결제완료: { bg: 'var(--primary-light)', color: 'var(--primary-dark)' },
  배송완료: { bg: '#e6f9f1', color: '#009a58' },
  배송중: { bg: '#ede7f6', color: '#7c4dff' },
};

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'online', label: '온라인' },
  { key: 'store', label: '매장' },
];

export default function Purchases({ goBack, onOpenConsent, openSaleId = null, onOpened }) {
  const [rows, setRows] = useState([]);
  const [storeVisible, setStoreVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  // 보고 있는 상세. { kind, id } 로 두고 데이터는 따로 받는다 — 목록을 다시 안 불러도
  // 뒤로 가기가 즉시 된다.
  const [openRow, setOpenRow] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    let alive = true;
    getMyPurchases()
      .then((res) => {
        if (!alive) return;
        setRows(res.data?.purchases || []);
        setStoreVisible(res.data?.store_visible !== false);
      })
      .catch(() => alive && setError('구매 내역을 불러오지 못했어요.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const open = useCallback((row) => {
    setOpenRow(row);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    const req = row.kind === 'store' ? getStorePurchase(row.id) : getOnlinePurchase(row.id);
    req
      .then((res) => setDetail(res.data))
      .catch(() => setDetailError('영수증을 불러오지 못했어요.'))
      .finally(() => setDetailLoading(false));
  }, []);

  // 전자영수증 알림을 탭해 들어왔으면 **그 영수증을 바로 편다.** 목록만 열면 손님이
  // 다시 찾아 들어가야 하고, 그러면 알림을 누른 의미가 없다. 목록에 없어도(기간 밖·
  // 미동의) 상세를 직접 부르므로 서버가 판단한다 — 볼 수 없으면 404 안내가 뜬다.
  useEffect(() => {
    if (!openSaleId) return;
    open({ kind: 'store', id: openSaleId });
    onOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSaleId]);

  if (openRow) {
    return (
      <Detail
        row={openRow}
        data={detail}
        loading={detailLoading}
        error={detailError}
        onBack={() => { setOpenRow(null); setDetail(null); }}
      />
    );
  }

  const shown = filter === 'all' ? rows : rows.filter((r) => r.kind === filter);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f7f8fa)', paddingBottom: 100 }}>
      <Header title="구매 내역" onBack={goBack} />

      <div style={{ display: 'flex', gap: 8, padding: '12px 16px' }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: filter === f.key ? 'var(--primary)' : 'var(--card, #fff)',
              color: filter === f.key ? '#fff' : 'var(--text2, #868e96)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 미동의 안내 — 동의 팝업은 한 번 답하면 다시 안 뜨므로, 스스로 켤 길이 여기 있어야 한다. */}
      {!storeVisible && (
        <div style={{
          margin: '0 16px 12px', padding: '14px 16px', borderRadius: 12,
          background: 'var(--primary-light)', fontSize: 13, lineHeight: 1.6,
          color: 'var(--text, #222)',
        }}>
          <b>매장에서 사신 내역은 아직 안 보여요.</b><br />
          에스알마트 각 지점은 서로 다른 사업자라, 매장 구매 내역을 이 앱에서 보시려면
          지점 통합 이용에 동의가 필요해요.
          {onOpenConsent && (
            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={onOpenConsent}
                style={{
                  padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                  background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700,
                  fontFamily: 'inherit',
                }}
              >
                동의하고 매장 내역 보기
              </button>
            </div>
          )}
        </div>
      )}

      {loading && <Empty text="불러오는 중…" />}
      {!!error && !loading && <Empty text={error} />}
      {!loading && !error && shown.length === 0 && <Empty text="아직 구매 내역이 없어요." />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 16px' }}>
        {shown.map((r) => {
          const st = STATUS_STYLE[r.status] || { bg: '#f1f3f5', color: '#555' };
          const faded = r.kind === 'store' && r.voided;
          return (
            <button
              key={`${r.kind}-${r.id}`}
              type="button"
              onClick={() => open(r)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                background: 'var(--card, #fff)', border: 'none', borderRadius: 14,
                padding: '14px 16px', fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-dark)' }}>
                  {r.kind === 'store' ? (r.store_name || '매장') : '온라인 주문'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text2, #868e96)' }}>{fmtDate(r.date)}</span>
                <span style={{ flex: 1 }} />
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                  background: st.bg, color: st.color,
                }}>
                  {r.status}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{
                  fontSize: 15, fontWeight: 800,
                  color: faded ? 'var(--text2, #868e96)' : 'var(--text, #222)',
                  textDecoration: faded ? 'line-through' : 'none',
                }}>
                  {won(r.total)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text2, #868e96)' }}>{r.item_summary}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Header({ title, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
      background: 'var(--card, #fff)', position: 'sticky', top: 0, zIndex: 10,
      borderBottom: '1px solid var(--primary-light)',
    }}>
      <button
        type="button"
        onClick={onBack}
        style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
        aria-label="뒤로"
      >
        ‹
      </button>
      <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text, #222)' }}>{title}</span>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text2, #868e96)', fontSize: 14 }}>
      {text}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: strong ? 15 : 13, fontWeight: strong ? 800 : 400, color: strong ? 'var(--text, #222)' : 'var(--text2, #868e96)' }}>
        {label}
      </span>
      <span style={{ fontSize: strong ? 17 : 13, fontWeight: strong ? 900 : 600, color: 'var(--text, #222)' }}>
        {value}
      </span>
    </div>
  );
}

function Detail({ row, data, loading, error, onBack }) {
  const isStore = row.kind === 'store';
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f7f8fa)', paddingBottom: 100 }}>
      <Header title={isStore ? '매장 영수증' : '주문 내역'} onBack={onBack} />
      {loading && <Empty text="불러오는 중…" />}
      {!!error && !loading && <Empty text={error} />}
      {!loading && !error && data && (isStore ? <StoreReceipt d={data} /> : <OnlineReceipt d={data} />)}
    </div>
  );
}

function StoreReceipt({ d }) {
  const voided = !!d.voided;
  return (
    <div style={{ margin: 16, background: 'var(--card, #fff)', borderRadius: 16, padding: '22px 20px' }}>
      {/* 취소 배너 — **맨 위에, 크게.**
          손님이 폰을 내밀었을 때 계산원이 한눈에 알아야 한다. 아래쪽 작은 배지로는
          늦는다(화면을 아래까지 읽어야 알게 된다). 종이 영수증의 취소 배너와 같은 뜻이다. */}
      {voided && (
        <div style={{
          margin: '-6px 0 18px', padding: '14px 16px', borderRadius: 12,
          background: '#fde8e8', border: '2px solid #c62828', textAlign: 'center',
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#c62828', letterSpacing: 2 }}>
            취소된 거래
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#c62828', marginTop: 4 }}>
            결제 효력 없음
          </div>
          {!!d.voided_at && (
            <div style={{ fontSize: 13, color: '#c62828', marginTop: 4 }}>
              취소 {fmtDate(d.voided_at)}
            </div>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text, #222)' }}>
          {d.store?.display_name || d.store?.name || '에스알마트'}
        </div>
        {!!d.store?.business_number && (
          <div style={{ fontSize: 12, color: 'var(--text2, #868e96)', marginTop: 3 }}>
            사업자번호 {d.store.business_number}
          </div>
        )}
        {!!d.store?.address && (
          <div style={{ fontSize: 12, color: 'var(--text2, #868e96)' }}>{d.store.address}</div>
        )}
        {!!d.store?.phone && (
          <div style={{ fontSize: 12, color: 'var(--text2, #868e96)' }}>{d.store.phone}</div>
        )}
      </div>

      <Dashed />

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2, #868e96)', padding: '8px 0' }}>
        <span>{fmtDate(d.date)}</span>
        <span>거래번호 {d.id}{d.pos_number ? ` · POS ${d.pos_number}` : ''}</span>
      </div>

      <Dashed />

      <div style={{ padding: '10px 0' }}>
        {(d.items || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0' }}>
            <div style={{ flex: 1, marginRight: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #222)' }}>
                {it.name}
                {it.tax_type === '면세' && (
                  <span style={{ fontSize: 11, color: 'var(--text2, #868e96)', marginLeft: 6 }}>면세</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2, #868e96)', marginTop: 2 }}>
                {won(it.unit_price)} × {it.qty}{it.spec ? ` · ${it.spec}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #222)' }}>{won(it.line_total)}</div>
          </div>
        ))}
      </div>

      <Dashed />

      <div style={{ padding: '10px 0' }}>
        <Row label="소계" value={won(d.subtotal)} />
        <Row label="부가세(포함)" value={won(d.tax)} />
        <Row label={d.is_return ? '반품 총액' : '합계'} value={won(d.total)} strong />
      </div>

      {(d.payments || []).length > 0 && (
        <>
          <Dashed />
          <div style={{ padding: '10px 0' }}>
            {d.payments.map((p) => (
              <Row
                key={p.seq}
                label={`${METHOD[p.method] || p.method}${p.status === 'canceled' ? ' (취소됨)' : ''}`}
                value={won(p.amount)}
              />
            ))}
            {d.payment_method === 'cash' && d.payments.some((p) => p.cash_received != null) && (
              <>
                <Row label="받은 금액" value={won(d.payments.find((p) => p.cash_received != null).cash_received)} />
                <Row label="거스름돈" value={won(d.payments.find((p) => p.cash_received != null).change_amount)} />
              </>
            )}
          </div>
        </>
      )}

      {d.earned_points > 0 && (
        <>
          <Dashed />
          <div style={{ padding: '10px 0' }}>
            <Row label="적립" value={`${Number(d.earned_points).toLocaleString('ko-KR')}P`} />
            {d.points_balance != null && (
              <Row label="누적" value={`${Number(d.points_balance).toLocaleString('ko-KR')}P`} />
            )}
          </div>
        </>
      )}

      <Dashed />

      {/* 거래 바코드 — 반품·재출력하러 오셨을 때 계산원이 스캔 한 번으로 이 거래를 찾는다.
          숫자를 같이 적는 이유: 스캐너가 폰 화면을 못 읽는 경우가 있어서 손으로 칠 수 있어야 한다. */}
      <div style={{ position: 'relative', paddingTop: 18 }}>
        <Code128 value={d.code} height={96} dimmed={voided} />
        {voided && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
          }}>
            <span style={{
              fontSize: 30, fontWeight: 900, color: 'rgba(198,40,40,0.72)',
              letterSpacing: 8, transform: 'rotate(-12deg)',
              border: '3px solid rgba(198,40,40,0.72)', borderRadius: 10, padding: '4px 16px',
            }}>
              취소됨
            </span>
          </div>
        )}
      </div>
      {voided && (
        <div style={{ marginTop: 12, fontSize: 12, textAlign: 'center', color: '#c62828', fontWeight: 700 }}>
          이 영수증은 취소된 거래의 사본이에요. 결제 효력이 없어요.
        </div>
      )}
    </div>
  );
}

function OnlineReceipt({ d }) {
  return (
    <div style={{ margin: 16, background: 'var(--card, #fff)', borderRadius: 16, padding: '22px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text, #222)' }}>온라인 주문</div>
        <div style={{ fontSize: 12, color: 'var(--text2, #868e96)', marginTop: 3 }}>
          주문번호 {d.id} · {fmtDate(d.date)}
        </div>
      </div>

      <Dashed />

      <div style={{ padding: '10px 0' }}>
        {(d.items || []).map((it, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '7px 0' }}>
            <div style={{ flex: 1, marginRight: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #222)' }}>{it.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2, #868e96)', marginTop: 2 }}>
                {won(it.unit_price)} × {it.qty}{it.spec ? ` · ${it.spec}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #222)' }}>{won(it.line_total)}</div>
          </div>
        ))}
      </div>

      <Dashed />

      <div style={{ padding: '10px 0' }}>
        <Row label="상품 금액" value={won(d.total_price)} />
        {d.coupon_discount > 0 && <Row label="쿠폰 할인" value={`-${won(d.coupon_discount)}`} />}
        {d.points_used > 0 && <Row label="포인트 사용" value={`-${won(d.points_used)}`} />}
        {d.delivery_fee > 0 && <Row label="배송비" value={won(d.delivery_fee)} />}
        <Row label="결제 금액" value={won(d.total)} strong />
      </div>

      {!!d.tracking_number && (
        <>
          <Dashed />
          <div style={{ padding: '10px 0' }}>
            <Row label="택배사" value={d.courier || '-'} />
            <Row label="운송장" value={d.tracking_number} />
          </div>
        </>
      )}

      <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text2, #868e96)', textAlign: 'center', lineHeight: 1.6 }}>
        배송 조회와 교환·반품 요청은 마이페이지의 <b>주문내역</b>에서 하실 수 있어요.
      </div>
    </div>
  );
}

function Dashed() {
  return <div style={{ borderTop: '1px dashed var(--primary-light, #d7f0e2)' }} />;
}
