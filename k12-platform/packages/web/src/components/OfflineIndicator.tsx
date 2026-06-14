import { useState, useEffect, useCallback } from 'react';
import { initSyncListeners, onSyncStatusChange, isOnline as checkOnline, processQueue, type SyncStatus } from '@/services/syncService';

const AUTO_DISMISS_MS = 3000;

export function OfflineIndicator() {
  const [isOfflineMode, setIsOfflineMode] = useState(!checkOnline());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  const showCompleteBriefly = useCallback(() => {
    setSyncStatus('complete');
    const timer = setTimeout(() => {
      setSyncStatus('idle');
    }, AUTO_DISMISS_MS);
    return timer;
  }, []);

  useEffect(() => {
    initSyncListeners();

    const handleOnline = () => {
      setIsOfflineMode(false);
      processQueue();
    };
    const handleOffline = () => {
      setIsOfflineMode(true);
    };

    const unsubSync = onSyncStatusChange((status) => {
      if (status === 'complete') {
        showCompleteBriefly();
      } else {
        setSyncStatus(status);
      }
    });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubSync();
    };
  }, [showCompleteBriefly]);

  // Don't render anything when idle and online
  if (!isOfflineMode && syncStatus === 'idle') {
    return null;
  }

  if (isOfflineMode && syncStatus === 'idle') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-xs) var(--spacing-md)',
          background: 'var(--color-warning)',
          color: '#fff',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
        }}
      >
        离线模式 - 部分功能可能受限
      </div>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-xs) var(--spacing-md)',
          background: 'var(--color-warning)',
          color: '#fff',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
        }}
      >
        正在同步...
      </div>
    );
  }

  if (syncStatus === 'complete') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-xs) var(--spacing-md)',
          background: 'var(--color-success)',
          color: '#fff',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
          transition: 'background var(--transition-normal)',
        }}
      >
        所有数据已同步
      </div>
    );
  }

  if (syncStatus === 'error') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--spacing-xs) var(--spacing-md)',
          background: 'var(--color-error)',
          color: '#fff',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 500,
        }}
      >
        同步失败，将在网络恢复后重试
      </div>
    );
  }

  return null;
}