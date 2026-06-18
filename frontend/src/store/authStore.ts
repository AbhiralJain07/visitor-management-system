import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'support_admin' | 'auditor' | 'admin' | 
        'manager' | 'receptionist' | 'security' | 'employee' | 'tenant_admin';
  tenant_id?: string | null;
  realm_id?: string | null;
  language?: string;
}

interface AuthState {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isOfflineKiosk: boolean;
  login: (user: UserSession, token: string) => void;
  logout: () => void;
  setOfflineKioskMode: (enabled: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isOfflineKiosk: false,
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
      setOfflineKioskMode: (enabled) =>
        set({
          isOfflineKiosk: enabled,
        }),
    }),
    {
      name: 'vms-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isOfflineKiosk: state.isOfflineKiosk,
      }),
    }
  )
);
