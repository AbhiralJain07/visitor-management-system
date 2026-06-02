import { httpClient } from '@/api/client';
import { type ApiResponse, type Employee } from '@/types/api.types';

export const getEmployees = async (): Promise<ApiResponse<Employee[]>> => {
  const response = await httpClient.get<ApiResponse<Employee[]>>('/employees');
  return response.data;
};

export const createEmployee = async (payload: Omit<Employee, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Employee>> => {
  const response = await httpClient.post<ApiResponse<Employee>>('/employees', payload);
  return response.data;
};

export const updateEmployee = async (id: string, payload: Partial<Employee>): Promise<ApiResponse<Employee>> => {
  const response = await httpClient.put<ApiResponse<Employee>>(`/employees/${id}`, payload);
  return response.data;
};

export const deleteEmployee = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await httpClient.delete<ApiResponse<{ message: string }>>(`/employees/${id}`);
  return response.data;
};
