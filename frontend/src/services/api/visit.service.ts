import { httpClient } from '@/api/client';
import type { Visit, VisitFilters, CreateVisitDTO, UpdateVisitDTO, PaginatedResponse, ApiResponse } from '@/types/api.types';

export const VisitService = {
  async getAll(filters?: VisitFilters): Promise<PaginatedResponse<Visit> | Visit[]> {
    const response = await httpClient.get<any>('/visits', { params: filters });
    if (response.data && typeof response.data.total === 'number') {
      return response.data as PaginatedResponse<Visit>;
    }
    return response.data.data as Visit[];
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
