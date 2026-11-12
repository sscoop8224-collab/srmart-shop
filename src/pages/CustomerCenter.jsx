// 고객센터 (목업 정본 v1 의 S46, 묶음 6 · 2026-11-13 새벽)
// 지시 6: 새 화면. 회사 소개(S40)의 「고객센터」 칩 → 이 화면(뒤로 = 앞 화면).
//   · 문의하기 — **내 매장 전화**(맨 위) · AI 상담(S37 — 헤더 아이콘과 같은 창을 연다)
//   · 다른 매장 전화 — 손님에게 보이는 매장 중 내 매장을 뺀 곳(2026-11-12 확정)
//   · 자주 묻는 질문 — `GET /api/shop/faqs`(어드민 「자주 묻는 질문」) · 누르면 펼침. 매장 전화는 FAQ 에 따로 적지 않는다(매장 API 의 phone).
// 매장 = `GET /api/stores?audience=customer` 의 phone · operating_hours. 비어 있는 칸은 빼고 보인다(지어내지 않는다).
import { useEffect, useState } from 'react';
import { getStores, getShopFaqs } from '../api';
import { useStore } from '../StoreContext';
import Icon from '../components/ui/Icon';

const telHref = (t) => `tel:${String(t || '').replace(/[^0-9+]/g, '')}`;
const shortName = (n) => String(n || '').replace(/^에스알마트\s*/, '');
const sub = (s) => [s.phone, s.operating_hours].filter(Boolean).join(' · ');

function CustomerCenter({ goBack, onOpenChat }) {
  const { currentStoreId } = useStore();
  const [stores, setStores] = useState(null);
  const [faqs, setFaqs] = useState(null);
  const [faqFailed, setFaqFailed] = useState(false);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let alive = true;
    getStores().then((r) => { if (alive) setStores(Array.isArray(r.data) ? r.data : []); }).catch(() => { if (alive) setStores([]); });
    getShopFaqs().then((r) => { if (alive) setFaqs(Array.isArray(r.data) ? r.data : []); }).catch(() => { if (alive) { setFaqFailed(true); setFaqs([]); } });
    return () => { alive = false; };
  }, []);

  const list = stores || [];
  const mine = list.find((s) => s.id === currentStoreId);
  const others = list.filter((s) => s.id !== currentStoreId && s.phone);

  return (
    <div className="v2 cs-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" aria-label="뒤로" onClick={goBack}><Icon name="chevL" /></button></div>
          <div className="nav-title" />
          <div className="nav-side r" />
        </div>
        <div className="large"><h1>고객센터</h1></div>
      </header>

      <div className="tw">
        <section className="sec">
          <div className="sec-h">문의하기</div>
          <div className="group">
            {mine && mine.phone && (
              <a className="row tap ind" href={telHref(mine.phone)}>
                <span className="ricon"><Icon name="phone" /></span>
                <span className="lbl">{shortName(mine.display_name || mine.name)}에 전화하기<small>{sub(mine)}</small></span>
                <span className="chev"><Icon name="chevR" size="sm" /></span>
              </a>
            )}
            <button type="button" className="row tap ind" onClick={onOpenChat}>
              <span className="ricon t-blue"><Icon name="sparkle" /></span>
              <span className="lbl">AI 상담<small>상품·배송·주문 문의 — 사람이 아닌 AI 도우미</small></span>
              <span className="chev"><Icon name="chevR" size="sm" /></span>
            </button>
          </div>
        </section>

        {others.length > 0 && (
          <section className="sec">
            <div className="sec-h">다른 매장 전화</div>
            <div className="group">
              {others.map((s) => (
                <a key={s.id} className="row tap ind" href={telHref(s.phone)}>
                  <span className="ricon t-gray"><Icon name="phone" /></span>
                  <span className="lbl">{s.display_name || s.name}<small>{sub(s)}</small></span>
                  <span className="chev"><Icon name="chevR" size="sm" /></span>
                </a>
              ))}
            </div>
            <div className="sec-f">주소·지도는 매장안내에서 볼 수 있어요.</div>
          </section>
        )}

        <section className="sec faq">
          <div className="sec-h">자주 묻는 질문</div>
          {faqs === null ? (
            <div className="group pad"><p className="f-hint" style={{ margin: 0 }}>불러오는 중…</p></div>
          ) : faqs.length === 0 ? (
            <div className="group pad"><p className="f-hint" style={{ margin: 0 }}>{faqFailed ? '질문을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.' : '아직 등록된 질문이 없어요. 궁금한 점은 매장에 전화해 주세요.'}</p></div>
          ) : (
            <div className="group">
              {faqs.map((q) => {
                const on = open === q.id;
                return (
                  <div key={q.id} className={`faq-item${on ? ' on' : ''}`}>
                    <button type="button" className="row faq-row" aria-expanded={on} onClick={() => setOpen(on ? null : q.id)}>
                      <span className="lbl">{q.question}</span>
                      <span className="chev"><Icon name={on ? 'chevD' : 'chevR'} size="sm" /></span>
                    </button>
                    {on && <div className="a">{q.answer}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default CustomerCenter;
