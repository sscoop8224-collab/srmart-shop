// 내 리뷰 (목업 정본 v1 의 S42, 묶음 6 · 2026-11-13 새벽)
// 결정 3: 만든다. 마이 → 「내 리뷰」(뒤로 = 마이). 상품 · 별점 · 내용 · 날짜 · 사장님 답글 · 삭제.
// 목록 = `GET /users/me/reviews`(상품 이름만 붙어 온다) — 그림·**규격**은 앱이 들고 있는 상품 목록에서 찾는다(없으면 상자 아이콘 · 이름만).
// 「삭제」는 바로 지우지 않고 **확인창**을 거친다(목업 「삭제 확인」) — 지운 리뷰는 되돌릴 수 없다. 서버 `DELETE /reviews/:id`(본인 것만).
// 목업이 짚은 F10 의 「상세의 리뷰 쓰기 버튼이 안 보인다」는 묶음 3 에서 이미 고쳐졌다(상세가 user 를 받는다).
import { useEffect, useState } from 'react';
import { getMyReviews, deleteReview, imgUrl } from '../api';
import { useDialog } from '../DialogContext';
import Icon from '../components/ui/Icon';

// DATETIME 은 JSON 에서 UTC ISO 로 온다 — new Date 로 읽어 기기 시간의 날짜로(앞 10자를 자르면 하루 밀릴 수 있다)
const ymd = (s) => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

function Stars({ n }) {
  const v = Math.max(0, Math.min(5, Number(n) || 0));
  return (
    <span className="stars" aria-label={`별점 ${v}점`}>
      {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={i <= v ? 'sm fill' : 'sm'} />)}
    </span>
  );
}

function MyReviews({ products = [], goBack, onProductClick }) {
  const { notify, confirm } = useDialog();
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    getMyReviews()
      .then((r) => { if (alive) setRows(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (alive) { setFailed(true); setRows([]); } });
    return () => { alive = false; };
  }, [tick]);

  const handleDelete = async (r) => {
    const ok = await confirm({ title: '리뷰를 삭제할까요?', message: '지운 리뷰는 되돌릴 수 없어요.', okLabel: '삭제', danger: true });
    if (!ok) return;
    try {
      await deleteReview(r.id);
      setRows((prev) => (prev || []).filter((x) => x.id !== r.id));
      notify({ icon: 'check', title: '리뷰를 삭제했어요' });
    } catch (e) {
      notify(e.response?.data?.error || '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div className="v2 myrev-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" onClick={goBack}><Icon name="chevL" />마이</button></div>
          <div className="nav-title" />
          <div className="nav-side r" />
        </div>
        <div className="large"><h1>내 리뷰</h1></div>
      </header>

      {rows === null ? (
        <div className="ui-empty"><p>불러오는 중…</p></div>
      ) : failed ? (
        <div className="ui-empty">
          <div className="big"><Icon name="wifiOff" /></div>
          <h3>내 리뷰를 불러오지 못했어요</h3>
          <p>인터넷 연결을 확인하고 다시 시도해 주세요.</p>
          <button type="button" className="ui-btn pri" onClick={() => setTick((t) => t + 1)}>다시 시도</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="ui-empty">
          <div className="big"><Icon name="msg" /></div>
          <h3>아직 쓴 리뷰가 없어요</h3>
          <p>산 상품의 상세 화면에서 리뷰를 쓸 수 있어요.</p>
        </div>
      ) : (
        rows.map((r) => {
          const p = products.find((x) => x.id === r.product_id);
          return (
            <section className="sec" key={r.id}>
              <div className="group">
                <div className="review">
                  <div className="prow">
                    <button type="button" className="mr-prod" disabled={!p} onClick={() => p && onProductClick?.(p)} aria-label={`${r.product_name || '상품'} 보기`}>
                      <div className="pimg">{p && p.image ? <img src={imgUrl(p.image)} alt="" /> : <Icon name="box" />}</div>
                      <div className="info">
                        <div className="nm">{r.product_name || '판매가 끝난 상품'}{p && p.spec ? ` ${p.spec}` : ''}</div>
                        <div className="mr-meta"><Stars n={r.rating} /><small>{ymd(r.created_at)}</small></div>
                      </div>
                    </button>
                    <button type="button" className="nav-btn danger mr-del" onClick={() => handleDelete(r)}>삭제</button>
                  </div>
                  <p>{r.content}</p>
                  {r.reply && <div className="reply">사장님 답글 · {r.reply}</div>}
                  {r.is_hidden ? <p className="f-hint">관리자가 가린 리뷰예요 — 상품 화면에는 보이지 않아요.</p> : null}
                </div>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

export default MyReviews;
