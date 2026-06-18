import {
  LayoutDashboard,
  UserPlus,
  CheckSquare,
  Users,
  Briefcase,
  Building2,
  BarChart3,
  Building,
  Database,
  TrendingUp,
  ClipboardList,
  Tags,
  type LucideIcon,
} from 'lucide-react';

export type UserRole = 'tenant_admin' | 'receptionist' | 'employee' | 'security' | 'super_admin' | 'support_admin' | 'auditor' | 'manager';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  allowedRoles: UserRole[];
}

export const navigationConfig: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['tenant_admin', 'manager', 'receptionist', 'employee', 'security'],
  },
  {
    name: 'Visitor Check-in',
    href: '/check-in',
    icon: UserPlus,
    allowedRoles: ['tenant_admin', 'receptionist'],
  },
  {
    name: 'Approvals',
    href: '/approvals',
    icon: CheckSquare,
    allowedRoles: ['tenant_admin', 'manager', 'receptionist', 'employee', 'security'],
  },
  {
    name: 'Visitors',
    href: '/visitors',
    icon: Users,
    allowedRoles: ['tenant_admin', 'manager', 'receptionist', 'security'],
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: Briefcase,
    allowedRoles: ['tenant_admin', 'manager'],
  },
  {
    name: 'Offices',
    href: '/offices',
    icon: Building2,
    allowedRoles: ['tenant_admin', 'manager'],
  },
  {
    name: 'Visits Log',
    href: '/visits',
    icon: ClipboardList,
    allowedRoles: ['tenant_admin', 'manager', 'receptionist', 'security'],
  },
  {
    name: 'Custom Master Data',
    href: '/master-data',
    icon: Tags,
    allowedRoles: ['tenant_admin'],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    allowedRoles: ['tenant_admin', 'manager', 'receptionist'],
  },
  {
    name: 'Super Admin KPIs',
    href: '/super-admin/dashboard',
    icon: TrendingUp,
    allowedRoles: ['super_admin', 'support_admin', 'auditor'],
  },
  {
    name: 'Tenants Control',
    href: '/super-admin/tenants',
    icon: Building,
    allowedRoles: ['super_admin', 'auditor'],
  },
  {
    name: 'Master Data',
    href: '/super-admin/master-data',
    icon: Database,
    allowedRoles: ['super_admin', 'support_admin'],
  },
];