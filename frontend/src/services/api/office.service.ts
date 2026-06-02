import { httpClient } from '@/api/client';
import type { Office, OfficeFilters, CreateOfficeDTO, UpdateOfficeDTO, PaginatedResponse, ApiResponse } from '@/types/api.types';

export const OfficeService = {
  async getAll(filters?: OfficeFilters): Promise<PaginatedResponse<Office> | Office[]> {
    const response = await httpClient.get<any>('/offices', { params: filters });
    if (response.data && typeof response.data.total === 'number') {
      return response.data as PaginatedResponse<Office>;
    }
    return response.data.data as Office[];
  },

  async create(dto: CreateOfficeDTO): Promise<Office> {
    const response = await httpClient.post<ApiResponse<Office>>('/offices', dto);
    return response.data.data;
  },

  async update(id: string, dto: UpdateOfficeDTO): Promise<Office> {
    const response = await httpClient.put<ApiResponse<Office>>(`/offices/${id}`, dto);
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await httpClient.delete<ApiResponse<any>>(`/offices/${id}`);
    return response.data.success;
  }
};
