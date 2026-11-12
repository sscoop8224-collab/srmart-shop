// 점포 선택 (목업 정본 v1 의 S30, 묶음 2 · 2026-11-12 밤)
// 처음 들어오면 반드시 고른다(닫기 없음). 줄을 누르면 바로 그 매장으로 — 따로 「확인」 단추가 없다.
// 목록은 StoreContext 가 받은 「손님에게 보이는 매장」(GET /api/stores?audience=customer). 색·크기는 styles/shop.css.
import { useStore } from '../StoreContext';
import Icon from './ui/Icon';

export default function StoreSelectionModal({ onSelected }) {
  const { stores, storesLoading, setGuestStoreId } = useStore();

  const choose = (id) => {
    const storeId = Number(id);
    setGuestStoreId(storeId);
    onSelected?.(storeId);
  };

  return (
    <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby="store-pick-title">
      <div className="sheet v2">
        <div className="grabber" />
        <div className="sheet-h">
          <div className="nav-side" />
          <div className="nav-title" id="store-pick-title">어느 매장에서 둘러볼까요?</div>
          <div className="nav-side r" />
        </div>
        <div className="sheet-b">
          {storesLoading ? (
            <div className="ui-empty"><div className="spin" /><p>점포 목록을 불러오는 중…</p></div>
          ) : stores.length === 0 ? (
            <div className="ui-empty"><div className="big"><Icon name="store" /></div><h3>지금 둘러볼 수 있는 점포가 없어요</h3></div>
          ) : (
            <section className="sec">
              <div className="group">
                {stores.map((s) => (
                  <button key={s.id} className="row ind" onClick={() => choose(s.id)}>
                    <span className="ricon"><Icon name="store" /></span>
                    <span className="lbl">{s.name}{s.address && <small>{s.address}</small>}</span>
                    <span className="chev"><Icon name="chevR" size="sm" /></span>
                  </button>
                ))}
              </div>
              <div className="sec-f">고른 매장의 가격·재고로 보여 드려요. 나중에 홈 위쪽에서 바꿀 수 있어요.</div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
