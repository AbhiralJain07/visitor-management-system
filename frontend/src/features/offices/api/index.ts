// src/features/offices/api/index.ts — replace karo
import { httpClient } from '@/api/client';
import { type ApiResponse, type Office } from '@/types/api.types';

export interface GetOfficesParams {
  search?: string;
  page?: number;
  limit?: number;
  is_active?: boolean | 'all';
}

export const getOffices = async (params?: GetOfficesParams): Promise<any> => {
  const response = await httpClient.get('/offices', { params });
  return response.data;
};

export const createOffice = async (payload: Omit<Office, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Office>> => {
  const response = await httpClient.post<ApiResponse<Office>>('/offices', payload);
  return response.data;
};

export const updateOffice = async (id: string, payload: Partial<Office>): Promise<ApiResponse<Office>> => {
  const response = await httpClient.put<ApiResponse<Office>>(`/offices/${id}`, payload);
  return response.data;
};

export const deleteOffice = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await httpClient.delete<ApiResponse<{ message: string }>>(`/offices/${id}`);
  return response.data;
};

/** Soft delete toggle: suspends if active, activates if suspended */
export const toggleOfficeStatus = async (id: string): Promise<ApiResponse<Office>> => {
  const response = await httpClient.patch<ApiResponse<Office>>(`/offices/${id}/toggle-status`);
  return response.data;
};