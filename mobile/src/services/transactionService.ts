import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api';
import { Transaction, Summary, toDateInputValue } from '@/utils/format';

// Keys for AsyncStorage
const KEY_TRANSACTIONS = '@spendwise:transactions_cache';
const KEY_SUMMARY = '@spendwise:summary_cache';
const KEY_QUEUE = '@spendwise:sync_queue';

export interface QueueItem {
  id: string; // queue item identifier
  action: 'ADD' | 'EDIT' | 'DELETE';
  tempId?: string; // used for ADD actions
  transactionId?: string; // used for EDIT / DELETE actions
  data?: any; // transaction data payload
  timestamp: number;
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncStatus {
  syncState: SyncState;
  pendingCount: number;
}

type SyncListener = (status: SyncStatus) => void;

// State management
let currentSyncState: SyncState = 'synced';
let isSyncing = false;
const listeners = new Set<SyncListener>();

function notifyListeners(pendingCount: number) {
  listeners.forEach((l) => l({ syncState: currentSyncState, pendingCount }));
}

export function subscribeToSyncStatus(listener: SyncListener) {
  listeners.add(listener);
  // Get initial count and notify
  getQueueCount().then((count) => {
    listener({ syncState: currentSyncState, pendingCount: count });
  });
  return () => {
    listeners.delete(listener);
  };
}

function updateSyncState(state: SyncState, pendingCount: number) {
  currentSyncState = state;
  notifyListeners(pendingCount);
}

async function getQueueCount(): Promise<number> {
  try {
    const queueJson = await AsyncStorage.getItem(KEY_QUEUE);
    if (!queueJson) return 0;
    const queue: QueueItem[] = JSON.parse(queueJson);
    return queue.length;
  } catch {
    return 0;
  }
}

// Check if error is due to network connection issues
function isNetworkError(err: any): boolean {
  // If there's no response object, it's a network/timeout/connection issue.
  // If we receive a response (like 400, 401, 500), the server WAS reached.
  return !err.response && !err.status;
}

// Generate a unique ID for local-only transactions or queue items
function generateUniqueId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Local cache helper: Recalculate summary from current transactions list
function recalculateSummary(transactions: Transaction[]): Summary {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    const amount = Number(t.amount) || 0;
    if (t.type === 'INCOME') {
      income += amount;
    } else {
      expense += amount;
    }
  }
  return {
    income,
    expense,
    balance: income - expense,
  };
}

/**
 * Sync the local queue to the backend server.
 * Processes each item in the queue sequentially in chronological order.
 */
export async function synchronize(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  let queue: QueueItem[] = [];
  try {
    const queueJson = await AsyncStorage.getItem(KEY_QUEUE);
    queue = queueJson ? JSON.parse(queueJson) : [];
  } catch (err) {
    console.error('Failed to read sync queue:', err);
    isSyncing = false;
    return;
  }

  if (queue.length === 0) {
    isSyncing = false;
    // We are synced. Let's do a fresh fetch from the server to guarantee consistency.
    try {
      await fetchFromServerAndCache();
      updateSyncState('synced', 0);
    } catch (err) {
      if (isNetworkError(err)) {
        updateSyncState('offline', 0);
      } else {
        updateSyncState('error', 0);
      }
    }
    return;
  }

  updateSyncState('syncing', queue.length);

  const remainingQueue: QueueItem[] = [...queue];

  for (const item of queue) {
    try {
      if (item.action === 'ADD') {
        const res = await API.post('/expenses', item.data);
        const serverTx: Transaction = res.data;
        const realId = serverTx.id;

        // 1. Update this tempId to realId in local cache
        const cachedJson = await AsyncStorage.getItem(KEY_TRANSACTIONS);
        if (cachedJson) {
          let cached: Transaction[] = JSON.parse(cachedJson);
          cached = cached.map((t) => (t.id === item.tempId ? serverTx : t));
          await AsyncStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(cached));
          await AsyncStorage.setItem(KEY_SUMMARY, JSON.stringify(recalculateSummary(cached)));
        }

        // 2. Map tempId to realId in subsequent queue items
        if (item.tempId && realId) {
          for (const remaining of remainingQueue) {
            if (remaining.transactionId === item.tempId) {
              remaining.transactionId = realId;
            }
          }
        }
      } else if (item.action === 'EDIT') {
        // If ID is still temporary, skip (should have been mapped, but just in case)
        if (item.transactionId?.startsWith('temp_')) {
          console.warn('Skipping EDIT because ID is still temporary:', item);
          remainingQueue.shift();
          await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(remainingQueue));
          continue;
        }
        await API.put(`/expenses/${item.transactionId}`, item.data);
      } else if (item.action === 'DELETE') {
        // If ID is still temporary, it means the ADD was never synced, so delete does nothing on backend.
        if (item.transactionId?.startsWith('temp_')) {
          console.warn('Skipping DELETE because ID is temporary:', item);
          remainingQueue.shift();
          await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(remainingQueue));
          continue;
        }
        try {
          await API.delete(`/expenses/${item.transactionId}`);
        } catch (err: any) {
          // If transaction already deleted (404), treat as success
          if (err.response?.status !== 404) {
            throw err;
          }
        }
      }

      // Success! Remove from remaining queue
      remainingQueue.shift();
      await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(remainingQueue));
      updateSyncState('syncing', remainingQueue.length);
    } catch (err: any) {
      if (isNetworkError(err)) {
        console.log('Network error encountered during sync, pausing queue execution.');
        updateSyncState('offline', remainingQueue.length);
        isSyncing = false;
        return;
      }

      // Non-network error (e.g. 400 Bad Request, validation failure, 401).
      // Discard this item to prevent blocking the queue forever, and proceed.
      console.error('Non-network error during sync processing, discarding queue item:', err, item);
      remainingQueue.shift();
      await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(remainingQueue));
      updateSyncState('syncing', remainingQueue.length);
    }
  }

  isSyncing = false;

  // Sync complete! Fetch latest source-of-truth from backend.
  try {
    await fetchFromServerAndCache();
    updateSyncState('synced', 0);
  } catch (err) {
    if (isNetworkError(err)) {
      updateSyncState('offline', 0);
    } else {
      updateSyncState('error', 0);
    }
  }
}

// Internal helper to fetch and update local cache from backend
async function fetchFromServerAndCache(): Promise<{ transactions: Transaction[]; summary: Summary }> {
  const [summaryRes, transactionsRes] = await Promise.all([
    API.get('/expenses/summary'),
    API.get('/expenses'),
  ]);

  const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
  const summary = summaryRes.data ?? recalculateSummary(transactions);

  await AsyncStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(transactions));
  await AsyncStorage.setItem(KEY_SUMMARY, JSON.stringify(summary));

  return { transactions, summary };
}

// Filter and sort transactions locally
function localFilterExpenses(
  transactions: Transaction[],
  filters: { category?: string; startDate?: string; endDate?: string; sort?: string } = {},
): Transaction[] {
  let result = [...transactions];

  if (filters.category) {
    result = result.filter((t) => t.category === filters.category);
  }

  if (filters.startDate) {
    const startStr = toDateInputValue(filters.startDate);
    result = result.filter((t) => toDateInputValue(t.date) >= startStr);
  }

  if (filters.endDate) {
    const endStr = toDateInputValue(filters.endDate);
    result = result.filter((t) => toDateInputValue(t.date) <= endStr);
  }

  const isAsc = filters.sort === 'asc';
  result.sort((a, b) => {
    const dateA = toDateInputValue(a.date);
    const dateB = toDateInputValue(b.date);
    return isAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
  });

  return result;
}

/**
 * Public API
 */

export async function getTransactions(
  filters: { category?: string; startDate?: string; endDate?: string; sort?: string } = {},
): Promise<Transaction[]> {
  try {
    // If we have unsynced changes, do not fetch from server to avoid overwrite conflicts
    const pendingCount = await getQueueCount();
    if (pendingCount > 0) {
      const cachedJson = await AsyncStorage.getItem(KEY_TRANSACTIONS);
      const cached = cachedJson ? JSON.parse(cachedJson) : [];
      return localFilterExpenses(cached, filters);
    }

    // Try fetching from server
    try {
      const { transactions } = await fetchFromServerAndCache();
      updateSyncState('synced', 0);
      return localFilterExpenses(transactions, filters);
    } catch (err) {
      if (isNetworkError(err)) {
        updateSyncState('offline', 0);
        // Fallback to local cache
        const cachedJson = await AsyncStorage.getItem(KEY_TRANSACTIONS);
        const cached = cachedJson ? JSON.parse(cachedJson) : [];
        return localFilterExpenses(cached, filters);
      }
      throw err;
    }
  } catch (err) {
    console.error('getTransactions failed:', err);
    // Fallback to local cache
    const cachedJson = await AsyncStorage.getItem(KEY_TRANSACTIONS);
    const cached = cachedJson ? JSON.parse(cachedJson) : [];
    return localFilterExpenses(cached, filters);
  }
}

export async function getSummary(): Promise<Summary> {
  try {
    const pendingCount = await getQueueCount();
    if (pendingCount > 0) {
      const cachedJson = await AsyncStorage.getItem(KEY_SUMMARY);
      return cachedJson ? JSON.parse(cachedJson) : { income: 0, expense: 0, balance: 0 };
    }

    try {
      const { summary } = await fetchFromServerAndCache();
      updateSyncState('synced', 0);
      return summary;
    } catch (err) {
      if (isNetworkError(err)) {
        updateSyncState('offline', 0);
        const cachedJson = await AsyncStorage.getItem(KEY_SUMMARY);
        return cachedJson ? JSON.parse(cachedJson) : { income: 0, expense: 0, balance: 0 };
      }
      throw err;
    }
  } catch (err) {
    console.error('getSummary failed:', err);
    const cachedJson = await AsyncStorage.getItem(KEY_SUMMARY);
    return cachedJson ? JSON.parse(cachedJson) : { income: 0, expense: 0, balance: 0 };
  }
}

export async function createTransaction(
  data: Omit<Transaction, 'id' | 'amount'> & { amount: number | string },
): Promise<Transaction> {
  const tempId = generateUniqueId();
  const newTx: Transaction = {
    id: tempId,
    amount: Number(data.amount),
    category: data.category,
    date: toDateInputValue(data.date),
    description: data.description,
    type: data.type,
  };

  // 1. Update local cache immediately (Optimistic Update)
  const cachedJson = await AsyncStorage.getItem(KEY_TRANSACTIONS);
  const cached: Transaction[] = cachedJson ? JSON.parse(cachedJson) : [];
  const updatedCache = [newTx, ...cached];
  await AsyncStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(updatedCache));
  await AsyncStorage.setItem(KEY_SUMMARY, JSON.stringify(recalculateSummary(updatedCache)));

  // 2. Queue mutation
  const queueJson = await AsyncStorage.getItem(KEY_QUEUE);
  const queue: QueueItem[] = queueJson ? JSON.parse(queueJson) : [];
  const newQueueItem: QueueItem = {
    id: generateUniqueId(),
    action: 'ADD',
    tempId,
    data: {
      ...data,
      amount: Number(data.amount),
      date: toDateInputValue(data.date),
    },
    timestamp: Date.now(),
  };
  const updatedQueue = [...queue, newQueueItem];
  await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(updatedQueue));

  // 3. Trigger sync in background
  synchronize();

  return newTx;
}

export async function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, 'id' | 'amount'>> & { amount?: number | string },
): Promise<Transaction> {
  // 1. Read cache and find target transaction
  const cachedJson = await AsyncStorage.getItem(KEY_TRANSACTIONS);
  const cached: Transaction[] = cachedJson ? JSON.parse(cachedJson) : [];
  const targetIndex = cached.findIndex((t) => t.id === id);

  if (targetIndex === -1) {
    throw new Error(`Transaction with id ${id} not found in cache.`);
  }

  const existingTx = cached[targetIndex];
  const updatedTx: Transaction = {
    ...existingTx,
    ...data,
    amount: data.amount !== undefined ? Number(data.amount) : existingTx.amount,
    date: data.date !== undefined ? toDateInputValue(data.date) : existingTx.date,
  };

  // 2. Update cache immediately
  cached[targetIndex] = updatedTx;
  await AsyncStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(cached));
  await AsyncStorage.setItem(KEY_SUMMARY, JSON.stringify(recalculateSummary(cached)));

  // 3. Update queue
  const queueJson = await AsyncStorage.getItem(KEY_QUEUE);
  let queue: QueueItem[] = queueJson ? JSON.parse(queueJson) : [];

  if (id.startsWith('temp_')) {
    // If it is a temp ID, we just modify the original ADD action's data payload in place!
    queue = queue.map((item) => {
      if (item.action === 'ADD' && item.tempId === id) {
        return {
          ...item,
          data: {
            ...item.data,
            ...data,
            amount: data.amount !== undefined ? Number(data.amount) : item.data.amount,
            date: data.date !== undefined ? toDateInputValue(data.date) : item.data.date,
          },
        };
      }
      return item;
    });
  } else {
    // If it's a real ID, we queue an EDIT action
    const newQueueItem: QueueItem = {
      id: generateUniqueId(),
      action: 'EDIT',
      transactionId: id,
      data: {
        ...data,
        ...(data.amount !== undefined ? { amount: Number(data.amount) } : {}),
        ...(data.date !== undefined ? { date: toDateInputValue(data.date) } : {}),
      },
      timestamp: Date.now(),
    };
    queue.push(newQueueItem);
  }
  await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(queue));

  // 4. Trigger sync in background
  synchronize();

  return updatedTx;
}

export async function deleteTransaction(id: string): Promise<void> {
  // 1. Read cache and filter out
  const cachedJson = await AsyncStorage.getItem(KEY_TRANSACTIONS);
  if (cachedJson) {
    const cached: Transaction[] = JSON.parse(cachedJson);
    const updatedCache = cached.filter((t) => t.id !== id);
    await AsyncStorage.setItem(KEY_TRANSACTIONS, JSON.stringify(updatedCache));
    await AsyncStorage.setItem(KEY_SUMMARY, JSON.stringify(recalculateSummary(updatedCache)));
  }

  // 2. Update queue
  const queueJson = await AsyncStorage.getItem(KEY_QUEUE);
  let queue: QueueItem[] = queueJson ? JSON.parse(queueJson) : [];

  if (id.startsWith('temp_')) {
    // If it's a temp ID, the transaction was never synced to the server.
    // So we can completely discard its ADD action and any subsequent EDIT actions from the queue!
    queue = queue.filter(
      (item) =>
        !(item.action === 'ADD' && item.tempId === id) &&
        !(item.action === 'EDIT' && item.transactionId === id),
    );
  } else {
    // If it's a real ID, we queue a DELETE action
    const newQueueItem: QueueItem = {
      id: generateUniqueId(),
      action: 'DELETE',
      transactionId: id,
      timestamp: Date.now(),
    };
    queue.push(newQueueItem);
  }
  await AsyncStorage.setItem(KEY_QUEUE, JSON.stringify(queue));

  // 3. Trigger sync in background
  synchronize();
}

export async function clearCache(): Promise<void> {
  await AsyncStorage.multiRemove([KEY_TRANSACTIONS, KEY_SUMMARY, KEY_QUEUE]);
  updateSyncState('synced', 0);
}
