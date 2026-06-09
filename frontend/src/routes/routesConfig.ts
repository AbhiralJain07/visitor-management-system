import React from 'react';

export type UserRole = 'admin' | 'receptionist' | 'employee' | 'security' | 'super_admin' | 'support_admin' | 'auditor' | 'manager' | 'tenant_admin';

export interface RouteItem {
  path: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  isProtected?: boolean;
  allowedRoles?: UserRole[];
  layout?: 'dashboard' | 'none';
}

export const routesConfig: RouteItem[] = [
  {
    path: 'dashboard',
    component: React.lazy(() => import('@/pages/DashboardPage')),
    isProtected: true,
    allowedRoles: ['admin', 'manager', 'receptionist', 'employee', 'security'],
    layout: 'dashboard',
  },
  {
    path: 'check-in',
    component: React.lazy(() => import('@/pages/CheckInPage')),
    isProtected: true,
    allowedRoles: ['admin', 'receptionist'],
    layout: 'dashboard',
  },
  {
    path: 'approvals',
    component: React.lazy(() => import('@/pages/ApprovalsPage')),
    isProtected: true,
    allowedRoles: ['admin', 'manager', 'receptionist', 'employee', 'security'],
    layout: 'dashboard',
  },
  {
    path: 'visitors',
    component: React.lazy(() => import('@/pages/VisitorsPage')),
    isProtected: true,
    allowedRoles: ['admin', 'manager', 'receptionist', 'security'],
    layout: 'dashboard',
  },
  {
    path: 'employees',
    component: React.lazy(() => import('@/pages/EmployeesPage')),
    isProtected: true,
    allowedRoles: ['admin', 'manager'],
    layout: 'dashboard',
  },
  {
    path: 'offices',
    component: React.lazy(() => import('@/pages/OfficesPage')),
    isProtected: true,
    allowedRoles: ['admin', 'manager'],
    layout: 'dashboard',
  },
  {
    path: 'visits',
    component: React.lazy(() => import('@/pages/VisitsPage')),
    isProtected: true,
    allowedRoles: ['admin', 'manager', 'receptionist', 'security'],
    layout: 'dashboard',
  },
  {
    path: 'master-data',
    component: React.lazy(() => import('@/pages/MasterDataPage')),
    isProtected: true,
    allowedRoles: ['admin'],
    layout: 'dashboard',
  },
  {
    path: 'reports',
    component: React.lazy(() => import('@/pages/ReportsPage')),
    isProtected: true,
    allowedRoles: ['admin', 'manager', 'receptionist'],
    layout: 'dashboard',
  },
  {
    path: 'super-admin/dashboard',
    component: React.lazy(() => import('@/pages/super-admin/SuperAdminDashboard')),
    isProtected: true,
    allowedRoles: ['super_admin', 'support_admin', 'auditor'],
    layout: 'dashboard',
  },
  {
    path: 'super-admin/tenants',
    component: React.lazy(() => import('@/pages/super-admin/TenantsPage')),
    isProtected: true,
    allowedRoles: ['super_admin', 'auditor'],
    layout: 'dashboard',
  },
  {
    path: 'super-admin/master-types',
    component: React.lazy(() => import('@/pages/super-admin/MasterTypesPage')),
    isProtected: true,
    allowedRoles: ['super_admin', 'support_admin'],
    layout: 'dashboard',
  },
  {
    path: 'super-admin/master-data',
    component: React.lazy(() => import('@/pages/super-admin/MasterDataPage')),
    isProtected: true,
    allowedRoles: ['super_admin', 'support_admin'],
    layout: 'dashboard',
  },
];
