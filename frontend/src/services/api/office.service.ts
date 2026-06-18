import { httpClient } from '@/api/client';
import type { Office, OfficeFilters, CreateOfficeDTO, UpdateOfficeDTO, PaginatedResponse, ApiResponse } from '@/types/api.types';

export const OfficeService = {
  async getAll(filters?: OfficeFilters): Promise<PaginatedResponse<Office>> {
    const response = await httpClient.get<any>('/offices', { params: filters });
    const res = response.data;

    // Backend ab paginated response return karta hai
    if (res && typeof res.total === 'number') {
      return res as PaginatedResponse<Office>;
    }

    // Fallback: sirf array aaya to wrap karo
    const arr: Office[] = Array.isArray(res) ? res : (res?.data ?? []);
    return {
      success: true,
      data: arr,
      total: arr.length,
      page: 1,
      limit: arr.length,
      totalPages: 1,
    };
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
