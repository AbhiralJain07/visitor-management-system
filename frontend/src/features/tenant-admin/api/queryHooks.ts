import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { httpClient } from '@/api/client';
import { db } from '@/offline/db';
import {
  EmployeeService,
  OfficeService,
  VisitorService,
  VisitService
} from '@/services/api';
import type {
  Employee as UserProfile,
  Office as OfficeRealm,
  Visitor as VisitorRecord,
  Visit as VisitLog,
  EmployeeFilters,
  OfficeFilters,
  VisitorFilters,
  VisitFilters,
  CustomMasterDataItem,
  PaginatedResponse,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  CreateOfficeDTO,
  UpdateOfficeDTO,
  CreateVisitorDTO,
  UpdateVisitorDTO,
  CreateVisitDTO,
  UpdateVisitDTO
} from '@/types/api.types';

// Helper to check network status
const getIsOnline = () => navigator.onLine;

// Lightweight server reachability check to prevent long timeout delays when server/DB is down
let isBackendReachable = true;
let lastCheckTime = 0;

const checkBackend = async (): Promise<boolean> => {
  const now = Date.now();
  if (now - lastCheckTime < 10000) { // Cache the reachability status for 10s
    return isBackendReachable;
  }
  try {
    const baseUrl = httpClient.defaults.baseURL || 'http://localhost:5000/api';
    const origin = new URL(baseUrl).origin;
    await axios.get(origin, { timeout: 1200 }); // Fast 1.2s ping
    isBackendReachable = true;
  } catch (error) {
    isBackendReachable = false;
  }
  lastCheckTime = now;
  return isBackendReachable;
};

// --- CLIENT-SIDE OFFLINE FALLBACK FILTERS & PAGINATION ---

const getLocalOffices = async (filters?: OfficeFilters) => {
  let results = await db.offices.toArray();
  
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    results = results.filter(o => 
      o.name.toLowerCase().includes(searchLower) ||
      o.city.toLowerCase().includes(searchLower) ||
      o.address.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.is_active !== undefined && filters?.is_active !== 'all') {
    const activeBool = String(filters.is_active) === 'true';
    results = results.filter(o => o.is_active === activeBool);
  }

  const mapped = results.map(o => ({
    _id: o._id,
    name: o.name,
    city: o.city,
    address: o.address,
    is_active: o.is_active,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  if (filters?.page || filters?.limit) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;
    const paginatedData = mapped.slice(skip, skip + limit);
    return {
      success: true,
      data: paginatedData,
      total: mapped.length,
      page,
      limit,
      totalPages: Math.ceil(mapped.length / limit)
    } as PaginatedResponse<OfficeRealm>;
  }

  return mapped;
};

const getLocalEmployees = async (filters?: EmployeeFilters) => {
  const results = await db.employees.toArray();
  const localOffices = await db.offices.toArray();
  
  let mapped = results.map(e => {
    const office = localOffices.find(o => o._id === e.office_id);
    return {
      _id: e._id,
      name: e.name,
      email: e.email,
      role: e.role as any,
      phone: (e as any).phone || '',
      office_id: office ? {
        _id: office._id,
        name: office.name,
        city: office.city,
        address: office.address,
        is_active: office.is_active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : e.office_id,
      telegram_id: e.telegram_id || '',
      department: e.department || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as UserProfile;
  });

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    mapped = mapped.filter(e => 
      e.name.toLowerCase().includes(searchLower) ||
      e.email.toLowerCase().includes(searchLower) ||
      (e.department || '').toLowerCase().includes(searchLower)
    );
  }

  if (filters?.role && filters.role !== 'all') {
    mapped = mapped.filter(e => e.role === filters.role);
  }

  if (filters?.department && filters.department !== 'all') {
    mapped = mapped.filter(e => e.department === filters.department);
  }

  if (filters?.office_id && filters.office_id !== 'all') {
    mapped = mapped.filter(e => {
      const officeIdStr = typeof e.office_id === 'object' && e.office_id !== null ? e.office_id._id : e.office_id;
      return officeIdStr === filters.office_id;
    });
  }

  if (filters?.page || filters?.limit) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;
    const paginatedData = mapped.slice(skip, skip + limit);
    return {
      success: true,
      data: paginatedData,
      total: mapped.length,
      page,
      limit,
      totalPages: Math.ceil(mapped.length / limit)
    } as PaginatedResponse<UserProfile>;
  }

  return mapped;
};

const getLocalVisitors = async (filters?: VisitorFilters) => {
  const results = await db.visitors.toArray();
  let mapped = results.map(v => ({
    _id: v._id || v.id || '',
    name: v.name,
    phone: v.phone,
    id_number: v.id_number,
    photo_url: v.photo_url || '',
    is_blacklisted: v.is_blacklisted === true,
    blacklist_reason: v.blacklist_reason || '',
    email: v.email || '',
    company_name: v.company_name || '',
    id_type: v.id_type || 'Aadhar',
    address: v.address || '',
    createdAt: v.createdAt || new Date().toISOString(),
    updatedAt: v.updatedAt || new Date().toISOString(),
  }));

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    mapped = mapped.filter(v =>
      v.name.toLowerCase().includes(searchLower) ||
      v.phone.includes(filters.search!) ||
      v.id_number.toLowerCase().includes(searchLower)
    );
  }

  if (filters?.is_blacklisted !== undefined && filters.is_blacklisted !== 'all') {
    const blacklistedBool = String(filters.is_blacklisted) === 'true';
    mapped = mapped.filter(v => v.is_blacklisted === blacklistedBool);
  }

  if (filters?.page || filters?.limit) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;
    const paginatedData = mapped.slice(skip, skip + limit);
    return {
      success: true,
      data: paginatedData,
      total: mapped.length,
      page,
      limit,
      totalPages: Math.ceil(mapped.length / limit)
    } as PaginatedResponse<VisitorRecord>;
  }

  return mapped;
};

const getLocalVisits = async (filters?: VisitFilters) => {
  const results = await db.visits.toArray();
  const localVisitors = await db.visitors.toArray();
  const localEmployees = await db.employees.toArray();
  const localOffices = await db.offices.toArray();

  let mapped = results.map(v => {
    const visitor = localVisitors.find(vis => (vis._id === v.visitor_id || vis.id === v.visitor_id));
    const host = localEmployees.find(emp => emp._id === v.host_id);
    const office = localOffices.find(o => o._id === v.office_id);

    return {
      _id: v._id || v.id || '',
      visitor_id: visitor ? {
        _id: visitor._id || visitor.id || '',
        name: visitor.name,
        phone: visitor.phone,
        id_number: visitor.id_number,
        is_blacklisted: visitor.is_blacklisted,
        email: visitor.email || '',
        company_name: visitor.company_name || '',
        id_type: visitor.id_type || 'Aadhar',
        address: visitor.address || '',
        createdAt: visitor.createdAt || new Date().toISOString(),
        updatedAt: visitor.updatedAt || new Date().toISOString(),
      } : v.visitor_id,
      host_id: host ? {
        _id: host._id,
        name: host.name,
        email: host.email,
        role: host.role as any,
        department: host.department || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : v.host_id,
      office_id: office ? {
        _id: office._id,
        name: office.name,
        city: office.city,
        address: office.address,
        is_active: office.is_active,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : v.office_id,
      purpose: v.purpose,
      notes: v.notes || '',
      reason: v.reason || '',
      check_in: v.check_in,
      check_out: v.check_out,
      status: v.status,
      createdAt: v.createdAt || new Date().toISOString(),
      updatedAt: v.updatedAt || new Date().toISOString(),
    } as VisitLog;
  });

  if (filters?.status && filters.status !== 'all') {
    mapped = mapped.filter(v => v.status === filters.status);
  }

  if (filters?.host_id && filters.host_id !== 'all') {
    mapped = mapped.filter(v => {
      const hostIdStr = typeof v.host_id === 'object' && v.host_id !== null ? v.host_id._id : v.host_id;
      return hostIdStr === filters.host_id;
    });
  }

  if (filters?.office_id && filters.office_id !== 'all') {
    mapped = mapped.filter(v => {
      const officeIdStr = typeof v.office_id === 'object' && v.office_id !== null ? v.office_id._id : v.office_id;
      return officeIdStr === filters.office_id;
    });
  }

  if (filters?.startDate) {
    mapped = mapped.filter(v => new Date(v.check_in) >= new Date(filters.startDate!));
  }

  if (filters?.endDate) {
    const endLimit = new Date(filters.endDate);
    endLimit.setHours(23, 59, 59, 999);
    mapped = mapped.filter(v => new Date(v.check_in) <= endLimit);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    mapped = mapped.filter(v => {
      const visitorName = typeof v.visitor_id === 'object' && v.visitor_id !== null ? v.visitor_id.name : '';
      const hostName = typeof v.host_id === 'object' && v.host_id !== null ? v.host_id.name : '';
      return (
        visitorName.toLowerCase().includes(searchLower) ||
        hostName.toLowerCase().includes(searchLower) ||
        v.purpose.toLowerCase().includes(searchLower)
      );
    });
  }

  // Sort chronologically descending
  mapped.sort((a, b) => new Date(b.check_in).getTime() - new Date(a.check_in).getTime());

  if (filters?.page || filters?.limit) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;
    const paginatedData = mapped.slice(skip, skip + limit);
    return {
      success: true,
      data: paginatedData,
      total: mapped.length,
      page,
      limit,
      totalPages: Math.ceil(mapped.length / limit)
    } as PaginatedResponse<VisitLog>;
  }

  return mapped;
};

// --- OFFICES HOOKS ---

export const useOffices = (filters?: OfficeFilters) => {
  const queryClient = useQueryClient();

  const officesQuery = useQuery<PaginatedResponse<OfficeRealm> | OfficeRealm[]>({
    queryKey: ['offices', filters],
    queryFn: async () => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive) {
        try {
          const res = await OfficeService.getAll(filters);
          // Sync online fetched results to local Dexie
          const arrayData = Array.isArray(res) ? res : res.data;
          // Merge items to prevent wiping out offline cache
          for (const item of arrayData) {
            await db.offices.put({
              _id: item._id,
              name: item.name,
              city: item.city,
              address: item.address,
              is_active: item.is_active,
            });
          }
          return res;
        } catch (error) {
          console.warn('Offices API fetch failed, falling back to local DB cache:', error);
        }
      }
      return getLocalOffices(filters);
    },
  });

  const createOfficeMutation = useMutation({
    mutationFn: async (payload: CreateOfficeDTO) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;
      const mockId = `local-office-${Date.now()}`;
      
      const newOffice: OfficeRealm = {
        _id: mockId,
        name: payload.name,
        city: payload.city,
        address: payload.address,
        is_active: payload.is_active !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isOnline && serverAlive) {
        try {
          const serverOffice = await OfficeService.create(payload);
          await db.offices.put({
            _id: serverOffice._id,
            name: serverOffice.name,
            city: serverOffice.city,
            address: serverOffice.address,
            is_active: serverOffice.is_active,
          });
          return serverOffice;
        } catch (error) {
          console.error('Failed to create office on server:', error);
        }
      }

      // Offline flow
      await db.offices.put({
        _id: mockId,
        name: payload.name,
        city: payload.city,
        address: payload.address,
        is_active: payload.is_active !== false,
      });

      // Queue in sync outbox if needed
      await db.syncOutbox.put({
        timestamp: Date.now(),
        action: 'CREATE_VISITOR', // Reuse creation sync structure if needed or create separate action
        payload: { type: 'CREATE_OFFICE', localId: mockId, ...payload },
        attempts: 0,
      });

      return newOffice;
    },
    onMutate: async (newOfficePayload) => {
      await queryClient.cancelQueries({ queryKey: ['offices', filters] });
      const previousOffices = queryClient.getQueryData(['offices', filters]);
      const mockOffice = {
        _id: `local-office-${Date.now()}`,
        name: newOfficePayload.name,
        city: newOfficePayload.city,
        address: newOfficePayload.address,
        is_active: newOfficePayload.is_active !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['offices', filters], (old: any) => {
        if (!old) return [mockOffice];
        if (Array.isArray(old)) {
          return [mockOffice, ...old];
        }
        return {
          ...old,
          data: [mockOffice, ...old.data],
          total: (old.total || 0) + 1,
        };
      });

      return { previousOffices };
    },
    onError: (err, newOfficePayload, context) => {
      if (context?.previousOffices) {
        queryClient.setQueryData(['offices', filters], context.previousOffices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });

  const updateOfficeMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateOfficeDTO }) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          const updated = await OfficeService.update(id, payload);
          await db.offices.put({
            _id: updated._id,
            name: updated.name,
            city: updated.city,
            address: updated.address,
            is_active: updated.is_active,
          });
          return updated;
        } catch (error) {
          console.error('Failed to update office on server:', error);
        }
      }

      // Offline flow
      const existing = await db.offices.get(id);
      if (existing) {
        const updated = { ...existing, ...payload } as any;
        await db.offices.put(updated);
      }
      return { _id: id, ...payload } as OfficeRealm;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['offices', filters] });
      const previousOffices = queryClient.getQueryData(['offices', filters]);

      queryClient.setQueryData(['offices', filters], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.map(o => o._id === id ? { ...o, ...payload } : o);
        }
        return {
          ...old,
          data: old.data.map((o: any) => o._id === id ? { ...o, ...payload } : o),
        };
      });

      return { previousOffices };
    },
    onError: (err, variables, context) => {
      if (context?.previousOffices) {
        queryClient.setQueryData(['offices', filters], context.previousOffices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });

  const deleteOfficeMutation = useMutation({
    mutationFn: async (id: string) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          await OfficeService.delete(id);
        } catch (error) {
          console.error('Failed to delete office on server:', error);
        }
      }

      await db.offices.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['offices', filters] });
      const previousOffices = queryClient.getQueryData(['offices', filters]);

      queryClient.setQueryData(['offices', filters], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.filter(o => o._id !== id);
        }
        return {
          ...old,
          data: old.data.filter((o: any) => o._id !== id),
          total: Math.max((old.total || 0) - 1, 0),
        };
      });

      return { previousOffices };
    },
    onError: (err, id, context) => {
      if (context?.previousOffices) {
        queryClient.setQueryData(['offices', filters], context.previousOffices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
    },
  });

  // Extract pagination results or fallback array
  const rawData = officesQuery.data;
  const offices = rawData ? (Array.isArray(rawData) ? rawData : rawData.data) : [];
  const pagination = rawData && !Array.isArray(rawData) ? {
    total: rawData.total,
    page: rawData.page,
    limit: rawData.limit,
    totalPages: rawData.totalPages
  } : undefined;

  return {
    offices,
    pagination,
    isLoading: officesQuery.isLoading,
    isError: officesQuery.isError,
    error: officesQuery.error,
    refetch: officesQuery.refetch,
    createOffice: createOfficeMutation.mutateAsync,
    isCreating: createOfficeMutation.isPending,
    updateOffice: updateOfficeMutation.mutateAsync,
    isUpdating: updateOfficeMutation.isPending,
    deleteOffice: deleteOfficeMutation.mutateAsync,
    isDeleting: deleteOfficeMutation.isPending,
  };
};

// --- EMPLOYEES HOOKS ---

export const useEmployees = (filters?: EmployeeFilters) => {
  const queryClient = useQueryClient();

  const employeesQuery = useQuery<PaginatedResponse<UserProfile> | UserProfile[]>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive) {
        try {
          const res = await EmployeeService.getAll(filters);
          const arrayData = Array.isArray(res) ? res : res.data;
          
          for (const item of arrayData) {
            await db.employees.put({
              _id: item._id,
              name: item.name,
              email: item.email,
              role: item.role,
              phone: item.phone || '',
              office_id: typeof item.office_id === 'object' && item.office_id !== null ? item.office_id._id : item.office_id || '',
              telegram_id: item.telegram_id || '',
              department: item.department || '',
            });
          }
          return res;
        } catch (error) {
          console.warn('Employees API fetch failed, falling back to local DB cache:', error);
        }
      }
      return getLocalEmployees(filters);
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (payload: CreateEmployeeDTO) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;
      const mockId = `local-employee-${Date.now()}`;
      
      const newEmployee: UserProfile = {
        _id: mockId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        phone: payload.phone || '',
        office_id: payload.office_id,
        telegram_id: payload.telegram_id || '',
        department: payload.department || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isOnline && serverAlive) {
        try {
          const serverEmp = await EmployeeService.create(payload);
          await db.employees.put({
            _id: serverEmp._id,
            name: serverEmp.name,
            email: serverEmp.email,
            role: serverEmp.role,
            phone: serverEmp.phone || '',
            office_id: typeof serverEmp.office_id === 'object' ? serverEmp.office_id._id : serverEmp.office_id,
            telegram_id: serverEmp.telegram_id,
            department: serverEmp.department,
          });
          return serverEmp;
        } catch (error) {
          console.error('Failed to create employee on server:', error);
        }
      }

      // Offline flow
      await db.employees.put({
        _id: mockId,
        name: payload.name,
        email: payload.email,
        role: payload.role as any,
        phone: payload.phone || '',
        office_id: payload.office_id,
        telegram_id: payload.telegram_id,
        department: payload.department,
      });

      return newEmployee;
    },
    onMutate: async (newEmpPayload) => {
      await queryClient.cancelQueries({ queryKey: ['employees', filters] });
      const previousEmployees = queryClient.getQueryData(['employees', filters]);
      const mockEmp = {
        _id: `local-employee-${Date.now()}`,
        name: newEmpPayload.name,
        email: newEmpPayload.email,
        role: newEmpPayload.role,
        phone: newEmpPayload.phone || '',
        office_id: newEmpPayload.office_id,
        telegram_id: newEmpPayload.telegram_id || '',
        department: newEmpPayload.department || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['employees', filters], (old: any) => {
        if (!old) return [mockEmp];
        if (Array.isArray(old)) {
          return [mockEmp, ...old];
        }
        return {
          ...old,
          data: [mockEmp, ...old.data],
          total: (old.total || 0) + 1,
        };
      });

      return { previousEmployees };
    },
    onError: (err, payload, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees', filters], context.previousEmployees);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateEmployeeDTO }) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;
      const officeIdStr = typeof payload.office_id === 'object' && payload.office_id !== null
        ? (payload.office_id as any)._id
        : payload.office_id;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          const apiPayload = {
            ...payload,
            ...(officeIdStr !== undefined ? { office_id: officeIdStr } : {})
          };
          const serverEmp = await EmployeeService.update(id, apiPayload);
          await db.employees.put({
            _id: serverEmp._id,
            name: serverEmp.name,
            email: serverEmp.email,
            role: serverEmp.role,
            phone: serverEmp.phone || '',
            office_id: typeof serverEmp.office_id === 'object' ? serverEmp.office_id._id : serverEmp.office_id,
            telegram_id: serverEmp.telegram_id,
            department: serverEmp.department,
          });
          return serverEmp;
        } catch (error) {
          console.error('Failed to update employee on server:', error);
        }
      }

      // Offline flow
      const existing = await db.employees.get(id);
      if (existing) {
        const updated = {
          ...existing,
          name: payload.name ?? existing.name,
          email: payload.email ?? existing.email,
          role: (payload.role ?? existing.role) as any,
          phone: payload.phone !== undefined ? payload.phone : (existing as any).phone,
          office_id: officeIdStr !== undefined ? officeIdStr : existing.office_id,
          telegram_id: payload.telegram_id !== undefined ? payload.telegram_id : existing.telegram_id,
          department: payload.department !== undefined ? payload.department : existing.department,
        };
        await db.employees.put(updated);
      }
      return { _id: id, ...payload } as UserProfile;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['employees', filters] });
      const previousEmployees = queryClient.getQueryData(['employees', filters]);

      queryClient.setQueryData(['employees', filters], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.map(e => e._id === id ? { ...e, ...payload } : e);
        }
        return {
          ...old,
          data: old.data.map((e: any) => e._id === id ? { ...e, ...payload } : e),
        };
      });

      return { previousEmployees };
    },
    onError: (err, variables, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees', filters], context.previousEmployees);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          await EmployeeService.delete(id);
        } catch (error) {
          console.error('Failed to delete employee on server:', error);
        }
      }

      await db.employees.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['employees', filters] });
      const previousEmployees = queryClient.getQueryData(['employees', filters]);

      queryClient.setQueryData(['employees', filters], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.filter(e => e._id !== id);
        }
        return {
          ...old,
          data: old.data.filter((e: any) => e._id !== id),
          total: Math.max((old.total || 0) - 1, 0),
        };
      });

      return { previousEmployees };
    },
    onError: (err, id, context) => {
      if (context?.previousEmployees) {
        queryClient.setQueryData(['employees', filters], context.previousEmployees);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const rawData = employeesQuery.data;
  const employees = rawData ? (Array.isArray(rawData) ? rawData : rawData.data) : [];
  const pagination = rawData && !Array.isArray(rawData) ? {
    total: rawData.total,
    page: rawData.page,
    limit: rawData.limit,
    totalPages: rawData.totalPages
  } : undefined;

  return {
    employees,
    pagination,
    isLoading: employeesQuery.isLoading,
    isError: employeesQuery.isError,
    error: employeesQuery.error,
    refetch: employeesQuery.refetch,
    createEmployee: createEmployeeMutation.mutateAsync,
    isCreating: createEmployeeMutation.isPending,
    updateEmployee: updateEmployeeMutation.mutateAsync,
    isUpdating: updateEmployeeMutation.isPending,
    deleteEmployee: deleteEmployeeMutation.mutateAsync,
    isDeleting: deleteEmployeeMutation.isPending,
  };
};

// --- VISITORS HOOKS ---

export const useVisitors = (filters?: VisitorFilters) => {
  const queryClient = useQueryClient();

  const visitorsQuery = useQuery<PaginatedResponse<VisitorRecord> | VisitorRecord[]>({
    queryKey: ['visitors', filters],
    queryFn: async () => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive) {
        try {
          const res = await VisitorService.getAll(filters);
          const arrayData = Array.isArray(res) ? res : res.data;
          
          for (const item of arrayData) {
            await db.visitors.put({
              id: item._id,
              _id: item._id,
              name: item.name,
              phone: item.phone,
              id_number: item.id_number,
              photo_url: item.photo_url || '',
              is_blacklisted: item.is_blacklisted === true,
              blacklist_reason: item.blacklist_reason || '',
              localOnly: 0,
            });
          }
          return res;
        } catch (error) {
          console.warn('Visitors API fetch failed, falling back to local DB cache:', error);
        }
      }
      return getLocalVisitors(filters);
    },
  });

  const createVisitorMutation = useMutation({
    mutationFn: async (payload: CreateVisitorDTO & { photoBase64?: string }) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;
      const mockId = `local-visitor-${Date.now()}`;

      const newVisitor: VisitorRecord = {
        _id: mockId,
        name: payload.name,
        phone: payload.phone,
        id_number: payload.id_number,
        photo_url: payload.photoBase64 || '',
        is_blacklisted: false,
        email: payload.email || '',
        company_name: payload.company_name || '',
        id_type: payload.id_type || 'Aadhar',
        address: payload.address || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (isOnline && serverAlive) {
        try {
          const serverVisitor = await VisitorService.create(payload);
          await db.visitors.put({
            id: serverVisitor._id,
            _id: serverVisitor._id,
            name: serverVisitor.name,
            phone: serverVisitor.phone,
            id_number: serverVisitor.id_number,
            photo_url: serverVisitor.photo_url || '',
            is_blacklisted: serverVisitor.is_blacklisted,
            email: serverVisitor.email || '',
            company_name: serverVisitor.company_name || '',
            id_type: serverVisitor.id_type || 'Aadhar',
            address: serverVisitor.address || '',
            localOnly: 0,
          });
          return serverVisitor;
        } catch (error) {
          console.error('Failed to create visitor on server, falling back to local storage:', error);
        }
      }

      // Offline flow
      await db.visitors.put({
        id: mockId,
        name: payload.name,
        phone: payload.phone,
        id_number: payload.id_number,
        photo_url: payload.photoBase64 || '',
        is_blacklisted: false,
        email: payload.email || '',
        company_name: payload.company_name || '',
        id_type: payload.id_type || 'Aadhar',
        address: payload.address || '',
        localOnly: 1,
      });

      // Queue in sync outbox
      await db.syncOutbox.put({
        timestamp: Date.now(),
        action: 'CREATE_VISITOR',
        payload: {
          localId: mockId,
          name: payload.name,
          phone: payload.phone,
          id_number: payload.id_number,
          email: payload.email || '',
          company_name: payload.company_name || '',
          id_type: payload.id_type || 'Aadhar',
          address: payload.address || '',
          photoBase64: payload.photoBase64,
        },
        attempts: 0,
      });

      return newVisitor;
    },
    onMutate: async (newVisitorPayload) => {
      await queryClient.cancelQueries({ queryKey: ['visitors', filters] });
      const previousVisitors = queryClient.getQueryData(['visitors', filters]);

      const mockVisitor = {
        _id: `local-visitor-${Date.now()}`,
        name: newVisitorPayload.name,
        phone: newVisitorPayload.phone,
        id_number: newVisitorPayload.id_number,
        photo_url: newVisitorPayload.photoBase64 || '',
        is_blacklisted: false,
        email: newVisitorPayload.email || '',
        company_name: newVisitorPayload.company_name || '',
        id_type: newVisitorPayload.id_type || 'Aadhar',
        address: newVisitorPayload.address || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['visitors', filters], (old: any) => {
        if (!old) return [mockVisitor];
        if (Array.isArray(old)) {
          return [mockVisitor, ...old];
        }
        return {
          ...old,
          data: [mockVisitor, ...old.data],
          total: (old.total || 0) + 1,
        };
      });

      return { previousVisitors };
    },
    onError: (err, payload, context) => {
      if (context?.previousVisitors) {
        queryClient.setQueryData(['visitors', filters], context.previousVisitors);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  const updateVisitorMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateVisitorDTO }) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          const updated = await VisitorService.update(id, payload);
          await db.visitors.put({
            id: updated._id,
            _id: updated._id,
            name: updated.name,
            phone: updated.phone,
            id_number: updated.id_number,
            photo_url: updated.photo_url || '',
            is_blacklisted: updated.is_blacklisted === true,
            blacklist_reason: updated.blacklist_reason || '',
            localOnly: 0,
          });
          return updated;
        } catch (error) {
          console.error('Failed to update visitor on server:', error);
        }
      }

      // Offline flow
      const existing = await db.visitors.get(id);
      if (existing) {
        const updated = {
          ...existing,
          ...payload,
          blacklist_reason: payload.blacklist_reason !== undefined ? payload.blacklist_reason : (existing as any).blacklist_reason,
        } as any;
        await db.visitors.put(updated);
      }
      return { _id: id, ...payload } as VisitorRecord;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['visitors', filters] });
      const previousVisitors = queryClient.getQueryData(['visitors', filters]);

      queryClient.setQueryData(['visitors', filters], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.map(v => v._id === id ? { ...v, ...payload } : v);
        }
        return {
          ...old,
          data: old.data.map((v: any) => v._id === id ? { ...v, ...payload } : v),
        };
      });

      return { previousVisitors };
    },
    onError: (err, variables, context) => {
      if (context?.previousVisitors) {
        queryClient.setQueryData(['visitors', filters], context.previousVisitors);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  const deleteVisitorMutation = useMutation({
    mutationFn: async (id: string) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          await VisitorService.delete(id);
        } catch (error) {
          console.error('Failed to delete visitor on server:', error);
        }
      }

      await db.visitors.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['visitors', filters] });
      const previousVisitors = queryClient.getQueryData(['visitors', filters]);

      queryClient.setQueryData(['visitors', filters], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.filter(v => v._id !== id);
        }
        return {
          ...old,
          data: old.data.filter((v: any) => v._id !== id),
          total: Math.max((old.total || 0) - 1, 0),
        };
      });

      return { previousVisitors };
    },
    onError: (err, id, context) => {
      if (context?.previousVisitors) {
        queryClient.setQueryData(['visitors', filters], context.previousVisitors);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
    },
  });

  const rawData = visitorsQuery.data;
  const visitors = rawData ? (Array.isArray(rawData) ? rawData : rawData.data) : [];
  const pagination = rawData && !Array.isArray(rawData) ? {
    total: rawData.total,
    page: rawData.page,
    limit: rawData.limit,
    totalPages: rawData.totalPages
  } : undefined;

  return {
    visitors,
    pagination,
    isLoading: visitorsQuery.isLoading,
    isError: visitorsQuery.isError,
    error: visitorsQuery.error,
    refetch: visitorsQuery.refetch,
    createVisitor: createVisitorMutation.mutateAsync,
    isCreating: createVisitorMutation.isPending,
    updateVisitor: updateVisitorMutation.mutateAsync,
    isUpdating: updateVisitorMutation.isPending,
    deleteVisitor: deleteVisitorMutation.mutateAsync,
    isDeleting: deleteVisitorMutation.isPending,
  };
};

// --- VISITS HOOKS ---

export const useVisits = (filters?: VisitFilters) => {
  const queryClient = useQueryClient();

  const visitsQuery = useQuery<PaginatedResponse<VisitLog> | VisitLog[]>({
    queryKey: ['visits', filters],
    queryFn: async () => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive) {
        try {
          const res = await VisitService.getAll(filters);
          const arrayData = Array.isArray(res) ? res : res.data;
          
          for (const item of arrayData) {
            await db.visits.put({
              id: item._id,
              _id: item._id,
              visitor_id: typeof item.visitor_id === 'object' && item.visitor_id !== null ? item.visitor_id._id : item.visitor_id,
              host_id: typeof item.host_id === 'object' && item.host_id !== null ? item.host_id._id : item.host_id,
              office_id: typeof item.office_id === 'object' && item.office_id !== null ? item.office_id._id : item.office_id,
              purpose: item.purpose,
              check_in: item.check_in,
              check_out: item.check_out,
              status: item.status,
              localOnly: 0,
            });
          }
          return res;
        } catch (error) {
          console.warn('Visits API fetch failed, falling back to local DB cache:', error);
        }
      }
      return getLocalVisits(filters);
    },
  });

  const createVisitMutation = useMutation({
    mutationFn: async (payload: CreateVisitDTO) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;
      const mockId = `local-visit-${Date.now()}`;

      const visitorIdStr = payload.visitor_id;
      const hostIdStr = payload.host_id;
      const officeIdStr = payload.office_id;

      if (isOnline && serverAlive) {
        try {
          const serverVisit = await VisitService.create(payload);
          await db.visits.put({
            id: serverVisit._id,
            _id: serverVisit._id,
            visitor_id: visitorIdStr,
            host_id: hostIdStr,
            office_id: officeIdStr,
            purpose: serverVisit.purpose,
            check_in: serverVisit.check_in,
            check_out: serverVisit.check_out,
            status: serverVisit.status,
            localOnly: 0,
          });
          return serverVisit;
        } catch (error) {
          console.error('Failed to create visit on server:', error);
        }
      }

      // Offline flow
      const mockVisit = {
        id: mockId,
        visitor_id: visitorIdStr,
        host_id: hostIdStr,
        office_id: officeIdStr,
        purpose: payload.purpose,
        check_in: payload.check_in || new Date().toISOString(),
        check_out: payload.check_out,
        status: payload.status || 'pending',
        localOnly: 1,
      };

      await db.visits.put(mockVisit);

      // Queue in sync outbox
      await db.syncOutbox.put({
        timestamp: Date.now(),
        action: 'CHECK_IN',
        payload: {
          localId: mockId,
          visitor_id: visitorIdStr,
          host_id: hostIdStr,
          office_id: officeIdStr,
          purpose: payload.purpose,
          check_in: payload.check_in || new Date().toISOString(),
        },
        attempts: 0,
      });

      return {
        _id: mockId,
        visitor_id: visitorIdStr,
        host_id: hostIdStr,
        office_id: officeIdStr,
        purpose: payload.purpose,
        check_in: payload.check_in || new Date().toISOString(),
        check_out: payload.check_out,
        status: payload.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any as VisitLog;
    },
    onMutate: async (newVisitPayload) => {
      await queryClient.cancelQueries({ queryKey: ['visits', filters] });
      const previousVisits = queryClient.getQueryData(['visits', filters]);

      const mockVisit = {
        _id: `local-visit-${Date.now()}`,
        visitor_id: newVisitPayload.visitor_id,
        host_id: newVisitPayload.host_id,
        office_id: newVisitPayload.office_id,
        purpose: newVisitPayload.purpose,
        check_in: newVisitPayload.check_in || new Date().toISOString(),
        check_out: newVisitPayload.check_out,
        status: newVisitPayload.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(['visits', filters], (old: any) => {
        if (!old) return [mockVisit];
        if (Array.isArray(old)) {
          return [mockVisit, ...old];
        }
        return {
          ...old,
          data: [mockVisit, ...old.data],
          total: (old.total || 0) + 1,
        };
      });

      return { previousVisits };
    },
    onError: (err, payload, context) => {
      if (context?.previousVisits) {
        queryClient.setQueryData(['visits', filters], context.previousVisits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });

  const updateVisitMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateVisitDTO }) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      const visitorIdStr = payload.visitor_id;
      const hostIdStr = payload.host_id;
      const officeIdStr = payload.office_id;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          const apiPayload = {
            ...payload,
            ...(visitorIdStr !== undefined ? { visitor_id: visitorIdStr } : {}),
            ...(hostIdStr !== undefined ? { host_id: hostIdStr } : {}),
            ...(officeIdStr !== undefined ? { office_id: officeIdStr } : {}),
          };
          const serverVisit = await VisitService.update(id, apiPayload);
          await db.visits.put({
            id: serverVisit._id,
            _id: serverVisit._id,
            visitor_id: typeof serverVisit.visitor_id === 'object' && serverVisit.visitor_id !== null ? serverVisit.visitor_id._id : serverVisit.visitor_id,
            host_id: typeof serverVisit.host_id === 'object' && serverVisit.host_id !== null ? serverVisit.host_id._id : serverVisit.host_id,
            office_id: typeof serverVisit.office_id === 'object' && serverVisit.office_id !== null ? serverVisit.office_id._id : serverVisit.office_id,
            purpose: serverVisit.purpose,
            reason: serverVisit.reason || '',
            check_in: serverVisit.check_in,
            check_out: serverVisit.check_out,
            status: serverVisit.status,
            localOnly: 0,
          });
          return serverVisit;
        } catch (error) {
          console.error('Failed to update visit on server:', error);
        }
      }

      // Offline flow
      const existing = await db.visits.get(id);
      if (existing) {
        const updated = {
          ...existing,
          visitor_id: visitorIdStr !== undefined ? visitorIdStr : existing.visitor_id,
          host_id: hostIdStr !== undefined ? hostIdStr : existing.host_id,
          office_id: officeIdStr !== undefined ? officeIdStr : existing.office_id,
          purpose: payload.purpose !== undefined ? payload.purpose : existing.purpose,
          reason: payload.reason !== undefined ? payload.reason : existing.reason,
          check_in: payload.check_in !== undefined ? payload.check_in : existing.check_in,
          check_out: payload.check_out !== undefined ? payload.check_out : existing.check_out,
          status: payload.status !== undefined ? payload.status : existing.status,
        };
        await db.visits.put(updated);

        if (payload.status === 'exited' || payload.check_out) {
          // Queue CHECK_OUT in sync outbox
          await db.syncOutbox.put({
            timestamp: Date.now(),
            action: 'CHECK_OUT',
            payload: {
              visitId: id,
              check_out: payload.check_out || new Date().toISOString(),
            },
            attempts: 0,
          });
        }
      }

      return { _id: id, ...payload } as any as VisitLog;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['visits', filters] });
      const previousVisits = queryClient.getQueryData(['visits', filters]);

      queryClient.setQueryData(['visits', filters], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.map(v => v._id === id ? { ...v, ...payload } : v);
        }
        return {
          ...old,
          data: old.data.map((v: any) => v._id === id ? { ...v, ...payload } : v),
        };
      });

      return { previousVisits };
    },
    onError: (err, variables, context) => {
      if (context?.previousVisits) {
        queryClient.setQueryData(['visits', filters], context.previousVisits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });

  const deleteVisitMutation = useMutation({
    mutationFn: async (id: string) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          await VisitService.delete(id);
        } catch (error) {
          console.error('Failed to delete visit on server:', error);
        }
      }

      await db.visits.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['visits', filters] });
      const previousVisits = queryClient.getQueryData(['visits', filters]);

      queryClient.setQueryData(['visits', filters], (old: any) => {
        if (!old) return [];
        if (Array.isArray(old)) {
          return old.filter(v => v._id !== id);
        }
        return {
          ...old,
          data: old.data.filter((v: any) => v._id !== id),
          total: Math.max((old.total || 0) - 1, 0),
        };
      });

      return { previousVisits };
    },
    onError: (err, id, context) => {
      if (context?.previousVisits) {
        queryClient.setQueryData(['visits', filters], context.previousVisits);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
    },
  });

  const rawData = visitsQuery.data;
  const visits = rawData ? (Array.isArray(rawData) ? rawData : rawData.data) : [];
  const pagination = rawData && !Array.isArray(rawData) ? {
    total: rawData.total,
    page: rawData.page,
    limit: rawData.limit,
    totalPages: rawData.totalPages
  } : undefined;

  return {
    visits,
    pagination,
    isLoading: visitsQuery.isLoading,
    isError: visitsQuery.isError,
    error: visitsQuery.error,
    refetch: visitsQuery.refetch,
    createVisit: createVisitMutation.mutateAsync,
    isCreating: createVisitMutation.isPending,
    updateVisit: updateVisitMutation.mutateAsync,
    isUpdating: updateVisitMutation.isPending,
    deleteVisit: deleteVisitMutation.mutateAsync,
    isDeleting: deleteVisitMutation.isPending,
  };
};

// --- CUSTOM MASTER DATA HOOKS (LOCAL STORAGE + ENDPOINT MOCK FLOW) ---

const MASTER_DATA_KEY = 'vms-custom-master-data';
const defaultMasterData: CustomMasterDataItem[] = [
  // Purposes
  { _id: 'p1', type: 'purpose', name: 'Meeting', sortOrder: 1, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'p2', type: 'purpose', name: 'Interview', sortOrder: 2, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'p3', type: 'purpose', name: 'Delivery', sortOrder: 3, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'p4', type: 'purpose', name: 'Service Visit', sortOrder: 4, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'p5', type: 'purpose', name: 'Personal', sortOrder: 5, is_active: true, createdAt: new Date().toISOString() },
  // Departments
  { _id: 'd1', type: 'department', name: 'Administration', sortOrder: 1, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'd2', type: 'department', name: 'Engineering', sortOrder: 2, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'd3', type: 'department', name: 'Human Resources', sortOrder: 3, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'd4', type: 'department', name: 'Security Operations', sortOrder: 4, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'd5', type: 'department', name: 'Marketing', sortOrder: 5, is_active: true, createdAt: new Date().toISOString() },
  { _id: 'd6', type: 'department', name: 'Sales', sortOrder: 6, is_active: true, createdAt: new Date().toISOString() },
];

const loadMasterDataLocal = (): CustomMasterDataItem[] => {
  const stored = localStorage.getItem(MASTER_DATA_KEY);
  if (!stored) {
    localStorage.setItem(MASTER_DATA_KEY, JSON.stringify(defaultMasterData));
    return defaultMasterData;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return defaultMasterData;
  }
};

const saveMasterDataLocal = (data: CustomMasterDataItem[]) => {
  localStorage.setItem(MASTER_DATA_KEY, JSON.stringify(data));
};

export const useCustomMasterData = () => {
  const queryClient = useQueryClient();

  const masterDataQuery = useQuery<CustomMasterDataItem[]>({
    queryKey: ['custom-master-data'],
    queryFn: async () => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive) {
        try {
          const response = await httpClient.get<{ success: boolean; data: CustomMasterDataItem[] }>('/custom-master-data');
          if (response.data.success) {
            saveMasterDataLocal(response.data.data);
            return response.data.data;
          }
        } catch {
          // ignore error and fallback
        }
      }
      return loadMasterDataLocal();
    },
  });

  const createItemMutation = useMutation({
    mutationFn: async (payload: Omit<CustomMasterDataItem, '_id' | 'createdAt'>) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;
      const mockId = `local-master-${Date.now()}`;
      const newItem: CustomMasterDataItem = {
        _id: mockId,
        ...payload,
        createdAt: new Date().toISOString(),
      };

      if (isOnline && serverAlive) {
        try {
          const response = await httpClient.post<{ success: boolean; data: CustomMasterDataItem }>('/custom-master-data', payload);
          if (response.data.success) {
            return response.data.data;
          }
        } catch {
          // fallback
        }
      }

      // Offline flow
      const current = loadMasterDataLocal();
      current.push(newItem);
      saveMasterDataLocal(current);
      return newItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-master-data'] });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CustomMasterDataItem> }) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          const response = await httpClient.put<{ success: boolean; data: CustomMasterDataItem }>(`/custom-master-data/${id}`, payload);
          if (response.data.success) {
            return response.data.data;
          }
        } catch {
          // fallback
        }
      }

      // Offline flow
      const current = loadMasterDataLocal();
      const updated = current.map(item => {
        if (item._id === id) {
          return { ...item, ...payload };
        }
        return item;
      });
      saveMasterDataLocal(updated);
      return { _id: id, ...payload } as CustomMasterDataItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-master-data'] });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const isOnline = getIsOnline();
      const serverAlive = isOnline ? await checkBackend() : false;

      if (isOnline && serverAlive && !id.startsWith('local-')) {
        try {
          await httpClient.delete(`/custom-master-data/${id}`);
        } catch {
          // fallback
        }
      }

      const current = loadMasterDataLocal();
      const filtered = current.filter(item => item._id !== id);
      saveMasterDataLocal(filtered);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-master-data'] });
    },
  });

  return {
    masterData: masterDataQuery.data || [],
    isLoading: masterDataQuery.isLoading,
    isError: masterDataQuery.isError,
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
  };
};
