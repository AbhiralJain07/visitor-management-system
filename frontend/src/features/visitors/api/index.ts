import { httpClient } from '@/api/client';
import { type ApiResponse, type Visitor } from '@/types/api.types';

export const getVisitors = async (): Promise<ApiResponse<Visitor[]>> => {
  const response = await httpClient.get<ApiResponse<Visitor[]>>('/visitors');
  return response.data;
};

export const getVisitorById = async (id: string): Promise<ApiResponse<Visitor>> => {
  const response = await httpClient.get<ApiResponse<Visitor>>(`/visitors/${id}`);
  return response.data;
};

export const createVisitor = async (formData: FormData): Promise<ApiResponse<Visitor>> => {
  const response = await httpClient.post<ApiResponse<Visitor>>('/visitors', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateVisitor = async (id: string, payload: Partial<Visitor>): Promise<ApiResponse<Visitor>> => {
  const response = await httpClient.put<ApiResponse<Visitor>>(`/visitors/${id}`, payload);
  return response.data;
};

export const deleteVisitor = async (id: string): Promise<ApiResponse<{ message: string }>> => {
  const response = await httpClient.delete<ApiResponse<{ message: string }>>(`/visitors/${id}`);
  return response.data;
};

export interface IdentifyResponse {
  success: boolean;
  found: boolean;
  blacklisted?: boolean;
  similarity?: number;
  visitor?: Visitor;
  message: string;
}

export const identifyVisitor = async (photoFormData: FormData): Promise<IdentifyResponse> => {
  const response = await httpClient.post<IdentifyResponse>('/visitors/identify', photoFormData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
