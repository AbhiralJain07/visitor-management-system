import { httpClient } from '@/api/client';
import { type Visitor } from '@/types/api.types';

export interface GetVisitorsParams {
  search?: string;
  page?: number;
  limit?: number;
  is_blacklisted?: boolean;
}

export interface GetVisitorsResponse {
  success: boolean;
  data: Visitor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface IdentifyResponse {
  success: boolean;
  found: boolean;
  blacklisted?: boolean;
  similarity?: number;
  visitor?: Visitor;
  message: string;
}

// ✅ Params support ke saath
export const getVisitors = async (params?: GetVisitorsParams): Promise<GetVisitorsResponse> => {
  const response = await httpClient.get<GetVisitorsResponse>('/visitors', { params });
  return response.data;
};

// ✅ Create — multipart/form-data (photo support)
export const createVisitor = async (formData: FormData): Promise<{ success: boolean; data: Visitor }> => {
  const response = await httpClient.post('/visitors', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// ✅ Update
export const updateVisitor = async (id: string, payload: Partial<Visitor>): Promise<{ success: boolean; data: Visitor }> => {
  const response = await httpClient.put(`/visitors/${id}`, payload);
  return response.data;
};

// ✅ Delete — only super_admin
export const deleteVisitor = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await httpClient.delete(`/visitors/${id}`);
  return response.data;
};

// ✅ Face identify
export const identifyVisitor = async (photoFormData: FormData): Promise<IdentifyResponse> => {
  const response = await httpClient.post('/visitors/identify', photoFormData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};