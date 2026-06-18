import { httpClient } from '@/api/client';
import type { Visitor, VisitorFilters, CreateVisitorDTO, UpdateVisitorDTO, PaginatedResponse, ApiResponse } from '@/types/api.types';

export const VisitorService = {
  async getAll(filters?: VisitorFilters): Promise<PaginatedResponse<Visitor> | Visitor[]> {
    const response = await httpClient.get<any>('/visitors', { params: filters });
    if (response.data && typeof response.data.total === 'number') {
      return response.data as PaginatedResponse<Visitor>;
    }
    return response.data.data as Visitor[];
  },

  async create(dto: CreateVisitorDTO): Promise<Visitor> {
    const formData = new FormData();
    formData.append('name', dto.name);
    formData.append('phone', dto.phone);
    formData.append('id_number', dto.id_number);
    if (dto.email) formData.append('email', dto.email);
    if (dto.company_name) formData.append('company_name', dto.company_name);
    if (dto.id_type) formData.append('id_type', dto.id_type);
    if (dto.address) formData.append('address', dto.address);
    if (dto.photo) {
      formData.append('photo', dto.photo);
    }

    const response = await httpClient.post<ApiResponse<Visitor>>('/visitors', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async update(id: string, dto: UpdateVisitorDTO): Promise<Visitor> {
    const response = await httpClient.put<ApiResponse<Visitor>>(`/visitors/${id}`, dto);
    return response.data.data;
  },

  async delete(id: string): Promise<boolean> {
    const response = await httpClient.delete<ApiResponse<any>>(`/visitors/${id}`);
    return response.data.success;
  },

  async identify(photo: File | Blob): Promise<{ found: boolean; blacklisted?: boolean; visitor?: Visitor; similarity?: number; message?: string }> {
    const formData = new FormData();
    formData.append('photo', photo);
    const response = await httpClient.post<{ success: boolean; found: boolean; blacklisted?: boolean; visitor?: Visitor; similarity?: number; message?: string }>('/visitors/identify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
