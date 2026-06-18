// src/features/visits/api/index.ts — replace karo
import { httpClient } from '@/api/client';
import { type ApiResponse, type Visit } from '@/types/api.types';

export interface GetVisitsParams {
  search?: string;
  page?: number;
  limit?: number;
  status?: string;
  host_id?: string;
  office_id?: string;
  startDate?: string;
  endDate?: string;
}

export const getVisits = async (params?: GetVisitsParams): Promise<any> => {
  const response = await httpClient.get('/visits', { params });
  return response.data;
};

export const createVisit = async (payload: Omit<Visit, '_id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Visit>> => {
  const response = await httpClient.post<ApiResponse<Visit>>('/visits', payload);
  return response.data;
};

export const updateVisit = async (id: string, payload: Partial<Visit>): Promise<ApiResponse<Visit>> => {
  const response = await httpClient.put<ApiResponse<Visit>>(`/visits/${id}`, payload);
  return response.data;
};

export const deleteVisit = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await httpClient.delete<ApiResponse<{ message: string }>>(`/visits/${id}`);
  return response.data;
};