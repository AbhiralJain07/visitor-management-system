import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { type PermissionAction } from '../types';

interface PermissionGuardProps {
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Structural boundary to hide or replace UI sections for unauthorized roles
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  action,
  children,
  fallback = null,
}) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
