import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OfficeConfig {
  _id: string;
  name: string;
  city: string;
  address: string;
  is_active: boolean;
}

interface ConfigState {
  selectedOffice: OfficeConfig | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  sidebarCollapsed: boolean;
  setSelectedOffice: (office: OfficeConfig | null) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncedAt: (timestamp: string) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      selectedOffice: null,
      lastSyncedAt: null,
      isSyncing: false,
      sidebarCollapsed: false,
      setSelectedOffice: (office) => set({ selectedOffice: office }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: 'vms-config-storage',
      partialize: (state) => ({
        selectedOffice: state.selectedOffice,
        lastSyncedAt: state.lastSyncedAt,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
