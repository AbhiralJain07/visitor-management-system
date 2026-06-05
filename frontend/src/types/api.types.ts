export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface Visitor {
  _id: string;
  name: string;
  phone: string;
  id_number: string;
  photo_url?: string;
  face_data?: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  email?: string;
  company_name?: string;
  id_type?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  telegram_id?: string;
  department?: string;
  role: 'admin' | 'manager' | 'receptionist' | 'security' | 'employee' | 'super_admin' | 'support_admin' | 'auditor';
  office_id?: string | Office;
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  _id: string;
  name: string;
  city: string;
  address: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  _id: string;
  visitor_id: string | Visitor;
  host_id: string | Employee;
  office_id: string | Office;
  purpose: string;
  notes?: string;
  reason?: string;
  check_in: string;
  check_out?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'exited';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  activeVisitors: number;
  expectedToday: number;
  pendingApprovals: number;
  activeOffices: number;
}

export interface VisitorFrequency {
  date: string;
  count: number;
}

export interface ReportSummary {
  stats: DashboardStats;
  trends: VisitorFrequency[];
}

// Pagination & Filtering Interfaces
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface EmployeeFilters extends PaginationParams {
  role?: string;
  department?: string;
  office_id?: string;
}

export interface VisitorFilters extends PaginationParams {
  is_blacklisted?: boolean | 'all';
}

export interface VisitFilters extends PaginationParams {
  status?: string;
  host_id?: string;
  office_id?: string;
  startDate?: string;
  endDate?: string;
}

export interface OfficeFilters extends PaginationParams {
  is_active?: boolean | 'all';
}

// Creation & Update DTOs
export interface CreateEmployeeDTO {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  telegram_id?: string;
  department?: string;
  role: 'admin' | 'manager' | 'receptionist' | 'security' | 'employee' | 'super_admin' | 'support_admin' | 'auditor';
  office_id: string;
}

export interface UpdateEmployeeDTO extends Partial<CreateEmployeeDTO> {}

export interface CreateOfficeDTO {
  name: string;
  city: string;
  address: string;
  is_active?: boolean;
}

export interface UpdateOfficeDTO extends Partial<CreateOfficeDTO> {}

export interface CreateVisitorDTO {
  name: string;
  phone: string;
  id_number: string;
  photo?: File | Blob;
  email?: string;
  company_name?: string;
  id_type?: string;
  address?: string;
}

export interface UpdateVisitorDTO {
  name?: string;
  phone?: string;
  id_number?: string;
  is_blacklisted?: boolean;
  blacklist_reason?: string;
  email?: string;
  company_name?: string;
  id_type?: string;
  address?: string;
}

export interface CreateVisitDTO {
  visitor_id: string;
  host_id: string;
  office_id: string;
  purpose: string;
  notes?: string;
  reason?: string;
  check_in?: string;
  check_out?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | 'exited';
}

export interface UpdateVisitDTO extends Partial<CreateVisitDTO> {}

export interface CustomMasterDataItem {
  _id: string;
  type: 'purpose' | 'department';
  name: string;
  sortOrder: number;
  is_active: boolean;
  createdAt: string;
}

