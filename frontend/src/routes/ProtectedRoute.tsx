import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { type UserRole } from './routesConfig';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isOfflineKiosk } = useAuthStore();
  const location = useLocation();

  // If set to offline tablet kiosk mode, bypass auth checks for kiosk self-registration screens
  if (isOfflineKiosk) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to unauthorized fallback page
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
