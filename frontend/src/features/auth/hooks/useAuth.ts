// src/features/auth/hooks/useAuth.ts
import { useState } from 'react';
import { httpClient } from '@/api/client';
import { useAuthStore } from '@/store/authStore';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const loginMutate = async ({ email, password }: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await httpClient.post('/auth/login', { email, password });
      const { token, user } = res.data; // backend se aata hai
      login(user, token); // authStore mein save hoga
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed!');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { loginMutate, isLoading, error };
};