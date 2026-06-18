import { useAuthStore } from '@/store/authStore';
import { type PermissionAction } from '../types';

/**
 * Access Control List mapping roles to their allowed action keys
 */
const ROLE_PERMISSIONS: Record<string, PermissionAction[]> = {
  super_admin: [
    'tenants:read',
    'tenants:write',
    'tenants:delete',
    'master_types:read',
    'master_types:write',
    'master_types:delete',
    'master_data:read',
    'master_data:write',
    'master_data:delete',
    'reports:read',
  ],
  support_admin: [
    'master_types:read',
    'master_types:write',
    'master_data:read',
    'master_data:write',
    'reports:read',
  ],
  auditor: [
    'tenants:read',
    'master_types:read',
    'master_data:read',
    'reports:read',
  ],
};

/**
 * Hook to verify current logged-in user permissions
 */
export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = (action: PermissionAction): boolean => {
    if (!user) return false;
    const allowedActions = ROLE_PERMISSIONS[user.role] || [];
    return allowedActions.includes(action);
  };

  const isAdminRole = (): boolean => {
    return user ? ['super_admin', 'support_admin', 'auditor'].includes(user.role) : false;
  };

  return {
    hasPermission,
    role: user?.role || null,
    isAuthenticated: !!user,
    isAdminRole,
  };
};

export default usePermissions;
