import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheResponse, getCachedResponse } from '@/services/offlineCache';
import { isOnline } from '@/services/syncService';

interface UseOfflineQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  isOffline: boolean;
  refetch: () => void;
}

/**
 * React hook that wraps API calls with offline support.
 * - On success: caches response and returns data.
 * - On network error: returns cached data if available, shows offline indicator.
 * - Auto-refetches when coming back online.
 */
export function useOfflineQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
): UseOfflineQueryResult<T> {
  const [data, setData] = useState<T | null>(() => getCachedResponse<T>(key));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOfflineState, setIsOfflineState] = useState(!isOnline());

  const fetcherRef = useRef(fetcher);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      cacheResponse(key, result);
      setData(result);
      setIsOfflineState(false);
    } catch (err: unknown) {
      const networkErr =
        err instanceof Error &&
        (err.message === 'Network Error' || (err as { code?: string }).code === 'ERR_NETWORK');

      if (networkErr) {
        setIsOfflineState(true);
        const cached = getCachedResponse<T>(key);
        if (cached !== null) {
          setData(cached);
          setError(null);
        } else {
          setError(err instanceof Error ? err : new Error('网络不可用'));
        }
      } else {
        setError(err instanceof Error ? err : new Error('未知错误'));
      }
    } finally {
      setLoading(false);
    }
  }, [key]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for online/offline events to trigger refetch
  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineState(false);
      fetchData();
    };
    const handleOffline = () => {
      setIsOfflineState(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchData]);

  return {
    data,
    loading: loading && data === null,
    error,
    isOffline: isOfflineState,
    refetch: fetchData,
  };
}