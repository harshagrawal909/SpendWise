import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { subscribeToSyncStatus, synchronize, SyncState } from '@/services/transactionService';

type TransactionRefreshContextValue = {
  refreshKey: number;
  notifyTransactionChange: () => void;
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;
  syncState: SyncState;
  pendingCount: number;
  pendingIds: string[];
  triggerSync: () => Promise<void>;
};

const TransactionRefreshContext = createContext<TransactionRefreshContextValue | null>(null);

export function TransactionRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  const notifyTransactionChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    // Subscribe to sync status updates from transactionService
    const unsubscribe = subscribeToSyncStatus((status) => {
      setSyncState(status.syncState);
      setPendingCount(status.pendingCount);
      setPendingIds(status.pendingIds || []);
    });

    // Auto-trigger sync on app startup
    synchronize();

    return unsubscribe;
  }, []);

  // Auto-detect internet restoration: try to sync every 10 seconds if offline with pending changes
  useEffect(() => {
    let intervalId: any = null;

    if (pendingCount > 0 && (syncState === 'offline' || syncState === 'error')) {
      intervalId = setInterval(() => {
        console.log('[Auto-Sync] Attempting synchronization of pending changes...');
        synchronize();
      }, 10000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pendingCount, syncState]);

  const value = useMemo(
    () => ({
      refreshKey,
      notifyTransactionChange,
      isAddModalOpen,
      openAddModal: () => setIsAddModalOpen(true),
      closeAddModal: () => setIsAddModalOpen(false),
      syncState,
      pendingCount,
      pendingIds,
      triggerSync: synchronize,
    }),
    [refreshKey, notifyTransactionChange, isAddModalOpen, syncState, pendingCount, pendingIds],
  );

  return <TransactionRefreshContext.Provider value={value}>{children}</TransactionRefreshContext.Provider>;
}

export function useTransactionRefresh() {
  const ctx = useContext(TransactionRefreshContext);
  if (!ctx) throw new Error('useTransactionRefresh must be used within TransactionRefreshProvider');
  return ctx;
}
