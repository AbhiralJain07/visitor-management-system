import {
  LayoutDashboard,
  UserPlus,
  CheckSquare,
  Users,
  Briefcase,
  Building2,
  BarChart3,
  Building,
  Settings2,
  Database,
  TrendingUp,
  ClipboardList,
  Tags,
  type LucideIcon,
} from 'lucide-react';

export type UserRole = 'admin' | 'receptionist' | 'employee' | 'security' | 'super_admin' | 'support_admin' | 'auditor' | 'manager';

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
    allowedRoles: ['admin', 'manager', 'receptionist', 'employee', 'security'],
  },
  {
    name: 'Visitor Check-in',
    href: '/check-in',
    icon: UserPlus,
    allowedRoles: ['admin', 'receptionist'],
  },
  {
    name: 'Approvals',
    href: '/approvals',
    icon: CheckSquare,
    allowedRoles: ['admin', 'manager', 'receptionist', 'employee', 'security'],
  },
  {
    name: 'Visitors',
    href: '/visitors',
    icon: Users,
    allowedRoles: ['admin', 'manager', 'receptionist', 'security'],
  },
  {
    name: 'Employees',
    href: '/employees',
    icon: Briefcase,
    allowedRoles: ['admin', 'manager'],
  },
  {
    name: 'Offices',
    href: '/offices',
    icon: Building2,
    allowedRoles: ['admin', 'manager'],
  },
  {
    name: 'Visits Log',
    href: '/visits',
    icon: ClipboardList,
    allowedRoles: ['admin', 'manager', 'receptionist', 'security'],
  },
  {
    name: 'Custom Master Data',
    href: '/master-data',
    icon: Tags,
    allowedRoles: ['admin'],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    allowedRoles: ['admin', 'manager', 'receptionist'],
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
    name: 'Master Categories',
    href: '/super-admin/master-types',
    icon: Settings2,
    allowedRoles: ['super_admin', 'support_admin'],
  },
  {
    name: 'Master Data',
    href: '/super-admin/master-data',
    icon: Database,
    allowedRoles: ['super_admin', 'support_admin'],
  },
];
