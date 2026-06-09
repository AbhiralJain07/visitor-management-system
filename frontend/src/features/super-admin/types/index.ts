import { type UserRole } from '@/routes/routesConfig';

/**
 * Tenant Company plan types
 */
export type SubscriptionPlan = 'Basic' | 'Standard' | 'Premium' | 'Enterprise';

/**
 * Tenant Company status states
 */
export type TenantStatus = 'Active' | 'Suspended' | 'Pending';

/**
 * Interface representing a multi-tenant client company
 */
export interface TenantCompany {
  _id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  subscriptionPlan: SubscriptionPlan;
  maxUsers: number;
  activeUsers: number;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Configurable master category (e.g. ID Proof Type, Designation)
 */
export interface MasterType {
  _id: string;
  name: string;
  code: string; // e.g. "VISITOR_TYPE", "DEPARTMENT"
  description: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

/**
 * Supported translation languages for localized master data
 */
export interface TranslationSchema {
  en: string; // English
  hi?: string; // Hindi
  ta?: string; // Tamil
  te?: string; // Telugu
  mr?: string; // Marathi
  bn?: string; // Bengali
}

export type SupportedLanguage = keyof TranslationSchema;

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  mr: 'Marathi',
  bn: 'Bengali',
};

/**
 * Item element inside a Master Type
 */
export interface MasterDataItem {
  _id: string;
  name: string; // Default English text
  code: string;
  typeCode: string; // References MasterType.code
  sortOrder: number;
  status: 'Active' | 'Inactive';
  translations: TranslationSchema;
  createdAt: string;
  updatedAt: string;
  master_type_id?: {
    _id: string;
    name: string;
    code: string;
  } | string;
}

/**
 * Dynamic KPI stats
 */
export interface GlobalStats {
  totalCompanies: number;
  activeCompanies: number;
  totalVisitors: number;
  visitsToday: number;
  activeUsers: number;
  monthlyGrowthPercent: number;
}

/**
 * Time series trend points
 */
export interface GrowthTrend {
  month: string;
  companies: number;
}

export interface VisitorTrend {
  date: string;
  visits: number;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
}

export interface PlanDistribution {
  name: SubscriptionPlan;
  value: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
}

/**
 * Root Global Analytics Payload
 */
export interface GlobalAnalytics {
  stats: GlobalStats;
  companyGrowth: GrowthTrend[];
  visitorTrend: VisitorTrend[];
  planDistribution: PlanDistribution[];
  statusDistribution: StatusDistribution[];
  revenueTrend: RevenueTrend[];
}

/**
 * Universal Search Output Item
 */
export interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'Tenant' | 'MasterType' | 'MasterData';
  link: string;
  status?: string;
}

/**
 * Permissions mapping
 */
export type PermissionAction =
  | 'tenants:read'
  | 'tenants:write'
  | 'tenants:delete'
  | 'master_types:read'
  | 'master_types:write'
  | 'master_types:delete'
  | 'master_data:read'
  | 'master_data:write'
  | 'master_data:delete'
  | 'reports:read';
