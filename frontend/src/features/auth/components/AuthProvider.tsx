import React, { useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { synchronizer } from '@/offline/synchronizer';
import { useConfigStore } from '@/store/configStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const isOnline = useNetworkStatus();
  const { setSyncing, setLastSyncedAt } = useConfigStore();

  useEffect(() => {
    // Run an initial sync trigger when the application loads if online
    if (isOnline) {
      const runInitialSync = async () => {
        setSyncing(true);
        try {
          await synchronizer.triggerSync();
          setLastSyncedAt(new Date().toISOString());
        } catch (err) {
          console.error('Initial sync failed:', err);
        } finally {
          setSyncing(false);
        }
      };
      runInitialSync();
    }
  }, [isOnline, setSyncing, setLastSyncedAt]);

  return <>{children}</>;
};

export default AuthProvider;
