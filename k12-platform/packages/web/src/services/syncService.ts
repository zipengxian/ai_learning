import apiClient from '@/api/client';

interface QueueAction {
  id: string;
  type: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

const SYNC_QUEUE_KEY = 'k12_sync_queue';
const MAX_RETRIES = 3;

let isSyncing = false;
let syncStatusChangedListeners: Array<(status: SyncStatus) => void> = [];

export type SyncStatus = 'idle' | 'syncing' | 'complete' | 'error';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function notifyListeners(status: SyncStatus): void {
  syncStatusChangedListeners.forEach((fn) => fn(status));
}

function getQueue(): QueueAction[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueAction[]): void {
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage full — trim oldest items
    if (queue.length > 0) {
      const trimmed = queue.slice(Math.floor(queue.length / 2));
      try {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(trimmed));
      } catch {
        // Give up
      }
    }
  }
}

/**
 * Check current network connectivity.
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Enqueue an action for later sync.
 */
export function enqueueAction(type: string, data: unknown): void {
  const queue = getQueue();
  queue.push({
    id: generateId(),
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  });
  saveQueue(queue);
}

/**
 * Process all queued actions by sending them to the API.
 * Called automatically when coming back online.
 */
export async function processQueue(): Promise<void> {
  if (!isOnline()) return;
  if (isSyncing) return;
  isSyncing = true;
  notifyListeners('syncing');

  const queue = getQueue();
  if (queue.length === 0) {
    isSyncing = false;
    notifyListeners('complete');
    return;
  }

  const remaining: QueueAction[] = [];
  let hadError = false;

  for (const item of queue) {
    try {
      await dispatchAction(item);
    } catch (err: unknown) {
      const isNetworkError =
        err instanceof Error &&
        (err.message === 'Network Error' || (err as { code?: string }).code === 'ERR_NETWORK');

      if (isNetworkError) {
        remaining.push(item);
        hadError = true;
      } else if (item.retryCount < MAX_RETRIES) {
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
        hadError = true;
      }
      // If max retries exceeded, drop the item silently
    }
  }

  saveQueue(remaining);
  isSyncing = false;

  if (hadError && remaining.length > 0) {
    notifyListeners('error');
  } else {
    notifyListeners('complete');
  }
}

async function dispatchAction(item: QueueAction): Promise<void> {
  switch (item.type) {
    case 'recordStudy':
      await apiClient.post('/study/records', item.data);
      break;
    case 'markWrongAnswerMastered':
      await apiClient.delete(`/wrong-answers/${(item.data as { id: string }).id}`);
      break;
    default:
      throw new Error(`Unknown action type: ${item.type}`);
  }
}

/**
 * Register a callback for sync status changes.
 */
export function onSyncStatusChange(fn: (status: SyncStatus) => void): () => void {
  syncStatusChangedListeners.push(fn);
  return () => {
    syncStatusChangedListeners = syncStatusChangedListeners.filter((f) => f !== fn);
  };
}

/**
 * Set up online/offline event listeners to auto-process queue.
 */
let listenersInitialized = false;

export function initSyncListeners(): void {
  if (listenersInitialized) return;
  listenersInitialized = true;

  const handleOnline = () => {
    processQueue();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
  }
}