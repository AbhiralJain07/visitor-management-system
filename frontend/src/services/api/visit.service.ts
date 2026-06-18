import { httpClient } from '@/api/client';
import type { Visit, VisitFilters, CreateVisitDTO, UpdateVisitDTO, PaginatedResponse, ApiResponse } from '@/types/api.types';

export const VisitService = {
  async getAll(filters?: VisitFilters): Promise<PaginatedResponse<Visit> | Visit[]> {
    const response = await httpClient.get<any>('/visits', { params: filters });
    const res = response.data;
    if (res && res.pagination && typeof res.pagination.total === 'number') {
      return {
        success: res.success,
        data: res.data,
        total: res.pagination.total,
        page: res.pagination.page,
        limit: res.pagination.limit,
        totalPages: res.pagination.pages,
      } as PaginatedResponse<Visit>;
    }
    if (res && typeof res.total === 'number') {
      return res as PaginatedResponse<Visit>;
    }
    return res.data as Visit[];
  },

  async create(dto: CreateVisitDTO): Promise<Visit> {
    const response = await httpClient.post<ApiResponse<Visit>>('/visits', dto);
    return response.data.data;
  },

  async update(id: string, dto: UpdateVisitDTO): Promise<Visit> {
    const response = await httpClient.put<ApiResponse<Visit>>(`/visits/${id}`, dto);
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await httpClient.delete<ApiResponse<any>>(`/visits/${id}`);
    return response.data.success;
  }
};
