import { useState, useEffect, useCallback } from 'react';
import { offlineService } from '@/offline/offlineService';
import { useConfigStore } from '@/store/configStore';
import { type SyncOperation } from '@/offline/db';

export const useOfflineQueue = () => {
  const { isSyncing, setSyncing, setLastSyncedAt } = useConfigStore();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [queueItems, setQueueItems] = useState<SyncOperation[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);

  const refreshQueueState = useCallback(async () => {
    try {
      const count = await offlineService.getPendingQueueCount();
      const items = await offlineService.getPendingQueueItems();
      setPendingCount(count);
      setQueueItems(items);
    } catch (err) {
      console.error('Failed to load local outbox status:', err);
    }
  }, []);

  // Poll state or register event updates
  useEffect(() => {
    refreshQueueState();

    // Set up a periodic poll every 5 seconds to catch background db additions
    const intervalId = setInterval(refreshQueueState, 5000);

    // Listen to network status changes to refresh
    window.addEventListener('online', refreshQueueState);
    window.addEventListener('offline', refreshQueueState);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', refreshQueueState);
      window.removeEventListener('offline', refreshQueueState);
    };
  }, [refreshQueueState]);

  const syncNow = async () => {
    if (isSyncing) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await offlineService.triggerManualSync();
      setLastSyncedAt(new Date().toISOString());
      await refreshQueueState();
    } catch (err: any) {
      setSyncError(err.message || 'Manual synchronization pass failed.');
    } finally {
      setSyncing(false);
    }
  };

  const clearQueue = async () => {
    try {
      // Import database directly to clear the syncOutbox table
      const { db } = await import('@/offline/db');
      await db.syncOutbox.clear();
      await refreshQueueState();
    } catch (err) {
      console.error('Failed to clear outbox:', err);
    }
  };

  return {
    pendingCount,
    queueItems,
    isSyncing,
    syncError,
    syncNow,
    clearQueue,
    refreshQueue: refreshQueueState
  };
};

export default useOfflineQueue;
