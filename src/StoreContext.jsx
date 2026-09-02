import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { getStores } from './api';

export const StoreContext = createContext(null);

const OWNER_VIEW_STORE_KEY = 'owner_view_store_id';

export function StoreProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [guestStoreId, setGuestStoreIdState] = useState(() => {
    const saved = localStorage.getItem('guestStoreId');
    return saved ? Number(saved) : null;
  });

  // owner는 가입점포가 없다(전 매장 관리자, 의도된 동작) — 그래서 손님 화면(가격/재고/배송구역)을
  // 검증하려면 상단 드롭다운으로 "지금 어느 매장 손님인 것처럼 볼지"를 직접 골라야 한다.
  // sessionStorage(세션 동안만 유지, 로그인 계정과 무관하게 브라우저 탭 닫으면 초기화)에 저장 —
  // localStorage(guestStoreId)와는 성격이 달라 따로 키를 쓴다: guestStoreId는 "비로그인 손님이
  // 다음에 다시 와도 기억"이 목적이고, 이건 "오너가 지금 이 세션에서 무슨 매장을 보고 있는지"가
  // 목적이라 세션을 넘어 남으면 오히려 다음에 헷갈린다.
  const isOwner = user?.role === 'owner';
  const [ownerViewStoreId, setOwnerViewStoreIdState] = useState(() => {
    const saved = sessionStorage.getItem(OWNER_VIEW_STORE_KEY);
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    setStoresLoading(true);
    getStores()
      .then(res => {
        const d = res.data;
        setStores(Array.isArray(d) ? d : Array.isArray(d?.stores) ? d.stores : Array.isArray(d?.data) ? d.data : []);
      })
      .catch(err => console.error('점포 목록 로드 실패:', err))
      .finally(() => setStoresLoading(false));
  }, []);

  const setGuestStoreId = (storeId) => {
    if (storeId) {
      localStorage.setItem('guestStoreId', String(storeId));
      setGuestStoreIdState(Number(storeId));
    } else {
      localStorage.removeItem('guestStoreId');
      setGuestStoreIdState(null);
    }
  };

  const setOwnerViewStoreId = (storeId) => {
    if (storeId) {
      sessionStorage.setItem(OWNER_VIEW_STORE_KEY, String(storeId));
      setOwnerViewStoreIdState(Number(storeId));
    } else {
      sessionStorage.removeItem(OWNER_VIEW_STORE_KEY);
      setOwnerViewStoreIdState(null);
    }
  };

  // owner는 미리보기 매장(없으면 1=검암점, 백엔드 resolveStoreId 기본값과 동일하게 맞춤 — 다른
  // 값이면 "선택 안 함"과 "1번 매장"이 겉보기엔 똑같이 보여서 헷갈림).
  // 일반 회원/게스트 로직은 그대로(건드리지 않음).
  const currentStoreId = isOwner ? (ownerViewStoreId || 1) : (user?.store_id || guestStoreId);
  const currentStore = Array.isArray(stores) ? (stores.find(s => s.id === currentStoreId) || null) : null;
  const isGuest = !user;

  return (
    <StoreContext.Provider value={{
      stores,
      storesLoading,
      currentStoreId,
      currentStore,
      guestStoreId,
      setGuestStoreId,
      isOwner,
      ownerViewStoreId,
      setOwnerViewStoreId,
      isGuest,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
