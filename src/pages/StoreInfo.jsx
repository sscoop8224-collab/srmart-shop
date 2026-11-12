// 매장안내 (목업 정본 v1 의 S44, 묶음 6 · 2026-11-13 새벽)
// 지시 6: 새 화면. 회사 소개(S40)의 「매장안내」 칩 → 이 화면(뒤로 = 앞 화면).
// 데이터: `GET /api/stores?audience=customer`(「손님에게 보이는 매장」 · 이 화면을 열 때 새로 읽는다 — 못 읽으면 다시 시도) —
//   이름(display_name) · 주소 · 영업시간(operating_hours) · 전화(phone). 비어 있는 칸은 그 줄에서 뺀다(지어내지 않는다).
// 「전화」 = tel: · 「지도 열기」 = 주소로 지도 검색(좌표 없이 된다) · 「이 매장으로」 = **확인창 「장바구니 가격·배송이 바뀔 수 있어요」** 뒤에 바꾼다.
// 🔸 매장을 바꿀 수 있는 사람은 점포 선택(S30)과 같다 — 손님(로그인 안 함)과 대표(미리보기 매장). **회원은 가입 매장으로 정해져** 단추가 없다.
import { useEffect, useState } from 'react';
import { getStores } from '../api';
import { useStore } from '../StoreContext';
import { useDialog } from '../DialogContext';
import Icon from '../components/ui/Icon';

const telHref = (t) => `tel:${String(t || '').replace(/[^0-9+]/g, '')}`;
const mapHref = (addr) => `https://map.kakao.com/link/search/${encodeURIComponent(addr)}`;

function StoreInfo({ goBack, onChooseStore }) {
  const { currentStoreId } = useStore();
  const { confirm } = useDialog();
  const [list, setList] = useState(null);       // null = 불러오는 중
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    getStores()
      .then((r) => { if (alive) setList(Array.isArray(r.data) ? r.data : []); })
      .catch(() => { if (alive) { setFailed(true); setList([]); } });
    return () => { alive = false; };
  }, [tick]);

  const choose = async (s) => {
    const nm = s.display_name || s.name;
    const ok = await confirm({ icon: 'store', title: `${nm}으로 바꿀까요?`, message: '장바구니 가격·배송이 바뀔 수 있어요.\n매장마다 가격·재고·배송 지역이 달라요.', okLabel: '바꾸기' });
    if (ok) onChooseStore(s.id);
  };

  return (
    <div className="v2 storeinfo-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" aria-label="뒤로" onClick={goBack}><Icon name="chevL" /></button></div>
          <div className="nav-title" />
          <div className="nav-side r" />
        </div>
        <div className="large"><h1>매장안내</h1></div>
      </header>

      {list === null ? (
        <div className="ui-empty"><p>불러오는 중…</p></div>
      ) : failed || list.length === 0 ? (
        <div className="ui-empty">
          <div className="big r"><Icon name="alert" /></div>
          <h3>매장 정보를 불러오지 못했어요</h3>
          <p>잠시 뒤 다시 시도해 주세요.</p>
          <button type="button" className="ui-btn md line" onClick={() => { setList(null); setTick((t) => t + 1); }}><Icon name="refresh" size="sm" />다시 시도</button>
        </div>
      ) : (
        <div className="tw">
          {list.map((s) => {
            const mine = s.id === currentStoreId;
            const facts = [s.operating_hours && <span key="h"><Icon name="clock" size="sm" /> {s.operating_hours}</span>, s.phone && <span key="p"><Icon name="phone" size="sm" /> {s.phone}</span>].filter(Boolean);
            return (
              <section className="sec" key={s.id}>
                <div className="group store-card">
                  <div className="row ind sc-top">
                    <span className="ricon"><Icon name="store" /></span>
                    <span className="lbl"><b>{s.display_name || s.name}</b>{mine && <> <span className="pill g">내 매장</span></>}{s.address && <small>{s.address}</small>}</span>
                  </div>
                  {facts.length > 0 && (
                    <div className="row sc-facts"><span className="lbl"><small>{facts.reduce((a, x, i) => (i ? [...a, ' · ', x] : [x]), [])}</small></span></div>
                  )}
                  <div className="acts">
                    {s.phone && <a className="ui-btn sm gray" href={telHref(s.phone)}><Icon name="phone" size="sm" />전화</a>}
                    {s.address && <a className="ui-btn sm gray" href={mapHref(s.address)} target="_blank" rel="noopener noreferrer"><Icon name="pin" size="sm" />지도 열기</a>}
                    {!mine && onChooseStore && <button type="button" className="ui-btn sm sec" onClick={() => choose(s)}>이 매장으로</button>}
                  </div>
                </div>
              </section>
            );
          })}
          <div className="sec-f sc-foot">영업시간·전화는 매장 사정에 따라 바뀔 수 있어요.</div>
        </div>
      )}
    </div>
  );
}

export default StoreInfo;
