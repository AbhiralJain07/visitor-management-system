import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '@/api/client';
import { type ApiResponse } from '@/types/api.types';
import {
  type TenantCompany,
  type MasterType,
  type MasterDataItem,
  type GlobalAnalytics,
  type SearchItem,
} from '../types';

/* ==========================================================
   MOCK FALLBACK DATA (used only when backend fails)
   ========================================================== */

let mockTenants: TenantCompany[] = [
  {
    _id: 't1',
    name: 'Acme Corporate Solutions',
    code: 'ACME_CORP',
    contactPerson: 'Suresh Kumar',
    email: 'suresh.kumar@acmesolutions.com',
    phone: '+919876543210',
    address: 'DLF Cyber City, Tower B, Gurugram, Haryana',
    gstNumber: '06AAAAA1111A1Z1',
    subscriptionPlan: 'Enterprise',
    maxUsers: 500,
    activeUsers: 342,
    status: 'Active',
    createdAt: '2025-01-10T08:30:00Z',
    updatedAt: '2026-05-15T12:00:00Z',
  },
  {
    _id: 't2',
    name: 'Zenith Tech Hubs',
    code: 'ZENITH_TECH',
    contactPerson: 'Meera Deshmukh',
    email: 'meera.d@zenithhubs.in',
    phone: '+919988776655',
    address: 'Manyata Tech Park, Block C3, Bengaluru, Karnataka',
    gstNumber: '29BBBBB2222B2Z2',
    subscriptionPlan: 'Premium',
    maxUsers: 200,
    activeUsers: 189,
    status: 'Active',
    createdAt: '2025-03-22T09:15:00Z',
    updatedAt: '2026-04-18T16:45:00Z',
  },
  {
    _id: 't3',
    name: 'Vanguard FinTech',
    code: 'VANGUARD_FIN',
    contactPerson: 'Ravi Teja',
    email: 'contact@vanguardfin.com',
    phone: '+918877665544',
    address: 'Gachibowli Financial District, Hyderabad, Telangana',
    gstNumber: '36CCCCC3333C3Z3',
    subscriptionPlan: 'Standard',
    maxUsers: 50,
    activeUsers: 48,
    status: 'Active',
    createdAt: '2025-06-05T14:20:00Z',
    updatedAt: '2025-11-30T10:00:00Z',
  },
  {
    _id: 't4',
    name: 'Starlight Retailers',
    code: 'STARLIGHT_RET',
    contactPerson: 'Anjali Sharma',
    email: 'admin@starlight.co.in',
    phone: '+917766554433',
    address: 'Naman Centre, Bandra Kurla Complex, Mumbai',
    gstNumber: '27DDDDD4444D4Z4',
    subscriptionPlan: 'Basic',
    maxUsers: 15,
    activeUsers: 15,
    status: 'Suspended',
    createdAt: '2025-08-14T11:00:00Z',
    updatedAt: '2026-05-01T09:30:00Z',
  },
  {
    _id: 't5',
    name: 'Apex Manufacturing',
    code: 'APEX_MANUF',
    contactPerson: 'Subhash Bose',
    email: 's.bose@apexmanuf.com',
    phone: '+919123456789',
    address: 'Salt Lake Sector V, Kolkata, West Bengal',
    gstNumber: '19EEEEE5555E5Z5',
    subscriptionPlan: 'Enterprise',
    maxUsers: 1000,
    activeUsers: 120,
    status: 'Pending',
    createdAt: '2026-05-28T09:00:00Z',
    updatedAt: '2026-05-28T09:00:00Z',
  },
];

let mockMasterTypes: MasterType[] = [
  { _id: 'mt1', name: 'Visitor Type', code: 'VISITOR_TYPE', description: 'Categories of guests visiting office premises', status: 'Active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { _id: 'mt2', name: 'Purpose Of Visit', code: 'PURPOSE_OF_VISIT', description: 'Official reasons for requesting entry authorization', status: 'Active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { _id: 'mt3', name: 'ID Proof Type', code: 'ID_PROOF_TYPE', description: 'Acceptable identification cards for front-desk audit verification', status: 'Active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { _id: 'mt4', name: 'Department', code: 'DEPARTMENT', description: 'Internal corporate departments', status: 'Active', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

let mockMasterData: MasterDataItem[] = [
  { _id: 'md1', name: 'General Guest', code: 'GUEST', typeCode: 'VISITOR_TYPE', sortOrder: 1, status: 'Active', translations: { en: 'General Guest', hi: 'सामान्य अतिथि', ta: '', te: '', mr: '', bn: '' }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { _id: 'md2', name: 'Vendor Partner', code: 'VENDOR', typeCode: 'VISITOR_TYPE', sortOrder: 2, status: 'Active', translations: { en: 'Vendor Partner', hi: 'विक्रेता भागीदार', ta: '', te: '', mr: '', bn: '' }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { _id: 'md3', name: 'Interview Candidate', code: 'CANDIDATE', typeCode: 'VISITOR_TYPE', sortOrder: 3, status: 'Active', translations: { en: 'Interview Candidate', hi: 'साक्षात्कार उम्मीदवार', ta: '', te: '', mr: '', bn: '' }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { _id: 'md4', name: 'Business Meeting', code: 'MEETING', typeCode: 'PURPOSE_OF_VISIT', sortOrder: 1, status: 'Active', translations: { en: 'Business Meeting', hi: 'व्यावसायिक बैठक', ta: '', te: '', mr: '', bn: '' }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { _id: 'md5', name: 'Aadhaar Card', code: 'AADHAAR', typeCode: 'ID_PROOF_TYPE', sortOrder: 1, status: 'Active', translations: { en: 'Aadhaar Card', hi: 'आधार कार्ड', ta: '', te: '', mr: '', bn: '' }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { _id: 'md6', name: 'PAN Card', code: 'PAN_CARD', typeCode: 'ID_PROOF_TYPE', sortOrder: 2, status: 'Active', translations: { en: 'PAN Card', hi: 'पैन कार्ड', ta: '', te: '', mr: '', bn: '' }, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
];

const mockAnalytics: GlobalAnalytics = {
  stats: { totalCompanies: 24, activeCompanies: 19, totalVisitors: 8432, visitsToday: 154, activeUsers: 843, monthlyGrowthPercent: 12.8 },
  companyGrowth: [{ month: 'Dec 2025', companies: 15 }, { month: 'Jan 2026', companies: 18 }, { month: 'Feb 2026', companies: 20 }, { month: 'Mar 2026', companies: 22 }, { month: 'Apr 2026', companies: 23 }, { month: 'May 2026', companies: 24 }],
  visitorTrend: [{ date: '25 May', visits: 110 }, { date: '26 May', visits: 135 }, { date: '27 May', visits: 142 }, { date: '28 May', visits: 120 }, { date: '29 May', visits: 148 }, { date: '30 May', visits: 162 }, { date: '31 May', visits: 154 }],
  planDistribution: [{ name: 'Basic', value: 4 }, { name: 'Standard', value: 8 }, { name: 'Premium', value: 7 }, { name: 'Enterprise', value: 5 }],
  statusDistribution: [{ name: 'Active', value: 19 }, { name: 'Suspended', value: 3 }, { name: 'Pending', value: 2 }],
  revenueTrend: [{ month: 'Dec', revenue: 7500 }, { month: 'Jan', revenue: 9000 }, { month: 'Feb', revenue: 10500 }, { month: 'Mar', revenue: 11800 }, { month: 'Apr', revenue: 12500 }, { month: 'May', revenue: 13200 }],
};

/* ==========================================================
   HELPER — Backend tenant → Frontend TenantCompany
   ========================================================== */

const mapTenant = (t: any): TenantCompany => ({
  _id: t._id,
  name: t.name,
  code: t.code,
  contactPerson: t.contactPerson || '',
  email: t.email,
  phone: t.phone || '',
  address: t.address || '',
  gstNumber: t.gstNumber || '',
  subscriptionPlan: t.plan
    ? (t.plan.charAt(0).toUpperCase() + t.plan.slice(1)) as TenantCompany['subscriptionPlan']
    : 'Basic',
  maxUsers: t.maxUsers || 50,
  activeUsers: t.activeUsers || 0,
  status: t.status || (t.is_active ? 'Active' : 'Suspended'),
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

/* ==========================================================
   TENANTS HOOKS
   ========================================================== */

export const useTenants = (search = '', status = 'All') => {
  return useQuery<TenantCompany[]>({
    queryKey: ['tenants', search, status],
    queryFn: async () => {
      try {
        const response = await httpClient.get('/tenants', {
          params: { search, status },
        });
        const tenants: any[] = response.data.data || [];
        return tenants
          .map(mapTenant)
          .filter((c) => {
            const matchesSearch = !search ||
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.code.toLowerCase().includes(search.toLowerCase()) ||
              c.email.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = status === 'All' || c.status === status;
            return matchesSearch && matchesStatus;
          });
      } catch (err) {
        console.warn('Tenants API failed, using mock data.');
        return mockTenants.filter((c) => {
          const matchesSearch = !search ||
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase());
          const matchesStatus = status === 'All' || c.status === status;
          return matchesSearch && matchesStatus;
        });
      }
    },
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation<{ tenant: TenantCompany; adminCredentials?: { email: string; password: string } }, Error, any>({
    mutationFn: async (payload) => {
      try {
        const backendPayload = {
          name: payload.name,
          code: payload.code,
          email: payload.email,
          phone: payload.phone,
          contactPerson: payload.contactPerson,
          gstNumber: payload.gstNumber,
          address: payload.address,
          plan: payload.subscriptionPlan?.toLowerCase(),
          maxUsers: payload.maxUsers,
          status: payload.status,
          adminPassword: payload.adminPassword || undefined,  // Pass if provided
        };
        const response = await httpClient.post('/tenants', backendPayload);
        return {
          tenant: mapTenant(response.data.data),
          adminCredentials: response.data.adminCredentials,
        };
      } catch (err) {
        console.warn('Creating tenant via mock.');
        const newTenant: TenantCompany = {
          ...payload,
          _id: `t${Date.now()}`,
          activeUsers: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockTenants.unshift(newTenant);
        return { tenant: newTenant };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['global-analytics'] });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation<TenantCompany, Error, { id: string; payload: Partial<TenantCompany> }>({
    mutationFn: async ({ id, payload }) => {
      try {
        const backendPayload: any = { ...payload };
        if (payload.subscriptionPlan) {
          backendPayload.plan = payload.subscriptionPlan.toLowerCase();
          delete backendPayload.subscriptionPlan;
        }
        const response = await httpClient.put(`/tenants/${id}`, backendPayload);
        return mapTenant(response.data.data);
      } catch (err) {
        console.warn('Updating tenant via mock.');
        mockTenants = mockTenants.map((t) =>
          t._id === id ? { ...t, ...payload, updatedAt: new Date().toISOString() } : t
        );
        return mockTenants.find((t) => t._id === id)!;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; message?: string }, Error, string>({
    mutationFn: async (id) => {
      try {
        await httpClient.delete(`/tenants/${id}`);
        return { success: true };
      } catch (err) {
        console.warn('Deleting tenant via mock.');
        mockTenants = mockTenants.filter((t) => t._id !== id);
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['global-analytics'] });
    },
  });
};

/* ==========================================================
   MASTER TYPES HOOKS
   ========================================================== */

export const useMasterTypes = (search = '') => {
  return useQuery<MasterType[]>({
    queryKey: ['master-types', search],
    queryFn: async () => {
      const response = await httpClient.get('/master-types', { params: { search } });
      const data = response.data.data || [];
      return data.map((item: any) => ({
        ...item,
        status: item.status || (item.is_active ? 'Active' : 'Inactive'),
        description: item.description || '',
      }));
    },
  });
};

export const useCreateMasterType = () => {
  const queryClient = useQueryClient();
  return useMutation<MasterType, Error, Omit<MasterType, '_id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: async (payload) => {
      const backendPayload = {
        code: payload.code,
        name: payload.name,
        description: payload.description,
        is_active: (payload as any).status === 'Active',
        is_global: true, // Super admin categories are global by default
      };
      const response = await httpClient.post('/master-types', backendPayload);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-types'] }),
  });
};

export const useUpdateMasterType = () => {
  const queryClient = useQueryClient();
  return useMutation<MasterType, Error, { id: string; payload: Partial<MasterType> }>({
    mutationFn: async ({ id, payload }) => {
      const backendPayload: any = {};
      if (payload.code) backendPayload.code = payload.code;
      if (payload.name) backendPayload.name = payload.name;
      if (payload.description) backendPayload.description = payload.description;
      if ((payload as any).status) {
        backendPayload.is_active = (payload as any).status === 'Active';
      }
      const response = await httpClient.put(`/master-types/${id}`, backendPayload);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-types'] }),
  });
};

export const useDeleteMasterType = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      await httpClient.delete(`/master-types/${id}`);
      return { success: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-types'] }),
  });
};

/* ==========================================================
   MASTER DATA HOOKS
   ========================================================== */

export const useMasterData = (typeCode = 'All', search = '') => {
  return useQuery<MasterDataItem[]>({
    queryKey: ['master-data', typeCode, search],
    queryFn: async () => {
      const response = await httpClient.get('/master-data', {
        params: {
          type: typeCode === 'All' ? undefined : typeCode,
          search,
        },
      });
      const data = response.data.data || [];
      return data.map((item: any) => ({
        ...item,
        status: item.status || (item.is_active ? 'Active' : 'Inactive'),
        sortOrder: item.sort_order ?? item.sortOrder ?? 0,
        typeCode: item.master_type_id?.code || typeCode || 'GENERAL',
        translations: item.translations || { en: item.name, hi: '', ta: '', te: '', mr: '', bn: '' },
      }));
    },
  });
};

export const useCreateMasterData = () => {
  const queryClient = useQueryClient();
  return useMutation<MasterDataItem, Error, Omit<MasterDataItem, '_id' | 'createdAt' | 'updatedAt'>>({
    mutationFn: async (payload) => {
      const backendPayload = {
        master_type_id: payload.master_type_id,
        code: payload.code,
        name: payload.name,
        sort_order: payload.sortOrder ?? 0,
        is_active: payload.status === 'Active',
        is_global: true, // Super admin records are global
        translations: {
          hi: payload.translations?.hi || '',
          ta: payload.translations?.ta || '',
          te: payload.translations?.te || '',
          mr: payload.translations?.mr || '',
        },
      };
      const response = await httpClient.post('/master-data', backendPayload);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-data'] }),
  });
};

export const useUpdateMasterData = () => {
  const queryClient = useQueryClient();
  return useMutation<MasterDataItem, Error, { id: string; payload: Partial<MasterDataItem> }>({
    mutationFn: async ({ id, payload }) => {
      const backendPayload: any = {};
      if (payload.master_type_id) backendPayload.master_type_id = payload.master_type_id;
      if (payload.code) backendPayload.code = payload.code;
      if (payload.name) backendPayload.name = payload.name;
      if (payload.sortOrder !== undefined) backendPayload.sort_order = payload.sortOrder;
      if (payload.status) backendPayload.is_active = payload.status === 'Active';
      if (payload.translations) {
        backendPayload.translations = {
          hi: payload.translations.hi || '',
          ta: payload.translations.ta || '',
          te: payload.translations.te || '',
          mr: payload.translations.mr || '',
        };
      }
      const response = await httpClient.put(`/master-data/${id}`, backendPayload);
      return response.data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-data'] }),
  });
};

export const useDeleteMasterData = () => {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id) => {
      await httpClient.delete(`/master-data/${id}`);
      return { success: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-data'] }),
  });
};

/* ==========================================================
   GLOBAL ANALYTICS HOOK
   ========================================================== */

export const useGlobalAnalytics = (dateRange = '30d') => {
  return useQuery<GlobalAnalytics>({
    queryKey: ['global-analytics', dateRange],
    queryFn: async () => {
      try {
        const response = await httpClient.get('/audit-logs/analytics', { params: { dateRange } });
        if (response.data?.success && response.data?.data) {
          return response.data.data as GlobalAnalytics;
        }
        return mockAnalytics;
      } catch (err) {
        console.warn('Analytics API failed, using mock fallback:', err);
        return mockAnalytics;
      }
    },
    staleTime: 60_000, // 1 min cache — dashboard pe baar baar hit na ho
  });
};

/* ==========================================================
   UNIVERSAL SEARCH HOOK
   ========================================================== */

export const useUniversalSearch = (query = '') => {
  return useQuery<SearchItem[]>({
    queryKey: ['universal-search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      try {
        const response = await httpClient.get('/search', { params: { query } });
        if (response.data?.success) return response.data.data || [];
      } catch (err) {
        console.warn('Search API failed, using mock fallback.');
      }

      // Fallback: mock data search
      const lowercaseQuery = query.toLowerCase();
      const results: SearchItem[] = [];

      mockTenants.forEach((t) => {
        if (t.name.toLowerCase().includes(lowercaseQuery) || t.code.toLowerCase().includes(lowercaseQuery)) {
          results.push({ id: t._id, title: t.name, subtitle: `Tenant Code: ${t.code} | Plan: ${t.subscriptionPlan}`, type: 'Tenant', link: '/super-admin/tenants', status: t.status });
        }
      });

      mockMasterTypes.forEach((mt) => {
        if (mt.name.toLowerCase().includes(lowercaseQuery) || mt.code.toLowerCase().includes(lowercaseQuery)) {
          results.push({ id: mt._id, title: mt.name, subtitle: `Master Category | Code: ${mt.code}`, type: 'MasterType', link: '/super-admin/master-types', status: mt.status });
        }
      });

      mockMasterData.forEach((md) => {
        if (md.name.toLowerCase().includes(lowercaseQuery) || md.code.toLowerCase().includes(lowercaseQuery)) {
          results.push({ id: md._id, title: md.name, subtitle: `Master Record | Code: ${md.code} under Type: ${md.typeCode}`, type: 'MasterData', link: '/super-admin/master-data', status: md.status });
        }
      });

      return results;
    },
    enabled: query.trim().length >= 2,
  });
};