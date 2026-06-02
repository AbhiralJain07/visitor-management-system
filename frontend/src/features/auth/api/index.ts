import { httpClient } from '@/api/client';
import { type UserSession } from '@/store/authStore';

export interface LoginResponse {
  success: boolean;
  token: string;
  employee: UserSession;
  message?: string;
}

export const loginUser = async (payload: Record<string, string>): Promise<LoginResponse> => {
  const response = await httpClient.post<LoginResponse>('/auth/login', payload);
  return response.data;
};
