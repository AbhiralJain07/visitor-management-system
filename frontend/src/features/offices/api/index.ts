import { httpClient } from '@/api/client';
import { type ApiResponse, type Office } from '@/types/api.types';

export const getOffices = async (): Promise<ApiResponse<Office[]>> => {
  const response = await httpClient.get<ApiResponse<Office[]>>('/offices');
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
