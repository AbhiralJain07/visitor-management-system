import { httpClient } from '@/api/client';
import type { Employee, EmployeeFilters, CreateEmployeeDTO, UpdateEmployeeDTO, PaginatedResponse, ApiResponse } from '@/types/api.types';

export const EmployeeService = {
  async getAll(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    const response = await httpClient.get<any>('/employees', { params: filters });
    const res = response.data;

    // Backend ab paginated response return karta hai
    if (res && typeof res.total === 'number') {
      return res as PaginatedResponse<Employee>;
    }

    // Fallback: agar sirf array aaya to wrap karo
    const arr: Employee[] = Array.isArray(res) ? res : (res?.data ?? []);
    return {
      success: true,
      data: arr,
      total: arr.length,
      page: 1,
      limit: arr.length,
      totalPages: 1,
    };
  },

  async create(dto: CreateEmployeeDTO): Promise<Employee> {
    const response = await httpClient.post<ApiResponse<Employee>>('/employees', dto);
    return response.data.data;
  },

  async update(id: string, dto: UpdateEmployeeDTO): Promise<Employee> {
    const response = await httpClient.put<ApiResponse<Employee>>(`/employees/${id}`, dto);
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await httpClient.delete<ApiResponse<any>>(`/employees/${id}`);
    return response.data.success;
  }
};
