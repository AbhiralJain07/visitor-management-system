import { httpClient } from '@/api/client';
import type { Employee, EmployeeFilters, CreateEmployeeDTO, UpdateEmployeeDTO, PaginatedResponse, ApiResponse } from '@/types/api.types';

export const EmployeeService = {
  async getAll(filters?: EmployeeFilters): Promise<PaginatedResponse<Employee> | Employee[]> {
    const response = await httpClient.get<any>('/employees', { params: filters });
    if (response.data && typeof response.data.total === 'number') {
      return response.data as PaginatedResponse<Employee>;
    }
    return response.data.data as Employee[];
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
