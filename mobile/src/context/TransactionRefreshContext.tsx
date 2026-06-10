import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type TransactionRefreshContextValue = {
  refreshKey: number;
  notifyTransactionChange: () => void;
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
};

const TransactionRefreshContext = createContext<TransactionRefreshContextValue | null>(null);

export function TransactionRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const notifyTransactionChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      refreshKey,
      notifyTransactionChange,
      isAddModalOpen,
      openAddModal: () => setIsAddModalOpen(true),
      closeAddModal: () => setIsAddModalOpen(false),
    }),
    [refreshKey, notifyTransactionChange, isAddModalOpen],
  );

  return <TransactionRefreshContext.Provider value={value}>{children}</TransactionRefreshContext.Provider>;
}

export function useTransactionRefresh() {
  const ctx = useContext(TransactionRefreshContext);
  if (!ctx) throw new Error('useTransactionRefresh must be used within TransactionRefreshProvider');
  return ctx;
}
