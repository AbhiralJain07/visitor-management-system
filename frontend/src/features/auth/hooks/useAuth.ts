import { useState } from 'react';
import { loginUser } from '../api';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { login: storeLogin, logout: storeLogout, user, isAuthenticated } = useAuthStore();

  const loginMutate = async (payload: Record<string, string>): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginUser(payload);
      if (response.success && response.token && response.employee) {
        storeLogin(response.employee, response.token);
        return true;
      } else {
        setError(response.message || 'Authentication failed. Please verify credentials.');
        return false;
      }
    } catch (err: any) {
      console.error('Login error details:', err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Invalid email or password.');
      } else {
        setError('A connection error occurred. Please try again.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loginMutate,
    isLoading,
    error,
    logout: storeLogout,
    user,
    isAuthenticated,
  };
};

export default useAuth;
