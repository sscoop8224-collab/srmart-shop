import { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';
import { getStores } from './api';

export const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [guestStoreId, setGuestStoreIdState] = useState(() => {
    const saved = localStorage.getItem('guestStoreId');
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    setStoresLoading(true);
    getStores()
      .then(res => setStores(res.data || []))
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

  const currentStoreId = user?.store_id || guestStoreId;
  const currentStore = stores.find(s => s.id === currentStoreId) || null;
  const isGuest = !user;

  return (
    <StoreContext.Provider value={{
      stores,
      storesLoading,
      currentStoreId,
      currentStore,
      guestStoreId,
      setGuestStoreId,
      isGuest,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
